// THE RECORD: motion engine. Turns the approved stills into the edit, as a pure function of song time.
// Plan (per shot): motion/plan.json. Global rules: freeze on band stops, chaos scales with section + intensity,
// cold shots never shake/tear/clip, rolls drive motion (stutter) rather than flashes.
import { INK, PAPER, RED, W, H, MONO, canvas, box, text, tear, clipBand, BAYER } from '../lib.js';

let plan = null;
export async function loadPlan() {
  plan = await fetch('/video/motion/plan.json').then((r) => r.json());
  return plan;
}

const SECTION_CHAOS = {
  intro: 0.15, verse1: 0.25, pre1: 0.35, chorus1: 0.5, post1: 0.65, verse2: 0.4, pre2: 0.5, chorus2: 0.65, post2: 0.75,
  inst: 0.6, verse3: 0.55, stoptime: 0.05, pre3: 0.7, chorus3: 0.85, bridge: 0.9, bridge2: 0.12, breakdown: 0.6,
  chorus4: 1.0, outro: 0.9,
};

// Emotion of the moment scales the motion (multiplies the section's chaos). Cold and bare = still.
const MOOD = { cold: 0, bare: 0, hush: 0.35, deadpan: 0.5, tension: 0.8, sneer: 1.0, confession: 1.1, anthem: 1.2, urgent: 1.3, epic: 1.4, frenzy: 1.6, scream: 1.6 };
// Shouted words. A scream drives the whole frame from the voice and overrides band-stop freezes.
const SHOUTS = [[31.738, 32.3], [108.54, 108.96], [116.78, 117.35], [208.99, 209.74]];
// Only the first scream (FOR NOW!) shatters the frame; the later ones get a glitchy pulse fuzz instead.
function screamAt(ctx, t) {
  for (const [k, [a, b]] of SHOUTS.entries()) {
    if (t >= a && t < b) return { level: 0.75 + 0.6 * ctx.pulse('vocal', t, 0.05), first: k === 0 };
    if (t >= b && t < b + 0.6) return { level: Math.exp(-(t - b) / 0.12), first: k === 0 };
  }
  return { level: 0, first: false };
}

// Flash limiter. Luminance-flipping effects (white clip bands, 1-bit crunch) may only fire on "allowed" hits:
// onsets thinned greedily so that consecutive allowed hits are at least `gap` seconds apart, song-wide.
// Deterministic (depends only on the audio), so the render stays a pure function of time.
const ALLOWED = new Map();
function allowedHit(ctx, stem, t, gap, window = 0.07, minStrength = 0.2) {
  const key = stem + gap;
  if (!ALLOWED.has(key)) {
    const out = [];
    for (const [o, s] of ctx.audio.onsets[stem]) if (s >= minStrength && (!out.length || o - out[out.length - 1] >= gap)) out.push(o);
    ALLOWED.set(key, out);
  }
  const arr = ALLOWED.get(key);
  let lo = 0, hi = arr.length - 1, ans = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (arr[m] <= t) { ans = m; lo = m + 1; } else hi = m - 1; }
  return ans >= 0 && t - arr[ans] < window;
}

const hash = (n) => {
  let x = Math.imul(n | 0, 2654435761) ^ 0x5bd1e995;
  x = Math.imul(x ^ (x >>> 15), 2246822519);
  return ((x ^ (x >>> 13)) >>> 0) / 4294967296;
};
const ease = (u) => 1 - Math.pow(1 - Math.min(1, Math.max(0, u)), 3);

function idxAt(t) {
  let i = 0;
  for (let k = 0; k < plan.length; k++) if (plan[k].start <= t) i = k;
  return i;
}

function eventAt(ctx, type, t) {
  return ctx.audio.events.find((e) => e.type === type && t >= e.t && t < (e.end ?? e.t + 0.3));
}

function chaosAt(ctx, t) {
  const s = ctx.section(t);
  return Math.min(1, (SECTION_CHAOS[s.id] ?? 0.4) * 0.8 + ctx.env('intensity', t) * 0.3);
}

