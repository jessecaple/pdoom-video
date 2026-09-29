"""Word-level lyric alignment of what is actually sung -> data/lyrics.json

Pipeline (adapted from mexicat/pdoom-video, MIT):
  1. separate.py      : Mel-RoFormer vocal stem, karaoke lead/backing stems.
  2. ctc_emissions.py : frame-wise CTC log-probs (20 ms) from two acoustic models
                        (torchaudio MMS_FA, wav2vec2 LV60K-960h) on the vocal
                        stem (mono, L, R) and the lead stem.
  3. whisper_run.py   : Whisper large-v3 word timestamps (cross-check).
  4. vocal_feats.py   : vocal-stem RMS / pitch / onset / sibilance (5 ms hop).
  5. this script      :
       a. variant selection: every {a|b} alternative in lyrics_sung.py and every
          optional '?' ad-lib is scored by a local constrained Viterbi pass
          (garbage 'star' token at both ends); the best-scoring text is kept.
       b. one global constrained CTC Viterbi pass over the whole song on the
          fused emissions (star token between lines absorbs chops / ad-libs /
          backing vocals that are not in the text).
       c. signal-based refinement of word starts / ends (refine.py).
       d. confidence = agreement of independent alignments (single models,
          single channels, lead stem) + CTC posterior + Whisper agreement.
       e. vocal-chop syllable onsets inside CHOP_REGIONS.

Run:  uv run python align.py [--plots]
"""
import common
import json
import re
import sys
from difflib import SequenceMatcher

import numpy as np

import lyrics_src
from ctcalign import FRAME, _viterbi, align, build_targets, emissions, word_table, ALPHA
from lyrics_sung import CHOP_REGIONS, DEVIATIONS, SUNG
from pron import display_tokens, pron
from refine import load_feats, refine, runs

PRIMARY = "fused8"
ALTS = ("mms", "lv60k", "fused_vocL", "fused_vocR", "fused_lead")
ADLIB_MIN_GAIN = 2.0   # log-score gain (nats) an optional ad-lib must add to be kept

# Per-line time windows (seconds): every token of the line must lie inside.
# Needed where vocal chops / ad-libs sound like the line's words and the CTC
# path would otherwise stretch a word across a long gap (found by
# gap_report() and the QA plots).
LINE_WINDOWS = {
    "intro.1": (0.0, 1.4),      # the 5.4-7.0 'zoom' stutter is a separate chop roll
    "pc1.2a": (31.0, 32.6),     # 'for now!' ends before the 32.1-33.7 riser / roll
    "v2.1": (53.0, 58.0),       # post-chorus chops at 52.5-54 are not 'A-I'
    "v3.1": (104.0, 109.0),     # verse 3 starts after the synth solo
    "c4.8": (212.0, 215.6),     # 'fine' must not run into the outro chops
}

# Manual fixes (seconds) after inspection of QA plots; (line id, token index) ->
# dict(start=..., end=..., conf=...). Filled after reviewing work/qa/line_*.png.
FIX = {
    # intro pickup chop: the fricative rule latches onto the noise swell at 0.0.
    ("intro.1", 0): dict(start=0.33, conf=0.6),
    # 'Grok' lands on the bar-4 downbeat (7.02) right after the intro chop roll;
    # the rest-onset rule otherwise pulls it back to the roll's start (5.41).
    ("v1.1", 0): dict(start=7.03, conf=0.75),
    # 'for now!' is a short shout; the vocal stem continues with the riser/roll.
    ("pc1.2a", 1): dict(end=32.15),
    # 'P-doom' held to the post-chorus drop (then only reverb tail).
    ("c1.6", 8): dict(end=47.80),
    ("c2.6", 8): dict(end=87.02),
    # 'A-I': 'A' is the held pickup note over the last post-chorus bar
    # (Whisper, full-song and sliced runs: 53.1-54.1), 'I' after the verse-2
    # downbeat (54.2). The CTC models place both letters in 54.2-54.6.
    ("v2.1", 0): dict(start=53.30, syl=[54.20], conf=0.4),
}

