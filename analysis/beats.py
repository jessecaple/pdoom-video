"""Beat / downbeat tracking with Beat This! (CPJKU, ISMIR 2024), no DBN.

Runs the 'final0' checkpoint on the mix, the instrumental (vocal-free) stem and
the Demucs drums stem, and writes work/beats_<source>.json with raw beat and
downbeat times. analyze.py fits the final grid from these.

Run:  uv run python beats.py
"""
import common
import json

import numpy as np


def track(source, f2b):
    y, sr = common.load(source, sr=None)
    beats, downbeats = f2b(y, sr)
    out = dict(source=source, beats=[round(float(b), 4) for b in beats],
               downbeats=[round(float(b), 4) for b in downbeats])
    (common.WORK / f"beats_{source}.json").write_text(json.dumps(out))
    ibi = np.diff(beats)
    print(f"{source:13s} {len(beats)} beats, {len(downbeats)} downbeats, median IBI {np.median(ibi):.4f}s "
          f"= {60 / np.median(ibi):.2f} BPM")
    return out


if __name__ == "__main__":
    import torch
    from beat_this.inference import Audio2Beats
    a2b = Audio2Beats(checkpoint_path="final0", device="cuda" if torch.cuda.is_available() else "cpu", dbn=False)
    for s in ("mix", "instrumental", "drums"):
        track(s, a2b)