// Onsets of sung "zoom" words inside [a, b).
function zoomWords(ctx, a, b) {
  const out = [];
  for (const l of ctx.lyrics.lines) for (const w of l.words || []) if (w.start >= a && w.start < b && /^zoom/i.test(w.w)) out.push(w.start);
  return out;
}
function wordsIn(ctx, a, b) {
  const out = [];
  for (const l of ctx.lyrics.lines) for (const w of l.words || []) if (w.start >= a && w.start < b) out.push(w.start);
  return out;
}
const countBefore = (arr, t) => arr.filter((x) => x <= t).length;

// Camera: scale about a point, plus offset.
function blitCam(g, src, cam) {
  // Keep the picture covering the frame: never show past its edges when zoomed in.
  if (cam.s >= 1) {
    const hw = cam.cx / cam.s, hh = cam.cy / cam.s;
    const hw2 = (W - cam.cx) / cam.s, hh2 = (H - cam.cy) / cam.s;
    cam.fx = Math.min(W - hw2, Math.max(hw, cam.fx));
    cam.fy = Math.min(H - hh2, Math.max(hh, cam.fy));
  }
  g.save();
  g.translate(cam.cx + cam.dx, cam.cy + cam.dy);
  g.scale(cam.s, cam.s);
  g.translate(-cam.fx, -cam.fy);
  g.drawImage(src, 0, 0, W, H);
  g.restore();
}

function focusCam(rect, amount) {
  // Scale so the rect fills ~92% of the frame, eased by amount (0 = wide, 1 = on the rect).
  const [x, y, w, h] = rect;
  const target = Math.max(1, Math.min(1.35, Math.min(W / w, H / h) * 0.92));
  const s = 1 + (target - 1) * amount;
  return { s, fx: x + w / 2, fy: y + h / 2, cx: W / 2 + (x + w / 2 - W / 2) * (1 - amount), cy: H / 2 + (y + h / 2 - H / 2) * (1 - amount) };
}

function ditherMix(g, a, b, p) {
  // 1-bit ordered dissolve from a to b at half resolution.
  const w = 960, h = 540;
  const ca = canvas(w, h), cb = canvas(w, h);
  ca.getContext('2d').drawImage(a, 0, 0, w, h);
  cb.getContext('2d').drawImage(b, 0, 0, w, h);
  const A = ca.getContext('2d').getImageData(0, 0, w, h), B = cb.getContext('2d').getImageData(0, 0, w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if ((BAYER[(y & 7) * 8 + (x & 7)] + 0.5) / 64 < p) {
      const k = (y * w + x) * 4;
      A.data[k] = B.data[k]; A.data[k + 1] = B.data[k + 1]; A.data[k + 2] = B.data[k + 2];
    }
  }
  ca.getContext('2d').putImageData(A, 0, 0);
  g.save();
  g.imageSmoothingEnabled = false;
  g.drawImage(ca, 0, 0, W, H);
  g.restore();
}

// Rectangular blocks copied and shoved sideways (a datamosh-like displacement).
function blocks(g, seed, n, maxShift) {
  const copy = canvas(W, H);
  copy.getContext('2d').drawImage(g.canvas, 0, 0);
  for (let i = 0; i < n; i++) {
    const w = 80 + hash(seed * 7 + i) * 520, h = 30 + hash(seed * 11 + i) * 160;
    const x = hash(seed * 13 + i) * (W - w), y = hash(seed * 17 + i) * (H - h);
    const dx = (hash(seed * 19 + i) - 0.5) * 2 * maxShift, dy = (hash(seed * 23 + i) - 0.5) * 30;
    g.drawImage(copy, x, y, w, h, x + dx, y + dy, w, h);
  }
}