VAR_RE = re.compile(r"\{([^}]*)\}")


def expand(text):
    """All variants of a text with {a|b} groups (cartesian product)."""
    m = VAR_RE.search(text)
    if not m:
        return [text]
    out = []
    for alt in m.group(1).split("|"):
        for rest in expand(text[m.end():]):
            out.append(text[:m.start()] + alt + rest)
    return [re.sub(r"\s+", " ", o).replace(" ,", ",").replace(" !", "!").strip() for o in out]


def local_score(E, toks_lines, t0, t1, margin=1.5):
    """Viterbi score of the token lines inside [t0, t1] with star tokens."""
    a, b = max(0, int(t0 / FRAME)), min(len(E), int(t1 / FRAME))
    Ex = E[a:b]
    star_col = Ex.max(axis=1, keepdims=True) - margin
    Ex = np.concatenate([Ex, star_col], axis=1)
    tgt, index, star = build_targets(toks_lines)
    tgt = np.array(tgt, np.int64)
    lo = np.zeros(len(tgt), np.int64)
    hi = np.full(len(tgt), len(Ex) - 1, np.int64)
    # score relative to all-star path
    _, score = _viterbi(Ex, tgt, lo, hi)
    base = float((Ex.max(axis=1) - margin).sum())
    return score - base


def toks_of(text):
    return display_tokens(text)


def windows_for(lines):
    return {li: LINE_WINDOWS[l["id"]] for li, l in enumerate(lines) if l["id"] in LINE_WINDOWS}


def gap_report(words, lines, max_gap=0.45):
    """Words whose CTC characters are spread across a long internal gap."""
    out = []
    for w in words:
        ch = [c for sub in w.get("_chars", []) for c in sub]
        for (a0, a1), (b0, b1) in zip(ch, ch[1:]):
            if b0 - a1 > max_gap:
                out.append((lines[w["li"]]["id"], w["w"], round(a1, 2), round(b0, 2)))
                break
    return out


def global_align(E, lines):
    toks = [toks_of(l["text"]) for l in lines]
    sp, score, _, _ = align(E, toks, line_windows=windows_for(lines))
    return word_table(sp, toks), score


def line_span(words, li):
    ws = [w for w in words if w["li"] == li]
    return ws[0]["start"], ws[-1]["end"]


def choose_variants(E):
    """Pick the best-scoring variant of each line and decide optional ad-libs."""
    lines = []
    for (lid, sec, kind, text, wid) in SUNG:
        opt = text.startswith("?")
        vs = expand(text.lstrip("?"))
        lines.append(dict(id=lid, section=sec, kind=kind, text=vs[0], variants=vs, optional=opt, written_id=wid))
    report = []
    # pass 1: first variant everywhere, optional ad-libs included
    words, _ = global_align(E, lines)
    for li, l in enumerate(lines):
        s, e = line_span(words, li)
        l["_span"] = (s, e)
    for li, l in enumerate(lines):
        s, e = l["_span"]
        prev_e = lines[li - 1]["_span"][1] if li else 0.0
        next_s = lines[li + 1]["_span"][0] if li + 1 < len(lines) else s + 30
        if len(l["variants"]) > 1:
            t0, t1 = max(prev_e - 0.3, s - 1.5), min(next_s + 0.3, e + 1.5)
            sc = [(local_score(E, [toks_of(v)], t0, t1), v) for v in l["variants"]]
            sc.sort(reverse=True)
            l["text"] = sc[0][1]
            l["variant_scores"] = [(round(x, 1), v) for x, v in sc]
            report.append((l["id"], [(round(x, 1), v) for x, v in sc]))
        if l["optional"]:
            # compare previous line alone vs previous line + ad-lib in the window
            pl = lines[li - 1]
            t0 = pl["_span"][0] - 0.3
            t1 = min(next_s + 0.2, e + 1.5)
            with_ = local_score(E, [toks_of(pl["text"]), toks_of(l["text"])], t0, t1)
            without = local_score(E, [toks_of(pl["text"])], t0, t1)
            l["keep"] = (with_ - without) >= ADLIB_MIN_GAIN
            l["adlib_gain"] = round(with_ - without, 1)
            report.append((l["id"], f"optional ad-lib gain {with_ - without:+.1f} -> {'kept' if l['keep'] else 'dropped'}"))
    return lines, report


