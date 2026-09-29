# Regenerates ../MOTION.md from plan.json + ../storyboard/shots.json. Run: python3 motion/gen_doc.py
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
plan = json.load(open(os.path.join(HERE, 'plan.json')))
shots = {s['id']: s for s in json.load(open(os.path.join(ROOT, 'storyboard', 'shots.json')))}
TR = {'cut': 'T1 cut', 'tear': 'T2 tear-wipe', 'slam': 'T3 slam', 'zoom': 'T4 crash zoom', 'stutter': 'T5 stutter', 'dissolve': 'T7 dissolve'}
FX = {'push': 'E8a push', 'punch': 'E1 punch', 'shake': 'E2 shake', 'tear': 'E3 tear', 'clip': 'E4 clip', 'reveal': 'E5 reveal',
      'ratchet': 'E6 ratchet', 'stutter': 'E6 stutter', 'crunch': 'E7 crunch', 'pan': 'E8 pan', 'flip': 'E9 flip', 'tape': 'E10 tape',
      'zoomchops': 'E11 zoom chops', 'drostepush': 'E12 recursion', 'freeze': 'T6 freeze on stop', 'cold': 'COLD', 'live': 'audio-driven'}

def ts(t):
    m = int(t // 60)
    return f"{m}:{t - m * 60:04.1f}"

rows = []
for n, p in enumerate(plan, 1):
    s = shots[p['id']]
    fx = ', '.join(FX[f] for f in p['fx']) or '—'
    rows.append(f"| {n} | {ts(p['start'])} | {s['section']} · {s['moment']} | {p['mood']} | {TR[p['in']]} | {fx} | {len(p['focus'])} | {p['note']} |")

HEAD = '''# THE RECORD: motion and edit spec

This spec turns the approved storyboard (`storyboard/`) into the edit. Every frame of the video is a pure function of song time, so any moment can be rendered or previewed on its own.

| Where | What |
|---|---|
| `motion/plan.json` | Per-shot data: start time, entry transition, effects, punch-in rects |
| `motion/engine.js` | The engine that applies the plan |
| `index.html?motion=1&t=<s>` | Live preview of the edit at a given time |
| `index.html?motion=1&only=tear,clip` | Preview with only the listed effects enabled |
| `motion/reel.sh` | Renders the vocabulary reel |
| `motion/gen_doc.py` | Regenerates this file from the plan |

## 1. The rules that override everything
1. **Cuts land on the music.** Every shot starts on its line's first sung word, or on the musical event it belongs to (a drop, a band stop, drums in or out). No cut is placed by eye.
2. **When the band stops, the picture stops.** During the 18 band-outs (`stop_acappella` in `data/audio.json`) there are no cuts, no shake, no tears and no clipping. The frame holds. The only exceptions are the chorus-hook recursion (E12) and the a cappella zoom chops (E11), which move slowly.
3. **Cold frames stay cold.** The real-harm shots (grok, florida, blacklist, logs, court) never shake, tear, clip or crunch. They get a slow push at most.
4. **Rolls drive motion, not light.** Drum rolls and ratchets make the picture stutter or accelerate; they never trigger full-frame flashes. There are at most 3 large-area luminance flashes per second anywhere. A flash limiter in the engine only lets white clip bands and 1-bit crunches fire on hits spaced ≥ 0.45 s apart (crunch ≥ 1.2 s; scream crunch ≥ 0.5 s). Every section clip is measured with `tools/flashcheck.py <clip> <song-start>` (1-second window, 25% area, 10% luminance), and the final master is checked the same way.
5. **Effects never destroy information.** Tears and clips hit the frame's texture; hero numbers, quotes and dates are readable in every held frame. This matches the storyboard rule of drawing the tear before the key text.
6. **Emotion dictates motion.** Every shot has a mood (the table below), and it multiplies the section's chaos. A sneering verse moves cockily, an anthem chorus pounds, a hush barely moves, and cold or bare frames don't move at all.
7. **Screams take over.** Only the first scream (FOR NOW!) shatters the frame; the later ones (hit the gas!, HOAX, WHO CAN TELL?) get a glitchy pulse fuzz instead: faint 1-bit static, heavier static bands, a rolling tracking band, fine slice jitter, and a small scale pulse with the voice. The first scream shakes itself apart: the frame shatters into ~70 jagged shards, each thrown outward and rattled every frame by the vocal, with the camera thrown around, tears, a 1-bit crunch on each vocal hit, and the words exploding outward (E15). It snaps back together within ~0.5 s of the shout ending. This overrides the band-stop freeze.
8. **Chaos escalates with the song.** Every effect scales by `chaos(t) = (section base × 0.8 + intensity × 0.3) × mood`:

   | Section | Base | Section | Base |
   |---|---|---|---|
   | intro | 0.15 | verse 3 | 0.55 |
   | verse 1 | 0.25 | stop-time | 0.05 |
   | pre-chorus 1 | 0.35 | pre-chorus 3 | 0.7 |
   | chorus 1 | 0.5 | chorus 3 | 0.85 |
   | post-chorus 1 | 0.65 | bridge | 0.9 |
   | verse 2 | 0.4 | bridge 2 (the hush) | 0.12 |
   | pre-chorus 2 | 0.5 | breakdown | 0.6 |
   | chorus 2 | 0.65 | final chorus | 1.0 |
   | post-chorus 2 | 0.75 | outro | 0.9 |
   | solo | 0.6 | | |

   | Mood | × | Mood | × |
   |---|---|---|---|
   | cold, bare | 0 | anthem | 1.2 |
   | hush | 0.35 | urgent | 1.3 |
   | deadpan | 0.5 | epic | 1.4 |
   | tension | 0.8 | frenzy | 1.6 |
   | sneer | 1.0 | scream | 1.6 |
   | confession | 1.1 | | |

## 2. Transitions (how a shot enters)
| Code | Name | What happens | Used for |
|---|---|---|---|
| T1 | Hard cut | Instant, on the line's first word or downbeat. | The default. All verse lines, and the cold frames. |
| T2 | Tear-wipe | The new shot arrives in horizontal bands over 1 beat; the old shot's bands slide out. | Chorus line changes, verse pickups. |
| T3 | Slam | The new shot lands at 116% scale and settles in 0.14 s, with one white clip band on impact. | Drops, the band slamming back in. |
| T4 | Crash zoom through | The outgoing shot crash-zooms into its focus point over 0.4 s, then cuts. | Into the choruses, and out of the intro. |
| T5 | Stutter | Old and new alternate on 16ths for ¾ beat, then land. | "(hit the gas!)" replay, chorus 2 and 3 line changes. |
| T6 | Freeze | The picture holds for the whole band stop; the next cut lands when the band returns. | Every band stop (see rule 2). |
| T7 | 1-bit dissolve | An ordered-dither dissolve over 2 beats. | The quiet passages: the solo's end, the stop-time, bridge 2. |

## 3. Effects (what happens inside a shot)
| Code | Name | Trigger | Scales with |
|---|---|---|---|
| E1 | Punch-in | Downbeats in the last ~40% of a shot (after its elements have landed): a gentle crop (max 1.35×) onto the next focus rect, alternating with wide. | — |
| E2 | Kick shake | Kick onsets, decaying over ~70 ms. | chaos (up to 16 px) |
| E3 | Snare tear | Snare onsets: horizontal slice tears. | chaos (3–21 slices, 20–280 px) |
| E4 | 808 clip | Kick peaks, when chaos > 0.4: one band blown out to paper white. | chaos |
| E5 | Word-sync reveal | The frame reveals top to bottom, one step per sung word, complete by 80% of the shot. | — |
| E6 | Ratchet stutter | During rolls: the picture holds on ½- then ¼-beat steps, accelerating into the downbeat. | — |
| E7 | 1-bit crunch | The first 0.22 s after every drop, and on heavy kicks when chaos > 0.8: the whole frame drops to 1-bit at quarter resolution, with red kept red. | — |
| E8 | Pan / push | A: slow 5% push across the shot, only on a few quiet shots (sharma, the stop-time, the hush). B (bridge peak): a continuous pan across the frame at 1.9×, one step per kick. | — |
| E9 | Flipbook | On each kick, cut to a different full-frame shot from earlier in the year. | — |
| E10 | Tape drag | On the HOAX pitch-dive (117.95–118.6): frame rate halves and the image sags vertically. | — |
| E11 | Zoom chops | On every sung "zoom", a quick 1.22× kick toward the card that just landed, settling back to wide. | — |
| E12 | Recursion | Chorus-hook band stops: a truly infinite zoom into the chorus's own frame, drawn down to 1 px so nothing pops in. It escalates: chorus 1 drifts (1 level/bar); choruses 3–4 dive (4–6 levels/bar, accelerating) while the whole tunnel spirals as one (same small turn per level + a slow spin). Each syllable lurches it forward. | — |
| E13 | Element entrances | Layered shots: each element (number, stamp, row, bar, card) enters on its own sung word or beat, by slam (scale-in) or wipe. | — |
| E14 | Live motion | After landing, every element keeps moving: hero numbers re-slam on kicks (≤ 10.5%), panels shove on snares (≤ 52 px), small elements tremble on hats, with a slow drift. Small hits are ignored (soft threshold). Off for cold frames and band stops. | energy^1.45 (quiet ≈ still, loud = constant motion) |
| E16 | Meltdown | The last ~1.7 s of the outro drop (the final roll): rolling vertical slips, heavy tears and block moves re-rolled every frame, static, and 1-bit resolution starvation (480 → ~40 px wide), then a clean cut to the lone synth. | ramps 0 → 1 |
| E15 | Scream | Shouted words sit in their own place and explode outward: echo copies burst out in waves, spike shards shoot from each letter, letters glitch in hard 15 fps steps with slice shifts. It snaps back fast when the shout ends. | vocal |

## 3b. Layering status
Shots with `"anim": true` in `plan.json` are fully layered (E13–E15). Done: the whole song. The rest are still flat stills under the camera and effects, and are layered section by section.

## 4. Per-shot plan
Generated from `motion/plan.json`.
- **Start** is the cut point.
- **Focus** is the number of punch-in rects.
- The instrumentals and the outro barcode are **audio-driven**: drawn from the stems every frame.

| # | Start | Shot | Mood | In | Effects | Focus | Notes |
|---|---|---|---|---|---|---|---|
'''

TAIL = '''

## 5. Status
Done. The upload master (`release/zoom-zoom-pdoom_4K60.mp4`, 3840×2160 60 fps, HEVC 10-bit) passes `tools/flashcheck.py` at 3 flashes/s max, and `tools/render/textscan.mjs` finds no unintended text overlaps. Captions, thumbnail and description are in `release/`.
'''

open(os.path.join(ROOT, 'MOTION.md'), 'w').write(HEAD + '\n'.join(rows) + TAIL)
print(len(rows), 'shots')
