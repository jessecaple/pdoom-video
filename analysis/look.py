"""QA plot of a time window: mix mel-spectrogram, vocal-stem spectrogram + pitch,
stem RMS, beat/bar grid, and (if present) aligned words from data/lyrics.json.

Run:  uv run python look.py T0 T1 [name]   -> work/qa/look_<name>.png
"""
import common
import json
import sys

import numpy as np
import librosa
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

BPM, OFF = None, None


def grid():
    p = common.DATA / "audio.json"
    if p.exists():
        d = json.loads(p.read_text())
        return d["beats"], d["downbeats"]
    b = json.loads((common.WORK / "beats_mix.json").read_text())
    return b["beats"], b["downbeats"]


def words():
    p = common.DATA / "lyrics.json"
    if not p.exists():
        return []
    d = json.loads(p.read_text())
    return [(w["w"], w["start"], w["end"]) for l in d["lines"] for w in l["words"]]


def look(t0, t1, name=None):
    sr = 22050
    fig, ax = plt.subplots(4, 1, figsize=(22, 13), sharex=True, gridspec_kw=dict(height_ratios=[2, 2, 1.4, 0.5]))
    mix, _ = common.load("mix", sr=sr)
    seg = mix[int(t0 * sr): int(t1 * sr)]
    S = librosa.power_to_db(librosa.feature.melspectrogram(y=seg, sr=sr, n_fft=2048, hop_length=128, n_mels=160, fmax=11000), ref=np.max)
    ext = [t0, t0 + S.shape[1] * 128 / sr, 0, 160]
    ax[0].imshow(S, origin="lower", aspect="auto", cmap="magma", vmin=-70, vmax=0, extent=ext)
    ax[0].set_ylabel("mix mel")
    v, _ = common.load("lead", sr=sr)
    sv = v[int(t0 * sr): int(t1 * sr)]
    S2 = librosa.power_to_db(librosa.feature.melspectrogram(y=sv, sr=sr, n_fft=2048, hop_length=128, n_mels=160, fmax=11000), ref=np.max)
    ax[1].imshow(S2, origin="lower", aspect="auto", cmap="magma", vmin=-70, vmax=0, extent=ext)
    ax[1].set_ylabel("lead vocal mel")
    hop = 441
    for n, c in [("mix", "k"), ("drums", "tab:orange"), ("bass", "tab:brown"), ("other", "tab:olive"),
                 ("lead", "tab:purple"), ("backing", "tab:pink"), ("kick", "tab:red"), ("snare", "tab:blue"), ("hh", "tab:cyan")]:
        try:
            y, _ = common.load(n, sr=sr)
        except Exception:
            continue
        y = y[int(t0 * sr): int(t1 * sr)]
        r = librosa.feature.rms(y=y, frame_length=1024, hop_length=hop)[0]
        ax[2].plot(t0 + np.arange(len(r)) * hop / sr, 20 * np.log10(r + 1e-6), color=c, lw=1, label=n)
    ax[2].set_ylim(-70, 0)
    ax[2].legend(loc="upper left", fontsize=7, ncol=9)
    beats, dbs = grid()
    for b in beats:
        if t0 <= b <= t1:
            for a in ax[:3]:
                a.axvline(b, color="w" if a is not ax[2] else "gray", lw=0.5, alpha=0.5)
    for b in dbs:
        if t0 <= b <= t1:
            for a in ax[:3]:
                a.axvline(b, color="c", lw=1.5, alpha=0.8)
    for w, s, e in words():
        if t0 - 1 <= s <= t1:
            ax[3].axvspan(s, e, color="tab:purple", alpha=0.25)
            ax[3].text(s, 0.5, w, fontsize=8, rotation=60, va="center")
    ax[3].set_yticks([])
    ax[3].set_xlim(t0, t1)
    ax[3].set_xticks(np.arange(np.ceil(t0 * 2) / 2, t1, 0.5))
    ax[3].tick_params(axis="x", labelsize=7)
    fig.tight_layout()
    out = common.QA / f"look_{name or f'{t0:.1f}_{t1:.1f}'}.png"
    fig.savefig(out, dpi=60)
    plt.close(fig)
    print(out)


if __name__ == "__main__":
    look(float(sys.argv[1]), float(sys.argv[2]), sys.argv[3] if len(sys.argv) > 3 else None)