def whisper_words():
    W = json.loads((common.WORK / "whisper_large-v3_vocals.json").read_text())
    return [(w["word"].strip(), w["start"], w["end"]) for s in W["segments"] for w in s.get("words", [])]


def norm(t):
    return re.sub(r"[^a-z]", "", t.lower())


NUMS = {"700": "sevenhundred", "7000": "seventhousand", "87k": "eightysevenkay", "15": "fifteen",
        "10": "ten", "28": "twentyeight", "34": "thirtyfour", "27": "twentyseven", "129": "twelvepointnine"}


def map_whisper(words, ww):
    a = [norm("".join(pron(w["w"]))) for w in words]
    b = [NUMS.get(norm(x[0]) or x[0], norm(x[0])) for x in ww]
    sm = SequenceMatcher(a=a, b=b, autojunk=False)
    m = {}
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal" or (tag == "replace" and (i2 - i1) == (j2 - j1)):
            for d in range(i2 - i1):
                m[i1 + d] = ww[j1 + d]
    for i, w in enumerate(words):
        x = m.get(i)
        if x is not None and abs(x[1] - w["start"]) > 1.5:
            x = None
        w["whisper"] = None if x is None else (round(x[1], 3), round(x[2], 3), x[0])
    return words


def whisper_bias(words):
    """Median (Whisper start - final start): Whisper's cross-attention word
    timestamps run systematically early on this vocal."""
    d = [w["whisper"][0] - w["start"] for w in words if w.get("whisper")]
    return float(np.median(d)) if d else 0.0


def confidence(words, alt):
    bias = whisper_bias(words)
    for i, w in enumerate(words):
        ds = [abs(a[i]["start"] - w["ctc_start"]) for a in alt.values()]
        agree = np.mean([d <= 0.06 for d in ds])
        p = min(1.0, w["conf"] / 0.5)
        wh = w.get("whisper")
        wagree = 0.5 if wh is None else float(abs(wh[0] - bias - w["start"]) <= 0.15)
        c = 0.35 + 0.3 * agree + 0.2 * p + 0.15 * wagree
        fx = FIX.get((w["lid"], w["ti"]))
        if fx is not None:
            c = fx.get("conf", max(c, 0.8))
        w["conf_final"] = round(float(np.clip(c, 0, 1)), 2)
    return words


def chop_onsets(f):
    """Syllable onsets of vocal chops (vocal stem flux peaks while active)."""
    from scipy.signal import find_peaks
    from scipy.ndimage import uniform_filter1d
    hop = f["hop"]
    on = f["onset"]
    r = f["rms_db"]
    out = []
    for (t0, t1, sec, label, note) in CHOP_REGIONS:
        a, b = int(t0 / hop), int(t1 / hop)
        seg = on[a:b]
        thr = max(0.25 * np.percentile(on, 99), np.percentile(seg, 60))
        pk, _ = find_peaks(seg, height=thr, distance=int(0.09 / hop))
        ts = [round((a + p) * hop, 3) for p in pk if r[min(len(r) - 1, a + p + int(0.03 / hop))] > -40]
        out.append(dict(start=t0, end=t1, section=sec, label=label, note=note, onsets=ts))
    out.sort(key=lambda c: c["start"])
    return out


