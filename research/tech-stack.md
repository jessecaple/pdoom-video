# Tech stack for "Zoom Zoom P(doom)"

Measured on this machine on 2026-09-28: i9-13900K (32 threads), 62 GB RAM, RTX 4090, NVIDIA driver 615.71.09, Chrome 154.0.8037.57, Electron 44.4.5, three r186, ffmpeg 8.1.2 (Fedora) plus BtbN n9.0.2. The scratch scripts that produced every number are in `/tmp/claude-1000/-home-jcaple-code-pdoom-1/da66833c-8630-45bf-bd38-907376263b63/scratchpad/tech/`, which is session-scoped. The load-bearing snippets are repeated inline below.

---

## 0. Recommendations

1. **Engine.** Use **custom three.js r186 (`WebGLRenderer`, WebGL2/GLSL3) with Vite 8 and TypeScript.** It follows the mexicat pattern, but the engine is our own, every frame is a pure `f(t)`, and escalation is driven by one global `P(t)` panic curve.
   - Post-FX are hand-written GLSL fullscreen passes. `pmndrs/postprocessing` 6.39 is optional.
   - For type: MSDF instanced glyphs carry the hero lyrics, canvas-2D textures carry UI and window spam, and troika-three-text is the quick path for arbitrary strings.
   - Skip Remotion, Motion Canvas/Revideo, p5 and Theatre.js as the core engine (reasons in §3).
2. **Render host: Electron, with Node integration in the renderer.** The page writes the frame bytes straight into `ffmpeg` stdin, so there is no WebSocket and no IPC bottleneck.
   - Measured: **612 fps at 1080p and 177 fps at 4K** (YUV420 readback into Node).
   - Headless Chrome streaming over WebSocket (the mexicat approach) manages 58 fps at 1080p and 13 fps at 4K on the same content.
   - Keep headless Chrome (Playwright) as the fallback host for when no desktop session exists.
3. **GPU flags.** Use **ANGLE on GL-EGL**: `--use-angle=gl-egl` (Electron: `app.commandLine.appendSwitch('use-angle','gl-egl')` plus `ignore-gpu-blocklist`). Headless Chrome needs `--headless=new --use-gl=angle --use-angle=gl-egl --ignore-gpu-blocklist`.
   - **Never add `--enable-features=Vulkan`.** It loses the WebGL context on the first draw.
   - **Assert that the renderer string contains "NVIDIA"** and abort otherwise, because the silent fallback is SwiftShader at about 3 fps.
   - Lock one backend for all workers. GL-EGL and Vulkan produce different pixels.
4. **Readback.** Pack RGB into **YUV420 (BT.709, limited range) in a shader** and read back 1.5 B/px instead of 4 B/px, 2.67× fewer bytes. Then pipe it to `-f rawvideo -pix_fmt yuv420p`.
5. **Encode segments.** Write segments with system ffmpeg using **`hevc_nvenc` main10 `-preset p7 -tune hq -rc vbr -cq 14..16 -b:v 0 -tier high -level 6.2`**. **`-tier high` is mandatory.** Without it NVENC silently caps HEVC at about 17 Mbps at 1080p (measured: cq 12 and cq 18 gave identical files).
   - Concat the segments with `-c copy`, then mux AAC-LC 384k with `+faststart`.
   - Upload **3840×2160 at 60 fps**. YouTube accepts HEVC.
   - For H.264, use libx264 from the BtbN static build.
6. **Install the BtbN static ffmpeg** (GPL n9.0). It is linked from ffmpeg.org and has libx264, libx265, NVENC and full decoders. **Fedora's ffmpeg cannot decode H.264 or HEVC at all**, so without BtbN, QA frame-grabs from our own renders fail.
   - Already installed, user-level with no PATH changes, at `~/.local/opt/ffmpeg-btbn-n9.0/bin/{ffmpeg,ffprobe}`.
7. **Parallelism.** Run **2–4 Electron workers**, each owning whole segments cut at EDL shot boundaries. Cache segments by content hash so re-renders only redo changed segments.
   - **Expected full-song time: 1080p60 ≈ 2–5 min and 4K60 ≈ 10–20 min** with 4–8× sub-frame motion blur.
   - The transfer and encode ceiling is 46 s (1080p) and 2.9 min (4K).
8. **Determinism is verified.** The same frame hashes identically across processes.
   - Stateful effects (feedback, datamosh, trails) must **pre-roll from the shot start**, or for at least `ceil(ln(1/255)/ln(decay))` frames.
   - Measured with decay 0.85: 60 vs 120 pre-roll frames gives a max diff of 1 LSB, but 30 vs 300 gives a max diff of 11.

**No sudo is needed for anything above.** One setup step: the project directory is **not a git repo**. Run `git init` before using worktree-isolated subagents.

---

## 1. Headless GPU on this box (measured)

### 1.1 Flags and `UNMASKED_RENDERER_WEBGL`

Tested with playwright-core 1.63.0 driving `/usr/bin/google-chrome`. "Bench fps" is the heavy scene from §1.2 at 1080p, GPU only.

| Flags | Renderer | Result |
|---|---|---|
| `--headless=new` (default) | `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)…)` | **Software**. The bench scene runs at **3.3 fps**. MAX_TEXTURE_SIZE is 8192. |
| `--headless=new --enable-gpu` | `ANGLE (NVIDIA Corporation, NVIDIA GeForce RTX 4090/PCIe/SSE2, OpenGL ES 3.2)` | HW, 936 fps |
| **`--headless=new --use-gl=angle --use-angle=gl-egl --ignore-gpu-blocklist`** | same (GL-EGL) | **HW, 892–980 fps. Recommended.** |
| `--headless=new --use-angle=vulkan [--ignore-gpu-blocklist]` | `ANGLE (NVIDIA, Vulkan 1.4.351 (NVIDIA NVIDIA GeForce RTX 4090 (0x00002684)), NVIDIA)` | HW, 581–667 fps. Readback is 2× slower than GL-EGL. |
| `--use-angle=vulkan --enable-features=Vulkan` | Vulkan string | **BROKEN.** The compositor logs "Failed to initialize vulkan surface", then `CONTEXT_LOST_WEBGL` on the first draw into any FBO. The string looks right, but the output is black. |
| `--use-gl=egl` | SwiftShader | **BROKEN** (context lost) |
| `--use-angle=swiftshader` | SwiftShader | 3.3 fps |

