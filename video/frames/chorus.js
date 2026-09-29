// The four choruses: same lines, four visibly different artefacts, escalating.
// n = 1..4. Palette drift: 1 paper, 2 black, 3 red, 4 everything.
import { INK, PAPER, GREY, RED, W, H, SANS, NARROW, SERIF, MONO, rng, canvas, dither, tear, clipBand, speckle, text, box, outline, rubber, stamp, satDataCenter, campusSource, timeline, droste, wrap, FULL, slam, wipe, memo } from '../lib.js';
import { fChorus } from './core.js';

const NOUN = ['', 'FINISH', 'DEADLINE', 'RED LINE', 'CLIFF EDGE'];
const GROUND = ['', PAPER, INK, RED, INK];
const FG = ['', INK, PAPER, INK, PAPER];

// "Zoom, zoom, zoom!": title cards slam in, one per sung "zoom". More panes each time.
export function chZoom(g, ctx, t, n, a = FULL) {
  const panes = [0, 1, 4, 16, 1][n];
  box(g, 0, 0, W, H, n === 1 ? PAPER : GROUND[n]);
  const side = Math.sqrt(panes);
  const pw = W / side, ph = H / side;
  const z0 = a.w(/^zoom/i), z1 = a.w(/^zoom/i, z0 + 0.05), z2 = a.w(/^zoom/i, z1 + 0.05);
  const zt = [z0, z1, z2];
  for (let j = 0; j < side; j++) for (let i = 0; i < side; i++) {
    const x = i * pw, y = j * ph, s = 1 / side;
    const k = (i + j * side) % 3;
    const inv = (i + j) % 2 === 1 && n >= 2;
    box(g, x, y, pw, ph, inv ? (n === 3 ? INK : PAPER) : GROUND[n]);
    const words = n === 4 ? ['ZOOM', 'ZOOM'] : ['ZOOM', 'ZOOM', 'ZOOM'];
    words.forEach((wd, q) => {
      const sc = [0.8, 1.25, 0.6][q] * s;
      const cx = x + pw * [0.2, 0.52, 0.84][q] + (n === 4 ? pw * 0.12 : 0);
      const cy = y + ph * [0.42, 0.56, 0.4][q];
      slam(g, a.in(zt[q] + ((i + j) % 4) * 0.02, 0.09), cx, cy, () => {
        box(g, cx - 260 * sc, cy - 150 * sc, 520 * sc, 220 * sc, inv ? GROUND[n] : FG[n]);
        text(g, wd, cx, cy + 40 * sc, { font: SERIF, size: 190 * sc, color: inv ? FG[n] : GROUND[n], align: 'center', sx: 0.72 });
      }, 1.7);
    });
    if (k === 1 && n === 3 && a.full) tear(g, 700 + i + j * 4, 2, 60 * s, y, y + ph);
  }
  if (n >= 2 && a.full) tear(g, 710 + n, 6 * n, 40 * n, 0, H);
  stamp(g, ['', '2026-04', '2026-07', '2026-09', '2026-09-27'][n], n === 1 ? INK : PAPER, `CH${n}`);
  speckle(g, 720 + n + (a.full ? 0 : Math.floor(a.t * 12)), 0.001 * n);
}

// "Seven hundred billion, nobody steering." The STEERING field is always blank.
function steering(g, x, y, fg, bg, scale = 1) {
  box(g, x, y, 820 * scale, 90 * scale, bg);
  text(g, 'STEERING:', x + 24 * scale, y + 64 * scale, { font: MONO, size: 52 * scale, color: fg });
  box(g, x + 380 * scale, y + 36 * scale, 400 * scale, 12 * scale, fg);
}