def main(plots=False):
    E = emissions(PRIMARY)
    lines, report = choose_variants(E)
    for r in report:
        print("variant:", r)
    lines = [l for l in lines if not l["optional"] or l.get("keep")]
    toks = [toks_of(l["text"]) for l in lines]
    lw = windows_for(lines)
    sp, score, _, _ = align(E, toks, line_windows=lw)
    words = word_table(sp, toks)
    for w in words:
        w["lid"] = lines[w["li"]]["id"]
        w["_chars"] = [s_[3] for s_ in sp[(w["li"], w["ti"])]]
    gaps = gap_report(words, lines)
    for g in gaps:
        print("WARNING long internal gap:", g)
    for w in words:
        w.pop("_chars")
    alt = {}
    for k in ALTS:
        s2, _, _, _ = align(emissions(k), toks, line_windows=lw)
        alt[k] = word_table(s2, toks)
    f = load_feats()
    fix_idx = {(lines[li]["id"], ti): v for (lid, ti), v in FIX.items() for li in range(len(lines)) if lines[li]["id"] == lid}
    fix_li = {}
    for li, l in enumerate(lines):
        for (lid, ti), v in FIX.items():
            if lid == l["id"]:
                fix_li[(li, ti)] = v
    words = refine(words, f, fix_li)
    for k in range(1, len(words)):
        if words[k]["start"] < words[k - 1]["start"] + 0.02:
            words[k]["start"] = words[k - 1]["start"] + 0.02
        if words[k - 1]["end"] > words[k]["start"]:
            words[k - 1]["end"] = words[k]["start"]
    words = map_whisper(words, whisper_words())
    words = confidence(words, alt)
    bias = whisper_bias(words)
    dd = np.array([w["whisper"][0] - bias - w["start"] for w in words if w.get("whisper")])
    agree = dict(whisper_bias_s=round(bias, 3), whisper_mapped=int(len(dd)), words=len(words),
                 within_100ms=round(float(np.mean(np.abs(dd) <= 0.10)), 3),
                 within_150ms=round(float(np.mean(np.abs(dd) <= 0.15)), 3),
                 median_abs_ms=round(float(np.median(np.abs(dd)) * 1000), 1))
    alt_agree = {k: round(float(np.mean([abs(a[i]["start"] - w["ctc_start"]) <= 0.06 for i, w in enumerate(words)])), 3)
                 for k, a in alt.items()}
    print("whisper agreement:", agree)
    print("alt-model agreement (<=60 ms of fused CTC start):", alt_agree)
    (common.WORK / "align_debug.json").write_text(json.dumps(dict(words=words, alt=alt, report=report), indent=1, default=float))

    written = {l["id"]: l["text"] for l in lyrics_src.parse()}
    ap = common.DATA / "audio.json"
    asec = json.loads(ap.read_text())["sections"] if ap.exists() else []
    out_lines = []
    for li, l in enumerate(lines):
        ws = [w for w in words if w["li"] == li]
        wl = []
        for w in ws:
            d = dict(w=w["w"].strip("()?"), start=round(w["start"], 3), end=round(w["end"], 3), conf=w["conf_final"],
                     clarity=round(float(w["conf"]), 2))
            if len(w["subs"]) > 1:
                d["syl"] = [[round(a, 3), round(b, 3)] for a, b in w["subs"]]
            wl.append(d)
        disp = l["text"].strip("()")
        mid = 0.5 * (wl[0]["start"] + wl[-1]["end"])
        sec = next((x["id"] for x in asec if x["start"] <= mid < x["end"]), l["section"])
        ol = dict(id=l["id"], section=sec, tag=l["section"], kind=l["kind"], text=disp,
                  start=wl[0]["start"], end=wl[-1]["end"], words=wl)
        if l["written_id"]:
            ol["written_id"] = l["written_id"]
            wt = written.get(l["written_id"])
            if wt is not None and norm(wt) != norm(disp) and l["kind"] == "lead":
                ol["written_text"] = wt
        if l["id"] in DEVIATIONS:
            ol["deviation"] = DEVIATIONS[l["id"]]
        if l.get("variant_scores"):
            ol["variant_scores"] = l["variant_scores"]
        out_lines.append(ol)
    dropped = [dict(id=lid, text=t.lstrip("?"), note="optional ad-lib from suno.md not detected in the vocal")
               for (lid, sec, kind, t, wid) in SUNG if t.startswith("?") and lid not in {l["id"] for l in lines}]
    used = {l["written_id"] for l in lines if l["written_id"]}
    for wl_ in lyrics_src.parse():
        if wl_["id"] not in used:
            dropped.append(dict(id=wl_["id"], text=wl_["text"],
                                note="lyrics.md line not sung as words: the post-chorus is pitched vocal chops "
                                     "('zoom/doom' syllables) answering the synth lead, see chops[]"))
    doc = dict(
        version=1,
        source="song.wav",
        timebase="seconds from sample 0 of song.wav (48 kHz)",
        lines=out_lines,
        chops=chop_onsets(f),
        stats=dict(whisper_agreement=agree, alt_model_agreement_60ms=alt_agree,
                   mean_conf=round(float(np.mean([w["conf_final"] for w in words])), 3),
                   low_conf_words=[(w["lid"], w["w"], round(w["start"], 2), w["conf_final"]) for w in words if w["conf_final"] < 0.6]),
        not_sung=dropped,
        notes=NOTES,
    )
    (common.DATA / "lyrics.json").write_text(json.dumps(doc, indent=1, ensure_ascii=False))
    print("wrote", common.DATA / "lyrics.json", "score", round(score, 1), "lines", len(out_lines))
    if plots:
        make_plots(words, alt, lines)
    return words, alt, lines


