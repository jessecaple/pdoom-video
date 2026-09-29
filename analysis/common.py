"""Shared paths / cache setup for the Zoom Zoom P(doom) analysis scripts.

Import this module FIRST (before torch / huggingface / whisper imports) so that
all model downloads land in analysis/.cache/ and all intermediates in
analysis/work/.

Time reference: song.wav (48 kHz, 16-bit, stereo, 229.6 s) sample 0 = t 0.0 s.
All stems are rendered from song.wav directly (no mp3 decode), so they share
its timeline; separate.py verifies this by cross-correlation.
"""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent          # analysis/
PROJECT = ROOT.parent                            # pdoom-1/
CACHE = ROOT / ".cache"
for var, sub in [("TORCH_HOME", "torch"), ("HF_HOME", "hf"), ("HF_HUB_CACHE", "hf/hub"),
                 ("HUGGINGFACE_HUB_CACHE", "hf/hub"), ("TRANSFORMERS_CACHE", "hf/transformers"),
                 ("XDG_CACHE_HOME", "xdg"), ("MPLCONFIGDIR", "mpl"), ("NUMBA_CACHE_DIR", "numba")]:
    os.environ.setdefault(var, str(CACHE / sub))
    (CACHE / sub).mkdir(parents=True, exist_ok=True)

AUDIO = PROJECT / "song.wav"
WORK = ROOT / "work"
STEMS = WORK / "stems"
MODELS = CACHE / "separator-models"
WHISPER_MODELS = CACHE / "whisper"
DATA = PROJECT / "data"
RESEARCH = PROJECT / "research"
QA = WORK / "qa"
for d in (WORK, STEMS, MODELS, WHISPER_MODELS, DATA, RESEARCH, QA):
    d.mkdir(parents=True, exist_ok=True)

SR_NATIVE = 48000

# stem name -> file (written by separate.py)
STEM_FILES = {
    "drums": STEMS / "demucs" / "drums.wav",
    "bass": STEMS / "demucs" / "bass.wav",
    "other": STEMS / "demucs" / "other.wav",
    "vocals_demucs": STEMS / "demucs" / "vocals.wav",
    "vocals": STEMS / "vocals" / "vocals.wav",          # roformer vocal stem (primary)
    "instrumental": STEMS / "vocals" / "instrumental.wav",
    "lead": STEMS / "karaoke" / "lead.wav",             # karaoke model: lead vocal
    "backing": STEMS / "karaoke" / "backing.wav",       # karaoke model: backing vocals
    "kick": STEMS / "drumsep" / "kick.wav",
    "snare": STEMS / "drumsep" / "snare.wav",
    "toms": STEMS / "drumsep" / "toms.wav",
    "hh": STEMS / "drumsep" / "hh.wav",
    "ride": STEMS / "drumsep" / "ride.wav",
    "crash": STEMS / "drumsep" / "crash.wav",
}


def load(path_or_name, sr=None, mono=True):
    """Load song.wav ('mix') or a stem by name, optionally resampled."""
    import numpy as np
    import soundfile as sf
    p = AUDIO if path_or_name == "mix" else STEM_FILES.get(path_or_name, path_or_name)
    y, s = sf.read(str(p), dtype="float32", always_2d=True)
    y = y.T  # (ch, n)
    if mono:
        y = y.mean(axis=0)
    if sr and sr != s:
        import soxr
        y = soxr.resample(y.T if not mono else y, s, sr).T if not mono else soxr.resample(y, s, sr)
        s = sr
    return y, s


def duration():
    import soundfile as sf
    info = sf.info(str(AUDIO))
    return info.frames / info.samplerate