- The GL-EGL path works with `DISPLAY` and `WAYLAND_DISPLAY` unset, so it runs over SSH with no desktop.
- MAX_TEXTURE_SIZE is 32768 and `EXT_color_buffer_float` is present.
- Neither playwright-core nor puppeteer-core (current versions) adds `--disable-gpu`. Playwright always adds `--enable-unsafe-swiftshader`, which is why a missing GPU flag *silently* falls back instead of failing. Pass `headless:false` and supply `--headless=new` yourself, so the flag set is explicit.
- **WebGPU is not usable headless here.** `navigator.gpu.requestAdapter()` returns only a SwiftShader adapter, and returns none with the Vulkan flags. Stay on `WebGLRenderer`, not `WebGPURenderer`/TSL.
- **Electron** (`use-angle=gl-egl`) gets the same NVIDIA GL-EGL renderer. It needs a display, which the logged-in Wayland session provides. It **SIGSEGVs with `--ozone-platform=headless`**, so use the headless-Chrome host when there is no session.
- The pixel checksum differs between GL-EGL and Vulkan (133071 vs 126771), so **all workers must use identical flags**.

### 1.2 Throughput

**Bench content.** The scene is a domain-warped fbm (3×7 octaves) plus a 48-step raymarch into RGBA16F. On top of that sit a 5-level downsample chain and a composite (chromatic split, bloom add, grain, tonemap) into RGBA8. There is no rAF: the page drives its own loop. One frame is one render plus a synchronous `readPixels`.

| 1920×1080 | GL-EGL | Vulkan |
|---|---|---|
| GPU only (1-px readback to sync) | **892 fps** (1.1 ms) | 581 fps |
| + full RGBA `readPixels` (in page) | 412 fps (2.4 ms read) | 189 fps (5.2 ms read) |
| Chrome → Node **WebSocket, RGBA** (8.3 MB/frame) | **23 fps** (189 MB/s) | 21 fps |
| Chrome → Node WebSocket, **YUV420 packed in shader** (3.1 MB) | **58 fps** | 59 fps |
| + PBO async readback (fenceSync ring of 3) | 65 fps | 67 fps |
| fetch POST, YUV | 14.7 fps | – |
| 2/4/8 WebSockets per page (split frame) | 61 / 61 / 75 fps. No real gain. | – |
| **Electron, renderer writes to a Node stream, YUV** | **612 fps** | – |
| Electron, RGBA | 416 fps | – |
| `page.screenshot` PNG / JPEG q95 | 2.7 / 22.8 fps | – |
| `canvas.toDataURL('image/png')` via evaluate | 7.7 fps | – |
| CDP `Page.startScreencast` JPEG q95 | 30.5 fps (lossy) | – |

| 3840×2160 | GL-EGL |
|---|---|
| GPU only | **209 fps** (4.8 ms). Vulkan: 216 fps. |
| + RGBA readPixels | 88.5 fps (11.3 ms) |
| Chrome WS RGBA / YUV | **5.1 / 13.1 fps** |
| **Electron YUV / RGBA** | **177 / 116 fps** |

**Parallel instances** (aggregate; plateaus around 550–650 MB/s for Chrome WS):

| | 1080p | 4K |
|---|---|---|
| Chrome WS YUV ×4 | ≈166 fps | ≈39 fps |
| Chrome WS YUV ×8 | ≈204 fps | – |
| **Electron → hevc_nvenc p7 main10, ×1** | **171 fps** end to end | **45 fps** |
| Electron → NVENC ×2 | 215 fps | 63 fps |
| **Electron → NVENC ×4** | **304 fps** | **81 fps** (NVENC-bound) |

**Why Chrome is slow.** The Chrome WS path is capped at about 190 MB/s per renderer: renderer, then network service, then socket. Adding sockets does not help. Electron's `nodeIntegration` lets the renderer `write()` into a pipe directly.

**Reference point.** Python ModernGL on headless EGL (Python 3.12; there are no 3.14 wheels yet) renders the same scene shader plus RGBA readback at **708 fps (1080p) and 192 fps (4K)**. That is the same class as Electron.

### 1.3 Full-stack prototype in Electron

The prototype used three r186, troika-three-text 0.52.5 (sdfGlyphSize 128), 3000 instanced boxes, sub-frame accumulation into RGBA16F, a feedback-zoom pass, an RGB split, and the YUV pack. It was built by Vite and served over http to a hidden Electron window.

- **Speed:** 1080p runs at 703 fps with K=1 and 276 fps with K=8. 4K runs at 247 fps (K=1) and 176 fps (K=8). At K=8 it is CPU-bound on JS instance-matrix updates, so **put per-instance animation in vertex shaders**.
- **Rendering:** troika text renders correctly after `await text.sync()`. The still was checked visually.
- **Determinism across runs:** frame 300 (K=4, 60-frame pre-roll) hashes `966d9971d37153c3` in two separate processes.
- **Pre-roll divergence** (feedback decay 0.85): 60 vs 120 frames gives 7 bytes differing and a max of 1 LSB. 30 vs 300 gives 3% differing and a max of 11. None vs 300 gives 91% differing.

### 1.4 Load-bearing snippets

**YUV420 pack.** The target is RGBA8 at `W/4 × H*3/2`. Each texel packs 4 consecutive I420 bytes, and the source is the final sRGB-encoded frame.

```glsl
uniform sampler2D s; uniform vec2 res; out vec4 o;   // GLSL3
float Y(vec3 c){ return dot(c, vec3(.2126,.7152,.0722))*219./255.+16./255.; }          // BT.709 limited
float U(vec3 c){ return (dot(c, vec3(-.1146,-.3854,.5))*224.+128.)/255.; }
float V(vec3 c){ return (dot(c, vec3(.5,-.4542,-.0458))*224.+128.)/255.; }
vec3 f(ivec2 p){ return texelFetch(s, ivec2(p.x, int(res.y)-1-p.y), 0).rgb; }          // flip: row 0 = top
void main(){ ivec2 fc=ivec2(gl_FragCoord.xy); int W=int(res.x), H=int(res.y);
  int bi=(fc.y*(W/4)+fc.x)*4, ys=W*H, cs=(W/2)*(H/2); vec4 r;
  for(int k=0;k<4;k++){ int b=bi+k; float v;
    if(b<ys) v=Y(f(ivec2(b%W,b/W)));
    else { int i=(b<ys+cs)?b-ys:b-ys-cs; ivec2 p=ivec2(i%(W/2),i/(W/2))*2;
      vec3 a=(f(p)+f(p+ivec2(1,0))+f(p+ivec2(0,1))+f(p+ivec2(1,1)))*.25; v=(b<ys+cs)?U(a):V(a); }
    r[k]=v; }
  o=r; }
```

