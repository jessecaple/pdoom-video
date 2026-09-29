// Instrumental sections: abstract, driven by the song's own audio data. No story.
import { INK, PAPER, GREY, RED, W, H, NARROW, SERIF, MONO, rng, tear, speckle, text, box, outline, stamp, FULL, slam, wipe } from '../lib.js';

// Post-chorus 2 (87.0 s): the "doom / zoom" chant as a typographic rhythm grid. Rows shove with the vocal chops and
// drift; which rows are inverted changes once per bar (no per-kick flicker).
export function fChant(g, ctx, t) {
  box(g, 0, 0, W, H, PAPER);
  const bar = ctx.grid(t).bar;
  for (let r = 0; r < 12; r++) {
    const tt = t - 1.5 + r * 0.25;
    const shove = (ctx.env('vocal', tt) - 0.2) * 900 + ((t * 120 * (r % 2 ? 1 : -1)) % 260);
    const word = r % 2 ? 'ZOOM' : 'DOOM';
    const inv = (r * 7 + bar * 5) % 12 < 3;
    const y = r * 90;
    box(g, 0, y, W, 90, inv ? INK : PAPER);
    for (let k = -2; k < 10; k++) text(g, word, k * 260 + shove, y + 82, { font: NARROW, size: 110, color: inv ? PAPER : INK });
  }
  box(g, 0, 540, W, 16, RED);
  tear(g, 9001 + Math.floor(t * 8), 10, 140, 0, H);
}

// Solo, beat gone (99.56 s): the synth idles alone. A persistence display: the lead synth's last few seconds as
// stacked ridgelines (one per 16th note), scrolling up; the newest line is red. As the drums creep back (104.27)
// the stack starts to tremble. Real audio data only.
export function fIdle(g, ctx, t) {
  box(g, 0, 0, W, H, INK);
  const step = ctx.audio.beat_period / 4, rows = 34, span = 2.4, top = 150, gap = 24;
  const now = Math.floor(t / step);
  const drums = Math.max(0, Math.min(1, (t - 104.0) / 1.4));
  for (let r = rows - 1; r >= 0; r--) {
    const tr = (now - r) * step;
    const y0 = top + (rows - 1 - r) * gap - ((t / step) % 1) * gap;
    if (y0 < 110) continue;
    const shake = drums * ctx.pulse('kick', tr, 0.1) * 12;
    g.save();
    g.beginPath();
    const pts = [];
    for (let i = 0; i <= 240; i++) {
      const tt = tr - span + (i / 240) * span;
      // Peaks where the synth actually struck (onsets), riding on the lead's level.
      let p = 0;
      for (const [o, st] of ctx.audio.onsets.synth) { const d = (tt - o) / 0.05; if (d > -4 && d < 4) p += st * Math.exp(-d * d); }
      // Between strikes the synth sustains: its level (above a floor) rides the line as a live ripple.
      const sus = Math.max(0, ctx.env('synth', tt) - 0.55) * 1.6 + ctx.env('lead', tt) * 0.3;
      const v = Math.min(1.4, p * 1.6 + sus * (0.55 + 0.45 * Math.sin(i * 0.9 + tt * 7)));
      const x = 160 + (i / 240) * 1600;
      pts.push([x, y0 - v * 150 * Math.sin((i / 240) * Math.PI) + (i % 7 === 0 ? shake : 0)]);
    }
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.lineTo(1760, y0 + 200); g.lineTo(160, y0 + 200); g.closePath();
    g.fillStyle = INK; g.fill();
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.strokeStyle = r === 0 ? RED : PAPER;
    g.lineWidth = r === 0 ? 3 : 2;
    g.stroke();
    g.restore();
  }
  box(g, 0, 0, W, 110, INK);
  box(g, 0, top + rows * gap - 10, W, H, INK);
  text(g, 'LEAD SYNTH, ALONE · EACH LINE = ONE 16TH NOTE', 48, H - 48, { font: MONO, size: 22, color: GREY });
  speckle(g, 9101 + Math.floor(t * 12), 0.00025);
}