export function chCapex(g, ctx, t, n, a = FULL) {
  if (n === 1) return fChorus(g, a);
  if (n === 2) {
    // Big Four 2026 capex guidance after the July calls. The bars grow to scale on the a cappella words;
    // the total slams when the band comes back on "nobody".
    box(g, 0, 0, W, H, INK);
    const sc = 1250 / 220;
    const rows = [['AMAZON', 220, 220, '~$220B · JUL 30'], ['ALPHABET', 195, 205, '$195–205B · JUL 22'], ['MICROSOFT', 175, 175, '~$175B · JUL 29'], ['META', 130, 145, '$130–145B · JUL 29']];
    const tS = a.w(/^seven/i), tH = a.w(/^hundred/i), tB = a.w(/^billion/i), tN = a.w(/^nobody/i);
    const at = [tS, tH, tB, tB + 0.35];
    text(g, 'BIG FOUR · 2026 CAPEX GUIDANCE AFTER THE JULY CALLS', 60, 150, { font: MONO, size: 30, color: PAPER });
    rows.forEach(([name, lo, hi], i) => {
      const y = 200 + i * 150, u = a.full ? 1 : a.in(at[i], 0.35);
      text(g, name, 60, y + 40, { font: MONO, size: 26, color: GREY });
      box(g, 60, y + 56, lo * sc * u, 64, i === 0 ? RED : PAPER);
      if (hi > lo && u >= 1) box(g, 60 + lo * sc, y + 56, (hi - lo) * sc, 64, GREY);
    });
    if (a.full) tear(g, 802, 8, 60, 200, 800);
    rows.forEach(([, , hi, lab], i) => wipe(g, a.in(at[i] + 0.3, 0.15), 60 + hi * sc + 20, 200 + i * 150 + 50, 560, 70, () => text(g, lab, 60 + hi * sc + 24, 200 + i * 150 + 108, { font: NARROW, size: 60, color: PAPER })));
    slam(g, a.in(tN, 0.12), 380, 940, () => text(g, '$720–745B', 60, 1000, { font: NARROW, size: 150, color: RED }), 1.9);
    wipe(g, a.in(a.w(/^steering/i), 0.3), 1000, 900, 820, 90, () => steering(g, 1000, 900, INK, PAPER));
    stamp(g, '2026-07', PAPER, 'CH2   SEC FILINGS · EARNINGS CALLS');
    return speckle(g, 803 + (a.full ? 0 : Math.floor(a.t * 12)), 0.0014);
  }
  if (n === 3) {
    // Alphabet's Q2: the capex outran the cash. The number lands when the band slams back on "nobody".
    box(g, 0, 0, W, H, RED);
    const bg = memo('ch3campus', 960, 540, (m) => dither(m, campusSource(33), 0, 0, 960, 540, { ink: INK, paper: RED, contrast: 1.5 }));
    wipe(g, a.in(a.start, 0.3), 960, 0, 960, 540, () => g.drawImage(bg, 960, 0), true);
    if (a.full) tear(g, 813, 14, 160, 0, 560);
    wipe(g, a.in(a.w(/^seven/i), 0.2), 50, 125, 800, 45, () => text(g, 'ALPHABET · Q2 2026', 60, 160, { font: MONO, size: 34, color: INK }));
    wipe(g, a.in(a.w(/^hundred/i), 0.3), 50, 190, 1000, 130, () => text(g, 'FREE CASH FLOW', 60, 300, { font: NARROW, size: 130, color: INK }));
    slam(g, a.in(a.w(/^nobody/i), 0.1), 500, 470, () => text(g, '−$5,855M', 40, 560, { font: NARROW, size: 260, color: INK }), 1.9);
    wipe(g, a.in(a.w(/^nobody/i) + 0.3, 0.3), 50, 600, 1300, 40, () => text(g, 'FROM ITS 8-K · REPORTEDLY THE FIRST NEGATIVE QUARTER SINCE THE 2004 IPO', 60, 630, { font: MONO, size: 24, color: INK }));
    wipe(g, a.in(a.w(/^billion/i), 0.2), 60, 690, 1300, 110, () => { box(g, 60, 690, 1300, 110, INK); text(g, 'JUN 1: AN $80B EQUITY RAISE FOR AI CAPEX', 90, 765, { font: NARROW, size: 64, color: RED, sx: 0.9 }); });
    wipe(g, a.in(a.w(/^steering/i), 0.3), 60, 900, 820, 90, () => steering(g, 60, 900, RED, INK));
    stamp(g, '2026-07-22', INK, 'CH3');
    return speckle(g, 814 + (a.full ? 0 : Math.floor(a.t * 12)), 0.0016);
  }
  // n === 4: every capex frame at once, one strip per a cappella word; STEERING slams when the band returns.
  box(g, 0, 0, W, H, INK);
  const c1 = canvas(W, H); fChorus(c1.getContext('2d'));
  const c2 = canvas(W, H); chCapex(c2.getContext('2d'), ctx, t, 2);
  const c3 = canvas(W, H); chCapex(c3.getContext('2d'), ctx, t, 3);
  const at = [a.w(/^seven/i), a.w(/^hundred/i), a.w(/^billion/i)];
  [c1, c2, c3].forEach((c, k) => wipe(g, a.in(at[k], 0.12), 0, (k * H) / 3, W, H / 3, () => g.drawImage(c, 0, (k * H) / 3, W, H / 3, 0, (k * H) / 3, W, H / 3)));
  if (a.full) tear(g, 824, 30, 260, 0, H);
  slam(g, a.in(a.w(/^nobody/i), 0.1), 160 + 780, 420 + 85, () => steering(g, 160, 420, INK, PAPER, 1.9), 1.8);
  stamp(g, '2026-09-27', PAPER, 'CH4');
  speckle(g, 825 + (a.full ? 0 : Math.floor(a.t * 12)), 0.002);
}