Add ±0.5 LSB blue-noise dither before quantization to kill banding. Tag the output `bt709/tv`.

**Electron host (main process):**

```js
app.commandLine.appendSwitch('ignore-gpu-blocklist'); app.commandLine.appendSwitch('use-angle','gl-egl');
new BrowserWindow({ show:false, webPreferences:{ nodeIntegration:true, contextIsolation:false, backgroundThrottling:false, sandbox:false } });
```

**Renderer page:**

```js
const ff = require('child_process').spawn('ffmpeg', args, { stdio:['pipe','ignore','inherit'] });
renderer.readRenderTargetPixels(yuvRT, 0,0, W/4, H*3/2, yuv);
if (!ff.stdin.write(Buffer.from(yuv.buffer))) await new Promise(r=>ff.stdin.once('drain', r));
```

---

## 2. Encoding

### 2.1 Measured quality and speed

The test clip is 240 frames of the bench content above at 1080p60. It includes fine temporal grain, which is the worst case. VMAF and SSIM were computed by the BtbN ffmpeg (libvmaf).

| Encoder settings | enc fps | Mbps | VMAF |
|---|---|---|---|
| hevc_nvenc p7 hq vbr **cq18**, main10, auto level | 145 | **17.0** | 74.7 |
| hevc_nvenc p7 hq vbr **cq12**, same | 146 | **17.0** | 74.7. **Identical output: a level-cap bug** |
| hevc_nvenc p7 hq cq18 **-tier high -level 6.2** | 143 | 60.9 | 86.1 |
| hevc_nvenc p7 **uhq** cq14 high tier | 110 | 92.8 | 88.8 |
| hevc_nvenc p7 uhq cq10 high tier | 111 | 132 | 90.8 |
| h264_nvenc p7 hq cq16 | 182 | 42.8 | 82.4 |
| h264_nvenc p7 hq cq10 `-level 5.2` | 172 | 141 | 92.1 |
| av1_nvenc p7 uhq cq20 / cq12 | 123 / 117 | 50 / 122 | 85.7 / 91.0 |
| libx264 slow crf14 (BtbN) | 40 | 97.7 | 91.1 |
| libx264 slow crf18 | 57 | 35.3 | 84.6 |
| libsvtav1 p4 crf20 10-bit | 27.5 | 28.0 | 83.0 |
| hevc_nvenc `-tune lossless` | 181 | 611 | 99.4 |

- **4K speed** (synthetic noise): hevc_nvenc p7 runs at 41 fps and av1_nvenc at 68 fps. libx264 slow manages 5.0 fps and svt-av1 p6 9.9 fps.
- **1080p speed:** libx264 slow runs at 16.9 fps.
- **Takeaway:** NVENC HEVC high tier at cq 14 is about equal to x264 crf 14 in quality, and 3× faster at 1080p and about 8× faster at 4K.

**Grain warning.** Per-pixel temporal white noise is incompressible. x264 needs about 98 Mbps at 1080p just to keep mild grain. YouTube's delivered 1080p60 stream is single-digit Mbps, so fine grain and 1-px scanlines turn to mush on playback.
- Make grain **2–3 virtual px, lower amplitude, updated every 2nd frame**.
- Keep scanline periods at **3–4 px at 1080p (6–8 px at 4K)**.
- Author the "bitrate starvation" look deliberately (§4) instead of hoping the encoder produces it.

### 2.2 Static ffmpeg: legitimate, and where to get it

- **BtbN/FFmpeg-Builds** (github.com/BtbN/FFmpeg-Builds/releases) is the Linux static build that **ffmpeg.org's download page links to** ("64-bit static and shared builds").
  - It is glibc-dynamic only, so it can dlopen `libnvidia-encode`: NVENC works (tested).
  - It has **libx264, libx265, libsvtav1, libvmaf, and native h264/hevc decoders**.
