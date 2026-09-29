// THE RECORD: shared palette, type, and drawing helpers.

export const INK = '#0B0B0B';
export const PAPER = '#ECEAE3';
export const GREY = '#8A8984';
export const RED = '#FF1E1E';
export const W = 1920, H = 1080;

export const SANS = '"Nimbus Sans", sans-serif';
export const NARROW = '"Nimbus Sans Narrow", sans-serif';
export const SERIF = '"Nimbus Roman", serif';
export const MONO = '"Nimbus Mono PS", monospace';

// ---------- utilities ----------

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let r = Math.imul(a ^ (a >>> 15), 1 | a);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function makeNoise(seed) {
  const r = rng(seed);
  const p = new Float32Array(256 * 256).map(() => r());
  const at = (x, y) => p[((y & 255) << 8) | (x & 255)];
  const sm = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  };
}

export const BAYER = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];
export const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];

// 1-bit ordered dither of a greyscale source canvas, drawn chunky onto g.
export function dither(g, src, x, y, w, h, { ink = INK, paper = PAPER, contrast = 1.25 } = {}) {
  const sw = src.width, sh = src.height;
  const s = src.getContext('2d').getImageData(0, 0, sw, sh);
  const out = new ImageData(sw, sh);
  const [ir, ig, ib] = hex(ink), [pr, pg, pb] = hex(paper);
  for (let j = 0; j < sh; j++) for (let i = 0; i < sw; i++) {
    const k = (j * sw + i) * 4;
    const v = Math.min(1, Math.max(0, (s.data[k] / 255 - 0.5) * contrast + 0.5));
    const on = v > (BAYER[(j & 7) * 8 + (i & 7)] + 0.5) / 64;
    out.data[k] = on ? pr : ir;
    out.data[k + 1] = on ? pg : ig;
    out.data[k + 2] = on ? pb : ib;
    out.data[k + 3] = 255;
  }
  const tmp = canvas(sw, sh);
  tmp.getContext('2d').putImageData(out, 0, 0);
  g.save();
  g.imageSmoothingEnabled = false;
  g.drawImage(tmp, x, y, w, h);
  g.restore();
}

// Horizontal slice tears: bands of the frame shoved sideways, like a cut landing on a hit.
export function tear(g, seed, n, maxShift, y0 = 0, y1 = H) {
  const copy = canvas(W, H);
  copy.getContext('2d').drawImage(g.canvas, 0, 0);
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const y = y0 + r() * (y1 - y0);
    const h = 6 + r() * 60;
    g.drawImage(copy, 0, y, W, h, (r() - 0.5) * 2 * maxShift, y, W, h);
  }
}

// Blown-out band: a strip pushed to paper white, like an 808 clipping.
export function clipBand(g, y, h) {
  g.save();
  g.globalCompositeOperation = 'lighten';
  box(g, 0, y, W, h, PAPER);
  g.restore();
}

export function speckle(g, seed, density = 0.0009) {
  const r = rng(seed);
  for (let i = 0; i < W * H * density; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(11,11,11,0.5)' : 'rgba(236,234,227,0.5)';
    const s = r() < 0.9 ? 1 : 1.5;
    g.fillRect(r() * W, r() * H, s, s);
  }
}

export function text(g, str, x, y, { font = SANS, size = 40, weight = 'bold', color = INK, align = 'left', sx = 1, rot = 0, base = 'alphabetic' } = {}) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(sx, 1);
  g.font = `${weight} ${size}px ${font}`;
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = base;
  g.fillText(str, 0, 0);
  g.restore();
}

export function box(g, x, y, w, h, fill) {
  g.fillStyle = fill;
  g.fillRect(x, y, w, h);
}

export function outline(g, x, y, w, h, color, lw = 3) {
  g.save();
  g.strokeStyle = color;
  g.lineWidth = lw;
  g.strokeRect(x, y, w, h);
  g.restore();
}

// Red rubber stamp.
export function rubber(g, str, x, y, { size = 44, rot = -0.12, color = RED } = {}) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.font = `bold ${size}px ${NARROW}`;
  const w = g.measureText(str).width;
  g.strokeStyle = color;
  g.lineWidth = 5;
  g.strokeRect(-w / 2 - 14, -size * 0.85, w + 28, size * 1.1);
  g.fillStyle = color;
  g.textAlign = 'center';
  g.fillText(str, 0, 0);
  g.restore();
}