// "Pause ripped out, the ___ is nearing": the pause line is struck on "ripped"; the timeline draws out to 2028.
export function chPause(g, ctx, t, n, a = FULL) {
  const bg = GROUND[n], fg = FG[n];
  box(g, 0, 0, W, H, bg);
  const m = (y, mo) => ((y - 2026) * 12 + (mo - 1)) / 26; // Jan 2026 .. Mar 2028
  const now = [0, m(2026, 4), m(2026, 7), m(2026, 9), m(2026, 9.9)][n];
  const tPause = a.w(/^pause/i), tRip = a.w(/^ripped/i), tOut = a.w(/^out/i), tNear = a.w(/^nearing/i);
  const tNoun = a.w([0, /^finish/i, /^deadline/i, /^red$/i, /^cliff/i][n]);
  wipe(g, a.in(a.start - 0.05, 0.16), 60, 90, 910, 270, () => {
    sheet2(g, 60, 90, 900, 260, n === 3 ? PAPER : n === 2 ? '#1c1c1a' : '#E0DED6');
    text(g, 'ANTHROPIC RSP v2.1 · §6.2', 90, 150, { font: MONO, size: 28, color: n === 2 ? PAPER : INK });
    text(g, 'GONE IN v3.0 · EFFECTIVE 2026-02-24', 90, 190, { font: MONO, size: 22, weight: 'normal', color: n === 2 ? GREY : INK });
  }, true);
  slam(g, a.in(tPause, 0.1), 500, 270, () => text(g, '“we will pause training until…”', 90, 290, { font: SERIF, size: 70, color: n === 2 ? PAPER : INK }), 1.25);
  wipe(g, a.in(tRip, 0.22), 80, 262, 840, 12, () => box(g, 80, 262, 840, 12, RED));
  // Timeline: the rule draws left to right from "out"; ticks appear as it passes them.
  const x0 = 100, w = 1600, y = 640;
  const items = [
    { x01: m(2026, 2.8), label: 'PAUSE REMOVED', sub: 'FEB 24' },
    { x01: now, label: 'NOW', sub: ['', 'APR 2026', 'JUL 2026', 'SEP 2026', 'SEP 27, 2026'][n], color: n === 3 ? PAPER : RED, below: true },
  ];
  if (n >= 3) items.push({ x01: m(2027, 11), label: 'AUTOMATED CODER?', sub: 'MEDIAN, KOKOTAJLO (AUG 16)', size: 20, tier: 1 });
  items.push({ x01: 1, label: 'AUTOMATED AI RESEARCHER', sub: 'OPENAI TARGET · MAR 2028', size: 24 });
  const u = a.in(tOut, 0.9);
  box(g, x0, y - 3, w * u, 6, fg);
  for (const it of items) if (it.x01 <= u + 1e-6) timeline(g, x0, y, w, [it], { color: fg, lw: 0 });
  wipe(g, a.in(tNear, 0.35), x0 + now * w, y - 3, (1 - now) * w, 6, () => box(g, x0 + now * w, y - 3, (1 - now) * w, 6, RED));
  if (n === 4) wipe(g, a.in(tNear + 0.3, 0.3), x0 + w, y - 3, 6, 400, () => box(g, x0 + w, y - 3, 6, 400, fg), true);
  slam(g, a.in(tNoun, 0.12), W - 400, 940, () => text(g, NOUN[n], W - 60, 1010, { font: NARROW, size: [0, 220, 220, 240, 260][n], color: n === 3 ? INK : RED, align: 'right' }), 1.7);
  slam(g, a.in(tNear, 0.1), 200, 1000, () => text(g, 'IS NEARING', 60, 1010, { font: MONO, size: 30, color: fg }));
  if (n >= 2 && a.full) tear(g, 830 + n, 6 * n, 30 * n, 560, 740);
  stamp(g, '', fg, `CH${n}`);
  speckle(g, 834 + n + (a.full ? 0 : Math.floor(a.t * 12)), 0.0012);
}
function sheet2(g, x, y, w, h, fill) { box(g, x + 10, y + 10, w, h, INK); box(g, x, y, w, h, fill); }

