"""Stem separation with audio-separator (UVR model zoo), all on the GPU.

  1. Demucs htdemucs_ft  (song.wav)        -> work/stems/demucs/{drums,bass,other,vocals}.wav
  2. BS-/Mel-RoFormer vocal model (song)   -> work/stems/vocals/{vocals,instrumental}.wav
  3. Mel-RoFormer karaoke model (vocals)   -> work/stems/karaoke/{lead,backing}.wav
  4. MDX23C DrumSep (demucs drums)         -> work/stems/drumsep/{kick,snare,toms,hh,ride,crash}.wav

Weights are downloaded to analysis/.cache/separator-models/.
Every stem is written at 48 kHz so it shares song.wav's sample timeline; the
script checks the alignment by cross-correlating (sum of demucs stems) with the
mix at a few points.

Run:  uv run python separate.py [step ...]      steps: demucs vocals karaoke drumsep check
"""
import common
import shutil
import sys
from pathlib import Path

VOCAL_MODEL = "vocals_mel_band_roformer.ckpt"          # Mel-RoFormer vocals (Kim), top vocal SDR in the zoo
KARAOKE_MODEL = "mel_band_roformer_karaoke_becruily.ckpt"  # lead vs backing vocals
DEMUCS_MODEL = "htdemucs_ft.yaml"
DRUMSEP_MODEL = "MDX23C-DrumSep-aufr33-jarredou.ckpt"


def separator(out_dir):
    from audio_separator.separator import Separator
    out_dir.mkdir(parents=True, exist_ok=True)
    return Separator(output_dir=str(out_dir), model_file_dir=str(common.MODELS),
                     output_format="WAV", sample_rate=common.SR_NATIVE,
                     use_autocast=False)


def run(model, src, out_dir, rename):
    """rename: {lowercase stem-name substring: target file stem}"""
    tmp = out_dir / "_tmp"
    if tmp.exists():
        shutil.rmtree(tmp)
    sep = separator(tmp)
    sep.load_model(model_filename=model)
    files = sep.separate(str(src))
    print(model, "->", files)
    for f in files:
        p = Path(f)
        if not p.is_absolute():
            p = tmp / p
        name = p.stem.lower()
        # audio-separator names outputs "<input>_(<Stem>)_<model>.wav"
        stem = name.split("_(")[-1].split(")")[0] if "_(" in name else name
        tgt = None
        for key, t in rename.items():
            if key == stem:
                tgt = t
        if tgt is None:
            print("  (unmapped output kept as)", p.name)
            tgt = stem.replace(" ", "_")
        shutil.move(str(p), str(out_dir / f"{tgt}.wav"))
        print("  ", stem, "->", out_dir / f"{tgt}.wav")
    shutil.rmtree(tmp, ignore_errors=True)


def check():
    """Cross-correlate the demucs stem sum with the mix -> sample offset."""
    import numpy as np
    mix, sr = common.load("mix")
    tot = sum(common.load(n)[0][: len(mix)] for n in ("drums", "bass", "other", "vocals_demucs"))
    for t in (30, 90, 150, 200):
        a = mix[int(t * sr): int((t + 5) * sr)]
        b = tot[int(t * sr): int((t + 5) * sr)]
        lags = range(-400, 401)
        c = [np.dot(a[400:-400], b[400 + L: len(b) - 400 + L]) for L in lags]
        print(f"t={t:3d}s best lag {lags[int(np.argmax(c))]} samples")
    for n in ("vocals", "lead", "kick"):
        y, s = common.load(n)
        print(n, s, len(y) / s)


if __name__ == "__main__":
    steps = sys.argv[1:] or ["demucs", "vocals", "karaoke", "drumsep", "check"]
    S = common.STEMS
    if "demucs" in steps:
        run(DEMUCS_MODEL, common.AUDIO, S / "demucs",
            {"drums": "drums", "bass": "bass", "other": "other", "vocals": "vocals"})
    if "vocals" in steps:
        run(VOCAL_MODEL, common.AUDIO, S / "vocals",
            {"vocals": "vocals", "instrumental": "instrumental", "other": "instrumental"})
    if "karaoke" in steps:
        run(KARAOKE_MODEL, common.STEM_FILES["vocals"], S / "karaoke",
            {"vocals": "lead", "karaoke": "lead", "instrumental": "backing", "other": "backing"})
    if "drumsep" in steps:
        run(DRUMSEP_MODEL, common.STEM_FILES["drums"], S / "drumsep",
            {"kick": "kick", "snare": "snare", "toms": "toms", "hh": "hh", "ride": "ride", "crash": "crash"})
    if "check" in steps:
        check()
