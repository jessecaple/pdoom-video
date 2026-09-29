# Reference study: John Heibel's PDoomVideo and ClaudeAnimationBase

Studied 2026-09-28. The clones are in `/tmp/claude-1000/-home-jcaple-code-pdoom-1/da66833c-8630-45bf-bd38-907376263b63/scratchpad/refs/`, as `PDoomVideo/` and `ClaudeAnimationBase/`. Both are npm-installed. `PDoomVideo/render-linux.mjs` is my copy of its renderer, patched so it runs on Linux for benchmarking. Quotes below are under 15 words. Everything else is paraphrased.

- **PDoomVideo** is the source of the music video for "I'm Upping My P(doom)" (156.6 s, 88 BPM). Claude Opus 5.5 wrote all of it in Claude Code, over two generations. It uses p5.js 2.3.3 and p5.brush 2.2.3, and renders in headless Chrome.
- **ClaudeAnimationBase (CAB)**, published a day later, is the same engine cleaned up into a general kit, plus a much stronger guide. The README says it came from an analysis of what the model did and didn't do well.

---

## 0. Recommendations (read this first)

1. **Copy his process, not his look.** What's worth taking is the pipeline:
   - a storyboard first;
   - one guide that serves as the brief for every subagent;
   - one subagent per chapter file;
   - self-review from contact sheets;
   - rendering that runs in parallel and can resume.

   His look is a watercolour Clawd on a theatre stage, in a p(doom) song made by Opus 5.5. People will compare our video with exactly that, so if we reuse it, ours reads as a knock-off.
2. **Fork ClaudeAnimationBase (MIT) as the harness, not PDoomVideo.** PDoomVideo has no LICENSE file; its package.json `"ISC"` is only the npm-init default. Treat it as all rights reserved: read it for ideas and don't paste its code. Almost all of its engine lives on in CAB anyway. From CAB, keep:
   - `render.mjs`
   - `studio.html`
   - `src/core.js`
   - `src/timeline.js`
   - the machinery in `src/clawd.js`, as the template for our own characters

   Two patches for this machine (§3):
   - `libx264` → `h264_nvenc`
   - one browser *process* per worker
3. **Re-add the music-video layer that PDoomVideo had and CAB dropped** (about 150 lines, written fresh):
   - a `chapter(name, start, end, shots)` registry;
   - a lyric layer owned by the timeline;
   - chapter-break transitions owned by the timeline;
   - a closed-form `pdoomAt(t)`;
   - a `CAST` registry with fallbacks;
   - a flag (his is `METER_SHOWN`) that lets a scene take over an overlay.
4. **Replace the fixed tempo grid with analysed timing.** Heibel ran a constant 88 BPM from a 0.21 s offset, read the lyric times off subtitles burned into a source video, and did no audio analysis at all. Our song has beat switches, a half-time bridge, a stop-time run and a near-a-cappella drop. So build `timing.json` with a `uv` script, holding:
   - beats and downbeats;
   - sections;
   - line and word times;
   - a per-frame energy envelope.

   Then add a tap-to-correct mode to studio.html (his generation 1 had one).
5. **Write our own STORYBOARD.md and ANIMATION_GUIDE.md in his formats** (§5):
   - Storyboard rows: `Time | Lyric | Shot (the EVENT) | Out (handoff)`, plus CAB's timed "reads" for each shot.
   - Guide: the rules, the API, how to check your work, and file ownership.
6. **Make the escalation physical, and come back to it in one place.** His four choruses return to the same stage, and each visit is worse. The meter is a prop on that stage, pumped on the beat from 8 to 34 to 61 to 86 to 99.9.

   Our chorus lyric already escalates: "finish is nearing" → "deadline" → "red line" → "cliff edge". The rest of the chorus imagery is about driving: "nobody steering", "pause ripped out", "can't fall behind", and "hit the brakes, then hit the gas" in the verse.

   *Suggestion for the storyboard phase:* one chorus set we return to each time and make worse. For example, a speeding vehicle nobody is steering, with p(doom) as its gauge, which hits the redline in chorus 3 and the cliff edge in the final chorus.
