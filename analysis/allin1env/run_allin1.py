"""All-In-One music structure analysis (Kim & Nam, WASPAA 2023) as a cross-check:
beats, downbeats, functional segment labels (intro/verse/chorus/bridge/...).
jdf fork with plain-PyTorch neighborhood attention (no NATTEN build needed).
Run from analysis/allin1env:  uv run python run_allin1.py
Writes ../work/allin1/song.json
"""
import os, sys, json
from pathlib import Path
HERE = Path(__file__).resolve().parent
CACHE = HERE.parent / ".cache"
for var, sub in [("TORCH_HOME", "torch"), ("HF_HOME", "hf"), ("XDG_CACHE_HOME", "xdg"),
                 ("MPLCONFIGDIR", "mpl"), ("NUMBA_CACHE_DIR", "numba")]:
    os.environ.setdefault(var, str(CACHE / sub))
import allin1
out = HERE.parent / "work" / "allin1"
out.mkdir(parents=True, exist_ok=True)
res = allin1.analyze(str(HERE.parent.parent / "song.wav"), out_dir=str(out), demix_dir=str(out / "demix"),
                     spec_dir=str(out / "spec"), device="cpu", keep_byproducts=True, overwrite=True)
print("bpm", res.bpm)
for s in res.segments:
    print(f"{s.start:8.2f} {s.end:8.2f} {s.label}")
