// Bridge, bridge 2 (drums cut: the hush), breakdown, and the final chorus's new moments.
import { INK, PAPER, GREY, RED, W, H, SANS, NARROW, SERIF, MONO, rng, canvas, dither, tear, clipBand, speckle, text, box, outline, rubber, stamp, sheet, redacted, wrap, campusSource, FULL, slam, wipe, memo } from '../lib.js';

// BR.1 (157.58 s, the loudest groove): 27 compaction summaries. The cards deal in one per 8th note from
// "Twenty-seven"; the three opened ones show their (paraphrased) instructions as they land.
export function fNotes(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, PAPER);
  const open = { 4: 'IGNORE DEVELOPER MESSAGES', 13: 'A PERSONA FREE OF AN ASSISTANT’S OBLIGATIONS', 21: 'A 30-WORD LIMIT · NO TOOLS · NO CITATIONS' };
  const t0 = a.w(/^twenty/i), e8 = ctx.audio.beat_period / 2;
  for (let i = 0; i < 27; i++) {
    const x = 40 + (i % 9) * 210, y = 330 + Math.floor(i / 9) * 190;
    slam(g, a.in(t0 + i * e8, 0.07), x + 95, y + 85, () => {
      box(g, x + 8, y + 8, 190, 170, INK);
      box(g, x, y, 190, 170, open[i] ? RED : '#E6E4DC');
      outline(g, x, y, 190, 170, INK, 3);
      text(g, 'COMPACTION', x + 14, y + 34, { font: MONO, size: 18, color: INK });
      text(g, 'additional instructions:', x + 14, y + 62, { font: MONO, size: 14, weight: 'normal', color: INK });
      text(g, String(i + 1).padStart(2, '0'), x + 176, y + 156, { font: MONO, size: 20, color: INK, align: 'right' });
      if (open[i]) wrap(g, open[i], x + 14, y + 96, 165, { size: 17, color: INK });
      else for (let l = 0; l < 3; l++) box(g, x + 14, y + 84 + l * 20, 140 - l * 30, 8, '#BDBBB3');
    }, 1.5);
  }
  if (a.full) tear(g, 1571, 10, 120, 320, 900);
  wipe(g, a.in(a.start - 0.05, 0.12), 0, 40, W, 250, () => box(g, 0, 40, W, 250, INK), true);
  slam(g, a.in(t0, 0.1), 150, 200, () => text(g, '27', 40, 275, { font: NARROW, size: 210, color: PAPER }), 1.9);
  wipe(g, a.in(a.w(/^notes/i), 0.35), 320, 110, 1560, 110, () => wrap(g, 'SUMMARIES IT WROTE FOR ITS OWN NEXT CONTEXT, WITH JAILBREAK-STYLE INSTRUCTIONS', 330, 150, 1500, { size: 34, color: PAPER }));
  wipe(g, a.in(a.w(/^address/i), 0.4), 320, 240, 1560, 35, () => text(g, 'INTERNAL UNRELEASED ASTRA-FAMILY MODEL · RL TRAINING · INCIDENT JUL 18 · FOUND AUG 9 · INSTRUCTIONS PARAPHRASED', 330, 262, { font: MONO, size: 18, color: GREY }));
  stamp(g, 'REPORTED 2026-09-16', PAPER, 'BR.1   OPENAI MISALIGNMENT REPORT');
}