// The date stamp that runs through the whole film.
export function stamp(g, date, color, line) {
  text(g, date, 48, 64, { font: MONO, size: 30, color });
  text(g, line, 48, 98, { font: MONO, size: 20, weight: 'normal', color });
}

// ---------- imaging sources (greyscale, small; dithered when drawn) ----------

export function grey(v) {
  const c = Math.round(v * 255);
  return `rgb(${c},${c},${c})`;
}

export function groundTexture(g, w, h, seed, base, amp) {
  const n = makeNoise(seed);
  const img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = base + amp * (n(x / 20, y / 20) - 0.5) + amp * 0.6 * (n(x / 2.5, y / 2.5) - 0.5);
    const k = (y * w + x) * 4;
    img.data[k] = img.data[k + 1] = img.data[k + 2] = v * 255;
    img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
}

export function satWaterPlant(seed) {
  const c = canvas(640, 400), g = c.getContext('2d');
  groundTexture(g, 640, 400, seed, 0.5, 0.14);
  g.strokeStyle = grey(0.82); g.lineWidth = 9;
  g.beginPath(); g.moveTo(0, 330); g.lineTo(640, 300); g.moveTo(410, 0); g.lineTo(440, 400); g.stroke();
  for (const [x, y, r] of [[100, 105, 60], [240, 100, 60], [100, 240, 60], [240, 235, 60]]) {
    g.fillStyle = grey(0.15); g.beginPath(); g.arc(x + 6, y + 6, r + 6, 0, 7); g.fill();
    g.fillStyle = grey(0.9); g.beginPath(); g.arc(x, y, r + 6, 0, 7); g.fill();
    g.fillStyle = grey(0.27); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    g.strokeStyle = grey(0.4); g.lineWidth = 2;
    for (let i = 1; i < 4; i++) { g.beginPath(); g.arc(x, y, (r * i) / 4, 0, 7); g.stroke(); }
    g.strokeStyle = grey(0.95); g.lineWidth = 5;
    const a = (x * 7 + y) % 6;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + r * Math.cos(a), y + r * Math.sin(a)); g.stroke();
    g.fillStyle = grey(0.95); g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill();
  }
  for (let i = 0; i < 4; i++) {
    g.fillStyle = grey(0.2); g.fillRect(460 + i * 40, 50, 32, 180);
    g.fillStyle = grey(0.5); for (let j = 0; j < 8; j++) g.fillRect(465 + i * 40, 62 + j * 21, 22, 6);
  }
  for (const [x, y, w, h] of [[320, 340, 70, 40], [500, 320, 100, 60], [330, 170, 50, 80]]) {
    g.fillStyle = grey(0.1); g.fillRect(x + 8, y + 8, w, h);
    g.fillStyle = grey(0.88); g.fillRect(x, y, w, h);
  }
  g.strokeStyle = grey(0.75); g.lineWidth = 3;
  g.beginPath(); g.moveTo(166, 100); g.lineTo(174, 100); g.moveTo(300, 170); g.lineTo(460, 140); g.stroke();
  return c;
}

export function satDataCenter(seed) {
  const c = canvas(640, 360), g = c.getContext('2d');
  groundTexture(g, 640, 360, seed, 0.6, 0.35);
  g.strokeStyle = grey(0.88); g.lineWidth = 8;
  g.beginPath(); g.moveTo(0, 196); g.lineTo(640, 206); g.stroke();
  const r = rng(seed);
  for (let i = 0; i < 6; i++) {
    const x = 18 + i * 104, y = 26, w = 88, h = 150;
    g.fillStyle = grey(0.08); g.fillRect(x + 7, y + 7, w, h);
    if (i < 4) {
      g.fillStyle = grey(0.93); g.fillRect(x, y, w, h);
      g.fillStyle = grey(0.32);
      for (let a = 0; a < 5; a++) for (let b = 0; b < 13; b++) g.fillRect(x + 8 + a * 16, y + 8 + b * 11, 8, 6);
    } else {
      g.fillStyle = grey(0.48); g.fillRect(x, y, w, h);
      g.strokeStyle = grey(0.96); g.lineWidth = 2;
      for (let a = 0; a <= 6; a++) { g.beginPath(); g.moveTo(x + (a * w) / 6, y); g.lineTo(x + (a * w) / 6, y + h); g.stroke(); }
      for (let b = 0; b <= 10; b++) { g.beginPath(); g.moveTo(x, y + (b * h) / 10); g.lineTo(x + w, y + (b * h) / 10); g.stroke(); }
    }
  }
  g.fillStyle = grey(0.22); g.fillRect(40, 240, 180, 96);
  g.strokeStyle = grey(0.9); g.lineWidth = 2;
  for (let a = 0; a < 8; a++) for (let b = 0; b < 4; b++) g.strokeRect(50 + a * 21, 250 + b * 21, 12, 12);
  for (let i = 0; i < 3; i++) {
    const x = 460 + i * 50, y = 70 + r() * 50;
    g.strokeStyle = grey(0.05); g.lineWidth = 4;
    g.beginPath(); g.moveTo(x + 6, y + 6); g.lineTo(x + 126, y - 34); g.stroke();
    g.strokeStyle = grey(0.98); g.lineWidth = 3;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 120, y - 40); g.stroke();
  }
  g.fillStyle = grey(0.38);
  for (let i = 0; i < 40; i++) g.fillRect(250 + r() * 380, 230 + r() * 120, 6 + r() * 20, 3 + r() * 6);
  return c;
}