// Outro drop (215.64 s): everything the film has been, at maximum. Rows of the year's frames stream past in
// alternating directions; ZOOM holds the centre.
export function fOutroDrop(g, ctx, t, contact) {
  box(g, 0, 0, W, H, INK);
  const th = 135, v = 200 + 500 * ctx.env('intensity', t);
  for (let r = 0; r < 8; r++) {
    const off = (((t - 215.64) * v * (r % 2 ? 1 : -1)) % W + W) % W;
    g.drawImage(contact, 0, r * th, W, th, off - W, r * th, W, th);
    g.drawImage(contact, 0, r * th, W, th, off, r * th, W, th);
  }
  box(g, 0, H * 0.46, W, H * 0.12, INK);
  const kick = ctx.pulse('kick', t, 0.12);
  g.save(); g.translate(W / 2, H * 0.52); g.scale(1 + 0.08 * kick, 1 + 0.08 * kick); g.translate(-W / 2, -H * 0.52);
  text(g, 'ZOOM', W / 2, H * 0.56, { font: SERIF, size: 150, color: PAPER, align: 'center', sx: 0.72 });
  g.restore();
  const bar = ctx.grid(t).bar;
  for (let i = 0; i < 5; i++) box(g, 0, 120 + ((i * 210 + bar * 97) % 1000), W, 18, RED);
  tear(g, 9201 + Math.floor(t * 8), 40, 380, 0, H);
}

// Outro, lone synth (221.92 s): the whole song as one barcode of its intensity; the playhead near the end.
// On the final "doom-doom-doom" stutter the playhead strikes the bar once per chop.
export function fOutroLone(g, ctx, t) {
  box(g, 0, 0, W, H, INK);
  const n = 1200, y0 = 470, h = 140;
  const chop = ctx.pulse('vocal', t, 0.07) * (t > 226.5 ? 1 : 0);
  for (let i = 0; i < n; i++) {
    const tt = (i / n) * 229.6;
    const v = ctx.env('intensity', tt);
    const x = 160 + (i / n) * 1600;
    box(g, x, y0 + h / 2 - (v * h) / 2 - chop * 30 * Math.sin(i * 0.37), 1600 / n + 0.4, v * h, tt <= t ? PAPER : '#3a3a37');
  }
  box(g, 160 + (t / 229.6) * 1600, y0 - 40 - chop * 60, 4, h + 80 + chop * 120, RED);
  text(g, 'ZOOM ZOOM P(DOOM) · 0:00–3:49 · INTENSITY', 160, y0 + h + 90, { font: MONO, size: 22, color: GREY });
}

// Hard cut (228.4 s).
export function fEnd(g) {
  box(g, 0, 0, W, H, INK);
  text(g, '2026-09-27', 48, 64, { font: MONO, size: 30, color: GREY });
}

