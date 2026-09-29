"""Frame-wise CTC log-probabilities (20 ms frames) of the vocal stems.

Adapted from mexicat/pdoom-video (MIT). Two acoustic models give two
independent alignments:
  mms   : torchaudio MMS_FA (multilingual, romanized chars, trained for alignment)
  lv60k : torchaudio WAV2VEC2_ASR_LARGE_LV60K_960H (English chars)
Sources: vocals (Mel-RoFormer vocal stem, mono), vocL / vocR (its channels),
lead (karaoke lead stem). Emissions are computed on overlapping chunks with
context and stitched -> work/emission_<model>[_<source>].npy  [frames, vocab]

Run:  uv run python ctc_emissions.py [source ...]
"""
import common
import sys

import numpy as np
import torch
import torchaudio

HOP = 320  # samples @16k -> 20 ms


def load_source(source):
    if source in ("vocL", "vocR"):
        y, _ = common.load("vocals", sr=16000, mono=False)
        return y[0 if source == "vocL" else 1]
    return common.load(source, sr=16000)[0]


def compute(name, source="vocals", chunk_s=20.0, ctx_s=3.0):
    bundle = {"mms": torchaudio.pipelines.MMS_FA,
              "lv60k": torchaudio.pipelines.WAV2VEC2_ASR_LARGE_LV60K_960H}[name]
    model = bundle.get_model(with_star=False) if name == "mms" else bundle.get_model()
    model = model.to("cuda").eval()
    y = load_source(source)
    y = (y / (np.abs(y).max() + 1e-9)).astype(np.float32)
    n_frames = len(y) // HOP
    chunk, ctx = int(chunk_s * 16000), int(ctx_s * 16000)
    out = None
    for s in range(0, len(y), chunk):
        a, b = max(0, s - ctx), min(len(y), s + chunk + ctx)
        x = torch.from_numpy(y[a:b])[None].to("cuda")
        with torch.inference_mode():
            em, _ = model(x)
            em = torch.log_softmax(em, dim=-1)[0].float().cpu().numpy()
        if out is None:
            out = np.full((n_frames, em.shape[1]), np.nan, np.float32)
        f0 = a // HOP
        lo, hi = s // HOP, min(n_frames, (s + chunk) // HOP)
        seg = em[lo - f0: hi - f0]
        out[lo: lo + len(seg)] = seg
    last = np.where(~np.isnan(out[:, 0]))[0].max()
    out[last + 1:] = out[last]
    tag = name if source == "vocals" else f"{name}_{source}"
    np.save(common.WORK / f"emission_{tag}.npy", out)
    print(tag, out.shape)
    return out


if __name__ == "__main__":
    for src in sys.argv[1:] or ["vocals", "vocL", "vocR", "lead"]:
        for n in ("mms", "lv60k"):
            compute(n, source=src)