// ---------- extra components ----------

// A sheet of paper with a hard offset shadow.
export function sheet(g, x, y, w, h, { fill = PAPER, shadow = INK, off = 10, rot = 0 } = {}) {
  g.save();
  g.translate(x + w / 2, y + h / 2);
  g.rotate(rot);
  box(g, -w / 2 + off, -h / 2 + off, w, h, shadow);
  box(g, -w / 2, -h / 2, w, h, fill);
  g.restore();
}

// Redaction bars: a paragraph of black blocks (intentional, not placeholder text).
export function redacted(g, x, y, w, rows, seed, { color = INK, lh = 34, bh = 20 } = {}) {
  const r = rng(seed);
  for (let i = 0; i < rows; i++) {
    let cx = x;
    const end = x + w * (i === rows - 1 ? 0.3 + r() * 0.4 : 0.85 + r() * 0.15);
    while (cx < end) {
      const ww = Math.min(end - cx, 40 + r() * 170);
      box(g, cx, y + i * lh, ww, bh, color);
      cx += ww + 12;
    }
  }
}

// Geometric identicon (for anonymous accounts).
export function identicon(g, x, y, s, seed, color = INK, bg = PAPER) {
  const r = rng(seed);
  box(g, x, y, s, s, bg);
  const c = s / 5;
  for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) {
    if (r() < 0.5) {
      box(g, x + i * c, y + j * c, c, c, color);
      box(g, x + (4 - i) * c, y + j * c, c, c, color);
    }
  }
}

// Recursive frame-in-frame (a literal zoom): draws src into itself `depth` times toward (cx, cy).
export function droste(g, src, depth, scale = 0.62, cx = W / 2, cy = H / 2, border = PAPER) {
  let s = 1;
  for (let i = 0; i < depth; i++) {
    const w = W * s, h = H * s;
    const x = cx - (cx * s), y = cy - (cy * s);
    if (i > 0) box(g, x - 6, y - 6, w + 12, h + 12, border);
    g.drawImage(src, x, y, w, h);
    s *= scale;
  }
}

// Padlock glyph.
export function lock(g, x, y, s, open, color = INK) {
  g.save();
  g.translate(x, y);
  g.strokeStyle = color;
  g.lineWidth = s * 0.14;
  g.beginPath();
  const lift = open ? -s * 0.28 : 0;
  g.arc(open ? s * 0.18 : 0, -s * 0.18 + lift, s * 0.28, Math.PI, 0);
  g.lineTo(s * 0.28 + (open ? s * 0.18 : 0), -s * 0.18 + lift + (open ? s * 0.1 : s * 0.12));
  if (!open) { g.moveTo(-s * 0.28, -s * 0.18); g.lineTo(-s * 0.28, -s * 0.06); }
  g.stroke();
  box(g, -s * 0.42, -s * 0.06, s * 0.84, s * 0.62, color);
  g.restore();
}

