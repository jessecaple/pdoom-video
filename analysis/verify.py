"""Spot checks of the timing data by slicing the audio with ffmpeg.

Word timings: for each checked word with aligned start s, ffmpeg cuts two
slices of the vocal stem, AFTER = [s - 0.03, s + 2.0] and BEFORE =
[s - 2.0, s - 0.03]; Whisper large-v3 transcribes each. A correct start means
the word is the first thing heard in AFTER and is absent from the end of
BEFORE.

Section boundaries: ffmpeg 'volumedetect' mean level of the relevant stem in
the 0.9 s before vs after the boundary, plus Whisper on a mix slice for
lyric-defined boundaries.

Writes work/verify.txt.   Run:  uv run python verify.py
"""
import common
import json
import re
import subprocess

import whisper_run as W

TMP = common.WORK / "verify"
TMP.mkdir(exist_ok=True)

WORDS = [("v1.1", 0), ("c1.2", 0), ("v2.4", 6), ("v3.1", 0), ("v3.4", 7), ("v3st.2", 0),
         ("br.4", 0), ("c4.6a", 0), ("c4.7", 6), ("brk.1", 0)]

BOUNDARIES = [
    # (t, stem file key, description, whisper slice after (s) or None)
    (47.797, "drums", "chorus1 a cappella stop -> post-chorus 1 drop", None),
    (105.837, "drums", "instrumental -> verse 3 (drums back, 'Eleven hundred')", 3.0),
    (170.153, "drums", "bridge -> bridge 2 (drums cut)", 3.0),
    (195.251, "instrumental", "breakdown -> final chorus a cappella bar ('Zoom, zoom!')", 2.4),
    (209.369, "drums", "final-chorus stop -> final drop ('Doom, doom, the warning shot')", 2.6),
    (228.541, "mix", "hard cut to silence at the end", None),
]


def cut(src, t0, t1, name):
    out = TMP / f"{name}.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{max(0, t0):.3f}", "-to", f"{t1:.3f}", "-i", str(src),
                    "-ac", "1", "-ar", "16000", str(out)], check=True)
    return out


def mean_volume(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", "volumedetect", "-f", "null", "-"],
                       capture_output=True, text=True)
    m = re.search(r"mean_volume: (-?[\d.]+) dB", r.stderr)
    return float(m.group(1)) if m else None


def whisper_file(path):
    import numpy as np
    import soundfile as sf
    y, sr = sf.read(str(path), dtype="float32")
    y = y / (np.abs(y).max() + 1e-9) * 0.9
    res = W.transcribe(y, "large-v3")
    return [w["word"].strip() for s in res["segments"] for w in s.get("words", [])]


def main():
    lyr = json.loads((common.DATA / "lyrics.json").read_text())
    L = {l["id"]: l for l in lyr["lines"]}
    out = []
    vocal = common.STEM_FILES["vocals"]
    out.append("== word starts (vocal stem slices, Whisper large-v3)")
    for lid, wi in WORDS:
        w = L[lid]["words"][wi]
        s = w["start"]
        a = whisper_file(cut(vocal, s - 0.03, s + 2.0, f"{lid}_{wi}_after"))
        b = whisper_file(cut(vocal, s - 2.0, s - 0.03, f"{lid}_{wi}_before"))
        out.append(f"{lid:7s} '{w['w']}' start {s:.3f}  AFTER-> {' '.join(a[:5])!r}   BEFORE-> ...{' '.join(b[-4:])!r}")
    out.append("")
    out.append("== section boundaries (ffmpeg volumedetect on stems, 0.9 s each side)")
    mixp = common.AUDIO
    for t, key, desc, wh in BOUNDARIES:
        src = mixp if key == "mix" else common.STEM_FILES[key]
        v0 = mean_volume(cut(src, t - 0.95, t - 0.05, f"b{t:.0f}_pre"))
        v1 = mean_volume(cut(src, t + 0.05, t + 0.95, f"b{t:.0f}_post"))
        line = f"{t:8.3f} {desc}: {key} mean {v0} dB before -> {v1} dB after"
        if wh:
            words = whisper_file(cut(mixp, t, t + wh, f"b{t:.0f}_mix"))
            line += f"   | Whisper on mix [{t:.2f}, {t + wh:.2f}]: {' '.join(words)!r}"
        out.append(line)
    txt = "\n".join(out)
    (common.WORK / "verify.txt").write_text(txt + "\n")
    print(txt)


if __name__ == "__main__":
    main()
