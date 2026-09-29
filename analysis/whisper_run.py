"""Whisper transcription of the vocal stem (what is ACTUALLY sung).

openai-whisper large-v3 (and turbo) with word timestamps, run on the RoFormer
vocal stem (and optionally the karaoke lead stem). Used (a) to discover
deviations from the written lyrics (repeats, skips, ad-libs), (b) as an
independent cross-check for the CTC forced alignment.

Writes work/whisper_<model>_<source>[_prompt].json

Run:  uv run python whisper_run.py [model] [source]     model: large-v3|turbo  source: vocals|lead|mix
      uv run python whisper_run.py slice T0 T1 [source]  -> transcribe one slice (spot checks)
"""
import common
import json
import sys

import numpy as np

PROMPT = ("Zoom Zoom P(doom). Grok, Musk, Anthropic, Claude, Mythos, Florida, Hugging Face, "
          "Coxon, Hubinger, Hinton, Congress, Astra, Dario, Stargate, Jensen, DNS, OpenAI, P-doom.")

_models = {}


def model(name):
    import whisper
    if name not in _models:
        _models[name] = whisper.load_model(name, device="cuda", download_root=str(common.WHISPER_MODELS))
    return _models[name]


def audio16(source):
    y, _ = common.load(source, sr=16000)
    return (y / (np.abs(y).max() + 1e-9) * 0.9).astype(np.float32)


def transcribe(y, name, prompt=None, offset=0.0):
    res = model(name).transcribe(
        y, language="en", word_timestamps=True, condition_on_previous_text=False,
        initial_prompt=prompt, temperature=0.0, no_speech_threshold=None,
        compression_ratio_threshold=None, logprob_threshold=None, fp16=True)
    for s in res["segments"]:
        s["start"] += offset
        s["end"] += offset
        for w in s.get("words", []):
            w["start"] += offset
            w["end"] += offset
    return res


def run(name="large-v3", source="vocals"):
    y = audio16(source)
    for tag, prompt in (("", None), ("_prompt", PROMPT)):
        res = transcribe(y, name, prompt)
        out = common.WORK / f"whisper_{name}_{source}{tag}.json"
        out.write_text(json.dumps(res, indent=1, default=float))
        print("==", out.name)
        for seg in res["segments"]:
            print(f"{seg['start']:7.2f} {seg['end']:7.2f} {seg['text']}")


def slice_words(t0, t1, source="vocals", name="large-v3", prompt=None):
    y = audio16(source)
    seg = y[int(t0 * 16000): int(t1 * 16000)]
    res = transcribe(seg, name, prompt, offset=t0)
    return [(w["word"].strip(), round(w["start"], 2), round(w["end"], 2))
            for s in res["segments"] for w in s.get("words", [])]


if __name__ == "__main__":
    a = sys.argv[1:]
    if a and a[0] == "slice":
        t0, t1 = float(a[1]), float(a[2])
        src = a[3] if len(a) > 3 else "vocals"
        for w in slice_words(t0, t1, src):
            print(w)
    else:
        run(a[0] if a else "large-v3", a[1] if len(a) > 1 else "vocals")
