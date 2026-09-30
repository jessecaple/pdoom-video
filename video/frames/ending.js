// The ending: "who can tell?" (209.2 s), "we'll be fine" (214.0 s), and the YouTube thumbnail.
import { INK, PAPER, GREY, RED, W, H, NARROW, SERIF, MONO, tear, clipBand, text, box, stamp, FULL, wipe } from '../lib.js';

// WHO CAN TELL: the published estimates, which measure different things and don't agree. Nothing summed.
export function fWhoScatter(g) {
  box(g, 0, 0, W, H, PAPER);
  const x0 = 100, w = 1720, y = 560;
  const X = (p) => x0 + (p / 100) * w;
  // Compiled range across public figures (Wikipedia list; reported).
  box(g, X(0.01), y - 14, X(95) - X(0.01), 28, '#D6D4CB');
  text(g, 'PUBLIC FIGURES’ STATED ESTIMATES RUN FROM <0.01% TO >95% · COMPILED LIST (REPORTED)', x0, y + 70, { font: MONO, size: 22, color: GREY });
  box(g, x0, y - 2, w, 4, INK);
  for (let p = 0; p <= 100; p += 10) { box(g, X(p) - 1, y - 20, 2, 40, INK); text(g, `${p}%`, X(p), y + 44, { font: MONO, size: 18, color: INK, align: 'center' }); }
  const pts = [
    [5, '5% · MEDIAN OF 2,778 AI RESEARCHERS', 'extinction-level outcomes · AI Impacts survey, 2023', y - 330],
    [10, '>10% · E. HUBINGER', 'AI kills all humans, within a decade · Sep 2026', y + 150],
    [25, '25% · D. AMODEI', '“really, really badly” · Sep 2025', y - 170],
  ];
  pts.forEach(([p, a, b, ty]) => {
    const side = ty < y ? -1 : 1;
    box(g, X(p) - 5, y - 60, 10, 120, RED);
    box(g, X(p) - 1, side < 0 ? ty + 20 : y + 60, 2, side < 0 ? y - 60 - ty - 20 : ty - y - 90, INK);
    text(g, a, X(p) - 4, ty, { font: NARROW, size: 44, color: INK });
    text(g, b, X(p) - 4, ty + (side < 0 ? -44 : 36), { font: MONO, size: 20, color: GREY });
  });
  box(g, 100, 880, 1240, 110, INK);
  text(g, '“‘P(doom)’ Is Just Vibes Masquerading as Science”', 130, 950, { font: SERIF, size: 44, color: PAPER });
  text(g, 'GIZMODO HEADLINE · SEP 16, 2026', 130, 982, { font: MONO, size: 18, color: GREY });
  text(g, 'who can tell?', 1820, 960, { font: MONO, size: 34, weight: 'normal', color: INK, align: 'right' });
  stamp(g, '2026-09-27', INK, 'FINAL · A CAPPELLA STOP');
}

// WE'LL BE FINE: the phrase stays tidy while the whole year shreds around it; the held "fine" stretches as it's held.
export function fFineHeld(g, ctx, t, contact, a = FULL) {
  box(g, 0, 0, W, H, INK);
  g.drawImage(contact, 0, 0, W, H);
  if (a.full) { tear(g, 2151, 60, 520, 0, H); clipBand(g, 180, 60); clipBand(g, 840, 40); }
  else tear(g, 2151 + Math.floor(a.t * 10), 40, 420, 0, H);
  const tWe = a.w(/^we'?’?ll/i), tFine = a.w(/^fine/i);
  wipe(g, a.in(tWe - 0.15, 0.12), 560, 420, 800, 240, () => box(g, 560, 420, 800, 240, PAPER), true);
  if (a.full || a.t >= tWe) text(g, 'we’ll be', 600, 520, { font: SERIF, size: 80, weight: 'normal', color: INK });
  if (a.full || a.t >= tFine) {
    const stretch = a.full ? 2.4 : 1 + 1.4 * Math.min(1, (a.t - tFine) / 1.5);
    g.save(); g.translate(600, 620); g.scale(stretch, 1);
    text(g, 'fine', 0, 0, { font: SERIF, size: 80, weight: 'normal', color: INK });
    g.restore();
  }
  stamp(g, '2026-09-27', PAPER, 'FINAL · “fine” HELD 1.5 s');
}

// YouTube thumbnail (1280×720 render): the title, set big and stark over the chorus's torn data-center frame.
export function fThumb(g, ctx, t, bg) {
  box(g, 0, 0, W, H, INK);
  g.drawImage(bg, 0, 0, W, H);
  box(g, 0, 0, W, H, 'rgba(11,11,11,0.55)');
  tear(g, 4401, 14, 160, 0, H);
  box(g, 0, 230, W, 620, INK);
  text(g, 'P(DOOM)ER', 70, 520, { font: NARROW, size: 300, color: PAPER, sx: 0.92 });
  text(g, 'HYPERSLOP', 70, 790, { font: NARROW, size: 260, color: RED, sx: 0.92 });
  text(g, '2026 · A YEAR OF AI NEWS', 1850, 740, { font: MONO, size: 36, color: PAPER, align: 'right' });
  text(g, 'ON THE RECORD', 1850, 790, { font: MONO, size: 36, color: GREY, align: 'right' });
  tear(g, 4402, 3, 22, 240, 840);
}
