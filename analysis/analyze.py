"""Music analysis -> data/audio.json  (+ research/audio-intensity.png)

  * constant-tempo beat grid: period fitted on Beat This! beats (mix), phase
    refined on kick attacks (drumsep kick stem); downbeat phase from Beat This!
    downbeats (all 146 agree), cross-checked with All-In-One (allin1).
  * sections on downbeats (hand-mapped SECTION_BARS, validated against
    allin1 segment boundaries, stem activity and the lyric alignment),
    arrangement parts per bar from stem activity.
  * 60 fps envelopes: mix loudness / RMS / bands / spectral centroid / flux,
    stem RMS (drums, bass, synths, vocal, lead, backing, kick, snare, hats),
    and a composite 'intensity' curve.
  * onsets: kick / snare / hats / toms / cymbals (drumsep stems), bass notes,
    lead-vocal notes, synth ('other' stem) attacks.
  * key (essentia KeyExtractor, several profiles, per section), stops, drops,
    rolls, builds and other notable events.

All times are seconds on song.wav's timeline (stems are sample-aligned).
Run:  uv run python analyze.py [--plots]
"""
import common
import json
import math
import sys

import numpy as np
import librosa
from scipy.ndimage import maximum_filter1d, median_filter, uniform_filter1d
from scipy.signal import butter, find_peaks, sosfiltfilt

SR = 44100
FPS = 60

# ---------------------------------------------------------------------------
# Section map in bars. Bar k starts at downbeat k (bar 0 = first downbeat,
# 0.737 s); bar -1 is the 2-beat pickup at the very start.
# Rule: sections start on the downbeat of the bar where the new material
# starts; vocal pickups (< 1 bar) stay in the previous section.
SECTION_BARS = [
    # id, label, bar_start, bar_end, short description
    ("intro", "Intro", None, 4, "vocal-chop pickup, gated synth-stab riff alone, then bass + stuttered 'zoom' chop roll"),
    ("verse1", "Verse 1", 4, 16, "sneering autotuned rap over bass only; drums build in bar 11, full beat from bar 12"),
    ("pre1", "Pre-Chorus 1", 16, 21, "'Mythos, baby'; stop on 'kept you in a box' + shouted 'FOR NOW!', then noise riser + roll"),
    ("chorus1", "Chorus 1", 21, 30, "drop on 'Zoom, zoom, zoom!'; ends with a 2-bar a cappella stop on 'add a point to my P-doom'"),
    ("post1", "Post-Chorus 1", 30, 34, "blown-out four-on-the-floor 808s, screaming synth lead, pitched vocal chops"),
    ("verse2", "Verse 2", 34, 42, "drums out for 2 bars (bass + vocal), full beat from bar 36, vocal-only stop bar 41"),
    ("pre2", "Pre-Chorus 2", 42, 46, "'Chatbot, baby'; vocal-only stop on 'will someone be there?'"),
    ("chorus2", "Chorus 2", 46, 55, "same shape as chorus 1, a cappella stop in bars 53-54"),
    ("post2", "Post-Chorus 2", 55, 59, "808 drop + synth lead + vocal chops (loudest so far)"),
    ("inst", "Instrumental", 59, 67, "synth-lead solo over the pounding beat, then beat drops out (bars 63-65, synth alone), drums re-enter bar 66"),
    ("verse3", "Verse 3", 67, 83, "frantic sing-rap, full beat; vocal-only stops on 'HOAX' (bar 74) and 'due in twenty-eight' (bar 82)"),
    ("stoptime", "Verse 3 stop-time", 83, 87, "drums cut, bass + synth hits under 'Then they paused again' / 'Hinton told Congress'"),
    ("pre3", "Pre-Chorus 3", 87, 91, "'Astra, darling': four-on-the-floor kick build, bass pulled back"),
    ("chorus3", "Chorus 3", 91, 100, "third chorus, a cappella stop in bars 98-99 ('P-doom' melisma)"),
    ("bridge", "Bridge (half-time vocal)", 100, 108, "loudest groove: four-on-the-floor 808, long half-time vocal lines, kick roll into bar 108"),
    ("bridge2", "Bridge, drums cut", 108, 120, "drums cut: bass + detuned pads + exposed vocal; one-bar drum hit at bar 116"),
    ("breakdown", "Breakdown", 120, 124, "'I've been laughing it off': kick pounds back in and builds (NOT a cappella)"),
    ("chorus4", "Final Chorus", 124, 137, "a cappella 'Zoom, zoom!' bar, full chorus, a cappella stop + 'WHO CAN TELL?', final drop"),
    ("outro", "Outro", 137, None, "instrumental 808 drop + laugh ad-lib, synth alone, 'doom-doom' stutter, hard cut to silence"),
]


