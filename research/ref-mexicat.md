# Reference deep-dive: mexicat/pdoom-video

- Repo: https://github.com/mexicat/pdoom-video, HEAD `bdbad53` (2026-09-28). The first commit was 2026-09-24, and 5 client "revisions" are logged in the treatment. The code is MIT. The fonts are OFL, and the song and lyrics are not licensed for reuse.
- Clone (scratch, ephemeral): `/tmp/claude-1000/-home-jcaple-code-pdoom-1/da66833c-8630-45bf-bd38-907376263b63/scratchpad/refs/pdoom-video`
- Size: the engine is 2.4k lines of TS and the scenes 19.6k lines (17 plate modules in 40 files). main.ts and timeline.ts are 264 lines, and the analysis Python is 1.5k lines. Their song runs 156.65 s at 132.007 BPM with 46 lines and 227 words.

## 0. Recommendations (read this first)

1. **Fork the engine nearly wholesale and restyle it. Don't rewrite it.** Take `app/src/engine/*` (engine, gl, post, lines, lyrics, audio, type, stroke, util, scene, glsl/common, hud minus the PDoom specifics), `main.ts` (preview player plus the `?export=1` API), and the timeline pattern. They give us deterministic time-based rendering, word-level karaoke helpers, beat helpers, HDR post, adaptive motion blur and 4K. The look lives in `palette.ts`, `glsl/common.ts` constants, `DEFAULT_POST` and the font registry, so a new style is a data change there. Rewrite the scenes, the palette, the fonts and the P(doom) schedule.
2. **Fork `scripts/render.ts` with 5 Linux patches.** It was tested on this box, and both paths work:
   - **(a) GPU flag.** Swap `--use-angle=metal` for `--use-angle=gl-egl --use-gl=angle --ignore-gpu-blocklist`. Unpatched, it silently renders on SwiftShader (CPU).
   - **(b) Port.** Change the default `--url` port. 5173 on this box is another project's Vite (`prams/apps/admin-web`).
   - **(c) Watchdog.** Add an ffmpeg-exit watchdog. When ffmpeg dies, the page waits forever for acks.
   - **(d) Encoder.** Make the encoder args configurable, with HEVC-10bit NVENC or x264 from a static ffmpeg.
   - **(e) Audio path.** Point it at our `song.wav`.
   - **Runner.** Run it with bun installed locally from npm, or with the ~40-line Node 24 port described in section 4.
3. **Fork the analysis pipeline and generalize its hard-coded constants.** It uses CTC forced alignment with 2 models × 3 channels, then signal refinement, a Whisper cross-check, and QA plots Claude reads. Swap mlx-whisper for openai-whisper or faster-whisper on CUDA, and change the `mps` device to `cuda`. Our song is hard-tuned, distorted autotune sing-rap with ~570 words (1.7× their word rate), so budget more manual `FIX` entries than their 17. Use a karaoke lead stem from the start. Get the beat grid from beat-this (already in our `analysis/pyproject.toml`) or from their constant-tempo fitter, re-ranged for ~152 BPM.
4. **Copy the process, not the look.** Their process was:
   - one treatment and style bible,
   - one "engine guide" that acts as a contract for scene sub-agents,
   - per-plate ownership (agents A1–A8, B1, and the lead),
   - hand-off geometry between neighbouring plates,
   - review via `stills` and `sheet` PNGs that Claude reads,
   - `--only` isolation, and
   - numbered revisions.

   This process is what produced the coherence.
5. **Plan render capacity.** Frames are CPU-bound (JS plus Canvas2D). Run 6–8 segment pipelines in parallel. Estimated full-song 1080p `--samples auto` for our length: about 1.3 h with 8 pipelines, or roughly 6–8 h with one. Draft with `--samples 4` (about 7 fps on typographic plates) or `--max-samples 108`.
6. **Adapt the karaoke strategy to our density.** Their per-word full-frame slams work at 1.45 words/s. Ours runs at about 2.5 words/s with fast rap verses. Use phrase- or line-level typographic systems in the verses, and keep one-word slams for "Zoom, zoom, zoom!" and the "add a point to my p(doom)" hit. That hit becomes our escalating recurring set piece (4 choruses, so 4 escalation levels, exactly like their `hook n=1..4`).

---

## 1. Creative process: from lyrics to concept, style bible and plates

**Framing device.** The whole video is framed as "plates from an illustrated treatise on the end of the world" (docs/TREATMENT.md). Each lyric section becomes a *plate* (a FIG.) with its own instrument and idiom:
- engraving, oscilloscope, bureaucratic form, banknote guilloché, blueprint/roadmap
- raymarched 3D, woven "loom" tree, chat UI

One palette, one type system, one film grain and one deadpan humour unify them. Variety comes from changing the idiom per plate. Coherence comes from everything else being invariant.