// The chorus hook's infinite zoom. It escalates across the song: chorus 1 drifts in, chorus 4 dives.
// p = zoom phase in levels (continuous, never resets). Later choruses spiral: every level is turned by the same
// small angle relative to the one outside it, so the whole tunnel twists as one (a log spiral), plus a slow spin.
// Each level is drawn down to ~1 px, so nothing ever pops in.
function recursion(base, n, p, spin = 0) {
  const r = [0, 0.6, 0.66, 0.72, 0.8][n] || 0.66;
  const spiral = [0, 0, 0, 0.05, 0.07][n] || 0;
  const c = canvas(W, H), g = c.getContext('2d');
  box(g, 0, 0, W, H, INK);
  // Start two levels outside the frame so the spin never exposes the corners.
  for (let i = Math.floor(p) - (spiral ? 2 : 0); ; i++) {
    const s = Math.pow(r, i - p);
    const w = W * s, h = H * s;
    if (w < 2) break;
    // Later choruses: every level gets a black border.
    const border = n >= 3 ? INK : PAPER;
    const b = Math.max(1, (n >= 3 ? 10 : 6) * s);
    g.save();
    g.translate(W / 2, H / 2);
    g.rotate(spin + spiral * (i - p));
    if (s < 1) box(g, -w / 2 - b, -h / 2 - b, w + 2 * b, h + 2 * b, border);
    g.drawImage(base, -w / 2, -h / 2, w, h);
    g.restore();
  }
  return c;
}

// Shatter: the frame breaks into jagged triangles thrown outward from the centre and rattled every frame.
// Vertices are jittered per shard layout (seed), offsets re-rolled at 30 fps (f) so the pieces shake violently.
function shatter(g, level, seed, f, bg = INK) {
  const copy = canvas(W, H);
  copy.getContext('2d').drawImage(g.canvas, 0, 0);
  box(g, 0, 0, W, H, bg);
  const cols = 7, rows = 5, cw = W / cols, ch = H / rows;
  const V = [];
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
    const edge = i === 0 || j === 0 || i === cols || j === rows;
    V.push([i * cw + (edge ? 0 : (hash(seed + i * 31 + j * 57) - 0.5) * cw * 0.8), j * ch + (edge ? 0 : (hash(seed + i * 71 + j * 13) - 0.5) * ch * 0.8)]);
  }
  const at = (i, j) => V[j * (cols + 1) + i];
  let k = 0;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
    const tris = hash(seed + i * 7 + j * 11) < 0.5 ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]];
    for (const tri of tris) {
      k++;
      const mx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, my = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
      const ox = mx - W / 2, oy = my - H / 2, ol = Math.hypot(ox, oy) || 1;
      const throwD = level * (30 + 170 * hash(seed + k * 3));
      const dx = (ox / ol) * throwD + (hash(f * 17 + k) - 0.5) * 2 * 45 * level;
      const dy = (oy / ol) * throwD + (hash(f * 29 + k) - 0.5) * 2 * 45 * level;
      const rot = (hash(f * 41 + k) - 0.5) * 0.16 * level;
      g.save();
      g.translate(mx + dx, my + dy);
      g.rotate(rot);
      g.translate(-mx, -my);
      g.beginPath();
      g.moveTo(tri[0][0], tri[0][1]); g.lineTo(tri[1][0], tri[1][1]); g.lineTo(tri[2][0], tri[2][1]);
      g.closePath();
      g.clip();
      g.drawImage(copy, 0, 0);
      g.restore();
    }
  }
}