# Top sync moments, resolved to times at run time:
#   ("bar", k)            -> downbeat of bar k
#   ("word", line, i)     -> start of word i of that line in data/lyrics.json
#   ("event", type, ~t)   -> the detected event of that type nearest ~t
SYNC_MOMENTS = [
    (("word", "intro.1", 0), "hit", "first sound: 'zoom-zoom-zoom' vocal-chop pickup (2 beats before bar 0)"),
    (("bar", 3), "entry", "bass drops in + stuttered 'zoom' chop roll"),
    (("word", "v1.1", 0), "vocal", "'Grok' - verse 1 starts on the bar-4 downbeat (bass + vocal, no drums)"),
    (("bar", 12), "drop", "drums kick in under 'Florida says'"),
    (("bar", 19), "stop", "band cuts out on 'so they kept you in a box'"),
    (("word", "pc1.2a", 0), "vocal", "shouted 'FOR NOW!' in the stop"),
    (("event", "roll", 32.9), "build", "16th-note snare roll after a noise riser (riser from 32.11)"),
    (("bar", 21), "drop", "CHORUS 1 DROP: 'ZOOM, ZOOM, ZOOM!'"),
    (("bar", 28), "stop", "band cuts: a cappella 'Zoom, zoom, zoom, add a point to my P-doom' (2 bars)"),
    (("bar", 30), "drop", "POST-CHORUS 1 DROP: blown-out four-on-the-floor 808s + screaming synth lead"),
    (("bar", 55), "drop", "POST-CHORUS 2 DROP (after the second a cappella stop at bar 53)"),
    (("bar", 63), "stop", "beat vanishes mid-solo: synth lead alone for 3 bars"),
    (("word", "v3.1", 0), "vocal", "'Eleven hundred' - verse 3 pickup, drums back at bar 67 (105.84)"),
    (("word", "v3.4", 7), "stop", "'a HOAX on the news': band stops for a bar (116.82), pitch-dive on 'news'"),
    (("bar", 83), "stop", "stop-time: drums cut, drone under 'Then they paused again'"),
    (("bar", 87), "drop", "pre-chorus 3: four-on-the-floor kick slams in on 'Astra, darling'"),
    (("bar", 91), "drop", "CHORUS 3 DROP after an 808 roll (140.35) and a 0.7 s stop (142.75)"),
    (("bar", 100), "drop", "BRIDGE DROP: loudest groove of the song, 'Twenty-seven notes...'"),
    (("bar", 108), "stop", "kick roll ends, drums cut: exposed vocal 'Dario says...'"),
    (("bar", 120), "drop", "breakdown: kick pounds back in, 'I've been laughing it off'"),
    (("event", "stop_acappella", 194.5), "stop", "808 ratchet ends, band cuts: a cappella into the final chorus ('Zoom, zoom!' 195.62)"),
    (("bar", 126), "drop", "final chorus: band slams back on 'nobody steering'"),
    (("word", "c4.6a", 0), "vocal", "'WHO CAN TELL?' shouted at the end of the last a cappella stop"),
    (("bar", 133), "drop", "FINAL DROP: 'Doom, doom, the warning shot sold for twelve-point-nine'"),
    (("event", "hard_cut", 228.5), "end", "hard cut to silence mid-'doom' (1.06 s of silence to the file end)"),
]
EXTRA_MOMENTS = [
    (("bar", 137), "drop", "outro drop (instrumental 808s) + laugh-like ad-lib"),
    (("bar", 141), "stop", "beat cuts: synth alone before the closing 'doom' stutter"),
]


def resolve_moments(spec, downbeats, events, lyr):
    out = []
    for (ref, typ, label) in spec:
        t = None
        if ref[0] == "bar":
            t = float(downbeats[ref[1]])
        elif ref[0] == "word" and lyr is not None:
            ln = next((l for l in lyr["lines"] if l["id"] == ref[1]), None)
            if ln:
                t = ln["words"][ref[2]]["start"]
        elif ref[0] == "event":
            c = [e for e in events if e["type"] == ref[1] and abs(e["t"] - ref[2]) < 1.5]
            if c:
                t = min(c, key=lambda e: abs(e["t"] - ref[2]))["t"]
        if t is not None:
            out.append(dict(t=round(t, 3), type=typ, label=label))
    return sorted(out, key=lambda e: e["t"])


# ---------------------------------------------------------------------------
def band_sos(lo, hi, sr):
    if lo and hi:
        return butter(4, [lo, hi], btype="band", fs=sr, output="sos")
    if hi:
        return butter(4, hi, btype="low", fs=sr, output="sos")
    return butter(4, lo, btype="high", fs=sr, output="sos")