// Horizontal timeline with labelled ticks. items: [{x01, label, sub, color}]
export function timeline(g, x, y, w, items, { color = INK, lw = 6 } = {}) {
  box(g, x, y - lw / 2, w, lw, color);
  for (const it of items) {
    // tier 1 moves the label a row further out on both sides, so close markers don't collide.
    // below: label and sub both hang under the line, a row lower than the other subs (tick drawn downward only).
    const px = x + it.x01 * w, d = (it.tier || 0) * 40, c = it.color || color;
    if (it.below) {
      box(g, px - 3, y - 30, 6, 100, c);
      if (it.label) text(g, it.label, px, y + 112, { font: MONO, size: it.size || 26, color: c, align: 'center' });
      if (it.sub) text(g, it.sub, px, y + 140, { font: MONO, size: 20, weight: 'normal', color: c, align: 'center' });
      continue;
    }
    box(g, px - 3, y - 30 - d, 6, 60 + 2 * d, c);
    if (it.label) text(g, it.label, px, y - 44 - d, { font: MONO, size: it.size || 26, color: c, align: 'center' });
    if (it.sub) text(g, it.sub, px, y + 72 + d, { font: MONO, size: 20, weight: 'normal', color: c, align: 'center' });
  }
}

// Wrap text into lines within width (for real sentences only).
export function wrap(g, str, x, y, maxW, { font = MONO, size = 28, weight = 'bold', color = INK, lh = 1.3 } = {}) {
  g.save();
  g.font = `${weight} ${size}px ${font}`;
  g.fillStyle = color;
  const words = str.split(' ');
  let line = '', yy = y;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (g.measureText(test).width > maxW && line) { g.fillText(line, x, yy); line = w; yy += size * lh; }
    else line = test;
  }
  if (line) g.fillText(line, x, yy);
  g.restore();
  return yy;
}

// Greyscale source: open sea with swell texture, for maritime frames.
export function seaSource(seed, w = 640, h = 360) {
  const c = canvas(w, h), g = c.getContext('2d');
  const n = makeNoise(seed);
  const img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = 0.3 + 0.12 * Math.sin(x * 0.09 + n(x / 30, y / 30) * 6) + 0.1 * (n(x / 3, y / 6) - 0.5);
    const k = (y * w + x) * 4;
    img.data[k] = img.data[k + 1] = img.data[k + 2] = v * 255;
    img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

// Greyscale source: a generic data-centre campus at an oblique aerial angle (illustration, not a real site).
export function campusSource(seed, w = 640, h = 360) {
  const c = canvas(w, h), g = c.getContext('2d');
  groundTexture(g, w, h, seed, 0.66, 0.3);
  const r = rng(seed);
  g.save();
  g.transform(1, 0, -0.35, 0.6, 120, 60);
  for (let i = 0; i < 8; i++) {
    const x = 20 + (i % 4) * 150, y = 30 + Math.floor(i / 4) * 210;
    g.fillStyle = grey(0.1); g.fillRect(x + 12, y + 12, 128, 180);
    g.fillStyle = grey(i < 6 ? 0.94 : 0.5); g.fillRect(x, y, 128, 180);
    g.fillStyle = grey(0.35);
    if (i < 6) for (let a = 0; a < 6; a++) for (let b = 0; b < 14; b++) g.fillRect(x + 8 + a * 20, y + 8 + b * 12, 10, 6);
  }
  g.restore();
  // Transmission lines and a substation.
  g.strokeStyle = grey(0.05); g.lineWidth = 2;
  for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(0, 300 + k * 10); g.lineTo(w, 250 + k * 10 + r() * 6); g.stroke(); }
  g.fillStyle = grey(0.2); g.fillRect(520, 270, 90, 70);
  return c;
}