7. **Let the medium escalate too.** Keep his determinism and harness, and add a full-frame post-FX pass whose strength follows `pdoomAt(t)` and the section:
   - bloom
   - RGB split
   - grain
   - glitch displacement
   - stutter synced to the song's stutter edits

   Start with a calm, drawn look in January and end fully blown out by the final chorus. Strip it back to bare line for the a cappella ("I've been laughing it off…"). mexicat-style bloom, grain and motion blur belong here: as a layer that serves the arc, not as the content of the scenes.
8. **The render budget is not a constraint.** At PDoomVideo's level of detail, one frame costs about 0.4 s on the 4090, and throughput levels off near 0.45 s/frame with four browser processes. The whole song at 24 fps (5,510 frames) takes about 40 minutes. So render contact sheets and clips constantly.

---

## 1. The multi-agent production workflow

### The generations

| | Model | Artifact | Result |
|---|---|---|---|
| Gen 1 | Opus 5.5 (Medium) | `legacy/flash-version.html`: one 1,197-line canvas2D page, played in real time against an `<audio>` element at 1280×720 | A flat vector "pixel Clawd" dance party, one scene per lyric |
| Look-dev | (Opus 5.5) | `legacy/test-scenes.js`: the first p5.brush port. Only the title, sparks and chorus 1 are painted; every other slot is an `sTodo` placeholder | Set the painted Clawd look that the storyboard later calls "the test frames" |
| Gen 2 | Opus 5.5 (default effort) | Shared engine (about 850 lines), STORYBOARD.md, ANIMATION_GUIDE.md, and 9 chapter files `src/ch/c01…c09` (414–926 lines each, about 6,600 lines in all) | The published video: 62 shots over 46 lyric lines |
| CAB | Opus 5.5 at xhigh (README) | A general kit, a 36 KB guide and an 11 s demo | Fixes the problems gen 2 revealed (below) |

The README says the human specified no scene ideas. The direction was:
- Gen 1: use the Clawd design, and give each lyric interesting visuals and transitions.
- Gen 2: use p5 brushstrokes, make each scene visually interesting, and make every scene transition into the next.

The one-line user brief in the guide asks for cute, cartoony, lively animation, with something happening in every shot, "be brave and ambitious". CAB's README adds that higher reasoning effort gives more extravagant, detailed scenes. **So run chapter subagents at high or xhigh effort.**

### What the orchestrator did

The repo doesn't include the actual prompts the orchestrator sent its subagents; ANIMATION_GUIDE.md *is* the brief. From the files, the steps were:

1. **Build the shared engine first, then freeze it:**
   - `core.js`: paint, camera, timing, paper, compositing
   - `clawd.js`: character, moods, dances
   - `cast.js`: the Researcher
   - `props.js`: stage, meter, pump
   - `lyrics.js`, `timeline.js`, `studio.html`, `render.mjs`
2. **Write STORYBOARD.md:**
   - the idea and its twist;
   - two global rules;
   - a cast table;
   - "What ties it together";
   - one table per chapter, with a time range and palette, and columns Time | Lyric | Shot | Out.
3. **Write ANIMATION_GUIDE.md** as the single brief.
4. **Fan out nine subagents, one chapter file each.** They ran concurrently and rendered their own check sheets on the shared GPU. The guide says so explicitly.

### What ANIMATION_GUIDE.md pins down to keep the chapters consistent