**Pipeline from lyrics to plates** (as documented and implied by the file ownership):
1. **One-paragraph concept**, then **Tone**:
   - dynamic, with big changes on the beat
   - strong eases (outExpo, springs), holds and snaps
   - impressive over cute
   - deadpan-scientist humour
2. **An explicit anti-slop list.** No purple/cyan neon, glowing brains, Matrix rain, lens-flare soup, particle nebulae or stock "AI" imagery. Also no copying of memes or artworks, no real product UIs or logos, and model names appear as words only.
3. **Palette spec** (ink `#0A0A0B`, ink2, graphite, ash, bone `#EEE9DF`, signal `#FF4D12`, ember, blood):
   - One rare accent (acid) is owned by a single ~2 s moment.
   - Only signal/ember may exceed ~0.85 linear, so only they bloom.
   - Some plates invert to bone paper, which gives a light/dark rhythm across the edit.
4. **Typography spec:**
   - Archivo (width axis 62–125) is the voice of the lyrics.
   - IBM Plex Mono is the machine voice.
   - Cormorant italic is the prophetic register, used rarely.
   - Single-stroke Hershey/EMS fonts are for text *written* by the spark or pen.
   - Kerning discipline, typographic punctuation, and no outlined or haloed type.
5. **Karaoke rules for all plates:**
   - Every line is readable and synced per word.
   - Dim anticipation of up to ~0.4 s is allowed, but highlighting never runs ahead of the voice.
   - Each plate integrates the lyric graphically and *differently*: on a curve, as tokens, stamped on a form, woven, `[MASK]`ed, charred along a fuse.
   - Text stays in title-safe (≥96 px) and clear of the HUD corners.
6. **Motifs that thread the plates.** These are the source of narrative continuity:
   - **The spark.** One orange point drags a hairline. It writes the first lyric, draws the loss curve, becomes a stock chart, bends into the first paperclip, is revealed as a burning fuse, and detonates in the outro. It appears in 15 of the 40 scene files.
   - **P(doom) as the story spine.** The number ticks up on each sung "P(doom)" (0.02 → 0.15 → 0.42 → 0.81 → 0.99 → overflow → ∞ → NaN). There is no permanent corner readout. Each plate stages a small in-world cameo (a form field, a ticker, fine print in the prompt UI, a contour label), and 16 scenes use `PDoom`/`drawReadout`. The hooks blow the number up full-screen.
   - **Recurring templates with parameterized escalation:**
     - `prompt` ×3 (params `chatgpt|sydney|gato`): a tunnel pulling in, then bars closing on the beat, then fragile drifting letters.
     - `hook` ×4 (`n=1..4`): clean bone on ink; inverted onto a signal-orange field; the "breakdown" (hairline, tiny, eerie); then maximal (strobing 8ths, stacked outlines, shake, 9s multiplying).

     The escalation deliberately includes a *valley* (hook 3 and the quiet paperclips plate) before the maximal hook 4.
   - **The bland "assistant smile" mask** recurs: shoggoth, a map made of the mask, and the mask rolling off during "askew".
7. **Plate table.** Each row gives a scene id, its window anchored to a lyric line, and an *owner*. Each plate gets a paragraph that turns lyric lines into **visual puns and transformations, not literal storyboard**:
   - a grokking cliff becomes a camera plunge into a 3D loss landscape
   - "backward" is set mirrored
   - "repeat" stutters ×3
   - "disobey" highlights right-to-left
   - "safety fence" becomes breaking the video's own title-safe and action-safe guides
8. **Hand-off geometry.** Every plate ends in the exact screen layout the next one starts from. In `hook.ts` the next plates' constants are copied in rather than imported, because other agents own those files:
   - hook 1's P(DOOM) outline is what `room` shatters
   - hook 2's field closes like an eyelid onto `ascent`'s eye seam
   - hook 4's 9s become the `loom` thread
   - the CDR slot morphs into the Gato prompt caret

   So hard cuts on downbeats read as continuous transformations.
9. **Bookends and loop.** The crop-mark frame appears only around the opening TikZ sheet and the outro. At the end, a "↻ Regenerate" button is clicked, every plate rewinds past as JPEG thumbnails (`public/plates/`, made by `render.ts plates`), and the opening plays backwards to frame 0, so the video loops.
10. **Revision log in the doc.** Revisions 2–5 retired an uncanny realistic eye, retired the blue plate, removed FIG captions, limited crop marks to the bookends, and did a typography pass. The doc was the living spec across feedback rounds.

**Why it coheres and escalates rather than reading as disconnected effects:**
- Invariants: palette, type, grain and post are global, and a plate may only change the idiom.
- One physical through-line object (the spark) and one number (P(doom)) that *only goes up*.
- Recurring templates that escalate by parameter.
- Neighbour-to-neighbour geometric hand-offs.
- Choreography keyed to the **beat grid and word timings**, not audio-reactive envelopes. Scene code references beat/downbeat helpers 140 times, word timing 69 times, and raw envelopes (`f.a.*`) only 12 times. It is edited like a music video, not a visualizer.