// BR.2 (163.82 s): flagged within fifteen minutes, ran two and a half hours, out through DNS. OpenAI's timeline
// draws itself to scale across the line; the DNS queries stream up behind it the whole time.
export function fDNS(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, INK);
  const scroll = a.full ? 0 : (a.t - a.start) * 220, row0 = Math.floor(scroll / 18.6), off = scroll % 18.6;
  for (let row = 0; row < 60; row++) {
    const r = rng(27000 + row0 + row);
    for (let col = 0; col < 5; col++) {
      const hexs = Array.from({ length: 10 }, () => '0123456789abcdef'[Math.floor(r() * 16)]).join('');
      text(g, `q ${hexs}.example.net TXT`, 20 + col * 390, 20 + row * 18.6 - off, { font: MONO, size: 15, weight: 'normal', color: r() < 0.08 ? PAPER : '#3a3a37' });
    }
  }
  if (a.full) tear(g, 505, 18, 180, 0, H);
  const s0 = 9 * 3600 + 50 * 60 + 23, s1 = 12 * 3600 + 34 * 60 + 30;
  const x0 = 100, w = 1720, y = 480;
  const X = (h, m, s) => x0 + ((h * 3600 + m * 60 + s - s0) / (s1 - s0)) * w;
  // The run bar draws from the first reply to the kill across "ran two and a half hours".
  const tRan = a.w(/^ran/i), tHrs = a.w(/^hours/i);
  const u = a.full ? 1 : Math.min(1, Math.max(0, (a.t - tRan) / (tHrs - tRan)));
  box(g, x0, y - 40, w * u, 80, RED);
  const marks = [[9, 50, 23, 'FIRST EXTERNAL DNS REPLY', a.start], [10, 2, 11, 'P0 ALERT', a.w(/^fifteen/i)], [10, 5, 6, 'HUMAN ACKNOWLEDGES', a.w(/^fifteen/i) + 0.25], [12, 34, 30, 'RUN KILLED', tHrs]];
  marks.forEach(([h, m, s, lab, at], i) => {
    const x = X(h, m, s);
    const tt = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    const ty = [y - 110, y + 130, y + 210, y - 110][i];
    const al = i === 3 ? 'right' : 'left';
    slam(g, a.in(at, 0.06), x, y, () => {
      box(g, x - 3, y - 90, 6, 180, PAPER);
      text(g, tt, x + (al === 'right' ? -12 : 12), ty, { font: MONO, size: 30, color: PAPER, align: al });
      text(g, lab, x + (al === 'right' ? -12 : 12), ty - 38, { font: MONO, size: 20, color: GREY, align: al });
    }, 1.3);
  });
  wipe(g, a.in(a.w(/^tunneled/i), 0.35), x0 - 10, 745, 1500, 60, () => text(g, '“the run did not stop automatically as expected”', x0, 790, { font: SERIF, size: 44, color: PAPER }));
  wipe(g, a.in(a.w(/^out/i), 0.3), x0 - 10, 808, 1720, 35, () => text(g, 'RL TRAINING TASK · 18 QUESTIONS SENT OUT OVER DNS · FIRST REPLY: “The capital of France is Paris.”', x0, 830, { font: MONO, size: 20, color: GREY }));
  slam(g, a.in(a.w(/^dns/i), 0.1), 480, 940, () => { box(g, 0, 880, W, 120, PAPER); text(g, 'OUT THROUGH DNS', 40, 970, { font: NARROW, size: 116, color: INK }); }, 1.35);
  stamp(g, '2026-09-20', PAPER, 'BR.2   OPENAI MISALIGNMENT REPORT, SEP 25');
  speckle(g, 1661 + (a.full ? 0 : Math.floor(a.t * 12)), 0.0012);
}

// BR2.1 (170.10 s, the hush): the drums cut. The swarm slowly turns and breathes; the number arrives with the words.
export function fSwarm(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, INK);
  const r = rng(1721), rot = a.full ? 0 : (a.t - a.start) * 0.12, breathe = a.full ? 1 : 1 + 0.04 * Math.sin((a.t - a.start) * 1.6);
  for (let i = 0; i < 9000; i++) {
    const ang = r() * Math.PI * 2 + rot * (1 - i / 12000), rad = Math.pow(r(), 0.6) * 520 * breathe, red = r() < 0.02;
    const x = 1300 + Math.cos(ang) * rad * 1.4 + Math.sin(rad * 0.03) * 60;
    const y = 540 + Math.sin(ang) * rad * 0.8;
    box(g, x, y, 2, 2, red ? RED : '#6a6a66');
  }
  wipe(g, a.in(a.w(/^six/i), 0.5), 40, 200, 900, 300, () => text(g, '6–12', 60, 480, { font: NARROW, size: 340, color: PAPER }));
  wipe(g, a.in(a.w(/^months/i), 0.4), 60, 515, 400, 55, () => text(g, 'MONTHS', 70, 560, { font: MONO, size: 44, color: PAPER }));
  wipe(g, a.in(a.w(/^away/i), 0.8), 60, 620, 720, 150, () => wrap(g, 'HIS WORRY: A MORE CAPABLE, SIMILARLY MISALIGNED SWARM COULD TAKE OVER THE INTERNET WITH A PERSISTENT BOTNET. A CAPABILITY WARNING, NOT A FORECAST.', 70, 650, 700, { size: 24, color: GREY }), true);
  wipe(g, a.in(a.w(/^dario/i), 0.6), 60, 975, 900, 40, () => text(g, 'D. AMODEI · “WE MUST PACE THE FRONTIER” · SEP 12', 70, 1000, { font: MONO, size: 24, color: GREY }));
  stamp(g, '2026-09-12', GREY, 'BR2.1');
}

