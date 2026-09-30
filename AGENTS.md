# AGENTS.md

This repo holds the song "P(doom)er Hyperslop" (originally "Zoom Zoom P(doom)", the name older files and the video's outro label still use) and its code-rendered music video ("THE RECORD"). The video is finished and published, so assume any change is a small fix unless you're told otherwise. [README.md](README.md) covers the project and the folder layout.

## Hard rules
- **Never put an invented or inaccurate fact on screen.** Every number, date and quote must already be in [video/FACTS.md](video/FACTS.md), sourced in `research/lines/`, and consistent with `annotations.md`. The FACTS.md rules apply:
  - Keep the source's precision.
  - Label reported and estimated figures as `REPORTED` or `ESTIMATE`.
  - Use exact quotes of 15 words or fewer, with attribution.
  - Show real harm events "cold": no jokes, no victims.
- **No p(doom) counter**, running or cumulative. A p(doom) percentage appears only where the lyric invokes it.
- **Flash safety.** Anywhere in the video, no more than 3 large-area flashes per second. Check every new render (see below). Drum rolls drive motion, never full-frame light.
- **Text stays readable.** Tears and glitches hit texture, not hero text. Run the text-overlap scan after layout changes.

## Style ("THE RECORD")
- **Look:** stark paper, ink and red, with 1-bit dither, slice tears, clipped bands and rubber stamps.
  - Palette and fonts (Nimbus Sans, Sans Narrow, Roman, Mono PS) live in `video/lib.js`.
- **Content:** shots of what each lyric literally describes.
- **Rejected by the user:** metaphors, mascots, anime, glossy "corporate" looks, low-quality 3D, marker or comic-sans scrawls, and overused slow zooms.
- **Motion rules** are in [video/MOTION.md](video/MOTION.md):
  - Cuts land on the music.
  - The picture freezes when the band stops.
  - Mood sets the amount of motion.
  - Only the first scream ("FOR NOW!") shatters the frame; later screams get a glitch-pulse fuzz.

## How the code works
- **Pure function of time.** Every frame depends only on song time `t`; data comes from `data/*.json` (beats, sections, onsets, envelopes, word timings).
- **`video/main.js`:** the `SHOTS` table (start time, id, function).
- **`video/frames/*.js`:** the shot drawing functions, grouped by section.
- **`video/lib.js`:** helpers. `a.w(/word/)` gives a sung word's time, `a.in(at, dur)` gives eased progress, and `slam` and `wipe` animate element entrances.
- **`video/motion/plan.json`:** per-shot cut times, transitions, effects and mood. `video/motion/engine.js` applies it.
- **`video/MOTION.md` is generated.** Edit `plan.json`, then run `python3 video/motion/gen_doc.py`.
- **`data/` is final.** Regenerating it (`analysis/run_all.sh`) needs about 18 GB of models and environments, so avoid it unless the audio changes.

## Commands
```bash
node tools/render/serve.mjs            # preview at http://127.0.0.1:8431/video/index.html?motion=1&t=<s>  (?shot=<id> for one shot's still)
node tools/render/render.mjs --page "video/index.html?motion=1" --stills 40,150 --out /tmp/stills
node tools/render/render.mjs --page "video/index.html?motion=1" --clip 33:48 --fps 30 --out /tmp/clip
node tools/render/render.mjs --page "video/index.html?motion=1" --clip 0:229.6 --fps 60 --master --name zoom-zoom-pdoom_4K60 --out release
python3 video/tools/flashcheck.py <clip.mp4> <clip-start-seconds>       # must report max_flashes_per_s <= 3
node tools/render/textscan.mjs --page "video/index.html?motion=1" --from 0 --to 229.6 --step 0.25 --json /tmp/overlaps.json
```
- **Rendering needs** `/usr/bin/google-chrome`, an NVIDIA GPU (the renderer refuses SwiftShader) and an ffmpeg with NVENC. A full master takes about 10 minutes.
- **ffmpeg on the original machine:** Fedora's ffmpeg can't decode H.264/HEVC. The renderer and flash check use a static build at `~/.local/opt/ffmpeg-btbn-n9.0/bin/` when it exists.
- **The scanner's flags** include deliberate layering, such as the background quote wall, the faint CRITICAL, and falling slips. Judge each flag by eye.

## Gotchas
- **The video is published.** The master on YouTube can't be replaced in place; any change means a new upload. The story is "as of" Sep 27–28, 2026, so don't add later events.
- **Timing comes from `data/audio.json`, not the prompt.** The song is 153 BPM (the Suno prompt says 152), 229.6 s long, and hard-cuts at 228.54 s.
- **Lyrics.**
  - Use `data/lyrics.json` for sung words and timings, not `lyrics.md` or `suno.md`. Suno changed some lines and dropped most of the echo ad-libs.
  - `a.w()` only finds words inside the shot's own time window. For words sung before the cut, read the lyric line from the data directly.
- **Draw order.** `tear()` shoves whatever is already on the canvas, so draw tears before hero text and numbers.
- **Stills aren't independent.** Some effects (the flash limiter, glitch fuzz) carry state from earlier frames, so a still rendered alone can differ from the same moment in a full render. To compare before and after a change, render the same list of times both times.
- **Resolution.** Frames are drawn at 1920×1080. The 4K master is a nearest-neighbour 2× upscale. True 4K would mean changing every frame's layout.
- **Encoding.** `hevc_nvenc` needs `-tier high -level 6.2`, or it quietly caps the bitrate at about 17 Mbps.
- **Storyboard files.** `video/storyboard/frames/` holds snapshots of the approved storyboard. Editing a shot doesn't update them; re-render the ones you touch with `?shot=<id>`.
- **Review cheaply first.** Show stills or a short clip for review before a full render.