---

## 2. Engine architecture (app/src/engine)

**Deterministic time-based rendering.** Every frame is a pure function of song time `t`.
- **Randomness** is seeded: `mulberry32`, `hash`, value noise. `Math.random` and `Date.now` appear nowhere in the scenes.
- **Stateful scenes** can opt in with `stateful=true`. The engine then resets them and re-simulates up to `prerollMax=6 s` at 1/60 after a seek. None of the shipped scenes are stateful, and stateful scenes are refused under adaptive sampling.
- **Preview and export** run the same code. The preview uses 1 sample. Export is `?export=1`, which exposes `window.__pdoom.{still, png, stream, timeline, engine}`.
- **Resolution.** The canvas is a fixed 1920×1080 logical size. `?scale=2` renders true 4K: render targets, Layer2D backing stores and LineBatch AA are physical, while the layout stays logical, and `FRAG_PX`/`pxLine` handle this in GLSL.

**Scene API** (`scene.ts`):
- `class X extends Scene { init(); render(f: Frame, out: HalfFloat RT) → PostOverrides }`.
- `ctx` holds `{renderer, audio, lyrics, comp, W, H, id, params, start, end}`.
- `Frame` holds `{t, dt, lt, p, beat, bar, beatPhase, barPhase, a: {rms, low, mid, high, vocal, drums, bass, other, kick, snare, hat, vonset}, under, tin, tout, seeked, preroll}`.
- `render` must overwrite `out` with **linear HDR**. Values above ~0.85 bloom.
- **Post overrides** a scene can return: `exposure, bloom*, halation, ca, grain, vignette, hud, frame, pdoom, paper, fade, flash, shake:[x,y], zoom, invert, pdoomText, hudCorruption`.
- **Toolbox:**
  - `FSPass`: a fullscreen GLSL3 pass with `GLSL_COMMON` prepended (palette consts, hashes, simplex/fbm/curl, SDFs, `hatch()`, `engrave()`, `heat()`).
  - `Compositor`: blend modes normal, add, screen, multiply, max, replace.
  - `Layer2D`: a Canvas2D layer uploaded as an sRGB texture, costing ~2–4 ms per layer (the engine guide says to use ≤2–3 per scene).
  - `LineBatch`: instanced capsule segments, 10k–200k, in 2D px or 3D with a camera.
  - `makeRT`.
- **Loading.** Modules load lazily via `import.meta.glob`. A broken scene renders dark red and is listed in `SCENE ERRORS`. It never breaks the build. HMR reloads a single scene.

**Timeline** (`timeline.ts`) is anchored to lyrics and the beat grid, with no hard-coded times:
- `cut(q)` returns the last beat at or before the first word of the line containing `q` (with 20 ms tolerance).
- `after(q)` returns the nearest downbeat to a line's end.
- The outro comes from `audio.sections`.
- **Entries** look like `{id, load, start, end, params, post, maxSamples, caption}`.
- **Transitions.** Touching windows produce a hard cut, which is the default. Overlapping windows produce a crossfade, or a custom transition with `handlesTransition` plus `f.under` and `f.tin`.
- **Inside scenes** the same idiom repeats. `loss.init()` finds words by content (`ly.get(...)`), then picks the nearest beat or downbeat inside a window for each camera move, for example a push-in on the beat before one word and a roll on another.

**Post** (`post.ts`):
1. Bloom pyramid: 7 mips, 13-tap down and tent up, fixed at logical resolution.
2. Halation tinted red-orange from mip 3.
3. Radial chromatic aberration.
4. Exposure.
5. HUD composited in *linear before the tone shoulder*, so it gets grain and vignette too.
6. Tone shoulder (`k=0.72`, desaturating to white above 2–12).
7. Invert, additive flash, vignette, fade.
8. sRGB conversion.
9. Two-scale mid-tone-weighted film grain plus dither.

Defaults are bloom 0.55 @ threshold 0.85, halation 0.25, CA 1.2 px, grain 0.055 and vignette 0.35.

**Typography and karaoke:**
- **Static font instances.** Variable fonts are cut into static instances with fontTools (`analysis/make_fonts.py`): 6 Archivo widths × 4 weights and so on, because Canvas2D and opentype.js need static outlines. Width is therefore "animated" in discrete steps.
- **Kerning.** `layout()` and `glyphX()` give per-glyph x positions *with* the font's kerning, measured with the measureText prefix trick. Use them whenever a word is drawn in pieces (sung vs unsung colours), or kerns get lost at the split.
- **Outlines and points.** `textPath2D` and `textPathCommands` produce opentype outlines placed at Canvas positions. They also sidestep opentype.js GSUB crashes. `textPoints` produces text made of points.
- **Written text.** `stroke.ts` provides Hershey/EMS single-stroke SVG fonts with *optical* kerning. `writtenLength(st, charTimes, t)` syncs a pen to word timings.
- **Sync helpers.** `Lyrics.get(q)` throws if the lyric is missing, so authoring fails loudly. `wordProgress(w, t)` is linear within a word, or piecewise across `syl` (syllable or letter sub-spans such as A-G-I or P-(doom)). `lineCharProgress` supports per-glyph wipes. `findWords('P(doom)')` finds words by text. `smart()` and `plain()` convert quotes.

