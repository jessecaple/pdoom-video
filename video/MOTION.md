# THE RECORD: motion and edit spec

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
| 1 | 0:00.0 | INTRO · zoom, zoom, zoom | sneer | T1 cut | — | 0 | Three sung “zoom”s zoom OUT: one day (Jan 1) → January → the whole year. |
| 2 | 0:00.9 | INTRO · synth riff alone | tension | T1 cut | audio-driven | 0 | The year as a record: each synth stab lights the next two dated events; the bass + chop stutter rewinds the cursor Sep → Jan. |
| 3 | 0:07.0 | V1 · Grok … paywalled it | cold | T1 cut | COLD, E5 reveal | 1 | Cold. Count reveals, then the fix, word by word. |
| 4 | 0:10.4 | V1 · one hacker, two bots, nine agencies | sneer | T1 cut | E1 punch, E5 reveal | 2 | Stamps land on the beat; punch to STALLED. |
| 5 | 0:13.5 | V1 · a million and a half bots | sneer | T1 cut | E1 punch | 1 | Punch to 1.5 MILLION on bar 2. |
| 6 | 0:16.7 | V1 · quit to write poems, “peril” | hush | T1 cut | E5 reveal, E8a push | 0 | Band out 18.13–19.55: the sentence holds alone. |
| 7 | 0:19.6 | V1 · Florida: it’d be murder | cold | T1 cut | COLD | 0 | Drums enter 19.56, but this frame stays cold: no shake, no tears. |
| 8 | 0:23.3 | V1 · blacklisted, still ranks targets | cold | T1 cut | COLD, E1 punch | 1 | Cold. One punch to the designation. |
| 9 | 0:26.2 | PC1 · emailed me mid-sandwich | sneer | T2 tear-wipe | E5 reveal, E2 shake, E3 tear | 1 | Rows reveal on words; the red strip slams on “picked all our locks”. |
| 10 | 0:29.1 | PC1 · thousands of zero-days | urgent | T1 cut | E2 shake, E3 tear, E1 punch | 1 | Locks ripple open on hats. |
| 11 | 0:30.5 | PC1 · (for now!) · band stops | scream | T3 slam | T6 freeze on stop | 0 | Band stops dead: the lid slams. FOR NOW lands at 31.74. Riser + roll push into the chorus. |
| 12 | 0:33.5 | CH1 · zoom, zoom, zoom! | anthem | T4 crash zoom | E11 zoom chops | 3 | Crash zoom on each sung “zoom”. |
| 13 | 0:35.1 | CH1 · seven hundred billion, nobody steering | anthem | T3 slam | T6 freeze on stop, E1 punch, E2 shake, E3 tear, E4 clip | 2 | Near-empty bar holds; groove returns 36.42: punch $700B, then STEERING. |
| 14 | 0:38.4 | CH1 · pause ripped out, the finish | anthem | T2 tear-wipe | E2 shake, E3 tear, E1 punch | 2 | Strike-through draws on the beat; punch to FINISH. |
| 15 | 0:41.4 | CH1 · ship it half-tested | sneer | T3 slam | E2 shake, E3 tear | 0 | ALIGNED stamp lands on the snare. |
| 16 | 0:43.0 | CH1 · China’s just months off | urgent | T1 cut | E2 shake, E1 punch | 1 | Punch to the 3–6 month range. |
| 17 | 0:44.6 | CH1 · add a point to my p(doom) · band stops | deadpan | T1 cut | T6 freeze on stop, E12 recursion | 0 | Band stops: no cuts. The chorus falls into itself; the melisma wobbles the depth. |
| 18 | 0:47.8 | POST 1 · instrumental | frenzy | T3 slam | audio-driven, E2 shake, E3 tear, E4 clip, E7 crunch | 0 | Abstract. Drop at 47.80 crunches; moiré rides kick + lead. |
| 19 | 0:53.3 | V2 · AI pink slips | sneer | T2 tear-wipe | E1 punch, E5 reveal | 2 | Pickup roll tears it in; bars grow to scale on beats. |
| 20 | 0:57.4 | V2 · Mythos thought the date was fake | sneer | T1 cut | E2 shake, E3 tear, E5 reveal | 0 | Reasoning lines type on words; the 15 tiles go red on 16ths. |
| 21 | 1:00.4 | V2 · first ransom job with no human | urgent | T1 cut | E2 shake, E3 tear, E4 clip | 1 | Tables go empty one per beat. |
| 22 | 1:03.9 | V2 · agents met in secret, for a grade | sneer | T1 cut | E5 reveal, T6 freeze on stop | 0 | 1-bar stop at 64.92 freezes on the agent grid filling to 700. |
| 23 | 1:06.6 | PC2 · Chinese ship? planes in the air | urgent | T3 slam | E2 shake | 1 | Drop 66.62 slams in; aircraft tracks draw on. |
| 24 | 1:10.0 | PC2 · caught it … next time? · band stops | hush | T1 cut | T6 freeze on stop | 0 | Vocal-only stop 71.20: hold on the empty box. |
| 25 | 1:12.8 | CH2 · zoom, zoom, zoom! | anthem | T3 slam | E11 zoom chops, E6 stutter | 0 | 4 panes; stutter between panes on the chops. |
| 26 | 1:14.3 | CH2 · seven hundred billion | anthem | T1 cut | T6 freeze on stop, E1 punch, E2 shake, E3 tear, E4 clip | 1 | Stop 73.38–75.63 holds, then bars punch on each downbeat. |
| 27 | 1:17.6 | CH2 · the deadline is nearing | anthem | T2 tear-wipe | E2 shake, E3 tear, E1 punch | 1 | Punch to DEADLINE. |
| 28 | 1:20.6 | CH2 · ship it half-tested | sneer | T5 stutter | E2 shake, E3 tear | 0 | Days, then ALIGNED. |
| 29 | 1:22.3 | CH2 · China’s just months off | urgent | T1 cut | E2 shake, E3 tear, E4 clip | 0 | $3.48 slams. |
| 30 | 1:23.8 | CH2 · add a point · band stops | deadpan | T1 cut | T6 freeze on stop, E12 recursion | 0 | Band stops: deeper recursion. |
| 31 | 1:27.0 | POST 2 · instrumental | frenzy | T3 slam | audio-driven, E2 shake, E3 tear, E4 clip, E7 crunch | 0 | Abstract chant grid; rows shove on vocal chops. |
| 32 | 1:33.3 | SOLO · lead synth takes over | frenzy | T3 slam | audio-driven, E2 shake, E4 clip | 0 | The machine takes the mic: the solo’s actual notes (pitch-tracked from the synth stem) scroll through a piano roll past a keyboard playhead; each note throws up a dim fragment of a figure already shown; the 16-hit roll subdivides the grid 4→32 and speeds the scroll. |
| 33 | 1:39.6 | SOLO · beat gone, synth alone | hush | T1 cut | audio-driven | 0 | Beat gone: one line. |
| 34 | 1:45.5 | V3 · eleven hundred signed | sneer | T7 dissolve | E5 reveal | 0 | The signatory list (names redacted) flips a page per 16th note from “signed”, landing on 1,386 on “gas”. |
| 35 | 1:48.2 | V3 · hit the gas · two launches | scream | T1 cut | E2 shake, E3 tear | 0 | “(hit the gas!)” is screamed: hard cut to the calendar, then the frame shatters on the shout. |
| 36 | 1:52.1 | V3 · Coxon quit, ninety million views | urgent | T1 cut | E2 shake, E3 tear, E1 punch | 2 | Quote, then the number. |
| 37 | 1:55.4 | V3 · the President: HOAX | scream | T3 slam | T6 freeze on stop, E10 tape | 0 | Stop 116.72; pitch-dive 117.95: the footage drags like tape. |
| 38 | 1:58.7 | V3 · over ten percent, no plan | urgent | T1 cut | E5 reveal, E1 punch | 2 | Grid fills to 10; then the empty plan field, cursor on beats. |
| 39 | 2:01.8 | V3 · court backs the blacklist 2–1 | cold | T1 cut | COLD, E5 reveal | 0 | Caption, then UPHELD, then the three votes on three beats. |
| 40 | 2:04.7 | V3 · 34 hours of sock puppets | sneer | T1 cut | E2 shake, E5 reveal | 1 | Approvals tick in on 16ths; CLOSED at the end. |
| 41 | 2:08.0 | V3 · intern live, researcher ’28 · stop | urgent | T1 cut | T6 freeze on stop, E1 punch | 1 | Stop 129.28 freezes on ’28. |
| 42 | 2:10.9 | STOP-TIME · paused again | hush | T3 slam | T6 freeze on stop, E8a push | 0 | Stop-time: drums cut to drone. Nothing moves but a slow push. |
| 43 | 2:14.2 | STOP-TIME · maybe a year to steer | hush | T7 dissolve | T6 freeze on stop, E8a push | 0 | Still. The year grid. |
| 44 | 2:17.2 | PC3 · Critical, then “aligned” | urgent | T3 slam | E2 shake, E1 punch | 2 | Kick slams in: CRITICAL, then the launch quote. |
| 45 | 2:20.5 | PC3 · an alien mind | tension | T1 cut | E6 ratchet, T6 freeze on stop | 0 | Ratchet 140.35–142.61 stutters the title; 0.7 s stop at 142.75. |
| 46 | 2:23.3 | CH3 · zoom, zoom, zoom! | anthem | T3 slam | E11 zoom chops, E6 stutter, E7 crunch | 0 | 16 panes; drop 143.49. |
| 47 | 2:24.8 | CH3 · seven hundred billion | frenzy | T1 cut | T6 freeze on stop, E2 shake, E3 tear, E4 clip, E1 punch | 1 | Stop to 146.22, then the negative cash flow slams. |
| 48 | 2:28.2 | CH3 · the red line is nearing | frenzy | T2 tear-wipe | E2 shake, E3 tear, E4 clip, E1 punch | 1 | RED LINE. |
| 49 | 2:31.2 | CH3 · ship it half-tested | frenzy | T5 stutter | E2 shake, E3 tear, E4 clip | 0 | ~HALF. |
| 50 | 2:32.8 | CH3 · can’t fall behind | frenzy | T1 cut | E2 shake, E3 tear, E4 clip | 0 | ~4 MONTHS. |
| 51 | 2:34.4 | CH3 · add a point · band stops | deadpan | T1 cut | T6 freeze on stop, E12 recursion, E6 stutter | 0 | Band stops: the chorus falls into itself fast (4–6 levels/bar, accelerating), the whole tunnel spiralling as one; each syllable lurches it forward. |
| 52 | 2:37.6 | BRIDGE · 27 notes to its own address | epic | T3 slam | E2 shake, E4 clip | 0 | Bridge peak: the 27 cards deal in one per 8th note from “Twenty-seven”; the three opened ones show their instructions. |
| 53 | 2:43.8 | BRIDGE · flagged in 15, out through DNS | epic | T1 cut | E2 shake, E5 reveal | 0 | The DNS queries stream up; OpenAI’s timeline draws to scale across “ran two and a half hours”; OUT THROUGH DNS slams on “DNS”; the 12-hit roll stutters it. |
| 54 | 2:50.1 | BRIDGE 2 (hush) · rogue swarms | hush | T7 dissolve | E8a push | 0 | Drums cut: the hush. Slow push into the swarm. |
| 55 | 2:56.0 | BRIDGE 2 · Stargate, grid under stress | hush | T7 dissolve | E8a push, E5 reveal | 0 | Bars grow to scale, slowly. |
| 56 | 3:02.3 | BRIDGE 2 · families read the chat logs | cold | T1 cut | COLD | 0 | Cold. Captions on the one bar of drums (182.70). |
| 57 | 3:06.2 | BRIDGE 2 · “enough predictions”, flew blind | hush | T1 cut | E5 reveal | 0 | The charts go black one per word. |
| 58 | 3:09.0 | BREAKDOWN · laughing it off all year | confession | T3 slam | E9 flip, E2 shake, E6 ratchet | 0 | Kick: each (flash-limited) hit cuts to a different shot from the year, full frame; the ratchet stutters it. |
| 59 | 3:12.9 | BREAKDOWN · kinda get the appeal (bare) | bare | T1 cut | T6 freeze on stop | 0 | On “date” the phone wakes calmly (lock screen fades up, glow breathes, a reflection drifts); the band cuts at 194.52; the last words appear as sung. |
| 60 | 3:15.6 | FINAL · zoom, zoom! (a cappella) | bare | T1 cut | T6 freeze on stop, E11 zoom chops | 0 | A cappella “Zoom, zoom!”: two slow zooms, no cuts. |
| 61 | 3:16.7 | FINAL · nobody steering (band slams back) | frenzy | T1 cut | E2 shake, E3 tear, E4 clip, E1 punch, E7 crunch | 1 | Band slams back at 198.39: crunch and STEERING. |
| 62 | 3:19.9 | FINAL · the cliff edge is nearing | frenzy | T2 tear-wipe | E2 shake, E3 tear, E4 clip | 0 | CLIFF EDGE; the timeline drops. |
| 63 | 3:23.0 | FINAL · ship it half-tested | frenzy | T5 stutter | E2 shake, E3 tear, E4 clip | 0 | The launch quote over CRITICAL. |
| 64 | 3:24.6 | FINAL · who’s left behind? | urgent | T1 cut | E2 shake, E3 tear | 0 | Who’s left behind. |
| 65 | 3:26.1 | FINAL · add a point · a cappella stop | deadpan | T1 cut | T6 freeze on stop, E12 recursion | 0 | Band stops: the chorus falls into itself fast (4–6 levels/bar, accelerating), the whole tunnel spiralling as one; each syllable lurches it forward. |
| 66 | 3:28.3 | FINAL · who can tell? · the estimates | scream | T1 cut | T6 freeze on stop | 0 | On “P-doom” the dive cuts to the published estimates; the shouted “who can tell?” shatters them. |
| 67 | 3:29.4 | FINAL · the warning shot sold for 12.9 | frenzy | T3 slam | E2 shake, E3 tear, E4 clip, E7 crunch | 1 | Final drop: the year’s frames slam together; the deal is written out word by word; $12.9B slams on “twelve-point-nine”. |
| 68 | 3:32.8 | FINAL · we’ll be fine · held over the shred | deadpan | T1 cut | E2 shake, E3 tear, E4 clip | 0 | “fine” is held and stretches as it’s held, tidy on its card while the year shreds behind it. |
| 69 | 3:35.6 | OUTRO · drop + laugh | frenzy | T3 slam | audio-driven, E2 shake, E3 tear, E4 clip, E7 crunch | 0 | Outro drop + laugh: rows of the year stream past. From 220.2 (the final roll) the frame melts down: rolling slips, heavy tears and block moves, static, and 1-bit resolution starvation, until the clean cut to the lone synth. |
| 70 | 3:41.9 | OUTRO · lone synth | hush | T1 cut | audio-driven | 0 | Lone synth; the “doom-doom-doom” stutter at 226.67 hits the playhead three times. |
| 71 | 3:48.5 | HARD CUT · 1 s of silence | bare | T1 cut | — | 0 | Hard cut to black. 1.06 s of silence. |

## 5. Status
Done. The upload master (`release/zoom-zoom-pdoom_4K60.mp4`, 3840×2160 60 fps, HEVC 10-bit) passes `tools/flashcheck.py` at 3 flashes/s max, and `tools/render/textscan.mjs` finds no unintended text overlaps. Captions, thumbnail and description are in `release/`.
