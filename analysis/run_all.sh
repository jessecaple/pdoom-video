#!/usr/bin/env bash
# Regenerate data/audio.json, data/lyrics.json and research/audio-intensity.png
# from song.wav. Models (~5 GB) download into analysis/.cache/, stems and
# intermediates go to analysis/work/. Needs uv, ffmpeg and an NVIDIA GPU.
set -euo pipefail
cd "$(dirname "$0")"
uv sync
uv run python separate.py                 # Demucs htdemucs_ft, Mel-RoFormer vocals, karaoke lead/backing, DrumSep
uv run python beats.py                    # Beat This! beats/downbeats on mix, instrumental, drums
uv run python whisper_run.py large-v3 vocals
uv run python ctc_emissions.py            # MMS_FA + wav2vec2-LV60K emissions: vocals, vocL, vocR, lead
uv run python vocal_feats.py
( cd allin1env && uv sync && uv run python run_allin1.py ) || echo "allin1 cross-check skipped"
uv run python analyze.py                  # pass 1: grid, sections, envelopes -> data/audio.json
uv run python align.py --plots            # data/lyrics.json (+ QA plots in work/qa/)
uv run python analyze.py                  # pass 2: adds the chorus-pitch key check from lyrics.json
uv run python verify.py                   # ffmpeg slice spot checks -> work/verify.txt