**Motion-blur sub-frame system** (`Engine.render`, export only):
- **Averaging.** Each output frame averages N sub-frames spread over `shutter × dt` (they use 0.2), centred on `t`. The average is taken in a float sum RT, *before* post. A NaN guard drops any non-finite sub-frame pixel.
- **Adaptive nesting.** `--samples auto` nests ternary offset sets, 4 → 12 → 36 → 108 → 324. Each step adds a sub-frame on either side of every existing one, so every prefix stays evenly spread and centred.
- **Stopping rule.** After each step, the engine compares the new set's average with the old set's in *display space* (after the tone shoulder and sRGB), taking the worst 2×2-logical-px block. It stops when the estimated remaining error (half the last change) is below `--tol 3/255`.
- **Typical counts.** Still frames stop at 12, camera moves at 36, and whips and slams at 108–324.
- **Per-entry cap.** `maxSamples` caps a timeline entry (shoggoth uses 108 because of its G-buffer sparkle).
- **Sub-frame rules:**
  - Post params are read at shutter offset +1/8. The HUD, grain and dither are drawn once per frame.
  - Per-frame flicker must use `frameIdx(t)` (constant over the shutter), not `floor(t·60)`.
  - Particle emitters take rate as a function of *birth time*.
  - Supersampling shaders share 4 RGSS taps across sub-frames (`SS_TAP`).

**HUD** (`hud.ts`):
- A Layer2D overlay carrying crop marks (only when `post.frame > 0`), the P(doom) readout (off unless `post.pdoom > 0`), a paper/ink mode, a glitch mode (`hudCorruption`), a `pdoomText` override (for NaN), and legacy captions.
- `PDoom` builds its steps from the sung `P(doom)` words, with hard-coded values `[0.15, 0.42, 0.81, 0.99]`. Each step rolls over 0.9 s with outExpo, then creeps up to 20% toward the next value, with a little jitter.
- `drawReadout()` is the reusable in-world instrument.

---

## 3. Analysis pipeline (analysis/, uv, Python ≥3.12)

**Models and tools:**
- **Stems.**
  - Demucs `htdemucs_ft` (vocals, drums, bass, other).
  - A mel-band-roformer *karaoke* lead-vocal stem via `audio-separator`, used for the buried final chorus.
- **CTC emissions** (`ctc_emissions.py`), 20 ms frames:
  - torchaudio `MMS_FA` and `WAV2VEC2_ASR_LARGE_LV60K_960H`.
  - Each runs on the vocal stem's mono sum, left channel, right channel (double-tracked choruses are panned L/R) and the lead stem.
  - Audio is chunked in 20 s pieces with 3 s of context.
- **Forced alignment** (`ctcalign.py`):
  - One *global* numba Viterbi over the whole song on the `fused6` probability mixture (2 models × 3 channels), using a common alphabet `-a-z'`.
  - A garbage "star" token sits between lines, scored as best-token minus a 1.5 margin, to absorb ad-libs.
  - Anchors and per-line windows can pin hard spots.
  - `pron.py` spells acronyms phonetically ("pee doom", "en vee dee ay", …), with `ALT` variants scored by likelihood.
- **Refinement** (`align.py refine`), per sub-word unit, using `vocal_feats.py` features: 5 ms hop RMS, pYIN f0, log-mel flux onsets, and a 4–10 kHz sibilance ratio.
  1. **rest-onset**: after a ≥50 ms rest, the start moves to the voice re-entry.
  2. **onset-snap**: the start snaps to the strongest flux onset just before the CTC start.
  3. **fricative**: for s/sh/ch/f/th/j/h starts, the start moves back to where frication begins.
  4. **ends**: an end is the next word's start when the singing is legato, otherwise the point where RMS drops 15 dB below the word's level for ≥60 ms.

  Starts are then made monotonic and non-overlapping.
- **Cross-checks.**
  - mlx-whisper large-v3-turbo word timestamps (`whisper_run.py`), with a jargon `initial_prompt`, mapped by `SequenceMatcher`.
  - Agreement between the independent alignments (mms, lv60k, L, R, lead).
  - Confidence = 0.35 + 0.3·agreement + 0.2·posterior + 0.15·Whisper agreement.