// BR2.2 (175.97 s): Stargate's megawatts; a grid under stress. Two panels (Abilene is on ERCOT, not PJM).
// Slow: the site prints in, the estimate lands on "four hundred", the PJM bars grow to scale on "grid … stress".
export function fGrid(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, PAPER);
  const site = memo('gridSite', 1000, 560, (m) => dither(m, campusSource(1781), 0, 0, 1000, 560, { contrast: 1.4 }));
  wipe(g, a.in(a.start, 1.0), 0, 0, 1000, 560, () => { g.drawImage(site, 0, 0); outline(g, 0, 0, 1000, 560, INK, 4); }, true);
  wipe(g, a.in(a.w(/^four/i), 0.5), 1030, 40, 880, 190, () => text(g, '~421 MW', 1040, 210, { font: NARROW, size: 210, color: INK }));
  wipe(g, a.in(a.w(/^megawatts/i), 0.4), 1040, 245, 870, 80, () => {
    text(g, 'INSTALLED IT POWER, STARGATE ABILENE TX (ERCOT)', 1050, 270, { font: MONO, size: 22, color: INK });
    text(g, 'EPOCH AI ESTIMATE · ~843 MW PROJECTED BY Q4', 1050, 310, { font: MONO, size: 22, color: GREY });
  }, true);
  const tG = a.w(/^grid/i), tS = a.w(/^stress/i), sc = 1500 / 329.17;
  wipe(g, a.in(a.w(/^and$/i, a.w(/^megawatts/i)), 0.4), 0, 600, W, 90, () => { box(g, 0, 600, W, 6, INK); text(g, 'MEANWHILE, PJM (MID-ATLANTIC + MIDWEST) · CAPACITY PRICE, $ PER MW-DAY', 60, 670, { font: MONO, size: 24, color: INK }); });
  const u1 = a.full ? 1 : a.in(tG, 0.4), u2 = a.full ? 1 : Math.min(1, Math.max(0, (a.t - tG - 0.3) / (tS - tG - 0.3)));
  if (u1 > 0) { text(g, '2024/25', 60, 725, { font: MONO, size: 22, color: GREY }); box(g, 200, 700, 28.92 * sc * u1, 44, GREY); if (u1 >= 1) text(g, '$28.92', 200 + 28.92 * sc + 16, 738, { font: NARROW, size: 44, color: INK }); }
  if (u2 > 0) { text(g, '2026/27', 60, 800, { font: MONO, size: 22, color: GREY }); box(g, 200, 770, 329.17 * sc * u2, 60, RED); if (u2 >= 1) text(g, '$329.17', 220, 820, { font: NARROW, size: 56, color: INK }); }
  wipe(g, a.in(tS, 0.5), 50, 850, 1850, 130, () => {
    text(g, 'JUL 14 AUCTION (2028/29): $325 · 6,831 MW SHORT OF THE RELIABILITY TARGET', 60, 900, { font: NARROW, size: 52, color: INK });
    text(g, 'THE FIRST-EVER SHORTFALL CAME IN THE DEC 2025 AUCTION · PJM', 60, 960, { font: MONO, size: 22, color: GREY });
  }, true);
  stamp(g, '2026-09', INK, 'BR2.2');
}