// Solo build-up (93.29–99.56 s): the machine takes the mic. The synth solo's actual notes (pitch-tracked from the
// synth stem: data/solo_notes.json) scroll right-to-left through a piano roll past a playhead: notes ahead are
// outlines, notes played are solid red. Each note throws up a giant, dim fragment of a figure already shown this
// year. On the 16-hit roll (97.97–99.47) the beat grid subdivides 4 → 8 → 16 → 32 and the scroll speeds up.
const FRAGMENTS = ['7,751', '9 AGENCIES', '1.5 MILLION', '17,000', 'THOUSANDS', '$700,000,000,000', '87,714', '54,836', '15', '1,342', '700', '$720–745B', '$3.48', '3–6', '2026'];
export function fSoloRoll(g, ctx, t) {
  box(g, 0, 0, W, H, INK);
  const N = ctx.soloNotes;
  if (!N) return;
  const notes = N.notes, bp = ctx.audio.beat_period;
  const lo = 71, hi = 86, top = 130, bot = H - 120, rowH = (bot - top) / (hi - lo + 1);
  const yOf = (m) => bot - (m - lo + 0.5) * rowH;
  const px = W * 0.6, kw = 70;
  // Scroll: 1 beat = 300 px, accelerating through the roll (position integrates the speed, so it stays smooth).
  const rollA = 97.97, rollB = 99.47, sp = 300 / bp;
  const pos = (tt) => { let x = tt * sp; if (tt > rollA) { const u = Math.min(tt, rollB) - rollA; x += u * u * 0.6 * sp; if (tt > rollB) x += (tt - rollB) * 1.2 * (rollB - rollA) * sp; } return x; };
  const X = (tt) => px + (pos(tt) - pos(t));
  // Giant fragments of figures already shown this year: one per note, dim, behind everything.
  const played = notes.filter((n) => n.t <= t);
  played.slice(-2).forEach((n, k, arr) => {
    const idx = notes.indexOf(n), r = rng(9300 + idx), newest = k === arr.length - 1;
    const pop = newest ? 1 + 0.06 * Math.max(0, 1 - (t - n.t) / 0.1) : 1;
    g.save();
    g.translate(-80 + r() * 700, 420 + r() * 600); g.scale(pop, pop);
    text(g, FRAGMENTS[idx % FRAGMENTS.length], 0, 0, { font: NARROW, size: 300 + r() * 260, color: newest ? '#2e2d2a' : '#1a1a18' });
    g.restore();
  });
  // Pitch rows.
  for (let m = lo; m <= hi; m++) {
    if ([1, 3, 6, 8, 10].includes(m % 12)) box(g, 0, yOf(m) - rowH / 2, W, rowH, 'rgba(236,234,227,0.035)');
    box(g, 0, yOf(m) + rowH / 2, W, 1, m % 12 === 0 ? '#3a3a37' : '#1f1f1d');
  }
  // Beat grid: 4 lines per beat, subdividing 8 → 16 → 32 through the roll.
  const sub = t < rollA ? 4 : t < rollA + 0.5 ? 8 : t < rollA + 1.0 ? 16 : 32;
  for (let k = Math.floor((t - 3) / (bp / sub)); k <= Math.ceil((t + 2) / (bp / sub)); k++) {
    const x = X(k * (bp / sub));
    if (x < 0 || x > W) continue;
    box(g, x, top, k % sub === 0 ? 2 : 1, bot - top, k % sub === 0 ? '#4a4945' : '#262624');
  }
  // The melody's contour: a thin line through the notes already played.
  g.save(); g.strokeStyle = 'rgba(236,234,227,0.5)'; g.lineWidth = 2; g.beginPath();
  let first = true;
  for (const n of played) { const x = Math.min(px, X((n.t + n.end) / 2)); if (x < -50) continue; first ? g.moveTo(x, yOf(n.midi)) : g.lineTo(x, yOf(n.midi)); first = false; }
  g.stroke(); g.restore();
  // Notes: played = solid red bars; ahead = outlines.
  let sounding = null;
  for (const n of notes) {
    const x0 = X(n.t), x1 = X(n.end);
    if (x1 < 0 || x0 > W) continue;
    const y = yOf(n.midi) - rowH / 2 + 5, h = rowH - 10;
    if (n.t <= t) {
      box(g, x0, y, Math.max(8, Math.min(x1, px) - x0), h, RED);
      if (t < n.end + 0.04) sounding = n;
      if (n.end > t) outline(g, px, y, x1 - px, h, PAPER, 2);
    } else outline(g, x0, y, Math.max(8, x1 - x0), h, PAPER, 2);
  }
  // Keyboard at the playhead: the sounding key lights red, with a short burst.
  box(g, px - kw / 2, top - 6, kw, bot - top + 12, INK);
  for (let m = lo; m <= hi; m++) {
    const black = [1, 3, 6, 8, 10].includes(m % 12), on = sounding && sounding.midi === m;
    box(g, px - kw / 2 + (black ? 18 : 2), yOf(m) - rowH / 2 + 2, black ? kw - 20 : kw - 4, rowH - 4, on ? RED : black ? '#2c2c29' : '#BDBBB3');
  }
  if (sounding) {
    const age = t - sounding.t, y = yOf(sounding.midi);
    const L = 40 + 160 * Math.max(0, 1 - age / 0.15);
    box(g, px + kw / 2, y - 2, L, 4, PAPER);
  }
  text(g, 'LEAD SYNTH · THE SOLO’S ACTUAL NOTES', 48, H - 48, { font: MONO, size: 22, color: GREY });
  speckle(g, 9401 + Math.floor(t * 12), 0.0004);
}