- **Human-in-the-loop, done by Claude.**
  - `align.py --plots` writes per-line QA PNGs: spectrogram, f0, envelopes, and all tracks.
  - `zoom.py lines` writes ~3.6 s zooms.
  - Claude read them and wrote **17 `FIX` entries** (manual starts, ends and confidences) plus `EXTRA_DESC` notes on unlisted vocals.
- **Music analysis** (`analyze.py`):
  - **Constant-tempo grid.** A brute-force BPM and phase search (**hard-coded range 125–138 BPM**) on drum and mix flux, with phase refined on kick attacks.
  - **Downbeats.** Assumed at beat index 0 mod 4, chosen by hand from snare-on-2/4 plus chord changes.
  - **Sections.** A hand-written `SECTION_BARS` table.
  - **Envelopes.** 100 fps envelopes, each normalized to its own 99th percentile.
  - **Onsets.** Band-onset kick (<120 Hz), snare (1.5–5 kHz attack plus tail test) and hat (>7 kHz, not near a kick or snare). Vocal onsets come from flux peaks plus pitch jumps greater than 0.8 semitone.
- **Pitch.** Pitch for the "blues" guitar-string bend was extracted once (pYIN on the lead stem) and pasted into `scenes/fuse-pitch.ts`, anchored relative to the word's start.

**Schemas.** The engine only needs these two files. It falls back to `*.approx.json`, so you can build before alignment exists.

`data/audio.json` is compact JSON, 755 KB for 156 s:
```ts
{
  duration: number, bpm: number, beat_period: number, time_signature: 4,
  beats: number[],            // seconds, constant grid, extrapolated through drumless parts
  downbeats: number[],        // seconds
  sections: { name: string, start: number, end: number }[],   // on downbeats
  fps: 100,
  rms, low, mid, high, vocal, drums, bass, other: number[],   // TOP-LEVEL arrays, 0..1, len = ceil(duration*100)
                              // (engine also accepts them under `features`; the TS interface says `features`)
  onsets: { kick|snare|hat|vocal: [t: number, strength01: number][] },
  notes: string
}
```
`data/lyrics.json`:
```ts
{
  lines: { i: number, text: string, start: number, end: number,
           words: { w: string /* display token incl. punctuation */, start: number, end: number,
                    conf: number, syl?: [start: number, end: number][] }[] }[],
  extras: { start: number, end: number, desc: string }[],   // vocals not in the lyric text
  notes: string
}
```
The source is `lyrics/lyrics.src.js`: `[[start, end, "line text"], ...]` with approximate line times. Word tokens are the line text split on spaces, and the alignment asserts that the round trip matches.

**Accuracy:**
- **Claimed.** Word starts are within ~30–50 ms, after manual verification of every line. Known-uncertain words are ±50–100 ms (for example the final-chorus pickup buried under a pad was placed using the rhythm of the other choruses). Confidence averages 0.84, and 7 of 227 words are below 0.6. 17 words have syllable timing.
- **Grid.** Per-15 s phase drift is ≤2 ms, and the kick residual SD is printed at run time.
- **Assessment.** Credible for a clean pop vocal. The accuracy comes from the manual loop, not the models.
- **Risk for our song.** Hard autotune, distortion, pitched chops, screamed ad-libs and fast rap all degrade wav2vec2 CTC. Expect more manual fixes (a rough guess is 40–80), and lean on the karaoke lead stem and Whisper large-v3 cross-checks.
- **Grid risk for our song.** "Sudden beat switches" and a half-time bridge are fine for a constant grid only if the BPM truly stays at 152. Verify, and allow piecewise sections. The kick band detector (<120 Hz) will confuse clipping 808s with kicks. Tune it on the drums stem and inspect the plots.

**Hard-coded constants to generalize before reuse:**

| File | Constant | Change for our song |
|---|---|---|
| `ctcalign.py` | `N_FRAMES = 7833` (their 156.66 s / 0.02) | Ours needs about 11,480. Compute it from the audio length. |
| `analyze.py` | BPM search range 125–138, `SECTION_BARS`, downbeat phase assumption | Re-range for ~152 BPM. Our lyrics.md header says ~120 while suno.md says 152, so verify first. |
| `qa_plot.py`, `zoom.py` | `P=60/132, OFF=0.708` | Read from audio.json. |
| `common.py` | `STEM_OFFSET_SAMPLES=1015` (mp3 LAME delay), `AUDIO=pdoom.mp3`, `load_stem` asserts 44.1 kHz | For our WAV the offset should be 0. Verify by cross-correlation. Demucs outputs 44.1k. |
| `whisper_run.py` | `mlx_whisper` (Apple only) | Use `openai-whisper` (in our pyproject) or faster-whisper on CUDA. |
| `ctc_emissions.py` | device picks `mps`, else CPU | Use `cuda`. |
| `pyproject.toml` / `uv.lock` | Locked on macOS with mlx | Don't reuse their lock. Our `analysis/pyproject.toml` already pins torch/torchaudio 2.8 cu128. Keep torchaudio 2.8: the MMS_FA and forced-align APIs were deprecated in 2.8, and 2.9 drops them. |
| `pron.py`, `FIX`, `EXTRA_DESC`, `NOTES` | Song-specific | Rewrite. Ours needs Grok, Musk, Anthropic, Mythos, p(doom), "eighty-seven K", '28, DNS, HOAX, Hubinger, Coxon, Stargate, Jensen, Dario, and so on. |