// Glitchy pulse fuzz: bands of 1-bit static, a rolling tracking band, and fine slice jitter. Semi-transparent,
// so it adds grit without flipping the frame's overall brightness.
function fuzz(g, level, f) {
  const nw = 320, nh = 180, n = canvas(nw, nh), s = n.getContext('2d');
  const img = s.createImageData(nw, nh);
  for (let i = 0; i < nw * nh; i++) {
    const on = hash(f * 131 + i) < 0.5;
    const v = on ? 236 : 11;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  s.putImageData(img, 0, 0);
  g.save();
  g.imageSmoothingEnabled = false;
  // Full-frame static, faint.
  g.globalAlpha = 0.12 * level;
  g.drawImage(n, 0, 0, W, H);
  // A few bands of heavier static.
  g.globalAlpha = Math.min(0.6, 0.35 * level);
  for (let b = 0; b < 3; b++) {
    const y = hash(f * 17 + b) * H, h = 12 + hash(f * 23 + b) * 60 * level;
    g.drawImage(n, 0, (y / H) * nh, nw, (h / H) * nh + 1, 0, y, W, h);
  }
  // Rolling tracking band.
  const ty = ((f * 37) % (H + 200)) - 100;
  g.globalAlpha = Math.min(0.7, 0.45 * level);
  g.drawImage(n, 0, 0, nw, 30, 0, ty, W, 60 + 60 * level);
  g.restore();
  tear(g, f + 911, Math.round(4 + 10 * level), 18 + 60 * level);
}

function crunch(g, w = 480) {
  // 1-bit crunch of the whole frame at reduced resolution (default quarter), keeping red as red.
  const h = Math.round((w * 9) / 16), c = canvas(w, h), s = c.getContext('2d');
  s.drawImage(g.canvas, 0, 0, w, h);
  const d = s.getImageData(0, 0, w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = (y * w + x) * 4;
    const r = d.data[k], gg = d.data[k + 1], b = d.data[k + 2];
    const red = r > 180 && gg < 90;
    const v = (0.3 * r + 0.59 * gg + 0.11 * b) / 255;
    const on = v > (BAYER[(y & 7) * 8 + (x & 7)] + 0.5) / 64;
    const col = red ? [255, 30, 30] : on ? [236, 234, 227] : [11, 11, 11];
    d.data[k] = col[0]; d.data[k + 1] = col[1]; d.data[k + 2] = col[2];
  }
  s.putImageData(d, 0, 0);
  g.save();
  g.imageSmoothingEnabled = false;
  g.drawImage(c, 0, 0, W, H);
  g.restore();
}

// api: { draw(id, t?), isLive(id) }. opts.only: Set of feature names to allow (reel demos); undefined = all.
export function renderMotion(out, t, ctx, api, opts = {}) {
  const on = (f) => !opts.only || opts.only.has(f);
  const beat = ctx.audio.beat_period;
  const i = idxAt(t);
  const S = plan[i], N = plan[i + 1], P = plan[i - 1];
  const start = S.start, end = N ? N.start : 229.6, dur = end - start, local = t - start;
  const fx = new Set(S.fx);
  const cold = fx.has('cold');
  const mood = MOOD[S.mood] ?? 1;
  const sc = on('scream') ? screamAt(ctx, t) : { level: 0, first: false };
  const scream = sc.level, shatterScream = sc.first ? scream : 0, fuzzScream = sc.first ? 0 : scream;
  const chaos = Math.min(1, chaosAt(ctx, t) * mood);
  const stop = eventAt(ctx, 'stop_acappella', t);
  const roll = eventAt(ctx, 'roll', t);

  // Time the picture is sampled at: frozen on band stops, quantized (stutter) in rolls/ratchets.
  let tp = t;
  const freeze = on('freeze') && stop && fx.has('freeze') && !fx.has('drostepush') && !fx.has('zoomchops') && scream < 0.05;
  if (freeze) tp = Math.max(start, stop.t);
  if (on('stutter') && roll && (fx.has('ratchet') || chaos > 0.5)) {
    const q = beat / (roll.t && t - roll.t < (roll.end - roll.t) / 2 ? 2 : 4);
    tp = Math.floor(t / q) * q;
  }
  if (on('tape') && fx.has('tape') && t >= 117.95 && t < 118.6) tp = 117.95 + Math.floor((t - 117.95) / 0.09) * 0.045;
  // Element animation follows the voice even through band stops; only stutter/tape quantize it.
  const ta = freeze ? t : tp;

  const g = out;
  g.save();
  box(g, 0, 0, W, H, INK);
  let src = S.anim && api.drawAnim ? api.drawAnim(S.id, ta, start, end, cold ? 0 : Math.max(freeze ? 0 : chaos, scream)) : api.draw(S.id, api.isLive(S.id) ? tp : undefined);
  // Chorus hooks: an infinite zoom into the chorus's own frame. Every level is drawn down to a pixel, and the
  // zoom phase runs continuously, so nothing ever appears from nowhere.
  if (on('drostepush') && fx.has('drostepush')) {
    // Zoom rate escalates per chorus (levels per bar) and accelerates through the stop; each syllable lurches it
    // forward. Choruses 3 and 4 also spin slowly as a whole (no per-frame randomness).
    const n = +S.id[2], rate = [0, 1, 1.4, 4, 6][n], acc = [0, 0, 0.3, 2, 3.5][n], spinRate = [0, 0, 0, 0.12, 0.2][n];
    const bars = (t - start) / (beat * 4), v = ctx.pulse('vocal', t, 0.08);
    const p = rate * bars + acc * bars * bars + (n >= 3 ? 0.35 * v : 0);
    src = recursion(api.draw(`ch${n}capex`), n, p, spinRate * bars);
  }
  // Flipbook: each kick cuts to a different full-resolution shot from earlier in the year.
  if (on('flip') && fx.has('flip')) {
    // Flash-limited: consecutive flips at least 0.42 s apart (full-frame changes between paper, ink and red).
    const kicks = [];
    for (const [o] of ctx.audio.onsets.kick) if (o >= start && o < end && (!kicks.length || o - kicks[kicks.length - 1] >= 0.42)) kicks.push(o);
    const k = countBefore(kicks, tp);
    const pool = plan.filter((p) => p.start < start && !p.fx.includes('cold') && !/hook|allyear|blind|end/.test(p.id));
    if (k > 0 && pool.length) src = api.draw(pool[Math.floor(hash(k * 31) * pool.length)].id);
  }

  // ----- camera -----
  let cam = { s: 1, fx: W / 2, fy: H / 2, cx: W / 2, cy: H / 2, dx: 0, dy: 0 };
  const lt = tp - start;
  if (on('push') && fx.has('push')) cam.s *= 1 + 0.05 * Math.min(1, lt / dur);
  if (on('punch') && fx.has('punch') && S.focus.length) {
    // Punch only once the shot's elements have landed (last ~40% of the shot), so nothing is cropped out mid-entrance.
    const dbs = ctx.downbeats.filter((d) => d > (S.anim ? start + dur * 0.6 : start + 0.2) && d < end - 0.1);
    const k = countBefore(dbs, tp);
    if (k > 0) {
      const rect = S.focus[(k - 1) % S.focus.length];
      const since = tp - dbs[k - 1];
      const wide = (k % 2 === 0 && S.focus.length === 1);
      if (!wide) cam = { ...focusCam(rect, ease(since / 0.09)), dx: 0, dy: 0 };
    }
  }
  if (on('zoomchops') && fx.has('zoomchops')) {
    const zs = zoomWords(ctx, start - 0.05, end);
    const k = countBefore(zs, tp);
    if (k > 0) {
      const since = tp - zs[k - 1];
      const f = S.focus.length ? S.focus[(k - 1) % S.focus.length] : [W / 2 - 200, H / 2 - 120, 400, 240];
      // A quick kick toward the card that just landed, settling back to wide (not a cumulative dive).
      cam.s = 1 + 0.22 * (1 - ease(since / 0.3));
      cam.fx = f[0] + f[2] / 2; cam.fy = f[1] + f[3] / 2;
    }
  }
  if (on('pan') && fx.has('pan')) {
    const kicks = ctx.audio.onsets.kick.map((o) => o[0]).filter((x) => x >= start && x < end);
    const k = countBefore(kicks, tp);
    const u = kicks.length ? ease(k / kicks.length) : lt / dur;
    cam.s = 1.9;
    cam.fx = 480 + u * 960; cam.fy = 380 + 300 * Math.sin(u * Math.PI);
  }
  // Crash zoom out of this shot when the next one enters by 'zoom'.
  if (on('zoom') && N && N.in === 'zoom' && end - t < 0.4) {
    const u = 1 - (end - t) / 0.4;
    const f = S.focus[0] || [W / 2 - 150, H / 2 - 60, 300, 120];
    cam.s *= Math.exp(u * u * 2.6);
    cam.fx = f[0] + f[2] / 2; cam.fy = f[1] + f[3] / 2;
  }
  // Slam in.
  if (on('slam') && S.in === 'slam' && local < 0.14) cam.s *= 1 + 0.16 * (1 - ease(local / 0.14));
  // Kick shake.
  if (on('shake') && !cold && !freeze && fx.has('shake')) {
    const p = ctx.pulse('kick', t, 0.07);
    const a = chaos * 16 * p;
    cam.dx = (hash(Math.floor(t * 60)) - 0.5) * 2 * a;
    cam.dy = (hash(Math.floor(t * 60) + 7) - 0.5) * 2 * a;
  }
  // Scream: the first one throws the camera around; later ones just pulse it with the voice.
  if (shatterScream > 0.05) {
    const f = Math.floor(t * 30), v = 0.5 + ctx.pulse('vocal', t, 0.05);
    cam.dx += (hash(f * 3) - 0.5) * 2 * 60 * shatterScream * v;
    cam.dy += (hash(f * 5) - 0.5) * 2 * 40 * shatterScream * v;
    cam.s *= 1 + 0.1 * shatterScream * v;
  }
  if (fuzzScream > 0.05) cam.s *= 1 + 0.035 * fuzzScream * ctx.pulse('vocal', t, 0.06);
  blitCam(g, src, cam);

  // ----- transition in -----
  if (P && local < beat * 2) {
    const prev = api.draw(P.id, api.isLive(P.id) ? start - 1 / 30 : undefined);
    if (on('tear') && S.in === 'tear' && local < beat) {
      const p = local / beat, bh = 36;
      for (let y = 0; y < H; y += bh) if (hash(y * 13 + 5) > p) g.drawImage(prev, 0, y, W, bh, (hash(y) - 0.5) * 120 * (1 - p), y, W, bh);
    }
    if (on('stutter') && S.in === 'stutter' && local < beat * 0.75) {
      if (Math.floor(local / (beat / 4)) % 2 === 0) g.drawImage(prev, 0, 0, W, H);
    }
    if (on('dissolve') && S.in === 'dissolve' && local < beat * 2) {
      const cur = canvas(W, H);
      cur.getContext('2d').drawImage(g.canvas, 0, 0);
      ditherMix(g, prev, cur, local / (beat * 2));
    }
    if (on('slam') && S.in === 'slam' && local < 0.06) clipBand(g, H * 0.4, 90);
  }

  // ----- word-synced reveal: hide the frame below a line that steps down on each sung word -----
  if (on('reveal') && fx.has('reveal') && !freeze && !S.anim) {
    const ws = wordsIn(ctx, start, start + dur * 0.8);
    if (ws.length > 2) {
      const k = countBefore(ws, tp);
      const y = 140 + (H - 140) * Math.min(1, (k + 1) / ws.length);
      if (y < H) {
        const bg = src.getContext('2d').getImageData(8, H - 8, 1, 1).data;
        g.fillStyle = `rgb(${bg[0]},${bg[1]},${bg[2]})`;
        g.fillRect(0, y, W, H - y);
      }
    }
  }

  // ----- beat effects -----
  if (!cold && !freeze) {
    if (on('tear') && fx.has('tear') && chaos > 0.15) {
      const f = Math.floor(t * 30);
      const p = ctx.pulse('snare', t, 0.08);
      if (p > 0.22) tear(g, f, Math.round(6 + chaos * 30), 40 + chaos * 380);
      // Hats: small, frequent slips.
      if (ctx.pulse('hat', t, 0.04) > 0.25 && chaos > 0.35) tear(g, f + 17, Math.round(2 + chaos * 6), 12 + chaos * 60);
      // Snare at high chaos: block displacement, rectangles shoved out of place.
      if (p > 0.3 && chaos > 0.55) blocks(g, f + 29, Math.round(3 + chaos * 9), 60 + chaos * 240);
    }
    if (on('clip') && fx.has('clip') && chaos > 0.3) {
      // At most one clip per 0.45 s (flash-safe); the band is held still for the hit instead of flickering.
      if (allowedHit(ctx, 'kick', t, 0.45)) {
        const k = Math.floor(ctx.grid(t).beat);
        clipBand(g, hash(k * 7) * H, 16 + chaos * 90);
        if (chaos > 0.6) clipBand(g, hash(k * 7 + 3) * H, 8 + chaos * 30);
      }
    }
    const drop = ctx.audio.events.find((e) => e.type === 'drop' && t >= e.t && t < e.t + 0.22);
    if (on('crunch') && (drop || (fx.has('crunch') && chaos > 0.8 && allowedHit(ctx, 'kick', t, 1.2, 0.05, 0.6)))) crunch(g);
  }
  if (shatterScream > 0.05) {
    // The frame shakes itself apart: shards thrown out and rattled by the voice, then torn and crunched.
    const f = Math.floor(t * 30), v = 0.6 + ctx.pulse('vocal', t, 0.05);
    shatter(g, Math.min(1.4, shatterScream * v), 7000 + Math.floor(t * 6), f);
    tear(g, f + 101, Math.round(4 + 14 * shatterScream), 40 + 220 * shatterScream);
    if (allowedHit(ctx, 'vocal', t, 0.5, 0.05, 0.3)) crunch(g);
  }
  if (fuzzScream > 0.05) fuzz(g, Math.min(1.2, fuzzScream * (0.6 + 0.6 * ctx.pulse('vocal', t, 0.06))), Math.floor(t * 30));
  // Meltdown: the frame destroys itself over the last stretch of a shot (the outro drop's final roll).
  if (S.meltdown && t >= S.meltdown && !cold) {
    const m0 = Math.min(1, (t - S.meltdown) / (end - S.meltdown)), m = Math.pow(m0, 1.6), f = Math.floor(t * 30);
    // Vertical slip (a rolling picture), heavy tears and block moves, re-rolled every frame.
    const slip = canvas(W, H); slip.getContext('2d').drawImage(g.canvas, 0, 0);
    const dy = Math.round((hash(f * 7) - 0.5) * 2 * 140 * m);
    g.drawImage(slip, 0, dy); g.drawImage(slip, 0, dy - Math.sign(dy || 1) * H);
    tear(g, f + 301, Math.round(20 + 60 * m), 200 + 900 * m);
    blocks(g, f + 331, Math.round(8 + 34 * m), 200 + 700 * m);
    fuzz(g, 0.4 + 0.9 * m, f + 5);
    // Resolution starvation: the whole frame collapses to 1-bit at ever coarser pixels.
    crunch(g, Math.max(24, Math.round(480 * (1 - 0.92 * m))));
  }
  if (on('tape') && fx.has('tape') && t >= 117.95 && t < 118.6) {
    const u = (t - 117.95) / 0.65;
    const c = canvas(W, H);
    c.getContext('2d').drawImage(g.canvas, 0, 0);
    box(g, 0, 0, W, H, INK);
    g.drawImage(c, 0, 0, W, H * (1 - 0.35 * u), 0, 0, W, H);
  }
  g.restore();

  if (opts.label) {
    box(g, W - 620, 24, 596, 56, INK);
    text(g, opts.label, W - 44, 64, { font: MONO, size: 26, color: PAPER, align: 'right' });
  }
}