def make_plots(words, alt, lines):
    from qa_plot import plot
    ww = whisper_words()
    for li, l in enumerate(lines):
        ws = [w for w in words if w["li"] == li]
        t0 = min(ws[0]["start"], ws[0]["ctc_start"]) - 0.8
        t1 = min(max(ws[-1]["end"], ws[-1]["ctc_end"]) + 0.6, t0 + 8)
        tracks = [
            ("final", [(w["w"], w["start"], w["end"]) for w in words]),
            ("fused-ctc", [(w["w"], w["ctc_start"], w["ctc_end"]) for w in words]),
            ("mms", [(w["w"], w["start"], w["end"]) for w in alt["mms"]]),
            ("lv60k", [(w["w"], w["start"], w["end"]) for w in alt["lv60k"]]),
            ("lead", [(w["w"], w["start"], w["end"]) for w in alt["fused_lead"]]),
            ("whisper", ww),
        ]
        plot(t0, t1, tracks, common.QA / f"line_{li:02d}_{l['id']}.png", title=f"{l['id']}: {l['text']}")


NOTES = (
    "Times in seconds on song.wav's timeline. Lines follow what is actually sung (Suno), in order; "
    "'section' = section id in data/audio.json (by line midpoint), 'tag' = lyric tag (v1, pc1, c1, v3st, br, brk...); "
    "'written_id' links a line to lyrics.md (ids from analysis/lyrics_src.py), 'written_text' is set "
    "when the sung words differ from lyrics.md. kind: lead | adlib (shouted echo/answer, often doubled "
    "by the backing stem) | chop. 'syl' = start/end of each part of hyphenated or spelled tokens "
    "(P-doom, A-I, DNS, OpenAI's, twelve-point-nine...). conf 0-1: agreement of independent CTC "
    "alignments (MMS_FA / wav2vec2-LV60K, L/R channels, karaoke lead stem) within 60 ms + CTC "
    "posterior + Whisper large-v3 agreement within 150 ms (after removing Whisper's -160 ms bias). "
    "clarity 0-1 = mean CTC posterior of the word's characters: low = slurred, distorted or buried "
    "(e.g. 'Hugging', 'Hubinger', 'A-I') even when the timing is reliable. 'chops'= vocal-chop syllable onsets in "
    "the intro, post-choruses, chorus-tail melismas and outro, plus a pitch dive and a laugh (not "
    "word-aligned; onsets = detected syllable attacks). 'deviation' = how the sung line differs from "
    "lyrics.md / suno.md. 'not_sung' = ad-libs written in "
    "suno.md that the aligner did not find. variant_scores = local CTC log-score gains of the "
    "candidate texts that were tested for that line (best first). Method details and accuracy "
    "caveats: research/audio-analysis.md."
)

if __name__ == "__main__":
    main(plots="--plots" in sys.argv)