def frame_rms(x, sr, fps=FPS, win=2048):
    hop = sr / fps
    n = int(math.ceil(len(x) / sr * fps))
    pad = np.pad(x, (win // 2, win // 2 + int(hop) + 2))
    idx = (np.arange(n) * hop).astype(int)
    c = np.concatenate([[0.0], np.cumsum(pad.astype(np.float64) ** 2)])
    e = (c[idx + win] - c[idx]) / win
    return np.sqrt(np.maximum(e, 0))


def smooth_env(x, fps=FPS, attack=0.010, release=0.090):
    aa = math.exp(-1 / (attack * fps))
    ar = math.exp(-1 / (release * fps))
    y = np.empty_like(x)
    s = 0.0
    for i, v in enumerate(x):
        a = aa if v > s else ar
        s = a * s + (1 - a) * v
        y[i] = s
    return y


def norm01(x, pct=99.0):
    ref = np.percentile(x, pct)
    return np.clip(x / (ref + 1e-12), 0, 1)


def db(x):
    return 20 * np.log10(np.maximum(x, 1e-9))


# ---------------------------------------------------------------------------
def fit_grid(duration):
    """Constant grid: period from Beat This! beats (least squares over the whole
    song), phase = beat-this phase + median kick-attack residual."""
    bt = json.loads((common.WORK / "beats_mix.json").read_text())
    b = np.array(bt["beats"])
    ibi = np.diff(b)
    P = float(np.mean(ibi[(ibi > 0.35) & (ibi < 0.43)]))
    off = float(b[0])
    for _ in range(6):
        n = np.round((b - off) / P)
        (P, off), *_ = np.linalg.lstsq(np.vstack([n, np.ones_like(n)]).T, b, rcond=None)
    res_bt = b - (off + np.round((b - off) / P) * P)
    kt, _ = stem_onsets("kick", rel_db=12, min_gap=0.07, floor_db=-45)
    n = np.round((kt - off) / P)
    rk = kt - (off + n * P)
    rk = rk[np.abs(rk) < 0.06]
    off_k = off + float(np.median(rk))
    # downbeat phase: beat index (relative to off) mod 4 of Beat This! downbeats
    dbt = np.array(bt["downbeats"])
    ph = np.bincount(np.round((dbt - off) / P).astype(int) % 4, minlength=4)
    phase = int(np.argmax(ph))
    off = off_k - P * math.floor(off_k / P)          # first beat >= 0
    # beat index of first downbeat relative to new off
    k0 = (phase - int(round((off - off_k) / P))) % 4
    beats = off + P * np.arange(int((duration - off) / P) + 1)
    first_db = off + k0 * P
    downbeats = beats[k0::4]
    stats = dict(beat_this_resid_sd_ms=round(float(res_bt.std() * 1000), 1),
                 kick_resid_sd_ms=round(float(rk.std() * 1000), 1),
                 kick_phase_shift_ms=round(float(np.median(rk) * 1000), 1),
                 downbeat_phase_votes=ph.tolist())
    return P, off, first_db, beats, downbeats, stats


def allin1_check(beats, downbeats):
    p = common.WORK / "allin1" / "song.json"
    if not p.exists():
        return None
    a = json.loads(p.read_text())
    ab, ad = np.array(a["beats"]), np.array(a["downbeats"])
    P = beats[1] - beats[0]
    rb = ab - (beats[0] + np.round((ab - beats[0]) / P) * P)
    same_phase = np.mean(np.min(np.abs(ad[:, None] - downbeats[None, :]), axis=1) < 0.08)
    return dict(bpm=a["bpm"], beat_offset_median_ms=round(float(np.median(rb) * 1000), 1),
                downbeats_matching=round(float(same_phase), 3),
                segments=[dict(start=s["start"], end=s["end"], label=s["label"]) for s in a["segments"]])


# ---------------------------------------------------------------------------
_stem_cache = {}


def stem(name, sr=SR):
    k = (name, sr)
    if k not in _stem_cache:
        _stem_cache[k] = common.load(name, sr=sr)[0]
    return _stem_cache[k]


def stem_onsets(name, rel_db=12, min_gap=0.07, floor_db=-45, win=0.008, lo=None, hi=None, y=None):
    """Attack times of an isolated stem: steepest rise of its log-energy
    envelope inside each >rel_db rise over 15 ms. Returns (times, peak_db)."""
    if y is None:
        y = stem(name)
    if lo or hi:
        y = sosfiltfilt(band_sos(lo, hi, SR), y)
    h = int(0.002 * SR)
    w = int(win * SR)
    e = np.convolve(y.astype(np.float64) ** 2, np.ones(w) / w, mode="same")[::h]
    d_b = 10 * np.log10(e + 1e-12)
    fps = SR / h
    lag = int(0.015 * fps)
    rise = d_b - np.concatenate([np.full(lag, d_b[0]), d_b[:-lag]])
    pk, _ = find_peaks(rise, height=rel_db, distance=int(min_gap * fps))
    ts, ps = [], []
    for p in pk:
        peak = d_b[p:p + int(0.03 * fps)].max()
        if peak < floor_db:
            continue
        a = max(0, p - lag)
        q = a + int(np.argmax(np.diff(d_b[a:p + 1]))) if p > a else p
        ts.append(q / fps)
        ps.append(peak)
    return np.array(ts), np.array(ps)


def strength01(vals, lo_pct=5, hi_pct=95):
    if len(vals) == 0:
        return vals
    lo, hi = np.percentile(vals, lo_pct), np.percentile(vals, hi_pct)
    return np.clip((vals - lo) / (hi - lo + 1e-9) * 0.8 + 0.2, 0, 1)


def vocal_onsets():
    """Lead-vocal note onsets: log-mel flux peaks (5 ms hop) + legato pitch
    jumps > 0.8 semitone, restricted to active vocal frames (from vocal_feats)."""
    f = dict(np.load(common.WORK / "vocal_feats.npz"))
    hop = float(f["hop_s"])
    on, rms = f["onset"], f["rms_db"]
    loc = maximum_filter1d(rms, int(2.0 / hop))
    active = (rms > -45) & (rms > loc - 25)
    thr = uniform_filter1d(on, int(0.4 / hop)) * 1.5 + 0.15 * np.percentile(on, 99)
    pk, _ = find_peaks(on, height=0, distance=int(0.09 / hop))
    pk = [p for p in pk if on[p] > thr[p] and active[min(len(active) - 1, p + int(0.03 / hop))]]
    t_flux = np.array(pk) * hop
    s_flux = np.array([on[p] for p in pk])
    midi = librosa.hz_to_midi(np.where(f["voiced"] > 0, f["f0"], np.nan))
    med = median_filter(np.nan_to_num(midi, nan=0), 9)
    w = int(0.04 / hop)
    jumps = [i for i in range(w, len(med) - w)
             if med[i - w] > 0 and med[i + w] > 0 and abs(med[i + w] - med[i - w]) > 0.8 and active[i]]
    t_pitch, last = [], -1e9
    for i in jumps:
        if i - last > int(0.1 / hop):
            t_pitch.append(i * hop)
        last = i
    ts = list(zip(t_flux, s_flux / (np.percentile(s_flux, 95) + 1e-9)))
    for t in t_pitch:
        if len(t_flux) == 0 or np.min(np.abs(t_flux - t)) > 0.08:
            ts.append((t, 0.35))
    ts.sort()
    return [(float(t), float(min(1.0, max(0.1, s)))) for t, s in ts]


# ---------------------------------------------------------------------------
def key_analysis(sections, duration):
    import essentia.standard as es
    y = stem("mix")
    yi = stem("instrumental")
    out = {}
    votes = {}
    for prof in ("edma", "bgate", "temperley", "krumhansl", "shaath"):
        k, s, st = es.KeyExtractor(profileType=prof, sampleRate=SR)(y.astype(np.float32))
        votes[prof] = dict(key=k, scale=s, strength=round(float(st), 3))
    out["tonic"], out["scale"] = votes["edma"]["key"], votes["edma"]["scale"]
    out["name"] = f"{out['tonic']} {out['scale']}"
    out["profiles"] = votes
    per = []
    for s in sections:
        a, b = int(s["start"] * SR), int(s["end"] * SR)
        k1, s1, st1 = es.KeyExtractor(profileType="edma", sampleRate=SR)(y[a:b].astype(np.float32))
        k2, s2, st2 = es.KeyExtractor(profileType="edma", sampleRate=SR)(yi[a:b].astype(np.float32))
        per.append(dict(section=s["id"], mix=f"{k1} {s1}", mix_strength=round(float(st1), 2),
                        instrumental=f"{k2} {s2}", instrumental_strength=round(float(st2), 2)))
    out["per_section"] = per
    return out


def chorus_pitch_check(lyr):
    """Median lead pitch (MIDI) of the same chorus lines in every chorus: a key
    change would shift them."""
    if lyr is None:
        return None
    f = dict(np.load(common.WORK / "vocal_feats.npz"))
    hop = float(f["hop_s"])
    L = {l["id"]: l for l in lyr["lines"]}
    out = {}
    for c in ("c1", "c2", "c3", "c4"):
        vals = []
        for k in (2, 3, 4):
            l = L.get(f"{c}.{k}")
            if not l:
                continue
            a, b = int(l["start"] / hop), int(l["end"] / hop)
            f0 = f["f0"][a:b]
            v = (f["voiced"][a:b] > 0) & np.isfinite(f0)
            vals.append(float(np.median(librosa.hz_to_midi(f0[v]))))
        out[c] = [round(v, 2) for v in vals]
    return out


# ---------------------------------------------------------------------------
def bar_activity(downbeats, duration, bar_len):
    """Per-bar RMS (dB) of each stem and on/low/off layer states."""
    names = {"drums": "drums", "bass": "bass", "synth": "other", "vocal": "lead", "backing": "backing", "mix": "mix"}
    edges = [0.0] + list(downbeats) + [duration]
    bars = []
    lev = {k: [] for k in names}
    for i in range(len(edges) - 1):
        a, b = edges[i], edges[i + 1]
        if b - a < 0.05:
            continue
        for k, n in names.items():
            y = stem(n)[int(a * SR):int(b * SR)]
            lev[k].append(float(db(np.sqrt(np.mean(y ** 2)))))
        bars.append((i - 1, a, b))
    ref = {k: np.percentile(v, 90) for k, v in lev.items()}
    out = []
    for j, (k, a, b) in enumerate(bars):
        st = {}
        for name in ("drums", "bass", "synth", "vocal", "backing"):
            rel = lev[name][j] - ref[name]
            st[name] = "on" if rel > -12 else ("low" if rel > -30 else "off")
        out.append(dict(bar=k, start=round(a, 3), end=round(b, 3),
                        mix_db=round(lev["mix"][j], 1), layers=st,
                        levels_db={n: round(lev[n][j], 1) for n in ("drums", "bass", "synth", "vocal", "backing")}))
    return out


def layer_desc(st):
    on = [k for k in ("drums", "bass", "synth", "vocal", "backing") if st[k] == "on"]
    low = [k for k in ("drums", "bass", "synth", "vocal", "backing") if st[k] == "low"]
    s = "+".join(on) if on else "silence"
    if low:
        s += " (low: " + "+".join(low) + ")"
    return s


def parts_from_bars(bars, sections):
    parts = []
    for b in bars:
        sec = next((s["id"] for s in sections if s["start"] - 1e-3 <= b["start"] < s["end"] - 1e-3), sections[-1]["id"])
        d = layer_desc(b["layers"])
        if parts and parts[-1]["section"] == sec and parts[-1]["layers"] == d:
            parts[-1]["end"] = b["end"]
            parts[-1]["bars"][1] = b["bar"] + 1
        else:
            parts.append(dict(section=sec, start=b["start"], end=b["end"], bars=[b["bar"], b["bar"] + 1], layers=d))
    return parts


# ---------------------------------------------------------------------------
def detect_events(env_db, fps, beats, downbeats, onsets, lyr, duration, bars, sections):
    """Stops (instrumental out), returns/drops, drums in/out, rolls, loudness
    peaks, hard cut. Times refined to envelope crossings / first onsets."""
    ev = []
    instr = env_db["instrumental"]
    voc = env_db["lead"]
    drums = env_db["drums"]
    t = np.arange(len(instr)) / fps
    ref_i = np.percentile(instr, 90)
    quiet = median_filter((instr < ref_i - 32).astype(np.int8), 7) > 0
    # stops: instrumental silent >= 0.35 s
    m = np.concatenate([[0], quiet.astype(np.int8), [0]])
    d = np.diff(m)
    starts, ends = np.where(d == 1)[0], np.where(d == -1)[0]
    kick = np.array([o[0] for o in onsets["kick"]])
    for a, b in zip(starts, ends):
        if (b - a) / fps < 0.35 or a == 0:
            continue
        ta, tb = a / fps, b / fps
        vocal_on = np.mean(voc[a:b] > np.percentile(voc, 90) - 20) > 0.5
        typ = "stop_acappella" if vocal_on else ("silence" if np.max(env_db["mix"][a:b]) < np.percentile(env_db["mix"], 50) - 30 else "stop")
        ev.append(dict(t=round(ta, 3), type=typ, end=round(tb, 3),
                       label=("band cuts out, vocal alone" if vocal_on else "band cuts out")))
        if tb < duration - 0.5:
            nk = kick[(kick >= tb - 0.08) & (kick < tb + 0.5)]
            tr = float(nk[0]) if len(nk) else tb
            ev.append(dict(t=round(tr, 3), type="return", label="band slams back in after stop"))
    # drums in / out (bar level, from the per-bar layer states)
    for prev, cur in zip(bars[:-1], bars[1:]):
        a, b = prev["layers"]["drums"] == "on", cur["layers"]["drums"] == "on"
        if a != b:
            t0 = cur["start"]
            if b:
                nk = kick[(kick >= t0 - 0.1) & (kick < t0 + 1.0)]
                ev.append(dict(t=round(float(nk[0]) if len(nk) else float(t0), 3), type="drums_in", label="drums return (bar level)"))
            else:
                ev.append(dict(t=round(float(t0), 3), type="drums_out", label="drums drop out (bar level)"))
    # rolls: runs of kick/snare/tom onsets with IOI <= 1/8 beat... (<= 0.11 s)
    P = beats[1] - beats[0]
    perc = np.sort(np.concatenate([np.array([o[0] for o in onsets[k]]) for k in ("kick", "snare", "toms") if onsets[k]]))
    keep = np.concatenate([[True], np.diff(perc) > 0.03])
    perc = perc[keep]
    i = 0
    while i < len(perc) - 1:
        j = i
        while j + 1 < len(perc) and perc[j + 1] - perc[j] <= P / 2 * 1.15 and perc[j + 1] - perc[j] > 0.03:
            j += 1
        if j - i + 1 >= 6 and perc[j] - perc[i] >= 0.6:
            ev.append(dict(t=round(float(perc[i]), 3), type="roll", end=round(float(perc[j]), 3),
                           label=f"drum/808 roll ({j - i + 1} hits) into next downbeat"))
        i = j + 1
    # loudness peaks (short-term, 1-bar window)
    L = uniform_filter1d(env_db["mix"], int(1.5 * fps))
    pk, _ = find_peaks(L, distance=int(8 * fps))
    for p in sorted(pk, key=lambda p: -L[p])[:5]:
        ev.append(dict(t=round(p / fps, 3), type="loudness_peak", label=f"short-term loudness peak ({L[p]:.1f} dBFS rms)"))
    # hard cut at the end
    mix = stem("mix")
    h = int(0.002 * SR)
    e = np.array([np.sqrt(np.mean(mix[i:i + h] ** 2)) for i in range(int((duration - 5) * SR), len(mix) - h, h)])
    ed = db(e)
    loud = np.where(ed > -40)[0]
    if len(loud):
        tc = duration - 5 + (loud[-1] + 1) * h / SR
        ev.append(dict(t=round(tc, 3), type="hard_cut", label="abrupt ending: everything cuts to silence"))
    # a return that lands on a section start is a drop into that section
    for e in ev:
        if e["type"] == "return":
            s = next((s for s in sections if abs(s["start"] - e["t"]) < 0.12), None)
            if s is not None:
                e["type"] = "drop"
                e["label"] = f"drop: band slams back in, start of {s['label']}"
                e["section"] = s["id"]
    ev.sort(key=lambda e: e["t"])
    return ev


# ---------------------------------------------------------------------------
def main(plots=False):
    duration = common.duration()
    mix = stem("mix")
    duration = min(duration, len(mix) / SR)
    P, off, first_db, beats, downbeats, gstats = fit_grid(duration)
    bpm = 60 / P
    bar_len = 4 * P
    print(f"tempo {bpm:.4f} BPM, period {P:.6f}s, first beat {off:.4f}, first downbeat {first_db:.4f}", gstats)
    bar_t = lambda k: float(first_db + k * bar_len)

    sections = []
    for sid, label, a, b, desc in SECTION_BARS:
        s = 0.0 if a is None else bar_t(a)
        e = duration if b is None else bar_t(b)
        sections.append(dict(id=sid, label=label, start=round(s, 3), end=round(e, 3),
                             bar_start=-1 if a is None else a, bar_end=b if b is not None else int(math.ceil((duration - first_db) / bar_len)),
                             description=desc))

    # envelopes ------------------------------------------------------------------
    n = int(math.ceil(duration * FPS))
    raw = {}
    raw["rms"] = frame_rms(mix, SR)[:n]
    for name, (lo, hi) in {"low": (None, 150), "mid": (150, 2000), "high": (4000, None)}.items():
        raw[name] = frame_rms(sosfiltfilt(band_sos(lo, hi, SR), mix), SR)[:n]
    stem_map = {"drums": "drums", "bass": "bass", "synth": "other", "vocal": "vocals", "lead": "lead",
                "backing": "backing", "kick": "kick", "snare": "snare", "hats": "hh", "instrumental": "instrumental"}
    for k, s in stem_map.items():
        raw[k] = frame_rms(stem(s), SR)[:n]
    env_db = {k: db(v) for k, v in raw.items()}
    env_db["mix"] = env_db["rms"]
    # spectral centroid + flux of the mix (22.05 kHz analysis)
    y22 = stem("mix", 22050)
    hop22 = 22050 / FPS
    S = np.abs(librosa.stft(y22, n_fft=2048, hop_length=int(round(hop22)), center=True))
    cent = librosa.feature.spectral_centroid(S=S, sr=22050)[0]
    flux = librosa.onset.onset_strength(S=librosa.amplitude_to_db(S, ref=np.max), sr=22050, lag=1, max_size=3)
    # resample to exact 60 fps grid (hop rounded to 368 samples)
    tt = np.arange(len(cent)) * int(round(hop22)) / 22050
    grid_t = np.arange(n) / FPS
    cent = np.interp(grid_t, tt, cent)
    flux = np.interp(grid_t, tt[:len(flux)], flux)
    loud_db = uniform_filter1d(env_db["rms"], int(0.4 * FPS))       # ~400 ms short-term level

    env = {}
    for k in ("rms", "low", "mid", "high", "drums", "bass", "synth", "vocal", "lead", "backing", "kick", "snare", "hats"):
        env[k] = [round(float(x), 3) for x in norm01(smooth_env(raw[k]))]
    env["loudness_db"] = [round(float(x), 1) for x in loud_db]
    env["centroid"] = [round(float(x), 3) for x in np.clip(cent / 8000.0, 0, 1)]
    env["flux"] = [round(float(x), 3) for x in norm01(uniform_filter1d(flux, 3))]

    # composite intensity: loudness + low-end/drum drive + brightness + onset density + layer count
    def z(x):
        return (x - np.percentile(x, 5)) / (np.percentile(x, 95) - np.percentile(x, 5) + 1e-9)
    win = int(bar_len * FPS)
    lay = sum((uniform_filter1d(env_db[k], win) > np.percentile(env_db[k], 90) - 15).astype(float)
              for k in ("drums", "bass", "synth", "vocal"))
    inten = (0.35 * z(uniform_filter1d(env_db["rms"], win)) + 0.2 * z(uniform_filter1d(env_db["drums"], win))
             + 0.15 * z(uniform_filter1d(env_db["high"], win)) + 0.15 * z(uniform_filter1d(flux, win))
             + 0.15 * lay / 4)
    inten = np.clip(inten, 0, None)
    inten = inten / (np.percentile(inten, 99) + 1e-9)
    env["intensity"] = [round(float(x), 3) for x in np.clip(inten, 0, 1)]
    for k in env:
        assert len(env[k]) == n, k

    # onsets --------------------------------------------------------------------
    ons = {}
    for name, s, kw in (("kick", "kick", dict(rel_db=12, min_gap=0.07, floor_db=-45)),
                        ("snare", "snare", dict(rel_db=12, min_gap=0.07, floor_db=-45)),
                        ("hat", "hh", dict(rel_db=10, min_gap=0.05, floor_db=-50, win=0.004)),
                        ("toms", "toms", dict(rel_db=12, min_gap=0.07, floor_db=-45)),
                        ("cymbal", "crash", dict(rel_db=10, min_gap=0.2, floor_db=-50)),
                        ("bass", "bass", dict(rel_db=9, min_gap=0.09, floor_db=-40, win=0.012, hi=400)),
                        ("synth", "other", dict(rel_db=9, min_gap=0.09, floor_db=-40, win=0.010))):
        ts, ps = stem_onsets(s, **kw)
        ons[name] = [[round(float(t), 3), round(float(v), 3)] for t, v in zip(ts, strength01(ps))]
    ons["vocal"] = [[round(t, 3), round(s, 3)] for t, s in vocal_onsets()]
    for k, v in ons.items():
        print(f"  onsets {k}: {len(v)}")

    # arrangement + events --------------------------------------------------
    bars = bar_activity(downbeats, duration, bar_len)
    parts = parts_from_bars(bars, sections)
    lyr_p = common.DATA / "lyrics.json"
    lyr = json.loads(lyr_p.read_text()) if lyr_p.exists() else None
    events = detect_events(env_db, FPS, beats, downbeats, ons, lyr, duration, bars, sections)
    # section energy (mean short-term level and mean intensity)
    for s in sections:
        a, b = int(s["start"] * FPS), int(s["end"] * FPS)
        s["loudness_db"] = round(float(np.mean(loud_db[a:b])), 1)
        s["loudness_p90_db"] = round(float(np.percentile(loud_db[a:b], 90)), 1)
        s["intensity"] = round(float(np.mean(inten[a:b])), 3)
        s["bars"] = s["bar_end"] - max(s["bar_start"], 0) if s["bar_start"] >= 0 else s["bar_end"]
    key = key_analysis(sections, duration)
    key["chorus_lead_pitch_midi"] = chorus_pitch_check(lyr)
    key["key_change"] = None
    key["note"] = ("F major throughout (relative D minor colour in verse 1, stop-time, pre-chorus 3, "
                   "bridge 2 and the breakdown). No key change: the final chorus melody sits on the "
                   "same pitches as choruses 1-3 (chorus_lead_pitch_midi) and every profile/section "
                   "estimate stays F major / D minor.")
    a1 = allin1_check(beats, downbeats)

    doc = dict(
        version=1,
        source="song.wav",
        sample_rate=common.SR_NATIVE,
        duration=round(duration, 3),
        timebase="seconds from sample 0 of song.wav",
        bpm=round(bpm, 3),
        beat_period=round(P, 6),
        time_signature=4,
        tempo=dict(bpm=round(bpm, 3), bpm_rounded=round(bpm), constant=True, first_beat=round(off, 4),
                   first_downbeat=round(first_db, 4), bar_length=round(bar_len, 5), **gstats,
                   half_time=dict(bridge="vocal phrasing only (lines span 4 bars instead of 2); the grid stays 153 BPM, "
                                         "the kick plays four-on-the-floor, no tempo change"),
                   note="One constant 4/4 grid for the whole song; no tempo drift (Beat This! residual sd ~9 ms, "
                        "20 ms frame quantisation) and no dropped/added beats (all Beat This! and allin1 downbeats "
                        "fall on the same phase)."),
        beats=[round(float(t), 3) for t in beats],
        downbeats=[round(float(t), 3) for t in downbeats],
        key=key,
        sections=sections,
        parts=parts,
        bars=bars,
        events=events,
        sync_moments=resolve_moments(SYNC_MOMENTS, downbeats, events, lyr),
        extra_moments=resolve_moments(EXTRA_MOMENTS, downbeats, events, lyr),
        fps=FPS,
        envelopes=env,
        onsets=ons,
        allin1=a1,
        notes=NOTES,
    )
    (common.DATA / "audio.json").write_text(json.dumps(doc, separators=(",", ":")))
    print("wrote", common.DATA / "audio.json", f"{len(beats)} beats, {len(downbeats)} downbeats, {len(events)} events")
    intensity_plot(doc, np.array(env["intensity"]), loud_db)
    return doc


def intensity_plot(doc, inten, loud_db):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    t = np.arange(len(inten)) / FPS
    fig, ax = plt.subplots(2, 1, figsize=(20, 8), sharex=True, gridspec_kw=dict(height_ratios=[3.2, 1.2]))
    cols = ["#e8eef8", "#f8ece6"]
    short = {"intro": "Intro", "verse1": "Verse 1", "pre1": "Pre 1", "chorus1": "Chorus 1", "post1": "Post 1",
             "verse2": "Verse 2", "pre2": "Pre 2", "chorus2": "Chorus 2", "post2": "Post 2", "inst": "Instr.",
             "verse3": "Verse 3", "stoptime": "Stop-time", "pre3": "Pre 3", "chorus3": "Chorus 3",
             "bridge": "Bridge", "bridge2": "Bridge 2 (drums cut)", "breakdown": "Break-\ndown",
             "chorus4": "Final chorus", "outro": "Outro"}
    for i, s in enumerate(doc["sections"]):
        for a in ax:
            a.axvspan(s["start"], s["end"], color=cols[i % 2], lw=0)
        ax[0].text((s["start"] + s["end"]) / 2, 1.17, short.get(s["id"], s["id"]), ha="center", va="center",
                   fontsize=8.5, rotation=0 if s["end"] - s["start"] > 7.5 else 90)
    for e in doc["events"]:
        if e["type"] in ("stop_acappella", "stop"):
            ax[0].axvspan(e["t"], e["end"], ymin=0, ymax=0.84, color="#3b6fc4", alpha=0.28, lw=0)
    ax[0].plot(t, inten, color="#b3261e", lw=1.4, label="intensity (composite 0-1, 1-bar smoothing)")
    ax[0].plot(t, np.array(doc["envelopes"]["rms"]) * 0.3, color="#444", lw=0.35, alpha=0.7, label="mix RMS envelope (x0.3)")
    for e in doc["events"]:
        if e["type"] == "hard_cut":
            ax[0].axvline(e["t"], color="k", lw=2)
            ax[0].text(e["t"] - 0.6, 0.62, "hard\ncut", ha="right", fontsize=8)
    ax[0].set_ylim(0, 1.25)
    ax[0].set_yticks([0, 0.25, 0.5, 0.75, 1.0])
    ax[0].set_ylabel("intensity")
    ax[0].legend(loc="lower right", fontsize=8, framealpha=0.9)
    ax[0].set_title("Zoom Zoom P(doom) - intensity by section (blue = band cuts out / a cappella stops)", fontsize=11)
    ax[1].plot(t, loud_db, color="#333", lw=0.7)
    ax[1].set_ylim(-40, -8)
    ax[1].set_ylabel("mix level dBFS\n(400 ms RMS)")
    ax[1].set_xlabel("time (s)")
    ax[1].set_xticks(np.arange(0, doc["duration"] + 1, 10))
    ax[1].set_xlim(0, doc["duration"])
    for a in ax:
        for s in doc["sections"]:
            a.axvline(s["start"], color="#999", lw=0.6)
    fig.tight_layout()
    out = common.RESEARCH / "audio-intensity.png"
    fig.savefig(out, dpi=110)
    plt.close(fig)
    print("wrote", out)


NOTES = (
    "Timeline = song.wav (48 kHz); every stem is sample-aligned with it (cross-correlation lag 0). "
    "Grid: constant 152.996 BPM (~153; the Suno prompt asked for 152), fitted by least squares on 584 Beat This! "
    "beats over the whole song, phase shifted onto kick attacks (drumsep kick stem); beats[] start at the "
    "first beat >= 0; downbeats[] every 4 beats (phase agreed by all Beat This! and allin1 downbeats). "
    "Bar k starts at downbeats[k]; the song opens with a 2-beat pickup. Sections: hand-mapped on bar "
    "boundaries (analysis/analyze.py SECTION_BARS) from stem activity, lyrics and allin1 boundaries. "
    "parts[] = runs of bars with the same layer state (on/low/off of drums, bass, synth, lead vocal, backing, "
    "each relative to its own loud bars). bars[] = per-bar stem levels. "
    "Envelopes: 60 fps, frame i centred at i/60 s, 46 ms RMS window, one-pole smoothing (10 ms attack / "
    "90 ms release), each divided by its 99th percentile and clipped to 0..1 (linear amplitude): rms/low "
    "(<150 Hz)/mid (150-2000 Hz)/high (>4 kHz) of the mix; drums/bass/synth ('other')/vocal (all vocals)/"
    "lead/backing = stems; kick/snare/hats = drumsep stems. loudness_db = 400 ms RMS level of the mix in "
    "dBFS. centroid = spectral centroid / 8 kHz. flux = spectral flux (onset strength). intensity = "
    "composite 0..1 (1-bar smoothing): 35% mix level, 20% drum level, 15% >4 kHz level, 15% onset density, "
    "15% number of active layers. Onsets [time, strength 0..1]: attack (steepest rise of log energy) of "
    "each drumsep stem (kick, snare, hat, toms, cymbal), bass-stem notes (<400 Hz), synth ('other' stem) "
    "attacks, lead-vocal note onsets (flux peaks + pitch jumps). Drumsep hats are weak in this mix. "
    "events[]: stop_acappella/stop (instrumental stem >32 dB below its loud level for >=0.35 s), return "
    "(first kick after a stop), drums_in/drums_out (bar level), roll (>=6 kick/snare/tom hits at <=8th-note "
    "spacing), loudness_peak, hard_cut. sync_moments = curated top-25 cue list (resolved from bars, "
    "lyric words and events; see SYNC_MOMENTS in analyze.py). key: essentia KeyExtractor (edma profile primary)."
)

if __name__ == "__main__":
    main(plots="--plots" in sys.argv)
