// Renderer: drives a runtime.js page in headless Chrome on the RTX 4090.
//
//   node tools/render/render.mjs --page video/index.html \
//     [--stills 35.2,44.7,160] [--clip 33.0:41.5] [--fps 30] [--w 1920 --h 1080] [--out video/out]
//
// Stills are written as PNG (still-<t>.png). A clip is written as clip-<a>-<b>.mp4
// (H.264 via NVENC, with the matching slice of song.wav muxed in).
//   --master   upload master: JPEG q100 frames, pixel-doubled to 3840x2160 (nearest), HEVC 10-bit NVENC cq 14
//              (-tier high so NVENC doesn't cap the bitrate), AAC 384k, faststart. Named with --name.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FFMPEG = fs.existsSync(`${process.env.HOME}/.local/opt/ffmpeg-btbn-n9.0/bin/ffmpeg`)
  ? `${process.env.HOME}/.local/opt/ffmpeg-btbn-n9.0/bin/ffmpeg`
  : 'ffmpeg';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1]?.startsWith('--') ? true : all[i + 1] ?? true]);
    return acc;
  }, []),
);
if (!args.page) {
  console.error('usage: render.mjs --page video/index.html [--stills t1,t2] [--clip a:b] [--fps 30] [--out dir]');
  process.exit(1);
}
const W = +(args.w || 1920);
const H = +(args.h || 1080);
const FPS = +(args.fps || 30);
const outDir = path.resolve(ROOT, args.out || path.join(path.dirname(args.page), 'out'));
fs.mkdirSync(outDir, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.wav': 'audio/wav', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ttf': 'font/ttf',
  '.otf': 'font/otf', '.woff2': 'font/woff2', '.glsl': 'text/plain', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: false,
  args: ['--headless=new', '--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
});
const cleanup = async () => { await browser.close().catch(() => {}); server.close(); };

try {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log(`[page ${m.type()}]`, m.text()); });
  page.on('pageerror', (e) => console.log('[page error]', e.message));

  const gpu = await page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl2');
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
  });
  if (!/NVIDIA/.test(gpu)) throw new Error(`Not on the NVIDIA GPU (renderer: ${gpu}); refusing to render on SwiftShader.`);

  const url = new URL(`${base}/${args.page}`);
  url.searchParams.set('render', '1');
  url.searchParams.set('w', String(W));
  url.searchParams.set('h', String(H));
  await page.goto(url.href);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });

  const draw = (t) => page.evaluate(async (t) => { await window.__frame(t); }, t);
  const shot = (type) => page.screenshot({ type, quality: type === 'jpeg' ? (args.master ? 100 : 95) : undefined, clip: { x: 0, y: 0, width: W, height: H } });

  if (args.stills) {
    for (const s of String(args.stills).split(',')) {
      const t = +s;
      await draw(t);
      const file = path.join(outDir, `still-${t.toFixed(2)}.png`);
      fs.writeFileSync(file, await shot('png'));
      console.log('wrote', path.relative(ROOT, file));
    }
  }

  if (args.clip) {
    const [a, b] = String(args.clip).split(':').map(Number);
    const n = Math.round((b - a) * FPS);
    const file = path.join(outDir, args.name ? `${args.name}.mp4` : `clip-${a}-${b}.mp4`);
    const venc = args.master
      ? ['-vf', 'scale=3840:2160:flags=neighbor', '-c:v', 'hevc_nvenc', '-profile:v', 'main10', '-pix_fmt', 'p010le', '-preset', 'p7', '-tune', 'hq', '-rc', 'vbr', '-cq', '14', '-b:v', '0', '-tier', 'high', '-level', '6.2', '-tag:v', 'hvc1', '-c:a', 'aac', '-b:a', '384k']
      : ['-c:v', 'h264_nvenc', '-preset', 'p7', '-tune', 'hq', '-rc', 'vbr', '-cq', '18', '-b:v', '0', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '256k'];
    const ff = spawn(FFMPEG, [
      '-y', '-loglevel', 'error',
      '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-ss', String(a), '-t', String(b - a), '-i', path.join(ROOT, 'song.wav'),
      '-map', '0:v', '-map', '1:a',
      ...venc, '-shortest', '-movflags', '+faststart', file,
    ], { stdio: ['pipe', 'inherit', 'inherit'] });
    const ffDone = new Promise((res, rej) => ff.on('exit', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`)))));
    let ffDead = false;
    ff.on('exit', () => { ffDead = true; });
    const t0 = Date.now();
    for (let i = 0; i < n; i++) {
      if (ffDead) throw new Error('ffmpeg exited early');
      await draw(a + i / FPS);
      const buf = await shot('jpeg');
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      if (i % 60 === 0) process.stdout.write(`\rframe ${i}/${n}`);
    }
    ff.stdin.end();
    await ffDone;
    console.log(`\rwrote ${path.relative(ROOT, file)} (${n} frames, ${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  }
} finally {
  await cleanup();
}