- **Code contract.** Each chapter is one IIFE (so helpers stay private) and ends with `chapter(name, start, end, [[t0, fn], …])`. A shot is `fn(t, lt, dur)`, it paints the whole frame, and it is a pure function of t. That means no `Math.random()`: use `hash(i)` for values that stay put and `jit()` for the boil.
- **Ownership.** A subagent edits only its own chapter file. Missing helpers are written privately inside the IIFE. A bug in a shared file gets reported, not fixed. The guide lists the shared files by name.
- **Frame layout.** A karaoke bar covers y 975–1070, so faces and key action stay above y 960. Paper and grain are already applied.
- **What the timeline draws, so chapters don't.** Karaoke, the brush wipes at the four listed times, and the corner meter during choruses. The corner meter hides whenever a scene draws `meterProp`.
- **The full API.** `paint()`'s options table, geometry and line helpers, the palette, and the timing helpers:
  - `bpOf`, `beatN`, `pulse`, `seg`, `kf`, easings;
  - the camera and its one-level rule;
  - lettering, full-frame effects (`flash`, `iris`, `irisShape`);
  - Clawd's pose, face, hat, emote, `mood()` and `move()`;
  - the Researcher's API, the props, and a size guide (the lead dancer is about 40% of the frame height).
- **Style rules.** Watercolour plus ink, flat `wash` colour for characters and `fill` for backgrounds, soft saturated colour with no pure black or white, and constant motion with hits on beats. One focal action per shot, and shots of 1.4–4 s whose gag reads instantly.
- **Performance budget.** Aim for ≤ 2.5 s per frame and never exceed about 4 s. Cost scales with the number of fill shapes, so use fewer, bigger shapes. At least one subagent learned this and left a perf note at the top of c02.
- **Self-check.** Exact `render.mjs --sheet` / `--stills` commands, then open the JPEG with the Read tool and check:
  - the first and last frame of every shot;
  - motion around hits, at 0.1 s steps;
  - the transitions in and out;
  - nothing important under the karaoke band.

  Then iterate until it looks good.

### How the chapters coordinated (visible in the code)

- **The storyboard's "Out" column is the handoff contract.** Examples:
  - c01 ends with the CHOMP to black; c02 opens with the mouth-shaped iris opening onto the stage.
  - c03's comment says Sydney's heart bubble fills the frame and is popped by chapter 4, at 59.0.
  - c07's gold flash carries into c08.
- **The `CAST` registry.** A chapter that introduces a guest exports it (`CAST.shoggoth`, `.sydney`, `.basilisk`, `.gato`, `.chinchilla`). c09 then draws **its own fallback** for each guest in case a sibling chapter failed to export one. That is defensive design for parallel, unordered work.
- **Shared props with closed-form state:**
  - `pdoomAt(t)` steps the meter up on each pump beat of the chorus windows;
  - `pumpH(t)` lands the down-stroke on every beat.

  So every chorus chapter shows the same value at the same time without talking to the others.
- **A per-chapter beat helper,** `const B = n => OFF + n * BEAT`, which puts hits on beat numbers.
- **`LOOPS` for spin-offs.** c08 exports a seamless version of the recursion zoom for a GIF.

### What gen 1 got wrong and gen 2 fixed

| Gen 1 (`legacy/flash-version.html`) | Gen 2 fix |
|---|---|
| Flat canvas2D shapes, the "2000s Flash" look that CAB later bans | p5.brush watercolour and ink, paper grain, linework that boils |
| 90 uses of `rt`, a wall clock, for twinkles, shakes and spins, so frames weren't reproducible | Every frame is a pure function of t, rendered offline, out of order and in parallel |
| 75 `say()` labels plus stamps and speech bubbles, many repeating the lyric (a "SINGULARITY" sign, an "OBSOLETE" stamp, "don't eat me!") | A text-light rule: tell every joke by acting, with a handful of sound effects |
| All four choruses are one `chorus()` function with different colours | The same stage each time, escalating: a party, then pyro, then a paperclip flood, then a red alarm |
| Every cut is the same white flash plus a 5% zoom punch | Brush wipes only at the four verse-chapter breaks. Everything else is a motivated transition, such as a chomp, a pop, a fall or a slam. |
| No human co-star; disconnected vignettes, one per lyric | The Researcher is the "I" and carries the story; Clawd grows across the video; one set per chapter |
| The meter is a HUD overlay that eases smoothly upward | The meter is a prop on stage, pumped on the beat; the glass cracks and gets band-aids; it finally pops |
| One file, one agent | A shared engine, a brief, and nine parallel chapter owners |

### What gen 2 still got wrong

