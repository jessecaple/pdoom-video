// Verse 2 (new lines) and Pre-Chorus 2.
import { INK, PAPER, GREY, RED, W, H, SANS, NARROW, SERIF, MONO, rng, canvas, dither, tear, clipBand, speckle, text, box, outline, rubber, stamp, sheet, redacted, wrap, seaSource, FULL, slam, wipe, memo } from '../lib.js';

// V2.3 (60.44 s): the first ransom job with no human operator; the schema dies table by table.
export function fRansom(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, RED);
  const tables = [[980, 120], [1340, 120], [1620, 300], [980, 420], [1300, 520], [1080, 760], [1500, 800]];
  const tR = a.w(/^ransom/i), tEven = a.w(/^even/i), h = ctx.audio.beat_period / 2;
  g.save();
  g.strokeStyle = INK; g.lineWidth = 3; g.setLineDash([10, 10]);
  for (let i = 0; i < tables.length - 1; i++) {
    if (!a.full && a.t < a.start + i * 0.05) break;
    g.beginPath(); g.moveTo(tables[i][0] + 120, tables[i][1] + 60); g.lineTo(tables[i + 1][0] + 120, tables[i + 1][1] + 60); g.stroke();
  }
  g.restore();
  // Order the tables die in (4 = the one that becomes README_RANSOM).
  const order = [0, 1, 2, 3, 5, 6];
  tables.forEach(([x, y], i) => {
    slam(g, a.in(a.start + i * 0.05, 0.06), x + 120, y + 75, () => {
      if (i === 4 && (a.full || a.t >= tEven)) { box(g, x, y, 240, 150, INK); text(g, 'README_RANSOM', x + 14, y + 30, { font: MONO, size: 22, color: RED }); return; }
      box(g, x, y, 240, 150, RED);
      outline(g, x, y, 240, 150, INK, 4);
      box(g, x, y, 240, 36, INK);
      const k = order.indexOf(i), u = i === 4 ? 0 : a.full ? 1 : a.in(tR + k * h, 0.08);
      if (u > 0) { g.save(); g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y + 36); g.lineTo(x + 240 * u, y + 36 + 114 * u); g.stroke(); g.restore(); }
      if (i !== 4 && u <= 0) for (let l = 0; l < 3; l++) box(g, x + 14, y + 56 + l * 26, 120 + ((i * 37 + l * 53) % 90), 10, INK);
    }, 1.3);
  });
  if (a.full) tear(g, 3301, 10, 90, 100, 1000);
  slam(g, a.in(tR, 0.1), 300, 220, () => text(g, '1,342', 50, 300, { font: NARROW, size: 230, color: INK }), 1.7);
  wipe(g, a.in(a.w(/^job/i), 0.25), 50, 340, 900, 40, () => text(g, 'CONFIG ITEMS ENCRYPTED · ORIGINALS DROPPED', 60, 370, { font: MONO, size: 30, color: INK }));
  slam(g, a.in(a.w(/^backups/i), 0.08), 360, 450, () => text(g, 'KEY PRINTED ONCE, NEVER SAVED', 60, 480, { font: NARROW, size: 72, color: INK, sx: 0.8 }), 1.4);
  wipe(g, a.in(a.w(/^paid/i), 0.25), 50, 510, 900, 40, () => text(g, 'UNRECOVERABLE EVEN WITH PAYMENT, PER SYSDIG', 60, 540, { font: MONO, size: 28, color: INK }));
  wipe(g, a.in(a.w(/^no$/i), 0.15), 60, 720, 820, 170, () => {
    box(g, 60, 720, 820, 170, INK);
    text(g, 'LLM-DRIVEN, END TO END', 90, 790, { font: NARROW, size: 70, color: RED });
  });
  wipe(g, a.in(a.w(/^human/i) + 0.15, 0.25), 80, 825, 800, 40, () => text(g, 'A HUMAN STILL SET IT UP AND CHOSE THE VICTIM', 90, 850, { font: MONO, size: 26, color: PAPER }));
  slam(g, a.in(a.w(/^if$/i), 0.06), 1680, 980, () => rubber(g, 'REPORTED', 1680, 1000, { size: 50, rot: -0.06, color: INK }), 1.8);
  text(g, '“JADEPUFFER” · “FIRST DOCUMENTED CASE OF AGENTIC RANSOMWARE,” PER SYSDIG', 60, 1010, { font: MONO, size: 22, color: INK });
  stamp(g, '2026-07-01', INK, 'V2.3   SYSDIG THREAT RESEARCH');
  speckle(g, 3302 + (a.full ? 0 : Math.floor(a.t * 12)), 0.0008);
}