// "Ship it half-tested, swear it's aligned."
export function chShip(g, ctx, t, n, a = FULL) {
  if (n === 1) {
    box(g, 0, 0, W, H, INK);
    const up = a.in(a.start - 0.05, 0.14);
    g.save(); g.translate(0, (1 - up) * 700);
    sheet2(g, 560, 70, 800, 940, PAPER);
    text(g, 'PRE-RELEASE CHECKS', 620, 160, { font: MONO, size: 34, color: INK });
    box(g, 620, 185, 680, 4, INK);
    const tShip = a.w(/^ship/i), half = ctx.audio.beat_period / 2;
    for (let i = 0; i < 10; i++) {
      const y = 240 + i * 72;
      outline(g, 620, y, 44, 44, INK, 4);
      const on = a.in(tShip + i * half, 0.05);
      if (i < 5 && on > 0) { text(g, '✓', 628, y + 40, { font: SANS, size: 44, color: INK }); }
      box(g, 690, y + 14, 180 + ((i * 97) % 380), 16, i < 5 && on > 0 ? INK : '#C9C7BF');
    }
    g.restore();
    slam(g, a.in(a.w(/^aligned/i), 0.12), 1130, 660, () => rubber(g, 'ALIGNED', 1130, 700, { size: 120, rot: -0.16 }), 2.2);
    stamp(g, '', PAPER, 'CH1');
    return speckle(g, 841, 0.001);
  }
  if (n === 2) {
    box(g, 0, 0, W, H, INK);
    wipe(g, a.in(a.start, 0.25), 50, 165, 1800, 45, () => text(g, 'OUTSIDE EVALUATORS “lack the time and model access” — IAPS', 60, 200, { font: MONO, size: 30, color: GREY }));
    if (a.full) tear(g, 851, 6, 60, 0, 200);
    slam(g, a.in(a.w(/^half/i), 0.08), 700, 350, () => text(g, 'APOLLO WITH ASTRA: 3 DAYS', 50, 400, { font: NARROW, size: 150, color: PAPER, sx: 0.85 }), 1.5);
    slam(g, a.in(a.w(/^half/i) + 0.25, 0.08), 700, 550, () => text(g, 'SECUREBIO: 6 DAYS (4 BUSINESS)', 50, 590, { font: NARROW, size: 120, color: PAPER, sx: 0.85 }), 1.5);
    wipe(g, a.in(a.w(/^swear/i), 0.15), 60, 700, 1100, 150, () => {
      box(g, 60, 700, 1100, 150, RED);
      text(g, 'APOLLO ON OPUS 4.6: “no formal assessment”', 90, 790, { font: NARROW, size: 64, color: INK, sx: 0.9 });
      text(g, 'OPUS 4.6 SYSTEM CARD §6.2.7', 90, 830, { font: MONO, size: 24, color: INK });
    });
    slam(g, a.in(a.w(/^aligned/i), 0.08), 1540, 770, () => rubber(g, 'ALIGNED', 1540, 800, { size: 110, rot: 0.1 }), 2.3);
    stamp(g, '', PAPER, 'CH2');
    return speckle(g, 852 + (a.full ? 0 : Math.floor(a.t * 12)), 0.0014);
  }
  if (n === 3) {
    box(g, 0, 0, W, H, RED);
    // Training environments: about half had exploitable holes. The grid fills fast; ALIGNED stamps anyway.
    const n200 = a.full ? 200 : Math.floor(200 * Math.min(1, Math.max(0, (a.t - a.start) / 0.6)));
    for (let i = 0; i < n200; i++) {
      const x = 960 + (i % 20) * 46, y = 100 + Math.floor(i / 20) * 46;
      if ((i * 7919) % 200 < 100) box(g, x, y, 38, 38, INK);
      else outline(g, x + 2, y + 2, 34, 34, INK, 3);
    }
    if (a.full) tear(g, 861, 16, 160, 0, H);
    slam(g, a.in(a.w(/^half/i), 0.1), 330, 260, () => text(g, '~HALF', 50, 360, { font: NARROW, size: 300, color: INK }), 1.8);
    wipe(g, a.in(a.w(/^half/i) + 0.2, 0.3), 50, 400, 900, 100, () => wrap(g, 'OF ITS COMPUTER-USE TRAINING ENVIRONMENTS WERE HACKABLE', 60, 440, 820, { size: 34, color: INK }));
    wipe(g, a.in(a.w(/^swear/i), 0.2), 50, 575, 900, 35, () => text(g, 'MYTHOS 5.1 SYSTEM CARD §6.3.2', 60, 600, { font: MONO, size: 24, color: INK }));
    text(g, 'EACH SQUARE IS ILLUSTRATIVE', 960, 620, { font: MONO, size: 18, color: INK });
    slam(g, a.in(a.w(/^aligned/i), 0.08), 1400, 860, () => rubber(g, 'ALIGNED', 1400, 900, { size: 150, rot: -0.08, color: INK }), 2.3);
    stamp(g, '', INK, 'CH3');
    return speckle(g, 862 + (a.full ? 0 : Math.floor(a.t * 12)), 0.0016);
  }
  // n === 4: the launch line, over the rating.
  box(g, 0, 0, W, H, INK);
  slam(g, a.in(a.start, 0.08), W / 2, 460, () => text(g, 'CRITICAL', W / 2, 640, { font: NARROW, size: 520, color: '#2a0a0a', align: 'center' }), 1.3);
  if (a.full) tear(g, 871, 26, 240, 0, H);
  wipe(g, a.in(a.w(/^half/i), 0.12), 120, 360, 1680, 300, () => box(g, 120, 360, 1680, 300, PAPER), true);
  wipe(g, a.in(a.w(/^half/i) + 0.1, 0.25), 150, 400, 1600, 100, () => text(g, '“the world’s most intelligent', 170, 480, { font: SERIF, size: 92, color: INK }));
  wipe(g, a.in(a.w(/^swear/i), 0.25), 150, 510, 1600, 100, () => text(g, 'and aligned model”', 170, 590, { font: SERIF, size: 92, color: INK }));
  wipe(g, a.in(a.w(/^aligned/i), 0.3), 110, 695, 1700, 40, () => text(g, 'GPT-6 ASTRA LAUNCH, SEP 3 · DAYS AFTER ITS OWN MAKER RATED IT CRITICAL FOR CYBER', 120, 720, { font: MONO, size: 24, color: PAPER }));
  stamp(g, '2026-09-27', PAPER, 'CH4');
  speckle(g, 872 + (a.full ? 0 : Math.floor(a.t * 12)), 0.002);
}

