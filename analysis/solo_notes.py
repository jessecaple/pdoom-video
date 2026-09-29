"""Pitch-track the synth solo (the 'other' stem) and segment it into notes for the renderer.
Writes ../data/solo_notes.json: {t0, t1, notes: [{t, end, midi}], frames: [[t, midi|null], ...]}.
    .venv/bin/python solo_notes.py
"""
import json, numpy as np, librosa
T0, T1 = 93.0, 99.7
y, sr = librosa.load('work/stems/demucs/other.wav', sr=22050, mono=True, offset=T0, duration=T1 - T0)
hop = 256
f0, vflag, vprob = librosa.pyin(y, fmin=librosa.note_to_hz('C3'), fmax=librosa.note_to_hz('C7'), sr=sr, hop_length=hop, frame_length=2048)
times = T0 + librosa.times_like(f0, sr=sr, hop_length=hop)
midi = np.where(vflag & (vprob > 0.3), librosa.hz_to_midi(np.nan_to_num(f0, nan=1.0)), np.nan)
# Segment: a new note when the rounded pitch changes or voicing breaks; drop notes shorter than 50 ms.
notes, cur = [], None
for t, m in zip(times, midi):
    r = None if np.isnan(m) else int(round(m))
    if cur and (r is None or r != cur['midi']):
        if cur['end'] - cur['t'] >= 0.05: notes.append(cur)
        cur = None
    if r is not None:
        if cur is None: cur = {'t': float(t), 'end': float(t), 'midi': r}
        cur['end'] = float(t) + hop / sr
if cur and cur['end'] - cur['t'] >= 0.05: notes.append(cur)
json.dump({'t0': T0, 't1': T1, 'notes': [{k: round(v, 3) if isinstance(v, float) else v for k, v in n.items()} for n in notes],
           'frames': [[round(float(t), 3), None if np.isnan(m) else round(float(m), 2)] for t, m in zip(times, midi)]},
          open('../data/solo_notes.json', 'w'))
print(len(notes), 'notes; range', min(n['midi'] for n in notes), max(n['midi'] for n in notes))
for n in notes[:40]: print(n)
