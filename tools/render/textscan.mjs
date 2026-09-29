// Finds overlapping text: hooks fillText, records each string's box per canvas, and reports intersecting pairs.
//   node tools/render/textscan.mjs --page "video/index.html?motion=1" --from 0 --to 229.6 --step 0.25
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
  if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1]?.startsWith('--') ? true : all[i + 1] ?? true]); return acc; }, []));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.wav': 'audio/wav', '.png': 'image/png', '.ttf': 'font/ttf', '.otf': 'font/otf', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: false,
  args: ['--headless=new', '--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', (e) => console.log('[page error]', e.message));
await page.addInitScript(() => {
  const P = CanvasRenderingContext2D.prototype, orig = P.fillText;
  window.__boxes = new Map();
  P.fillText = function (s, x, y, mw) {
    const str = String(s).trim();
    if (str && this.globalAlpha > 0.35) {
      const m = this.measureText(s), T = this.getTransform();
      const x0 = x - m.actualBoundingBoxLeft, x1 = x + m.actualBoundingBoxRight, y0 = y - m.actualBoundingBoxAscent, y1 = y + m.actualBoundingBoxDescent;
      const pts = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([a, b]) => [T.a * a + T.c * b + T.e, T.b * a + T.d * b + T.f]);
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      const size = +(/(\d+(\.\d+)?)px/.exec(this.font)?.[1] || 0) * Math.hypot(T.a, T.b);
      let list = window.__boxes.get(this.canvas); if (!list) window.__boxes.set(this.canvas, list = []);
      list.push({ s: str.slice(0, 40), size: Math.round(size), bb: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] });
    }
    return orig.call(this, s, x, y, mw);
  };
  window.__overlaps = () => {
    const out = [];
    for (const [cv, list] of window.__boxes) {
      if (cv.width < 1000) continue; // thumbnails / flipbook minis
      for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
        const A = list[i], B = list[j];
        if (A.s === B.s) continue;
        const w = Math.min(A.bb[2], B.bb[2]) - Math.max(A.bb[0], B.bb[0]), h = Math.min(A.bb[3], B.bb[3]) - Math.max(A.bb[1], B.bb[1]);
        if (w <= 2 || h <= 2) continue;
        const aA = (A.bb[2] - A.bb[0]) * (A.bb[3] - A.bb[1]), aB = (B.bb[2] - B.bb[0]) * (B.bb[3] - B.bb[1]);
        const f = (w * h) / Math.min(aA, aB);
        if (f > 0.08) out.push({ a: A.s, as: A.size, b: B.s, bs: B.size, f: +f.toFixed(2) });
      }
    }
    window.__boxes = new Map();
    return out;
  };
});
const url = new URL(`http://127.0.0.1:${server.address().port}/${args.page}`);
url.searchParams.set('render', '1');
await page.goto(url.href);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
const from = +(args.from ?? 0), to = +(args.to ?? 229.6), step = +(args.step ?? 0.25);
const res = [];
for (let t = from; t <= to + 1e-6; t += step) {
  await page.evaluate(() => { window.__boxes = new Map(); });
  await page.evaluate(async (t) => { await window.__frame(t); }, t);
  for (const o of await page.evaluate(() => window.__overlaps())) res.push({ t: +t.toFixed(2), ...o });
}
fs.writeFileSync(args.json || '/dev/stdout', JSON.stringify(res, null, 0) + '\n');
await browser.close(); server.close();