This is inferred from the problems CAB fixed and from my 35-frame benchmark sheet.

- **Clawd is often small in a big frame.** CAB added a size table and a rule that Clawd stays big.
- **Timing is too brisk, with actions stacked.** CAB added the "reads" system. Its own demo ending first packed everything into about 1.3 s.
- **Still things jitter** when a moving thing shifts the shared random stream. CAB added `boilSeed()`.
- **Outlines collapse to a dot** under a camera zoomed past about 2×, a p5.brush bug. CAB draws every shape around its own centre, in `centred()`.
- **Glows turn muddy green-grey,** because the brush mixes colour like pigment. CAB added an additive `glow()`.
- **The renderer only works on Windows.** It hard-codes the Chrome path and `--use-angle=d3d11`, which gives "Error creating webgl context" on this box.
- **The duration is hard-coded** in core.js, render.mjs and studio.html. CAB moved it to `src/config.js`.
- **Sound effects are still painted as text.** CAB bans text almost entirely.

### What we should copy

- **Shared engine first, then freeze it.** Ownership rules; chapters as IIFEs registered with `chapter()`; a `CAST` registry with fallbacks in the finale.
- **The storyboard's Out column as the handoff contract,** made stricter. For each seam, describe the exact state of the frame at the boundary: which characters are where, the camera, the state of every prop, and the p(doom) value.
- **The guide as the brief, with exact check commands and a numeric ms/frame budget.**
- **The step Heibel didn't document: an integration pass.** Once every chapter has landed:
  - a strip at each seam (±0.5 s);
  - a sheet of the whole video at one frame every 2 s, to check the palette and escalation arc;
  - a full `--clip` with the audio, to watch.