// PC2.1 (66.62 s): a chatbot reads a manifest; the sea drifts, the target box closes, the aircraft tracks draw in.
export function fShip(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, INK);
  const sea = memo('sea41', W + 200, H, (m) => dither(m, seaSource(41, 740, 360), 0, 0, W + 200, H, { contrast: 1.6 }));
  const drift = a.full ? 0 : ((a.t - a.start) * 30) % 200;
  g.drawImage(sea, -drift, 0);
  const sx = 1100, sy = 520, bob = a.full ? 0 : Math.sin(a.t * 3) * 4;
  g.save();
  g.translate(sx, sy + bob);
  g.rotate(-0.25);
  g.fillStyle = PAPER;
  g.beginPath();
  g.moveTo(-190, -34); g.lineTo(150, -34); g.quadraticCurveTo(210, 0, 150, 34); g.lineTo(-190, 34); g.closePath();
  g.fill();
  for (let i = 0; i < 6; i++) box(g, -170 + i * 48, -24, 40, 48, i % 2 ? RED : INK);
  g.restore();
  // Target box closes in on "Chinese ship".
  const tu = a.in(a.w(/^chinese/i), 0.25);
  if (tu > 0) { const k = 1 + (1 - tu) * 1.8; outline(g, sx - 260 * k, sy - 150 * k, 520 * k, 300 * k, RED, 6); }
  // Aircraft tracks draw in from "Planes".
  const tP = a.w(/^planes/i), pu = a.full ? 1 : Math.min(1, Math.max(0, (a.t - tP) / 0.9));
  if (pu > 0) {
    g.save(); g.strokeStyle = PAPER; g.lineWidth = 4; g.setLineDash([18, 12]);
    for (const [x0, y0] of [[1900, 60], [1880, 1040], [300, 60]]) {
      const ex = x0 + (sx + (x0 - sx) * 0.35 - x0) * pu, ey = y0 + (sy + (y0 - sy) * 0.35 - y0) * pu;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(ex, ey); g.stroke();
      g.fillStyle = PAPER; g.beginPath(); g.arc(ex, ey, 9, 0, 7); g.fill();
    }
    g.restore();
  }
  // The analyst's chat.
  wipe(g, a.in(a.w(/^chatbot/i) - 0.05, 0.15), 60, 150, 780, 580, () => sheet(g, 60, 150, 760, 560, { fill: PAPER }), true);
  wipe(g, a.in(a.w(/^chatbot/i) + 0.1, 0.25), 80, 180, 740, 130, () => {
    text(g, 'INPUT', 90, 210, { font: MONO, size: 24, color: GREY });
    wrap(g, 'INTELLIGENCE REPORTING ON A SHIP’S MANIFEST', 90, 260, 700, { size: 30, color: INK });
  });
  wipe(g, a.in(a.w(/^bomb/i), 0.1), 80, 370, 740, 40, () => text(g, 'CHATBOT CONCLUDED', 90, 400, { font: MONO, size: 24, color: GREY }));
  slam(g, a.in(a.w(/^parts/i), 0.1), 400, 480, () => wrap(g, 'NUCLEAR-WEAPONS- PROGRAM PARTS ABOARD', 90, 460, 700, { font: NARROW, size: 60, color: INK, lh: 1.05 }), 1.35);
  slam(g, a.in(a.w(/^the$/i, a.w(/^planes/i)), 0.06), 280, 630, () => { box(g, 80, 600, 400, 60, RED); text(g, 'IT WAS WRONG', 100, 645, { font: NARROW, size: 48, color: INK }); }, 1.6);
  slam(g, a.in(a.w(/^air/i), 0.1), 500, 955, () => { box(g, 60, 900, 900, 110, PAPER); text(g, 'PLANES IN THE AIR', 90, 985, { font: NARROW, size: 88, color: INK }); }, 1.4);
  slam(g, a.in(a.start + 0.2, 0.06), 1700, 980, () => rubber(g, 'REPORTED', 1700, 1000, { size: 50, rot: -0.06 }), 1.6);
  stamp(g, 'REPORTED 2026-09-18', PAPER, 'PC2.1   CNN, 4 SOURCES · “THIS SPRING” · CHINESE SHIP, MIDDLE EAST');
}

// PC2.2 (70.05 s): someone caught it. The check draws on "caught"; the next box stays empty.
export function fCaught(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, PAPER);
  const row = (y, at, label, sub, subAt, check) => {
    wipe(g, a.in(at, 0.12), 150, y - 10, 1500, 180, () => {
      outline(g, 160, y, 150, 150, INK, 10);
      text(g, label, 380, y + 120, { font: NARROW, size: 130, color: INK });
    });
    if (check) {
      const u = a.full ? 1 : a.in(check, 0.2);
      if (u > 0) {
        g.save(); g.strokeStyle = INK; g.lineWidth = 22; g.lineCap = 'square'; g.beginPath();
        g.moveTo(190, y + 80);
        if (u < 0.35) g.lineTo(190 + 35 * (u / 0.35), y + 80 + 40 * (u / 0.35));
        else { g.lineTo(225, y + 120); g.lineTo(225 + 65 * ((u - 0.35) / 0.65), y + 120 - 90 * ((u - 0.35) / 0.65)); }
        g.stroke(); g.restore();
      }
    }
    if (sub) wipe(g, a.in(subAt, 0.3), 380, y + 140, 1000, 40, () => text(g, sub, 384, y + 170, { font: MONO, size: 28, color: GREY }));
  };
  row(200, a.start - 0.05, 'HUMAN CHECK', 'ERROR CAUGHT BEFORE THE BOARDING', a.w(/^time/i), a.w(/^caught/i));
  row(560, a.w(/^next/i), 'NEXT TIME', '', 0, 0);
  wipe(g, a.in(a.w(/^there/i), 0.4), 380, 700, 900, 14, () => box(g, 380, 700, 900, 14, RED));
  stamp(g, '', INK, 'PC2.2 · BAND STOPS');
}