// ---------- element animation ----------
// A frame function receives an anim object `a`. Storyboard stills get FULL (everything already in place);
// the motion engine passes makeAnim(...) so elements enter on words and beats.
const easeOut = (u) => 1 - Math.pow(1 - Math.min(1, Math.max(0, u)), 3);
export const FULL = { t: 1e9, start: 0, local: 1e9, in: () => 1, w: () => -1e9, beat: () => -1e9, full: true };
export function makeAnim(ctx, t, start, end) {
  const words = [];
  for (const l of ctx.lyrics.lines) for (const w of l.words || []) if (w.start >= start - 0.3 && w.start < end) words.push(w);
  const bp = ctx.audio.beat_period, b0 = ctx.audio.tempo.first_beat;
  return {
    t, start, local: t - start, full: false, ctx,
    // Eased 0→1 progress of an entrance starting at time `at` and lasting `dur` seconds.
    in: (at, dur = 0.12) => easeOut((t - at) / dur),
    // Start time of the first sung word matching re (after optional time `from`), or +inf if none.
    w: (re, from = start - 0.3) => { const x = words.find((w) => w.start >= from && re.test(w.w)); return x ? x.start : 1e9; },
    // Time of the n-th beat at or after the shot start.
    beat: (n) => b0 + (Math.ceil((start - b0) / bp - 1e-6) + n) * bp,
  };
}
// Live motion: while the motion engine renders a layered shot, every element that has landed keeps moving,
// scaled by the song's energy at that moment (0 = still: quiet parts, band stops, cold frames).
let LIVE = null, liveIdx = 0;
export function setLive(v) { LIVE = v; liveIdx = 0; }
const lhash = (n) => { let x = Math.imul(n | 0, 2654435761) ^ 0x9e3779b9; x = Math.imul(x ^ (x >>> 15), 2246822519); return ((x ^ (x >>> 13)) >>> 0) / 4294967296; };
// Transform for element k after it has landed. big = hero element (re-slams on the kick).
function liveMotion(g, cx, cy, big) {
  if (!LIVE || LIVE.energy <= 0) return;
  const k = liveIdx++, e = Math.pow(LIVE.energy, 1.45), c = LIVE.ctx, t = LIVE.t, f = Math.floor(t * 30);
  // Soft threshold: only clear hits move things (small ones are ignored).
  const hit = (p, th) => Math.max(0, p - th) / (1 - th);
  const kick = hit(c.pulse('kick', t, 0.1), 0.2), snare = hit(c.pulse('snare', t, 0.08), 0.2), hat = hit(c.pulse('hat', t, 0.05), 0.3);
  const s = 1 + e * (big ? 0.105 : 0.038) * kick;
  const dx = (lhash(k * 97 + f) - 0.5) * e * (52 * snare + 10 * hat) + Math.sin(t * 2.1 + k) * e * 7;
  const dy = (lhash(k * 131 + f) - 0.5) * e * (27 * snare + 7 * hat);
  const rot = (lhash(k * 173 + f) - 0.5) * e * 0.045 * snare;
  g.translate(cx + dx, cy + dy); g.rotate(rot); g.scale(s, s); g.translate(-cx, -cy);
}

// Draw fn() scaled from `from`× down to 1× about (cx, cy) as u goes 0→1. Nothing is drawn at u = 0.
export function slam(g, u, cx, cy, fn, from = 1.35) {
  if (u <= 0) return;
  g.save();
  if (u >= 1) liveMotion(g, cx, cy, from >= 1.5);
  const s = from + (1 - from) * u;
  g.translate(cx, cy); g.scale(s, s); g.translate(-cx, -cy);
  g.globalAlpha = Math.min(1, u * 3);
  fn();
  g.restore();
}
// Draw fn() clipped to a rect that grows from the left (or top) as u goes 0→1.
export function wipe(g, u, x, y, w, h, fn, vertical = false) {
  if (u <= 0) return;
  g.save();
  if (u >= 1 && w * h < W * H * 0.6) liveMotion(g, x + w / 2, y + h / 2, false);
  g.beginPath();
  vertical ? g.rect(x, y, w, h * u) : g.rect(x, y, w * u, h);
  g.clip();
  fn();
  g.restore();
}
// Cache an expensive static layer (e.g. a dithered image) by key.
const MEMO = new Map();
export function memo(key, w, h, fn) {
  if (!MEMO.has(key)) { const c = canvas(w, h); fn(c.getContext('2d')); MEMO.set(key, c); }
  return MEMO.get(key);
}

// Screamed type: per-letter jitter, scale and echo copies driven by `level` (0 = still, 1 = full scream).
// visible(i) can hide letters (e.g. words not yet sung). Returns nothing; draws at the current transform.
export function screamText(g, str, x, y, { font = NARROW, size = 150, weight = 'bold', color = INK, echo = [RED, PAPER], sx = 1 } = {}, level = 0, seed = 0, visible = () => true) {
  g.save();
  g.font = `${weight} ${size}px ${font}`;
  const widths = [...str].map((ch) => g.measureText(ch).width * sx);
  g.restore();
  const r = rng(seed);
  const jit = () => (r() - 0.5) * 2;
  const draw = (col, ox, oy, k) => {
    let cx = x;
    [...str].forEach((ch, i) => {
      const w = widths[i];
      if (ch !== ' ' && visible(i)) {
        const s = 1 + level * 0.5 * Math.abs(jit());
        g.save();
        g.translate(cx + w / 2 + ox + jit() * level * size * 0.12, y + oy + jit() * level * size * 0.18);
        g.rotate(jit() * level * 0.22);
        g.scale(s * sx, s);
        g.font = `${weight} ${size}px ${font}`;
        g.fillStyle = col;
        g.textAlign = 'center';
        g.fillText(ch, 0, 0);
        g.restore();
      }
      cx += w;
    });
  };
  if (level > 0.05) echo.forEach((col, k) => draw(col, jit() * level * size * 0.3, jit() * level * size * 0.15, k));
  draw(color, 0, 0, 99);
}