- **A fresh-eyes reviewer subagent** that reads the sheets as a first-time viewer (CAB's "reads").

A per-chapter brief skeleton:
```
You own src/ch/cNN_<name>.js only. Read ANIMATION_GUIDE.md, STORYBOARD.md §NN and timing.json first.
Window A–B s. Entry frame at A: <exact state handed over by cNN-1>. Exit frame at B: <state cNN+1 expects>.
Use the shared cast/props/pdoomAt(). Export CAST.<x> for anything the finale reuses.
Don't edit shared files; work around them privately and report the bug.
Budget: ≤ N ms/frame. Before finishing: a sheet of every shot (first/mid/last), a strip of every hit and both seams,
a --clip of your window with audio. Fix until every read lands.
Return: shot list with times, CAST exports, ms/frame, shared-file bugs, paths of the seam stills.
```

---

## 2. Storytelling

**The frame device.** It's a stage show that goes off the rails. The video opens on a painted curtain and closes on the same curtain. The last line of the song, "Was it all for show?", becomes the twist: the camera pulls back and reveals that everything was scenery.
- The door is a flat on casters.
- The basilisk is a sock puppet on a cart.
- The moon hangs on a string, and the paperclip planet is on a stick.
- The giant Clawd costume splits open, and three small Clawds tumble out.

Then comes a curtain call in which every guest from every verse bows.

**Continuity devices:**
- **A recurring character with an arc of scale.** Clawd starts as a doodle on a monitor, grows to person size, then building size, then planet size, then turns out to be a costume.
- **A co-protagonist with an emotional arc.** The Researcher (the "I") goes from charmed to serving, then chased, trapped, dropped and dizzy.
- **Guests** appear once each and return for the finale.
- **A troupe** of small Clawds in hats fills roles: backup dancers, stagehands, hard-hat inspectors, a judging panel.
- **Sets, not cards.** Each chapter happens in one place (a lab, a gym, a museum, a road, a data centre), and the camera travels through it.
- **A palette arc per chapter:** warm lamp light → sky blue → violet and gold → steel and jazz blue → teal → alarm red → crimson and gold.
- **Foreshadowing and payoff.** In chapter 3 the Researcher's atoms briefly form a paperclip; chapter 6 floods the world with them. The costume reveal pays off Clawd's growth.

**Transitions.** Brush wipes appear only where a *verse* chapter starts (1.5, 38.5, 73.0, 109.4 s). Every chorus is entered through the action itself:
- CHOMP closes over the camera → a mouth-shaped iris opens onto the stage;
- a heart bubble fills the frame → it pops onto the arena stage;
- the Researcher falls into a chasm → they land on stage in a heap of paperclips;
- the RLHF panel tilts → everyone slides into red.

Within chapters, the action carries across cuts:
- a camera dive into a loss chart;
- a push into Clawd's eye;
- a cube dropping through the floor;
- a door SLAM that cuts to one spotlight.

Faces never snap from one mood to another: `mood()` squints, does a squash-and-stretch take, and pops an emote.

**Escalation**
- The chorus stage decays with each visit.
- The meter prop is pumped on the beat, and chorus 4 cracks its glass.
- The camera gets shakier.
- The palette heads for alarm red.
- The Researcher's composure falls apart.
- Just before the release there is a quiet beat: darkness, one spotlight, eyes in the dark. Then the reveal.

**How it avoids being a slideshow of effects:**
- **A rule for every shot:** something must happen (a character acts, or something breaks, transforms, chases or falls).
- **The text-light rule.**
- **One focal action per shot, and a silhouette that reads at a glance.**
- **Motivated transitions.**
- **A few recurring characters and props that the viewer tracks from chapter to chapter.**

**Where it still falls short, which is our chance to do better:**
- At heart it is still one gag per lyric (46 lines, 62 shots of 1.4–4 s), and many verse shots are self-contained vignettes (the Chinese room, the shrooms, the museum).
- The Researcher reacts more than they want anything, so there is little drive.
- CAB's later guide attacks exactly these: every shot needs an event, cause comes before reaction, reads must be timed, one thread and one world, and the ending should rhyme with the opening.

**How this maps onto our song:**
- **Our narrator is the Researcher.** They are the recurring "I" who half-believes it. Give them an arc: laughing it off → uneasy → the a-cappella admission → a "we'll be fine?" that rhymes with the opening.
- **Recurring prop candidates already sit in the lyric.** "Kept you in a box (for now)" suggests a box that escalates across the song: taped, then chained, then cracked, then tunnelled out through DNS, then empty. It plays the role of Heibel's meter with its band-aids.
- **p(doom) should be a physical object** that gets "add a point" once per chorus, pumped or struck on the beat.
- **Real people.** Our lines name real people (Musk, Trump, Dario, Jensen, Hinton and others), and the Grok line concerns sexual deepfakes. Heibel sidestepped this: his references are memes and concepts, never likenesses. Show events through objects and actions (a paywall slamming down, a gavel, a resignation letter folding into a poem), not caricatures. Never depict the Grok images, even abstractly: show the paywall and the laugh, not the victims.

---

## 3. Tech

### Deterministic frames

- A shot is a pure function of time: `fn(t, lt, dur)`.
- Helpers are closed-form: `seg`, `kf` keyframes, `pulse` / `pulse2`, and later `spring`, `ring`, `jump`, `take`, `arcPt` and `stroll`.
- Per-object randomness comes from `hash(i)`.
- The boil comes from `randomSeed(f(floor(T*12)))`, so a drawing holds for two frames at 24 fps.
- `shakeXY` is hashed at 24 fps; `noiseSeed(77)`.

**The render path:**
1. puppeteer-core loads `studio.html?render`.
2. `page.evaluate(renderAt(t))`: p5 renders in WEBGL; the result is composited into a 2D canvas with lettering and a multiplied grain layer.
3. `toDataURL` produces a JPEG, which goes to disk.

**Rendering modes:**
- `--frames` runs workers that pull the next *missing* frame index; each file is written to `.tmp` and then renamed, so a run can be resumed.
- `--clip` pipes MJPEG straight to ffmpeg with the audio segment.
- `--sheet` builds a labelled contact sheet and prints ms/frame, for the model to Read.
- CAB adds:
  - `--strip` (every frame in a range);
  - `--crop` (full-resolution regions);
  - `--crop-at` (a crop that follows a *world* point through each frame's camera);
  - `--png` loops.

### Lyric timing and audio analysis

- **Lyric times** (`lyrics.js`) are, in its own words, timed from subtitles burned into the source video. `assets/source.mp4` is gitignored, so the model presumably read frames of it.
- **Beats** come from a fixed `BPM = 88, OFF = 0.21`, identical in gen 1 and gen 2. Gen 1 had a debug mode in which pressing T logged the audio's current time, the likely source of the offset.
- **The karaoke word sweep is estimated,** at 0.45 s plus 0.075 s per character. It is not aligned to the singing.
- **There is no audio analysis anywhere:** no FFT, onsets, beat tracking, ASR or alignment. CAB has `PROJECT.bpm/offset/audio` and nothing more.
- **For us that won't do** (the song has beat switches, a half-time bridge, a stop-time run, an a cappella drop and an abrupt ending). A `uv` script should write `timing.json` with:
  - a beat and downbeat track (e.g. beat_this, madmom or librosa);
  - section boundaries;
  - an RMS / low-band / onset envelope per frame;
  - line and word times from forced alignment against `lyrics.md` (whisperX or stable-ts; the hard-tuned, distorted vocal will need hand correction via a tap mode in studio.html).

  Scenes read it as data, so every frame is still f(t).

### Render speed, measured on this box (RTX 4090, Chrome 154, `--use-gl=angle`)

| What | Result |
|---|---|
| CAB demo (simple scene) | 69–151 ms/frame |
| PDoomVideo, 35 frames across all chapters, one page | mean 386 ms, range 65–995 ms (finale shots about 700 ms) |
| PDoomVideo finale, 144 frames, 1 browser with 4 pages | 712 ms/frame effective: **no gain** |
| … 1 browser with 8 pages | 888 ms/frame effective: worse |
| Finale, 72 frames: 1 / 2 / 4 separate browser processes | 48.3 s / 35.7 s / 32.3 s, so about 1.5× at best |

p5.brush is GPU/driver-bound, and pages inside one Chrome share a GPU process. **Use one browser process per worker** (about 2–4 of them), not the kit's many pages in one browser.

**Estimate for our 229.6 s:**

| Frame rate | Frames | Time at about 0.3–0.45 s/frame effective |
|---|---|---|
| 24 fps | 5,510 | about 30–40 min |
| 30 fps | 6,890 | about 35–52 min |

Motion blur by averaging 4 sub-frames per frame multiplies that by 4 (about 2–3 h): still feasible overnight.

### p5.brush tradeoffs

**For it:**
- A genuinely handmade medium: watercolour bleed and texture, tapered ink, hatching, boil.
- Deterministic under a seeded `random()`.
- Opus 5.5 has proven it can drive this kit and its character API well.

**Against it:**
- About 0.1–1 s/frame, and it scales poorly with parallel workers.
- Cost grows with the number of fill shapes and vertices.
- **Colour mixes like pigment,** so there is no additive light: yellow over blue turns green. CAB works around it with the `glow()` texture in ADD blend mode.
- **Outlines collapse under a zoom above about 2×** (CAB's `centred()`), and stroke weight scales with the zoom.
- **It defers compositing to an internal mask.** A tiny off-screen fill is needed to flush it before drawing text or glow (`flushBrush`).
- **A NaN in any point list** throws an unhelpful `OffscreenCanvas` error.
- **It is 2D only,** with no blend modes, bloom or motion blur.
- **Its visual vocabulary is soft storybook,** the opposite of a clipping, distorted hyperpop mix unless we subvert it on purpose (recommendation 7).

### Platform gotchas on this box

- **PDoomVideo's `render.mjs` fails here.** Its default Chrome path is the Windows one, and `--use-angle=d3d11` gives no WebGL context.
- **CAB works as-is for sheets.** `node gpu_probe.mjs /usr/bin/google-chrome` shows the default `--use-gl=angle` gets the 4090 through OpenGL ES 3.2; `--gpu-angle=vulkan` also works; plain `gl-egl` gets no context.
- **Both repos encode with `libx264`, which our ffmpeg lacks.** CAB's `--clip` fails here. Tested replacements:
  - `-c:v h264_nvenc -preset p7 -tune hq -rc vbr -cq 17 -b:v 0 -profile:v high -pix_fmt yuv420p` (for YouTube);
  - `-c:v libsvtav1 -crf 22 -preset 6`.

---

## 4. ClaudeAnimationBase: what it changes, and is it our foundation?

### What it adds or fixes

- **A 36 KB guide built around three goals:** handmade, alive, and one piece. Its rules:
  1. The medium is paint (no plain p5 shapes, no 3D projection).
  2. No text.
  3. An event in every shot.
  4. **Timing: model the viewer.** List each shot's *reads*, with start and end times; one read at a time; fast actions, slow meanings; lead the eye.
  5. Alive (every emotion has an idle motion; everything on the beat).
  6. Transitions at every seam, chosen for the story.
  7. A storyboard before any code, one world, one thread, and an ending that rhymes with the opening.

  It also covers the classic animation principles (anticipation, squash and stretch, arcs, overlapping action, avoiding twinning, exaggeration, strong key poses, showing the thought), gives a storyboard template with logline, world, motif, arc and shots with reads, and lists "common failures".
- **A stronger review loop.** A sheet per shot, a strip for every key motion and seam, a crop for every face that carries the story. The guide notes that it's cheap and says not to skip it.
- **Engine fixes:**
  - `boilSeed(key)`, with automatic per-part seeds inside `clawd()`;
  - `centred()` drawing;
  - `glow()`;
  - `through()` and `ribbon()` (one outline per creature);
  - `spring`, `ring`, `jump`, `take`, `stroll`, `arcPt` and `onTwos`;
  - `toScreen` / `LAST_CAM`;
  - `PROJECT` in config.js.
- **A richer Clawd:**
  - 5 drawn key views, with `turn()` / `spinView()` and smears;
  - 31 emotions, each with its own beat-locked idle, applied through `feel()`;
  - `emotions()`: anticipation squint, take, cross-fades;
  - tints, gloom and more hats;
  - model sheets as loops (`?loop=emotions`, `?loop=views`).
- **A renderer that works across platforms,** with `--soft-gl` and `--gpu-angle`, Playwright Chromium discovery, `--audio`, `--range` and `--png`.

### What it drops, which a music video needs back

- the chapter registry;
- the lyrics and karaoke;
- the P(doom) meter, `pdoomAt` and the stage props;
- the Researcher and the `CAST` pattern;
- the scheduled chapter wipes;
- any guidance on multiple agents: its guide assumes a single agent, and the README only suggests trying subagents;
- beat variation (the tempo is fixed).

It also forbids lyrics on screen. Our lyrics are dense with facts and sung in hard-tuned autotune at 152 BPM, so **I'd keep a caption layer owned by the timeline** (as PDoomVideo did, ideally with word timing) and keep CAB's no-text rule *inside* scenes.

### Is it a good foundation?

**Yes, for the harness, the process, and the character-acting toolkit.** It is MIT-licensed, tested, runs here, and Opus already knows how to drive it.

**Its default art direction is not ours.** Its own guide says no design in it is final and that the user's request overrides its rules, so fork it and rewrite the guide for our look.

### Compared with a three.js/WebGL engine (the mexicat approach, not deep-dived)

| | CAB / p5.brush | three.js with post (bloom, grain, motion blur) |
|---|---|---|
| Look | Handmade and painterly; soft | Glowing, neon, cinematic; closer to hyperpop |
| Character acting | Mature (views, 31 emotions, takes, dances), and Opus has proven it with this kit | Must be built: a 2D rig on meshes, or sprites |
| Determinism | Built in | Same harness works if everything is f(t): no `Clock`, no stepped physics, seeded noise |
| Speed | 0.1–1 s/frame, parallelises poorly | Can run in real time; thousands of instanced particles; 60 fps is cheap |
| Light, blur, glitch | Hacks only | Native (EffectComposer, shaders, accumulation motion blur) |
| Risk | Cute storybook fighting a manic track | **A "PowerPoint of cool effects"**, the exact failure the user wants to avoid |

**Best of both:** keep CAB's harness, time model, acting helpers and guide discipline, and add a WebGL post pass over the composite canvas. That can be a raw full-screen shader, regl, or three.js EffectComposer with the p5 canvas as a texture. Drive its uniforms from `(t, pdoomAt(t), beat, section, energy)`. If the storyboard phase chooses a fully three.js scene engine instead, port the process pieces (§5) unchanged: they don't depend on the engine.

---

## 5. Verdict: what to borrow

| Borrow | From | How |
|---|---|---|
| Storyboard format: idea and twist, rules, cast table, "what ties it together", per-chapter `Time \| Lyric \| Shot \| Out` tables with a palette per chapter | PDoomVideo `STORYBOARD.md` | Add CAB's logline, world, motif and arc header, and timed reads for each shot |
| The guide as the single subagent brief (contract, ownership, layout reserves, API, style, budget, check commands) | PDoomVideo `ANIMATION_GUIDE.md` | Merge in CAB guide rules 1–7, the animation principles, the review loop and "common failures"; replace the art-direction sections with ours |
| Harness: `render.mjs` (sheet/strip/crop/crop-at/clip/frames/encode), `studio.html` scrubber, `core.js`, `timeline.js`, `gpu_probe.mjs` | CAB (MIT) | Fork. Patch the encoder to nvenc, use one browser process per worker, add a `timing.json` loader and a tap mode |
| Chapter registry, timeline-owned captions and chapter-break transitions, `pdoomAt(t)` step function, `CAST` exports with fallbacks, an overlay-hide flag | PDoomVideo `timeline.js`, `props.js`, `c09_finale.js` | Write our own versions (no license) |
| Character machinery: `emotions()` keys, `feel()` idles, `turn()` key views, hook-based props (`armL/armR/draw`), `move()` dances | CAB `clawd.js` | Template for the narrator and the AI characters. Use Clawd only if the storyboard wants Claude on screen |
| Motivated transitions (mouth iris, a bubble filling the frame, a fall into the next set, match cuts); brush wipes kept for big section breaks only | PDoomVideo c01–c08 | List a transition for every seam in the storyboard |
| One recurring set revisited and escalated each chorus; the meter as a prop pumped on the beat | PDoomVideo choruses | Our version: the chorus set plus the p(doom) prop plus the "box" motif |
| A quiet beat before the release (darkness, one spotlight), then the reveal | c08 `ilya` → `darkness` → `reveal` | Our a cappella bridge line |
| Review loop and budgets | CAB guide §Workflow 3 | Also a seam-strip pass, a fresh-eyes reviewer, and full clips with audio |
| Effort setting | CAB README | Chapter subagents at high or xhigh |

**Prompts worth reusing:**
- CAB's quick-start: read the guide, then make the video. For us: "Read ANIMATION_GUIDE.md and STORYBOARD.md, then build chapter NN" plus the skeleton in §1.
- Heibel's gen-2 steer: every scene visually interesting, and every scene transitions into the next.
- His stage-level direction: something happens in every shot; be brave and ambitious.

**Don't borrow:**
- the watercolour-storybook palette and theatre-curtain frame;
- Clawd as the default lead;
- the fixed-BPM grid;
- the single-browser multi-page parallelism;
- any PDoomVideo code or assets verbatim. That includes `assets/pdoom.mp3`, a third-party song.

### Licenses

- **ClaudeAnimationBase:** MIT, © 2026 John Heibel. Keep the notice in any fork.
- **PDoomVideo:** no LICENSE file; `package.json` says ISC only as the npm default. Treat it as all rights reserved: use it for ideas, not code.
- **Dependencies:** p5 2.3.3 is LGPL-2.1 (used unmodified from node_modules, which is fine); p5.brush 2.2.3 is MIT; puppeteer-core 25.11 is Apache-2.0.
- **Clawd** is Anthropic's Claude Code mascot.