// "China's just months off, can't fall behind." (Sung three times; the final chorus swaps the line.)
export function chChina(g, ctx, t, n, a = FULL) {
  if (n === 1) {
    box(g, 0, 0, W, H, PAPER);
    const bp = ctx.audio.beat_period, tMon = a.w(/^months/i), tBeh = a.w(/^behind/i);
    wipe(g, a.in(a.start - 0.05, 0.12), 60, 80, 1010, 630, () => sheet2(g, 60, 80, 1000, 620, INK));
    slam(g, a.in(a.w(/^china/i), 0.1), 400, 200, () => text(g, 'DEEPSEEK V4', 100, 250, { font: NARROW, size: 170, color: PAPER }), 1.5);
    const spec = [['RELEASED 2026-04-24 · OPEN WEIGHTS · MIT LICENSE', 320, 28, PAPER], ['V4-PRO: 1.6T PARAMETERS, 49B ACTIVE', 420, 34, PAPER], ['1M-TOKEN CONTEXT', 480, 34, PAPER], ['RUNS ON HUAWEI ASCEND', 540, 34, RED]];
    spec.forEach(([s, y, sz, c], k) => wipe(g, a.in(a.start + 0.15 + k * bp / 2, 0.12), 100, y - sz, 900, sz + 12, () => text(g, s, 100, y, { font: MONO, size: sz, color: c })));
    const x0 = 60, px = 240;
    wipe(g, a.in(tMon - 0.25, 0.25), 0, 780, 1600, 160, () => {
      text(g, 'ITS OWN TECH REPORT: BEHIND THE FRONTIER BY', 60, 820, { font: MONO, size: 28, color: INK });
      for (let mo = 0; mo <= 6; mo++) { box(g, x0 + mo * px, 850, 3, 40, INK); text(g, `${mo}`, x0 + mo * px, 925, { font: MONO, size: 24, color: INK, align: 'center' }); }
      box(g, x0, 868, 6 * px, 4, INK);
    });
    wipe(g, a.in(tMon, 0.3), x0 + 3 * px, 855, 3 * px, 30, () => box(g, x0 + 3 * px, 855, 3 * px, 30, RED));
    slam(g, a.in(tBeh, 0.1), x0 + 3 * px + 300, 980, () => text(g, '“approximately 3 to 6 months”', x0 + 3 * px, 1000, { font: SERIF, size: 54, color: RED }), 1.4);
    stamp(g, '2026-04-24', INK, 'CH1');
    return speckle(g, 881);
  }
  if (n === 2) {
    box(g, 0, 0, W, H, INK);
    if (a.full) tear(g, 892, 24, 180, 0, H);
    slam(g, a.in(a.w(/^months/i), 0.1), 560, 400, () => text(g, '$3.48', 30, 560, { font: NARROW, size: 500, color: RED }), 1.9);
    wipe(g, a.in(a.w(/^off/i), 0.2), 50, 625, 1300, 45, () => text(g, 'PER 1M OUTPUT TOKENS · DEEPSEEK V4-PRO', 60, 660, { font: MONO, size: 34, color: PAPER }));
    wipe(g, a.in(a.w(/^behind/i), 0.2), 50, 685, 1300, 45, () => text(g, 'OPEN WEIGHTS · ANYONE CAN RUN IT', 60, 720, { font: MONO, size: 34, color: GREY }));
    stamp(g, '2026-04-24', PAPER, 'CH2');
    return speckle(g, 895 + (a.full ? 0 : Math.floor(a.t * 12)), 0.0015);
  }
  if (n === 3) {
    box(g, 0, 0, W, H, RED);
    if (a.full) tear(g, 893, 36, 270, 0, H);
    slam(g, a.in(a.w(/^months/i), 0.1), 350, 450, () => text(g, '~4', 20, 700, { font: NARROW, size: 620, color: INK }), 1.9);
    slam(g, a.in(a.w(/^off/i), 0.08), 1100, 630, () => text(g, 'MONTHS', 760, 700, { font: NARROW, size: 200, color: INK }), 1.5);
    wipe(g, a.in(a.w(/^behind/i), 0.3), 50, 765, 1500, 45, () => text(g, 'OPEN-WEIGHT MODELS BEHIND CLOSED ONES, JAN–MAY 2026 · EPOCH AI', 60, 800, { font: MONO, size: 30, color: INK }));
    stamp(g, '2026', INK, 'CH3');
    return speckle(g, 896 + (a.full ? 0 : Math.floor(a.t * 12)), 0.0015);
  }
  // n === 4 sings "This is the finish, who's left behind?" instead.
  box(g, 0, 0, W, H, PAPER);
  wipe(g, a.in(a.start, 0.2), 50, 165, 1700, 45, () => text(g, 'ENTRY-LEVEL JOB POSTINGS, SINCE JAN 2023 · REVELIO LABS', 60, 200, { font: MONO, size: 34, color: INK }));
  slam(g, a.in(a.w(/^finish/i), 0.1), 560, 450, () => text(g, '−35%', 20, 640, { font: NARROW, size: 520, color: INK }), 1.8);
  wipe(g, a.in(a.w(/^who/i), 0.15), 1180, 150, 680, 560, () => {
    box(g, 1180, 150, 680, 560, INK);
    wrap(g, 'AI: THE TOP STATED LAYOFF REASON THIS YEAR', 1220, 250, 600, { font: NARROW, size: 84, color: PAPER, lh: 1.05 });
    text(g, '116,175 CUTS, JAN–AUG · CHALLENGER', 1220, 660, { font: MONO, size: 26, color: RED });
  }, true);
  if (a.full) tear(g, 901, 10, 80, 820, 1040);
  slam(g, a.in(a.w(/^behind/i), 0.1), 700, 920, () => text(g, 'WHO’S LEFT BEHIND?', 60, 980, { font: NARROW, size: 170, color: RED }), 1.6);
  stamp(g, '2026-09-27', INK, 'CH4');
  speckle(g, 902 + (a.full ? 0 : Math.floor(a.t * 12)));
}

// "Zoom, zoom, zoom, add a point to my p(doom)!": the band stops; the chorus falls into itself.
export function chHook(g, ctx, t, n, renderChorusCapex) {
  const src = renderChorusCapex(n);
  box(g, 0, 0, W, H, INK);
  const depth = [0, 3, 5, 8, 14][n];
  droste(g, src, depth, [0, 0.6, 0.66, 0.72, 0.8][n], W / 2, H / 2, n === 3 ? INK : PAPER);
  if (n >= 3) tear(g, 910 + n, 10 * n, 30 * n, 0, H);
  stamp(g, '', PAPER, `CH${n} · BAND STOPS · VOICE ALONE`);
}