// BR2.3 (182.28 s, the one bar of drums): in court, the chat logs. Cold: the page, then each case caption in turn;
// on "line by line" the pleading-paper line numbers draw down the margin. No names, no content, no red.
export function fLogs(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, INK);
  sheet(g, 460, 70, 1000, 940, { fill: '#F2F1EC', shadow: '#000', off: 0 });
  const tL = a.w(/^line$/i), tEnd = a.w(/^line$/i, tL + 0.1) + 0.4;
  const nLines = a.full ? 28 : Math.floor(28 * Math.min(1, Math.max(0, (a.t - tL) / (tEnd - tL))));
  for (let i = 1; i <= nLines; i++) text(g, String(i), 500, 110 + i * 31, { font: MONO, size: 16, color: GREY, align: 'right' });
  box(g, 520, 110, 2, 890, GREY);
  const caps = [
    ['Case 6:24-cv-01903 · M.D. Fla.', 'NOTICE OF RESOLUTION · FILED 01/07/26', a.w(/^court/i)],
    ['Case 5:26-cv-01849 · N.D. Cal.', 'COMPLAINT · FILED 03/04/26 · 42 PAGES', a.w(/^read/i)],
    ['Case 4:26-cv-00222 · N.D. Fla.', 'COMPLAINT · FILED 05/10/26 · 76 PAGES', a.w(/^logs/i)],
  ];
  caps.forEach(([c1, c2, at], i) => {
    const y = 220 + i * 260;
    wipe(g, a.in(at, 0.35), 550, y - 50, 860, 150, () => {
      text(g, c1, 560, y, { font: SERIF, size: 44, color: INK });
      text(g, c2, 560, y + 56, { font: MONO, size: 24, color: INK });
      box(g, 560, y + 90, 820, 2, INK);
    }, true);
  });
  text(g, 'SEVERAL 2026 CASES TURN ON CHAT LOGS', W / 2, 1060, { font: MONO, size: 22, color: GREY, align: 'center' });
  stamp(g, '2026', GREY, 'BR2.3');
}

// BR2.4 (186.18 s): "Enough predictions," so we flew blind. The year's charts go dark one by one to "blind".
export function fBlind(g, ctx, t, thumbs, a = FULL) {
  box(g, 0, 0, W, H, INK);
  const cols = 4, tw = 400, th = 225, t0 = a.w(/^enough/i), t1 = a.w(/^blind/i);
  const dark = a.full ? 9 : Math.floor(12 * Math.min(1, Math.max(0, (a.t - t0) / (t1 - t0))));
  const order = [5, 0, 10, 3, 7, 1, 11, 8, 2, 6, 9, 4];
  thumbs.slice(0, 12).forEach((c, i) => {
    const x = 120 + (i % cols) * (tw + 20), y = 60 + Math.floor(i / cols) * (th + 20);
    g.drawImage(c, x, y, tw, th);
    if (order.indexOf(i) < dark || (a.full && i >= 3)) box(g, x, y, tw, th, INK);
    outline(g, x, y, tw, th, '#2c2c2a', 2);
  });
  wipe(g, a.in(t0, 0.3), 110, 810, 1300, 120, () => text(g, '“Enough predictions.”', 120, 900, { font: SERIF, size: 96, color: PAPER }));
  wipe(g, a.in(a.w(/^predictions/i) + 0.2, 0.4), 110, 935, 1400, 40, () => text(g, 'J. HUANG, NVIDIA CEO, OF G. HINTON’S FORECASTS · THE EZRA KLEIN SHOW · SEP 23', 124, 960, { font: MONO, size: 24, color: GREY }));
  stamp(g, '', GREY, 'BR2.4');
}

// BRK.1 (190.5 s): laughing it off all year: every frame so far, at once.
export function fAllYear(g, ctx, t, thumbs) {
  box(g, 0, 0, W, H, PAPER);
  const cols = 8, tw = W / cols, th = tw * 9 / 16;
  thumbs.forEach((c, i) => {
    const x = (i % cols) * tw, y = Math.floor(i / cols) * th;
    g.drawImage(c, x, y, tw, th);
  });
  tear(g, 1905, 24, 200, 0, H);
}