// Screamed type, v2: the words sit in place and the scream explodes out of them. Echo copies burst outward
// in waves, spike shards shoot out of each letter, and the letters glitch in hard steps (slice shifts, not drift).
// level 0 = static (storyboard); age = seconds since the shout began.
export function screamBurst(g, str, x, y, { font = NARROW, size = 150, weight = 'bold', color = INK, echo = [PAPER, INK, RED], spike = INK } = {}, level = 0, age = 0, seed = 0, visible = () => true) {
  const tmp = canvas(W, H), s = tmp.getContext('2d');
  s.font = `${weight} ${size}px ${font}`;
  const widths = [...str].map((ch) => s.measureText(ch).width);
  const total = widths.reduce((p, c) => p + c, 0);
  const cx = x + total / 2, cy = y - size * 0.36;
  const r = rng(seed);
  const jit = () => (r() - 0.5) * 2;
  const letters = (ctx2, col, ox = 0, oy = 0) => {
    let px = x;
    [...str].forEach((ch, i) => {
      if (ch !== ' ' && visible(i)) {
        ctx2.save();
        ctx2.font = `${weight} ${size}px ${font}`;
        ctx2.fillStyle = col;
        const step = level > 0.05 ? Math.round(jit() * 2) * size * 0.05 * level : 0;
        ctx2.fillText(ch, px + ox + step, y + oy + (level > 0.05 ? Math.round(jit()) * size * 0.04 * level : 0));
        ctx2.restore();
      }
      px += widths[i];
    });
  };
  if (level > 0.05) {
    // Spike shards: thin wedges from each visible letter's centre, pointing outward.
    let px = x;
    [...str].forEach((ch, i) => {
      const lc = px + widths[i] / 2;
      px += widths[i];
      if (ch === ' ' || !visible(i)) return;
      const n = 4 + Math.floor(r() * 6 * level);
      for (let k = 0; k < n; k++) {
        const ang = Math.atan2(cy - H / 2, lc - W / 2) * 0 + r() * Math.PI * 2;
        const len = size * (0.8 + r() * 4.5) * level;
        const wdt = size * (0.03 + r() * 0.07);
        g.save();
        g.translate(lc, cy);
        g.rotate(ang);
        g.fillStyle = k % 3 === 0 ? RED : spike;
        g.beginPath();
        g.moveTo(size * 0.15, -wdt);
        g.lineTo(size * 0.15 + len, 0);
        g.lineTo(size * 0.15, wdt);
        g.closePath();
        g.fill();
        g.restore();
      }
    });
    // Echo waves: copies scaled outward from the words' centre, restarting every 0.24 s.
    for (let j = 3; j >= 1; j--) {
      const phase = ((age + j * 0.08) % 0.24) / 0.24;
      const sc = 1 + phase * 2.6 * level * (0.6 + j * 0.3);
      g.save();
      g.translate(cx + jit() * size * 0.1 * level, cy + jit() * size * 0.06 * level);
      g.scale(sc, sc);
      g.translate(-cx, -cy);
      letters(g, echo[(j + Math.floor(age / 0.08)) % echo.length]);
      g.restore();
    }
  }
  // The words themselves, in place, sliced into bands that shift sideways.
  letters(s, color);
  if (level > 0.05) {
    const top = y - size, h = size * 1.2, bands = 5 + Math.floor(r() * 5);
    for (let b = 0; b < bands; b++) {
      const by = top + (b / bands) * h, bh = h / bands + 1;
      const dx = (r() < 0.45 ? 0 : jit()) * size * 0.6 * level;
      g.drawImage(tmp, 0, by, W, bh, dx, by, W, bh);
    }
  } else g.drawImage(tmp, 0, 0);
}