- **johnvansickle.com** is no longer linked from ffmpeg.org. Its latest release is **7.0.2 (git 20240629)**, which is stale. Skip it.
- **Fedora's ffmpeg** is built with `--disable-decoder='h264,hevc,vc1,vvc'`. It can encode NVENC, but it **cannot decode our own H.264/HEVC outputs**. Only libopenh264 is available for H.264.
- **Installed** (user-level; the checksum matched the release's `checksums.sha256`: `3b479779…91dd3f6`): `~/.local/opt/ffmpeg-btbn-n9.0/bin/ffmpeg` reports `n9.0.2-14-gebafaee10a-20260928`. PATH was not changed. Scripts should use `FFMPEG=~/.local/opt/ffmpeg-btbn-n9.0/bin/ffmpeg`.
- To reproduce or pin the install (the `latest` tag rolls daily; dated `autobuild-*` tags exist for pinning):

```sh
cd /tmp && curl -LO https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-n9.0-latest-linux64-gpl-9.0.tar.xz \
 && curl -LO https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/checksums.sha256 \
 && grep ' ffmpeg-n9.0-latest-linux64-gpl-9.0.tar.xz$' checksums.sha256 | sha256sum -c - \
 && mkdir -p ~/.local/opt && tar -C ~/.local/opt -xf ffmpeg-n9.0-latest-linux64-gpl-9.0.tar.xz \
 && mv ~/.local/opt/ffmpeg-n9.0-latest-linux64-gpl-9.0 ~/.local/opt/ffmpeg-btbn-n9.0
```

Also note: Fedora's ffmpeg has **libfdk_aac**, which BtbN's GPL build lacks. Use either for audio.

### 2.3 Commands (tested end to end)

**Per-segment encode.** The renderer pipes raw YUV into this.

```sh
ffmpeg -f rawvideo -pix_fmt yuv420p -s 3840x2160 -r 60 -i - \
  -c:v hevc_nvenc -preset p7 -tune hq -rc vbr -cq 15 -b:v 0 -tier high -level 6.2 \
  -rc-lookahead 32 -spatial-aq 1 -temporal-aq 1 -bf 3 -b_ref_mode middle -g 60 -forced-idr 1 \
  -profile:v main10 -pix_fmt p010le \
  -bsf:v hevc_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0 \
  -video_track_timescale 60000 out/seg/0007.mp4
```

**Concat and mux.** Tested: 450 frames, Main 10, tags bt709/bt709/bt709, clean decode.

```sh
ffmpeg -f concat -safe 0 -i out/seg/list.txt -i song.wav -map 0:v -map 1:a \
  -c:v copy -tag:v hvc1 -c:a aac -b:a 384k -shortest -movflags +faststart out/final_4k60.mp4
```

Pitfalls found:
- **MKV** segments at 60 fps with B-frames give non-monotonic DTS after concat, because of the 1 ms timebase. Use MP4 with `-video_track_timescale 60000`.
- Without the `hevc_metadata` bsf, transfer and primaries are lost on remux.
- `-tier high` is required, as covered in §0.

**Optional H.264 to YouTube's documented spec**, from a near-lossless master. It is slow: about 46 min at 4K.

```sh
~/.local/opt/ffmpeg-btbn-n9.0/bin/ffmpeg -i master.mp4 -c:v libx264 -preset slow -crf 14 -profile:v high \
  -pix_fmt yuv420p -g 30 -bf 2 -flags +cgop -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a copy -movflags +faststart final_h264.mp4
```

### 2.4 YouTube

From support.google.com/youtube/answer/1722171:
- **Container:** MP4 with the moov atom at the front (faststart) and no edit lists.
- **Audio:** AAC-LC (or Opus), stereo at **384 kbps, 48 kHz**. song.wav is already 48 kHz s16 stereo.
- **H.264 spec:** High profile, 2 B-frames, closed GOP of half the frame rate, CABAC, VBR, 4:2:0. Colour BT.709.
- **SDR high-frame-rate bitrates:** 1080p60 **12 Mbps**, 1440p60 24 Mbps, **2160p60 53–68 Mbps**. These are minimums, and more is fine.
- **Supported formats** include **HEVC (H.265), ProRes, DNxHR and CineForm**.

Practical advice:
- **Upload 3840×2160.** It is widely observed, though not in the doc, that ≥1440p uploads get YouTube's better VP9/AV1 ladder, and 1080p viewers get a better stream from it.
- **Author at 1920×1080 logical units** so the output is resolution-independent.
- **Upload at 60 fps.** At 152 BPM one beat is 23.68 frames, so beat events must be frame-quantized consistently (§4).
- ffmpeg writes a small AAC-priming edit list. This is harmless in practice.

---

## 3. Framework comparison

| | Determinism (t only) | Scrubbable preview | Claude author/debug as text | Segment-parallel | Post-FX ceiling | Typography | Licence and health | Verdict |
|---|---|---|---|---|---|---|---|---|
| **Custom three.js + Vite** (mexicat-style) | Yes, if enforced. We own the loop: no rAF, no Clock, no Math.random. | Build it: about 200 LOC scrubber plus Vite HMR. Pure f(t) means HMR keeps t. | **Best.** Plain TS and GLSL with massive training data. Stills and contact sheets via CLI. | Trivial. Our orchestrator, **Electron fast path** (§1). | Unlimited: raw GLSL passes, RT graph, MRT velocity, float RTs. | troika, MSDF, canvas: all available. | MIT. three r186 (2026-09-24), active. | **Recommended** |
| p5.js 2.3 + p5.brush 2.2 (Heibel) | Needs `randomSeed`/`noiseSeed` per frame. p5.brush and accumulating canvases are stateful. | Real-time loop only. Scrubbing means re-simulating. | Very good; simple API. | OK only if kept pure. | Weak: filter shaders, no RT graph or float pipeline. Slow at 4K. | Canvas text and textToPoints. No SDF. | p5 LGPL-2.1, p5.brush MIT; both active. | Use only to **bake ink/brush sprite sheets** |
| Remotion 4.0.529 + @remotion/three | **Excellent.** `useCurrentFrame()`; frames render out of order across tabs, which forces purity but **kills feedback/datamosh state**. | **Best-in-class Studio** with waveform. | Good, but React plus R3F reconciliation per frame adds indirection. | Built in (concurrency, Lambda). | Via R3F plus postprocessing, but **capture is screenshots** (JPEG default; PNG slow). We measured 23 fps/tab JPEG and 2.7 fps PNG at 1080p. Recommended `--gl=angle-egl`. | **DOM/CSS text is superb**, and troika via drei. | **Free for individuals, non-profits and for-profits with ≤3 employees. Others need a paid Company License** (remotion.pro). The user is an individual, so it's free here. | 2nd choice. Not worth the capture tax and statefulness limits. |
| Motion Canvas 3.17 / Revideo 0.11 | Good (generator timelines). | Good editor. | Good for 2D vector. | Revideo has parallel render. | 2D canvas-first; WebGL is second-class. | Good 2D text. | Motion Canvas npm was last published **Feb 2025**. Revideo was **folded into Midrender** (commercial roadmap). | No |
| Raw WebGL2 + twgl 7 / regl 2.1 | Yes | DIY | Very good GLSL, but we'd rebuild the scene graph, text and loaders. | Trivial | Unlimited | DIY | twgl active. regl effectively unmaintained. | No. three's `ShaderMaterial`/`RawShaderMaterial` gives the same control. |
| Theatre.js 0.7.2 (keyframes) | Yes (sequence position = t) | Studio GUI | **Poor.** Keyframes live in GUI-edited JSON and aren't beat-aware. | n/a | n/a | n/a | npm last published **May 2024**. 1.0 is in private development. | No. Use a **code-first beat-grid tween DSL** instead. |
| Python ModernGL (+ skia-python) | **Excellent** | None built in (moderngl-window is real-time; scrubbing is DIY) | Good | Trivial | Same GLSL | skia text is excellent but CPU raster | MIT/BSD. Measured **708/192 fps** (1080p/4K). | Fallback host. Use for offline tools (plots, LUT/atlas baking). |

**Typography choices within three.js:**
- **MSDF.** Build a prebaked atlas with `msdf-bmfont-xml` (npm) or msdf-atlas-gen, and render an instanced-glyph shader (`three-msdf-text-utils` 1.5 helps).
  - It keeps sharp corners at any scale and costs almost nothing, even with thousands of glyphs.
  - The SDF enables outline, glow, erosion, ink-bleed and melt.
  - The charset is fixed, which is fine for English lyrics. **Use it for the hero lyric system.**
- **troika-three-text 0.52.** It generates SDFs at runtime from TTF/OTF/WOFF, with kerning, ligatures and bidi, and exposes glyph bounds.
  - It is **async**: `await text.sync()` for every string during scene setup, before rendering.
  - Set `sdfGlyphSize: 128` for display sizes at 4K.
  - Per-glyph effects need `createDerivedMaterial`. **It's the quick path.**
- **Canvas-2D → texture.** Any font, emoji or CSS `font-variation-settings`, with HarfBuzz shaping.
  - The cost is rasterization plus upload, and it blurs when scaled, so re-raster at the target size.
  - **Use it for UI windows, dialog chrome, terminal and text walls.**
- **Licence trap:** **lygia** (shader library) is Prosperity/Patron-licensed, not MIT. Write your own noise, or use stegu/ashima webgl-noise (MIT).

---

## 4. Cookbook for "increasingly frantic"

### 4.0 The panic system (build this first)

All escalation reads from one pure function, evaluated once per output frame and once per sub-frame for continuous terms.

```ts
// engine/panic.ts
P(t) = clamp01( base(t) + kEnv*env(t) + events(t) + scene.localBias )
base(t)   : monotone cubic (Fritsch–Carlson) through keys in data/panic.json. Section-aligned, e.g.
            intro .05, V1 .12→.25, pre .35, CH1 .45, V2 .40→.55, CH2 .65, V3 .6→.75, CH3 .85, final "who can tell?" 1.0.
            The narrator's "add a point to my p(doom)" is literally a step up at each chorus downbeat.
            Render P as an in-world HUD "p(doom) = 0.xx".
env(t)    : precomputed audio envelopes from data/analysis.json at ≥240 Hz (RMS, flux, band onsets: kick 40–120 Hz,
            snare 1–4 kHz, hats >6 kHz), smoothed with attack ~5 ms and release ~150 ms.
kick(t)   : Σ_i s_i·exp(-(t−t_i)/τ) over kick onsets t_i ≤ t (binary search the onset list, sum the last ~4); τ ≈ 80 ms
events(t) : beat-quantized triggers  trig(beatIdx, salt, prob) = hash(beatIdx*7919+salt) < prob(P)
gate(P,a,b) = smoothstep(a,b,P)
```

`engine/fxSchedule.ts` is **one table that is the whole escalation design**. Each FX gets `[pStart, pFull, max]` plus envelope couplings. The engine produces an `FxState` per frame:

| FX | pStart→pFull | Coupling |
|---|---|---|
| grain amp, bloom/halation | 0 → 1 | + rms |
| RGB split px | .15 → .9 | + kick·6px |
| camera shake | .1 → 1 | × kick |
| cut rate | .2 → 1 | quantized to the grid (§4.4) |
| feedback decay / Droste depth | .25 → .9 | zoom punch on kick |
| palette stage | .3 → 1 | step at chorus downbeats |
| JPEG/macroblock | .45 → 1 | block-refresh probability ∝ 1−P |
| datamosh | .55 → .95 | triggered at cuts with probability ∝ P |
| pixel-sort passes | .6 → 1 | + snare |
| effective fps (temporal crunch) | .7 → 1 | 60 → 12 → 6 |
| window spawn rate / text density | .2 → 1 | + hats |
| pixelation | .8 → 1 | beat-synced crunches |

Tooling:
- `tools/plot-fx.py` renders P(t), cuts per bar and every FX curve to one PNG over the song's section markers. Claude reads it to verify monotone escalation, and the user reviews it.
- The preview HUD shows the live `FxState`.
- Per-shot overrides live in the EDL, not in scene code.

### 4.1 Feedback, trails and recursive zoom (Droste)

- **Feedback.** Ping-pong two RGBA16F RTs. Each output frame:
  - `fb' = max|mix(cur, sample(fb, warp(uv)) * decay)`, where warp is zoom toward a focus point, rotation, a small offset and a hue rotate.
  - Update **once per output frame**, after sub-frame accumulation, never per sub-frame.
  - Cost is about 0.1 ms at 1080p and 0.4 ms at 4K.
  - **State:** reset at shot start and pre-roll from shot start, or for `ceil(ln(1/255)/ln(decay))` frames (≈34 at 0.85, but HDR values need more; 60 was measured sufficient).
  - Align segment boundaries to cuts so no pre-roll is needed.
- **Analytic Droste** (infinite nested zoom; the "Zoom Zoom" motif). Use it on a source frame whose central "screen" (a phone, monitor or window) sits at scale 1/s:

```glsl
vec2 cmul(vec2 a,vec2 b){return vec2(a.x*b.x-a.y*b.y,a.x*b.y+a.y*b.x);}
// z: centered, aspect-corrected output coord; s: outer/inner scale (e.g. 4.0); phase: zoom levels (beat-locked)
vec2 droste(vec2 z, float s, float phase, bool spiral){
  float L = log(s);
  vec2 w = vec2(log(length(z)), atan(z.y, z.x));               // complex log
  if (spiral) w = cmul(w, vec2(1.0, -L/6.2831853));           // beta = 1 - i L/2π : one turn = one nesting level (Escher)
  w.x = mod(w.x + phase*L, L) - L;                            // wrap log-radius into annulus [1/s, 1)
  return exp(w.x) * vec2(cos(w.y), sin(w.y));                 // sample source here
}
```

  - Sample with `textureGrad`, using derivatives taken **before** the `mod`, so the seam doesn't produce a mip-0 sparkle ring. Keep the source mip-mapped.
  - Drive `phase` with beat time. At the climax, use 1 level per beat and speed-ramp into the drop.
  - Cost is one pass, under 0.2 ms at 4K.
  - Negate the imaginary part of β to flip the spiral's handedness.
- **Frame-in-frame by rendering.** The previous final frame is drawn onto a "screen" mesh in the current frame. Recursion grows one level per frame, which gives the video-feedback look.
- **Zoom-through transition.** Render the next scene to an RT, texture it onto a screen in the current scene, and fly the camera in until it fills the frame, then swap. This chains shots into one endless zoom. It costs 2× scene render during the transition.

### 4.2 Datamosh, pixel sort, RGB split, CRT, JPEG/macroblock and starvation

- **Datamosh (I-frame drop emulation).**
  - Render a **screen-space velocity MRT** from the previous and current MVP. That adds 10–20% to scene cost; far better than optical flow.
  - Block-average the velocity per 16×16 macroblock in a 1/16-res pass.
  - Advect a mosh buffer: `mosh = texture(moshPrev, uv - mvBlock(uv))`.
  - At a cut, *don't* replace the old shot. Keep the old pixels and let the new shot's motion push them, then `mix(mosh, cur, residual)`. A residual of 0.02–0.1 gives "melting into the new shot".
  - Per-block intra-refresh uses `hash(block, frame) < refreshProb(P)`.
  - Cost is about 0.3 ms at 4K. It's stateful from the trigger cut, so pre-roll from that cut.
- **Pixel sort.**
  - **Odd-even transposition** passes: pass i compares x with its partner `x + ((x+i)&1 ? -1 : 1)` (rotate uv for the sort direction).
  - Swap only if both pixels are inside a mask interval (luma between lo and hi), then ping-pong.
  - 50–200 passes gives the characteristic partial-sort streaks; the pass count scales with P and snare. Each pass is trivial: 200 passes ≈ 6 ms at 1080p and ≈ 24 ms at 4K.
  - It's stateless if you sort each frame fresh. Accumulating the sort is a stateful "melting" variant.
  - Bitonic per row segment (≈66 passes for a full 2048 row) sorts completely.
- **RGB split.** Use 6–8 wavelength-weighted taps along a radial or velocity direction, not 3 hard copies. It's free.
- **CRT and scanlines** (final pass): barrel k1, scanline modulation, aperture-grille triads, interlace line alternation per frame, rolling bright bar, vignette and phosphor glow (reuse bloom).
  - Define periods in **virtual px** (H/1080) and keep them ≥3–4 px at 1080p, or YouTube produces moiré and mush.
  - Use it in bursts, not as a constant layer.
- **JPEG emulation.**
  1. RGB→YCbCr, then 2× chroma downsample.
  2. Separable 8×8 DCT: 2 passes × 8 taps.
  3. Quantize `round(c/(Q·qtab[u][v]))·Q·qtab`.
  4. Separable IDCT.

  Q is per block, `hash(block, beat)`, and rises with P. Crush chroma harder than luma. That's 4 passes, under 1 ms at 4K.
- **Bitrate starvation (H.264 macroblocks).** A per-16×16 decision map from `hash(block, frame)`, P and motion magnitude chooses one of:
  - normal
  - DC-only (flat average)
  - low-frequency only
  - **skip** (hold the previous frame's block)
  - **wrong-MV copy** (the previous frame at an offset)

  It needs only the previous output frame (1-frame state). This is the controllable version of what the encoder would do randomly.
- **Real-codec option.** Bake selected shots through `libx264 -b:v 80k` or corrupted bitstreams offline, then decode to an image-sequence atlas (BtbN ffmpeg) for deterministic frame access. **Never use `HTMLVideoElement`**: it isn't frame-accurate.

### 4.3 Camera shake, speed ramps and stutter

- **Kick shake:**

```
off(t) = Σ_i A_i·exp(-(t−t_i)/τ)·vnoise2(seed_i, (t−t_i)·16 Hz)
A_i = strength_i · mix(0.002, 0.03, P)   // in NDC
```

  Add roll ±0.5°·A and an **FOV/zoom punch** `fov *= 1 − 0.05·kick(t)`, the "zoom" motif. Evaluate it at **sub-frame times** so it motion-blurs filmically. 2D layers take it through a global transform uniform.
- **Speed ramps.** Use analytic time remaps `τ(t) = ∫speed`. With piecewise-linear speed, τ is piecewise quadratic, so it stays a pure function. A classic: slow to 0.15× over the last beat before a drop, then snap to 1× on the downbeat.
- **Stutter / beat-repeat:** `τ = s0 + mod(t − s0, len)`, where len is 1/8 or 1/16 beat. Line these up with the audio's own stutters from the analysis data.
- **Frame hold / temporal crunch:** `τ = floor(t·fpsEff)/fpsEff`, with fpsEff 60 → 12 → 6 as P rises.
  - Apply it to scene time, not to lyric typography, which should stay 60 fps and readable.
  - **Don't motion-blur across a hold.**
- **Frame quantization.** At 152 BPM a 1/16 note is 5.92 frames. Quantize every beat event with `frame = round(tBeat·60)`, consistently. Leading the audio by 0–1 frame reads as tighter sync.

### 4.4 Increasing cut density

`tools/gen-edl.ts` reads P, the beat/downbeat grid, section boundaries and lyric word onsets, and writes `data/edl.json`. The file is seeded, deterministic, checked in and hand-editable.

Shot length L(P):

| P | Shot length |
|---|---|
| < .2 | 8 bars |
| < .4 | 2 bars |
| < .6 | 1 bar |
| < .8 | 1 beat |
| < .95 | ½ beat |
| ≥ .95 | ¼ beat (≈6 frames) |

Other rules:
- Single-frame **flash frames** (inverted, white, another scene, text) with probability ∝ P above 0.7.
- **A/B/A/B rhythmic cutback** at 16ths in the final chorus.
- Lyric-hero shots anchor on word onsets.
- **Eye-trace rule:** at high cut rates, keep the focal point near the center across cuts so the frame stays readable.
- Each shot is `{t0, t1, scene, seed, localT0, speedCurve, transition, blurK, preroll}`.
- Plot cuts per bar in `plot-fx` and check that the curve rises monotonically.

### 4.5 Text overload, UI-window spam and kinetic type

- **Window manager layer.**
  - An instanced quad pool with a pre-rendered chrome atlas (title bars, buttons, progress bars, the XP/Win95/macOS error look), drawn once with canvas-2D at load.
  - Contents are canvas textures, re-rastered only when their content changes. Budget: ≤20 uploads of ≤512² per frame at 4K.
  - The spawn list is precomputed in the EDL/timeline with Poisson rate λ(P) per beat, so it's deterministic.
  - Pop-in is a 2-frame overshoot; windows jitter ∝ P.
  - At the climax, windows **cascade** (+24 vpx each), and dragged-window smear comes from feedback inside the window mask.
  - Copy ideas: "p(doom) = 0.97", "Are you sure?" with OK/OK, 99% progress bars.
- **Kinetic lyric behaviors** are pure functions `f(word, tLocal, P)` driven by `data/words.json` (`{w, t0, t1, line, stress}` from forced alignment):
  - **slam**: scale 3→1 over 2 frames, with a 1-frame white flash on t0
  - **type-on** at syllable rate
  - **per-glyph jitter** ∝ P
  - **stretch-to-fill** on sustained notes: width ∝ (t−t0)/(t1−t0)
  - **echo stamps** into feedback
  - **glyph substitution**/leet at P > .6 (check font coverage)
  - **weight punch** on kick, using pre-instanced static weights. Make them with `fonttools varLib.instancer` via `uvx fonttools`, because troika and MSDF can't animate variable axes.
  - **SDF erosion/melt**: threshold ± noise·P
- **Cost:** the MSDF instanced path handles 10k glyphs for well under 1 ms. Text is composited **after** motion blur and most glitch passes. Datamosh deliberately includes it, so the text melts.

### 4.6 Palette decay

- Scenes emit colors through a **global palette ramp texture** (semantic indices), not hard-coded RGB.
- The final grade pass uses 3D LUTs (32³, generated procedurally in JS or loaded as `.cube` via three's `LUTCubeLoader`), interpolated by stage: `mix(LUT_i(c), LUT_{i+1}(c), fract(P·3))`. The stages are:
  1. Clean 3–5-color brand palette.
  2. Oversaturated clipped neon.
  3. Posterized 8–16 colors with blue-noise/Bayer dither.
  4. 1-bit, thermal, inverted, channel-collapse.
- Extras: hue drift, channel swaps on downbeats, and posterize levels 256 → 4.
- Cost is one pass, which is trivial.

### 4.7 Motion blur by sub-frame accumulation

- Render K sub-frames at `t + (k+0.5)/K · shutter/fps`, with shutter 0.5 (180°) and a jittered sub-pixel projection (Halton 2,3 per sub-frame gives free AA).
- Add them in **linear HDR** into RGBA16F with additive blending (weight 1/K). Then run bloom, grain, glitch, CRT, grade and text **once**.
- Clamp sub-frame times to `[shot.t0, shot.t1)` and to the current hold interval, so **there's no blur across cuts or frame holds**. Flashes and triggers are evaluated at the frame's center time.
- **Adaptive K** per shot: `blurK` in the EDL, or auto from the max screen speed, `K = clamp(ceil(v_px/2), 1, 32)`. Use K=1 for static or text shots and 8–16 for fast camera moves. Preview always uses K=1.
- **Cost is K × scene.** The bench scene with K=16 costs ≈18 ms at 1080p and ≈77 ms at 4K. A cheap fallback is 4 sub-frames plus a per-pixel velocity-buffer blur (McGuire).

### 4.8 Shader ink/paint vs clean vector

- **Clean:** 2D SDF primitives in fragment shaders (iq's set), three `Line2` fat lines, and canvas paths. Crisp, cheap and graphic.
- **Ink:**
  - domain-warp the SDF with fbm
  - **boil**: quantize the noise time to 12 fps for a hand-drawn jitter
  - bleed: blur the mask, then threshold with noise
  - paper texture multiply
  - edge darkening: difference of blurred masks
  - anisotropic **Kuwahara** on the frame (r = 6 ≈ 1–3 ms at 1080p) for a painted look
  - brush strokes as instanced stamp splats along paths, or **p5.brush baked to sprite sheets offline**
- **Escalation lever:** the wobble amplitude, boil fps, bleed and Kuwahara radius are all FX-schedule fields. The arc can go from clean "aligned" vector to smeared ink, or the reverse.

---

## 5. Pipeline

### 5.1 Repo layout

```
pdoom-1/                         (git init first; not a repo today)
  song.wav lyrics.md research/
  video/
    package.json                 three@0.186 troika-three-text vite@8 typescript electron@44(dev) playwright-core(dev)
    index.html                   preview app
    src/engine/
      clock.ts                   t → {frame, bar, beat, beatPhase, section}
      panic.ts fxSchedule.ts     P(t), envelopes, FxState (§4.0)
      audio.ts                   loads data/*.json (no WebAudio analysis at render time)
      edl.ts                     t → shot (scene, localT, seed, params)
      rng.ts                     hash PRNG; Math.random is lint-banned
      renderer.ts                WebGLRenderer, RT pool, sub-frame accumulation, velocity MRT
      post/                      feedback droste mosh sort jpeg crt grade grain bloom yuvpack (one .ts + .glsl each)
      text/                      msdf glyphs, canvas windows, lyric behaviors
      capture.ts                 render-mode loop → sink (Electron) | WebSocket (Chrome fallback)
    src/scenes/<id>/index.ts     one folder per scene; owned by one agent
    src/preview/                 scrubber, HUD, hotkeys
    data/ analysis.json words.json sections.json panic.json edl.json
    tools/ render.ts still.ts sheet.ts bench.ts gen-edl.ts golden.ts electron-main.cjs plot-fx.py
    out/                         (gitignored) seg/ stills/ sheets/
```

### 5.2 Scene contract (freeze it early)

```ts
export interface FrameInfo { t:number; frame:number; sub:number; localT:number; shot:Shot; beat:number; beatPhase:number;
  bar:number; section:string; P:number; fx:FxState; env:{kick:number;snare:number;hat:number;rms:number;flux:number};
  words:ActiveWord[]; }
export interface Scene {
  id:string; preroll?:number /*s; only if stateful*/; blurK?:number;
  setup(ctx:SceneCtx):Promise<void>;          // load and await ALL assets/text.sync() here
  render(f:FrameInfo, target:THREE.WebGLRenderTarget):void;  // pure; writes linear HDR; no global state
  dispose():void; }
```

Rules for every scene:
- Never call `Date`, `performance.now` or `Math.random`, and don't use rAF or three's `Clock`.
- Keep state only through the engine's feedback API, with a declared `preroll`.
- Size everything in units of H.
- Budget ≤4 ms per sub-frame at 4K, measured with `npm run bench -- --scene id`.
- Each scene is reachable standalone at `?scene=id&t=…` and via `npm run still -- --scene id --t …`, so agents can work without the EDL.

### 5.3 Preview (human)

1. Run `npm run dev` and open `localhost:5173` in desktop Chrome.
2. Audio plays through an `<audio>` element, and t follows `audio.currentTime`. This is the only place wall-clock time is used.
3. Controls:
   - a timeline with section, lyric, cut and P lanes
   - J/K/L, `,`/`.` to step frames, `[`/`]` to jump bars
   - loop region, a 0.5× resolution toggle, and K=1 forced
   - an FX HUD
4. Vite HMR swaps scene modules. Because frames are pure f(t), the picture updates in place.
5. Scrubbing into feedback shots replays pre-roll from the shot start at preview resolution.

### 5.4 Claude's debug loop (text in, images out)

- `npm run still -- --t 81.5,82.0 --w 960` writes PNGs, which Claude reads with its image-capable Read tool.
- `npm run sheet -- --from 80 --to 96 --step 0.25` makes a contact sheet with timestamp, lyric word and P burned in.
- `npm run plot-fx` writes the escalation chart.
- `npm run golden` renders about 20 fixed timestamps and compares SHA-256 hashes (bit-exact, as measured in §1.3), which catches unintended engine changes.
- `npm run clip -- --from 80 --to 88 --scale .5` makes a short MP4 with audio for the user.
- Decode QA always uses the BtbN ffmpeg.

### 5.5 Render

Command: `npm run render -- --res 3840x2160 --fps 60 --workers 4 --blur auto --out out/final_4k60.mp4`

1. **Plan.** Frames = 229.6 s × 60 = **13,776**. Split at EDL cut boundaries into about 8–15 s segments, which gives about 20 jobs in a work queue.
   - Cache key: `sha(engineRev, sceneSources[], edlSlice, params)`. Existing matching segments are skipped, so re-rendering after tweaking one scene only redoes its segments.
2. **Workers.** Each worker is an Electron process (hidden window, `use-angle=gl-egl`, asserts NVIDIA). It loads the **Vite-built `dist/`** over a local static server with `?render&from=F0&to=F1`.
   - It runs the pre-roll, then for each frame: sub-frames, post, YUV pack, `readRenderTargetPixels`, then `ff.stdin.write` into a per-segment `hevc_nvenc` process (§2.3).
3. **Concat and mux** (§2.3), then optionally the x264 pass.
4. **Fallback host:** Playwright plus headless Chrome with GL-EGL flags, streaming YUV over WebSocket (§1.2). It is about 5× slower but needs no display.

**GPU and CPU split.** The GPU is one shared device, so workers mainly overlap readback, JS and NVENC with rendering. 4 workers beat 2 when the job is transfer- or NVENC-bound; heavy GPU scenes gain little beyond 2. 10 concurrent `hevc_nvenc` sessions ran fine on driver 615, so the old GeForce session cap is not a constraint here. The 4090 has 2 NVENC engines. The 32 CPU threads go to scene JS (keep it light), optional libx264 (segment-parallel: 4 encodes × 8 threads), and tools.

**Expected full-song times:**

| Scenario | 1080p60 | 4K60 |
|---|---|---|
| Ceiling: Electron ×4 + NVENC p7, cheap scenes (measured) | ≈ 46 s | ≈ 2.9 min |
| Chrome-WS fallback ×4 (measured throughput) | ≈ 83 s | ≈ 5.9 min |
| Realistic: scene ≈2× bench (2.2 / 9.6 ms), post 1 / 4 ms, **avg K=4** | ≈ 2.3 min | ≈ 10 min |
| Same, **avg K=8** | ≈ 4.3 min | ≈ 19 min |
| + optional libx264 slow final (CPU) | + ≈ 14 min | + ≈ 46 min |

### 5.6 Subagents on a shared engine

- **Engine lead (1 agent).** Owns `engine/`, `tools/`, `data/` contracts and `fxSchedule.ts`.
  - Ships the v0 Scene API with a stub scene, `still`, `sheet` and `golden` first.
  - Engine changes by other agents go through the lead.
- **Scene agents (N)**, one per `src/scenes/<id>/`, each in its own worktree (`isolation: "worktree"`). Each brief contains:
  - the time range and section
  - the lyric words
  - the P range and FX stages active there
  - the palette stage and required motifs (Droste screen, windows, p(doom) HUD)
  - the budget

  Each delivers the scene module, declared `preroll`/`blurK`, a bench number and a contact sheet of its range.
- **Typography agent** owns `engine/text/` and the lyric behaviors (a global overlay layer driven by `words.json`).
- **Post/FX agent** owns `engine/post/` against a fixed `FxState` interface, and tests each pass on the golden stills.
- **EDL/integration agent** owns `gen-edl.ts`, the transitions (zoom-through) and whole-song sheet and plot reviews. It merges worktrees and reruns `golden`.
- **Isolation rule:** agents never edit outside their folder. Shared constants live only in `data/*.json` and `fxSchedule.ts`.

### 5.7 Installs (no sudo needed)

- Done: BtbN ffmpeg in `~/.local/opt/ffmpeg-btbn-n9.0` (§2.2).
- In `video/`: `npm i three@0.186 troika-three-text && npm i -D vite@8 typescript electron@44 playwright-core msdf-bmfont-xml`. Electron's postinstall downloads its binary from GitHub.
- Optional: `uvx fonttools` for static weight instances, and `uv run --python 3.12 --with moderngl` for Python tools (3.14 has no moderngl wheel yet).
- bun is not needed. node 24 and npm are enough.