---

## 4. Render pipeline, and whether it works on this box

**Design** (`scripts/render.ts`, bun):
1. playwright-core launches **system Chrome headless** (`channel: 'chrome'`) against a Vite server, either `--url` or a private `PDOOM_NO_HMR=1` server it spawns.
2. The page renders frames itself (`__pdoom.stream`). It reads each frame back with `readPixelsAsync` (PBO plus fence) and sends raw RGBA (bottom-up) over a **WebSocket** to a `Bun.serve` server in the script.
3. The script pipes the frames to **ffmpeg stdin**: rawvideo rgba, `vflip`, a BT.709 matrix plus tags, then `libx264 -preset slow -crf 16 -tune grain -x264-params aq-mode=3` and AAC 320k with `+faststart`.
4. **Backpressure.** There are ack-based limits (at most 4 frames in flight) and a 64 MB `bufferedAmount` cap.
5. **Modes:** `stills`, `sheet` (contact sheets; `--cuts` gives 4 frames around every boundary), `plates` (rewind thumbnails), `perf`, `gpu` and `video`. `--from`/`--to` produce segments to concat losslessly, `--only` loads selected entries, and `--scale 2` renders 4K.
6. **Their numbers.** A 4K song took ~2.5 h on an M5 Pro with 2 parallel pipelines. Each 4K pipeline used ~5 GB for Chrome plus ~4 GB for ffmpeg, and 4K CRF16 came to ~670 Mbit/s (13 GB). At 1080p, a frame costs 40 ms to over 10 s.

**Tested here** (Fedora, RTX 4090, driver 615.71, Chrome 154, node 24.18, npm 11.16), all in scratch:

| Step | Result |
|---|---|
| `npm install` (instead of `bun install`) | OK in 6 s. It added 32 packages, and vite 8.3.1 plus TypeScript 7 installed as a peer. |
| Headless WebGL2 with default flags, or `--use-angle=metal` (the reference's flag) | **SwiftShader, i.e. CPU.** The unpatched script silently renders in software. |
| `--use-angle=vulkan` in headless | **No WebGL2** (the app would fail to boot and time out after 120 s). |
| `--use-angle=gl-egl --use-gl=angle --ignore-gpu-blocklist`, or `--use-angle=gl` | **RTX 4090, OpenGL ES 3.2, float RTs.** chrome://gpu shows Canvas, WebGL and rasterization all hardware accelerated. |
| App boot, full timeline, in headless | ~1.5 s |
| `stills` ×11 across the song (1 sample) | 9.2 s total. All plates render correctly, including the raymarched shoggoth. |
| 1-sample frame including readback (`perf`) | 44–63 ms (their Mac target is <25 ms). Readback alone is ~40 ms here, versus ~15 ms on their Mac. |
| 36 sub-frames per frame | 0.6–0.7 s/frame for the typographic hook and 1.2–1.3 s for the room scene. |
| `--samples auto --shutter 0.2`, 8 windows in parallel | Averages 0.9–6.5 s/frame per window, p95 up to 12.4 s. The paperclips raymarch uses 324 sub-frames on every frame. The mean cost per frame under 8-way load was about 2.7 s, which is about 2.9 fps aggregate. |
| 3 parallel pipelines | Each is only ~7% slower than a single one, and GPU use was ~40%. Frames are **CPU-bound** (JS plus Canvas2D), so parallel segments scale. |
| Original `render.ts` under **bun 1.4.2** (`npm i -D bun`), one-line flag patch, **BtbN static ffmpeg**, `--samples 4` | 120 frames in 16.8 s (7.1 fps). The output is H.264 High, yuv420p, BT.709-tagged, at 77 Mbit/s. |
| Node 24 port, `h264_nvenc`, 1 sample | 14.8 fps |
| Node 24 port, `hevc_nvenc` main10 p010, p7 hq, `-cq 16` | Works: BT.709 tags carried, 11.5 fps at 1 sample. |
| Adaptive clip through the port, `h264_nvenc` | 15 frames at 108 sub-frames each in 26.8 s. Motion blur looks correct: continuous streaks on the rising letters. |

**Answers:**
- **bun.** Not needed globally. `npm i -D bun` in `app/` gives a working bun 1.4.2 with no rc edits. npm 11 warns about the blocked postinstall, but the binary works anyway. The official `curl -fsSL https://bun.sh/install | bash` also works, but it edits `~/.bashrc`; I did not run it.
- **node or tsx instead of bun.** Node 24 runs `.ts` directly (native type stripping), so **no tsx is needed**. `render.ts` still needs a small port: `Bun.spawn` → `child_process.spawn`, `Bun.serve` websocket → the `ws` package (`npm i -D ws`), `Bun.write`/`file`/`sleep` → fs and setTimeout, `import.meta.dir` → `import.meta.dirname`, and handling `stdin` `'drain'`. The port is done and tested for `gpu`, `stills`, `perf` and `video`: `…/scratchpad/refs/pdoom-video/app/scripts/render.node.ts` (ephemeral; ~40 changed lines). It also adds `GPU_FLAGS`, a `VENC` encoder override, `PROG`, and an ffmpeg-exit watchdog.
- **x264 replacements:**
  - **(a) No install.** Fedora's `ffmpeg-free` has `h264/hevc/av1_nvenc`, `libsvtav1`, `ffv1` and `prores_ks`. For the master, use `-c:v hevc_nvenc -preset p7 -tune hq -rc vbr -cq 14–16 -b:v 0 -profile:v main10 -pix_fmt p010le` (tested). NVENC is less efficient than x264 `--tune grain` on film grain, so spend bitrate, or render lossless segments (FFV1 or ProRes) and encode once. **Trap:** `ffmpeg-free` has **no software H.264/HEVC decoders** (only libopenh264, and no cuvid), so you cannot inspect or re-encode your own HEVC renders with the system ffmpeg.
  - **(b) Static ffmpeg (tested).** The BtbN GPL build (153 MB `.tar.xz`) has libx264, libx265, NVENC, and h264/hevc decoders. It is a drop-in via `PATH`, and the original x264 command line works unchanged.
  - **(c) pip.** `imageio-ffmpeg` bundles a static ffmpeg, reportedly with libx264. **Untested.**
  - **(d) RPM Fusion full ffmpeg.** Needs sudo, so not done: enable RPM Fusion free, then `sudo dnf swap ffmpeg-free ffmpeg --allowerasing`.
- **Full-song time estimate for our video** (229.6 s × 60 = 13,776 frames) at reference-like complexity: about 1.3 h with 8 parallel pipelines at `--samples auto`, or roughly 6–8 h with one. Drafts with `--samples 4` take about 35–60 min single-pipeline. The heavy raymarch plates dominate. These estimates come from 0.5 s samples of 8 windows, so treat them as rough.

**Exact user-level commands** (no sudo):
```sh
# bun, local to the app (tested)
cd app && npm i -D bun            # then: npx bun scripts/render.ts …  (or node_modules/.bin/bun)
# static ffmpeg with x264 (tested). Keep it off the default PATH so the system ffmpeg is untouched.
mkdir -p ~/.local/opt && curl -L https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz | tar xJ -C ~/.local/opt
export PATH=~/.local/opt/ffmpeg-master-latest-linux64-gpl/bin:$PATH   # per render shell, or make the render script honour $FFMPEG
# Linux GPU flags for the Chrome launch in render.ts (the one required patch)
#   args: ['--use-angle=gl-egl', '--use-gl=angle', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', …]
# always check before a long render:
bun scripts/render.ts gpu --url http://127.0.0.1:<port>   # must print "NVIDIA GeForce RTX 4090", not SwiftShader
```
All servers I started were stopped: the private Vite on 5391 and every headless Chrome.

---

## 5. Reuse assessment

**Fork these files (high value, low risk):**
- `engine/engine.ts`: timeline compositing, adaptive motion blur, stateful preroll, readback.
- `engine/gl.ts`, `post.ts`, `lines.ts`, `util.ts`, `scene.ts`, `lyrics.ts`, `audio.ts`, `type.ts` (kerned layout, outlines, text points), `glsl/common.ts` (swap the palette constants and keep the hatch/engrave/SDF/noise library), `scale.ts`.
- `stroke.ts` plus the Hershey/EMS fonts, only if we want "written by a pen" text.
- `main.ts` (preview UI: scrub bar with scene marks, `[`/`]`/`l`/`h`, `?t=`, HMR per scene) and `timeline.ts` (the anchoring functions).
- `render.ts`, with the patches above, the modes, the segment workflow and BT.709 tagging.
- `analysis/`: `ctcalign.py`, `ctc_emissions.py`, `vocal_feats.py`, `align.py` (refine, confidence, plots), `qa_plot.py`, `zoom.py`, `make_fonts.py`, and the `analyze.py` envelope and onset code. Generalize the constants first.
- **Process artifacts as templates:** the TREATMENT.md structure (one-paragraph idea, tone, anti-slop list, palette with bloom rules, type roles, karaoke rules, motifs, plate table with lyric and owner, per-plate paragraphs, revision log) and ENGINE.md as the sub-agent contract: edit only your own scene files, leave the timeline alone, look at your stills, and meet the perf budget.

**Adapt (reuse the mechanism, rewrite the content):**
- `hud.ts` `PDoom`: our schedule is one "add a point" per chorus (4 steps), plus the outro "(who can tell?)" and "twelve-point-nine" beats. Re-key it on our words (`findWords('p(doom)')` normalizes to `p(doom)`).
- The recurring-template-with-escalation pattern: our "Zoom, zoom, zoom!" hook ×4 and the pre-chorus "baby/darling" addresses (Mythos, Chatbot, Astra) are natural `params` variants.
- `prompt-data.ts`-style joke data tables (next-token distributions) fit our cheeky narrator.
- The outro loop trick (Regenerate → rewind → frame 0) is clever but theirs. Only echo it if it fits our ending; our song has an "abrupt ending".

**Avoid:**
- **Their scenes and their look.** That means the engraved treatise, ink/bone/signal orange, the spark, the mask, and their font trio. We need our own framing device and through-line. The brief requires style unique to *this* song: a chronological 2026 walk and speed ("zoom"). Mine the scenes for techniques only: the odometer-drum digits (`hook.drawDigits`), the token-probability popups, text on a curve, the contour-terrain shader in `loss.ts`, SDF raymarch with engraving hatching, typographic width and weight pressure (`dense-press.ts`), and breaking the frame's own safe areas.
- **mlx-whisper, the mp3 LAME offset, their uv.lock, and the 5173 default port.**
- **Audio-reactive visualizer habits.** The reference stays coherent because it is choreographed to words and beats. Use envelopes only for micro-texture.

**Traps and limitations spotted:**
1. `--use-angle=metal` on Linux gives SwiftShader silently. Also, `vulkan` headless gives no WebGL2, and the app times out after 120 s instead of erroring, because `new Engine()` throws at module load before `__pdoom` exists.
2. The default `--url http://localhost:5173` is taken on this box by `prams/apps/admin-web` Vite, so render.ts would attach to the wrong app. Always pass `--url`, or change the port.
3. **An ffmpeg failure hangs the render forever** (the page waits for acks). I hit this with a bad `-tune` value. Add an exit watchdog.
4. Readback costs ~40 ms per frame on Linux/ANGLE-GL versus 15 ms on the Mac, and Canvas2D upload costs ~2–4 ms per layer per *sub-frame*. At 108–324 sub-frames, Canvas2D-heavy or raymarch plates take 2–13 s per frame. Use `maxSamples` per entry, `--max-samples` for drafts, and parallel segments.
5. The adaptive sampler refuses `stateful` scenes, so design scenes as pure functions of `t`. Use `frameIdx(t)` for flicker and birth-time emitters.
6. `room.ts` uses macOS CJK system fonts (Songti/PingFang). Lesson: bundle every glyph source, and verify glyph coverage (the treatment bans fallback glyphs; symbols missing from a font are drawn instead).
7. `public/plates/*.jpg` (outro rewind) go stale after scene edits. Rerun `plates`.
8. Hand-off constants are **copied between scene files**, so changing one plate silently breaks its neighbour's hand-off. Keep a shared `handoffs.ts`, or check with `sheet --cuts`.
9. `Lyrics.get()` throws on a missing lyric, which is by design. It means lyric-text edits after alignment break scenes at init.
10. Their preview is real-time on a Mac. Here a 1-sample frame costs ~45 ms in headless because of the readback; a normal browser tab has no readback and should be faster (not measured).
11. `audio/pdoom.mp3` is hard-coded in `main.ts` and `render.ts`, and `.mp3` is assumed. Point both at our song. Chrome plays 48 kHz WAV fine, and ffmpeg muxes AAC 320k from the WAV.
12. `AudioJSON` declares `features`, but the file stores envelopes top-level. The loader handles both. Keep one convention.
13. YouTube smears per-pixel grain. Their YouTube upload was an older 4-sample render. Consider slightly coarser grain, or a 4K upload, so the grain survives.
14. The Fedora `ffmpeg-free` build can't decode H.264/HEVC in software. Use the static build for QA frame grabs, concat re-encodes and `-ss` seeking.

**Artifacts in scratch (ephemeral), in case they are useful before the session ends:**
- The clone with `node_modules` (bun and ws installed).
- `scripts/render.node.ts` (Node port) and `scripts/render.linux.ts` (flag patch).
- `refs/probe.mjs` (GPU flag probe), `refs/perfprobe.mjs` (readback breakdown), `refs/par.mjs` (parallel scaling).
- `refs/out/sheet_stills.png` (11-plate contact sheet) and `refs/out/t2_f5.png` (motion-blur frame).
- `scratchpad/tools/ffmpeg-master-latest-linux64-gpl/` (BtbN static ffmpeg).
