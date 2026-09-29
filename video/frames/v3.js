// Verse 3 (new lines), stop-time and Pre-Chorus 3.
import { INK, PAPER, GREY, RED, W, H, SANS, NARROW, SERIF, MONO, rng, canvas, dither, tear, clipBand, speckle, text, box, outline, rubber, stamp, sheet, redacted, identicon, wrap, FULL, slam, wipe, memo } from '../lib.js';

// V3.1 (105.47 s): eleven hundred signed to hit the brakes. The signatory list: numbered rows, names redacted.
// Pages flip on 16th notes from "signed" and land on the last page (1,386 as of Sep 28) on "gas".
export function fLetter(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, PAPER);
  const TOTAL = 1386, cols = 4, rows = 22, per = cols * rows, pages = Math.ceil(TOTAL / per);
  const tS = a.w(/^signed/i), tG = a.w(/^gas/i);
  const pg = a.full ? pages - 1 : Math.max(0, Math.min(pages - 1, Math.floor((a.t - tS) / ((tG - tS) / (pages - 1)))));
  const started = a.full || a.t >= tS;
  for (let k = 0; k < per; k++) {
    const idx = pg * per + k;
    if (idx >= TOTAL || (!started && k > 0)) break;
    const c = Math.floor(k / rows), rI = k % rows;
    const x = 60 + c * 455, y = 318 + rI * 25;
    const r = rng(20000 + idx);
    text(g, String(idx + 1).padStart(4, '0'), x, y + 12, { font: MONO, size: 15, weight: 'normal', color: GREY });
    box(g, x + 58, y + 1, 110 + r() * 120, 13, INK);
    box(g, x + 300, y + 4, 40 + r() * 90, 7, '#C9C7BF');
  }
  box(g, 40, 880, W - 80, 2, INK);
  wipe(g, a.in(a.start - 0.05, 0.15), 0, 60, W, 230, () => box(g, 0, 60, W, 230, INK), true);
  slam(g, a.in(a.start, 0.1), 650, 150, () => text(g, 'PACING THE FRONTIER*', 50, 200, { font: NARROW, size: 150, color: PAPER, sx: 0.86 }), 1.35);
  wipe(g, a.in(a.w(/^hundred/i), 0.25), 1300, 110, 580, 140, () => {
    text(g, 'OPEN LETTER · 2026-07-28', 1870, 140, { font: MONO, size: 26, color: PAPER, align: 'right' });
    text(g, '1,386 SIGNATORIES AS OF SEP 28', 1870, 190, { font: MONO, size: 26, color: RED, align: 'right' });
    text(g, '~1,134 AT LAUNCH (REPORTED)', 1870, 236, { font: MONO, size: 22, color: GREY, align: 'right' });
  }, true);
  wipe(g, a.in(a.w(/^brakes/i), 0.2), 60, 900, 1150, 110, () => { box(g, 60, 900, 1150, 110, INK); text(g, '* ASKED FOR TOOLS TO PACE AI LATER, NOT A PAUSE NOW', 90, 972, { font: MONO, size: 30, color: PAPER }); });
  wipe(g, a.in(a.w(/^then/i), 0.2), 1500, 915, 380, 80, () => { text(g, 'ENDORSED BY OPENAI', 1860, 945, { font: MONO, size: 24, color: INK, align: 'right' }); text(g, 'AND ANTHROPIC', 1860, 985, { font: MONO, size: 24, color: INK, align: 'right' }); }, true);
  stamp(g, '', INK, 'V3.1');
}

// V3.2 (108.22 s): "hit the gas!" (screamed: the frame shatters). Two launches in the week before Labor Day.
export function fLaunch(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, INK);
  text(g, 'SEPTEMBER 2026', 60, 160, { font: MONO, size: 34, color: PAPER });
  const days = ['MON 31', 'TUE 1', 'WED 2', 'THU 3', 'FRI 4', 'SAT 5', 'SUN 6', 'MON 7'];
  const cw = 225, tTwo = a.w(/^two$/i), tLaunch = a.w(/^launches/i), tLabor = a.w(/^labor/i);
  days.forEach((d, i) => {
    const x = 60 + i * cw;
    const redAt = i === 1 ? tTwo : i === 3 ? tLaunch : 1e9;
    const launch = a.full ? i === 1 || i === 3 : a.t >= redAt;
    const labor = i === 7 && (a.full || a.t >= tLabor);
    wipe(g, a.in(a.start + i * 0.04, 0.1), x, 200, cw - 12, 600, () => {
      box(g, x, 200, cw - 12, 600, launch ? RED : labor ? PAPER : '#1c1c1a');
      text(g, d, x + 16, 250, { font: MONO, size: 26, color: launch || labor ? INK : GREY });
    }, true);
    if (i === 1) slam(g, a.in(tTwo, 0.08), x + 100, 660, () => { text(g, 'CLAUDE', x + 16, 600, { font: NARROW, size: 54, color: INK }); text(g, 'MYTHOS', x + 16, 660, { font: NARROW, size: 54, color: INK }); text(g, '5.1', x + 16, 720, { font: NARROW, size: 54, color: INK }); }, 1.5);
    if (i === 3) slam(g, a.in(tLaunch, 0.08), x + 100, 660, () => { text(g, 'GPT-6', x + 16, 620, { font: NARROW, size: 60, color: INK }); text(g, 'ASTRA', x + 16, 690, { font: NARROW, size: 60, color: INK }); }, 1.5);
    if (i === 7) slam(g, a.in(tLabor, 0.08), x + 100, 690, () => { text(g, 'LABOR', x + 16, 660, { font: NARROW, size: 54, color: INK }); text(g, 'DAY', x + 16, 720, { font: NARROW, size: 54, color: INK }); }, 1.5);
  });
  if (a.full) tear(g, 1101, 6, 40, 820, 1060);
  wipe(g, a.in(a.w(/^pass/i), 0.3), 50, 870, 1820, 40, () => text(g, 'AUG 18: OPENAI SAID IT HAD “paused RL training … for two weeks” · MYTHOS 5.1: VETTED US ORGS ONLY', 60, 900, { font: MONO, size: 24, color: GREY }));
  slam(g, a.in(a.w(/^both/i), 0.1), 700, 950, () => text(g, 'TWO FRONTIER LAUNCHES BEFORE LABOR DAY', 60, 980, { font: NARROW, size: 80, color: PAPER }), 1.4);
  stamp(g, '2026-09', PAPER, 'V3.2');
}

// V3.5 (118.69 s): over ten percent (the lyric's number); nobody's got a plan. The ten squares fill on 16ths.
export function fHubinger(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, PAPER);
  const x0 = 1120, y0 = 110, c = 70, tTen = a.w(/^ten$/i), q = ctx.audio.beat_period / 4;
  for (let j = 0; j < 10; j++) for (let i = 0; i < 10; i++) {
    const k = j * 10 + i;
    if (!a.full && a.t < a.start + k * 0.006) continue;
    if (k < 10 && (a.full || a.t >= tTen + k * q)) box(g, x0 + i * c, y0 + j * c, c - 10, c - 10, RED);
    else outline(g, x0 + i * c + 2, y0 + j * c + 2, c - 14, c - 14, INK, 3);
  }
  slam(g, a.in(a.w(/^percent/i), 0.06), x0 + 10 * c + 30, y0 + 30, () => text(g, '+', x0 + 10 * c + 10, y0 + 60, { font: NARROW, size: 90, color: RED }), 1.8);
  slam(g, a.in(a.w(/^over/i), 0.1), 400, 290, () => text(g, '>10%', 40, 420, { font: NARROW, size: 380, color: INK }), 1.7);
  wipe(g, a.in(a.w(/^percent/i), 0.3), 50, 460, 1000, 90, () => wrap(g, 'CHANCE AI KILLS ALL HUMANS, WITHIN THE NEXT DECADE', 60, 500, 900, { size: 34, color: INK }));
  wipe(g, a.in(a.w(/^and$/i), 0.3), 50, 610, 1100, 40, () => text(g, 'E. HUBINGER · ALIGNMENT SCIENCE LEAD, ANTHROPIC · ON X, SEP 8 (US)', 60, 640, { font: MONO, size: 24, color: GREY }));
  wipe(g, a.in(a.w(/^nobody/i), 0.2), 60, 780, 1800, 170, () => { box(g, 60, 780, 1800, 170, INK); text(g, 'PLAN FOR ALIGNING SUPERINTELLIGENCE:', 100, 885, { font: MONO, size: 40, color: PAPER }); });
  // The cursor blinks on the beat in the empty field (small area; not a flash).
  const blink = a.full || Math.floor((a.t - a.start) / ctx.audio.beat_period) % 2 === 0;
  if ((a.full || a.t >= a.w(/^plan/i)) && blink) box(g, 1030, 845, 22, 56, RED);
  wipe(g, a.in(a.w(/^got/i), 0.35), 50, 985, 1500, 40, () => text(g, '“we do not yet have a plan to solve alignment for superintelligence” — HUBINGER', 60, 1010, { font: MONO, size: 24, color: INK }));
  stamp(g, '2026-09-09 UTC', INK, 'V3.5');
}

// V3.6 (121.76 s): the court backs the blacklist 2-1. Cold: the opinion sets itself; the votes land one by one.
export function fCourt(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, PAPER);
  text(g, 'UNITED STATES COURT OF APPEALS', W / 2, 150, { font: SERIF, size: 64, color: INK, align: 'center' });
  text(g, 'FOR THE DISTRICT OF COLUMBIA CIRCUIT', W / 2, 220, { font: SERIF, size: 44, weight: 'normal', color: INK, align: 'center' });
  box(g, 360, 260, 1200, 3, INK);
  wipe(g, a.in(a.w(/^backs/i), 0.3), 300, 325, 1320, 45, () => text(g, 'No. 26-1049 · SUPPLY-CHAIN-RISK DESIGNATION UNDER 41 U.S.C. § 4713', W / 2, 360, { font: MONO, size: 30, color: INK, align: 'center' }));
  slam(g, a.in(a.w(/^blacklist/i), 0.01), W / 2, 480, () => text(g, 'UPHELD', W / 2, 560, { font: NARROW, size: 220, color: INK, align: 'center' }), 1);
  const tV = a.w(/^two/i), votes = [INK, INK, PAPER];
  votes.forEach((c, i) => slam(g, a.in(tV + i * 0.18, 0.01), 775 + i * 180, 715, () => { box(g, 700 + i * 180, 640, 150, 150, c); outline(g, 700 + i * 180, 640, 150, 150, INK, 5); }, 1));
  wipe(g, a.in(a.w(/^say/i), 0.3), 300, 830, 1320, 90, () => text(g, '2 – 1 · “we deny the petitions for review”', W / 2, 900, { font: NARROW, size: 80, color: RED, align: 'center' }));
  wipe(g, a.in(a.w(/^banned/i), 0.35), 300, 970, 1320, 40, () => text(g, 'DECIDED SEP 25 · A SEPARATE § 3252 DESIGNATION WAS SET ASIDE AUG 27 (N.D. CAL.)', W / 2, 1000, { font: MONO, size: 22, color: GREY, align: 'center' }));
  stamp(g, '2026-09-25', INK, 'V3.6');
}

// V3.7 (124.66 s): 34 hours of sock puppets at the gate. The fake accounts vouch one by one; the PR is closed.
export function fSock(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, INK);
  wipe(g, a.in(a.start - 0.05, 0.12), 60, 90, 1100, 900, () => sheet(g, 60, 90, 1100, 900, { fill: '#F2F1EC', shadow: '#000', off: 0 }), true);
  text(g, 'PULL REQUEST · REAL OPEN-SOURCE PROJECT', 100, 160, { font: MONO, size: 26, color: INK });
  box(g, 100, 180, 1020, 3, INK);
  const tSock = a.w(/^sock/i), e8 = ctx.audio.beat_period / 2;
  for (let i = 0; i < 9; i++) {
    const at = i === 0 ? a.start + 0.1 : tSock + (i - 1) * e8;
    slam(g, a.in(at, 0.06), 600, 238 + i * 78, () => {
      const y = 210 + i * 78;
      identicon(g, 100, y, 56, 3400 + i, i === 0 ? RED : INK, '#F2F1EC');
      box(g, 180, y + 10, 520 + (i * 53) % 300, 14, '#C9C7BF');
      box(g, 180, y + 34, 200, 10, '#DDDBD3');
      text(g, '✓', 1060, y + 44, { font: SANS, size: 44, color: i === 0 ? GREY : INK });
    }, 1.15);
  }
  wipe(g, a.in(a.w(/^gate/i), 0.2), 100, 920, 1020, 50, () => { box(g, 100, 920, 1020, 50, RED); text(g, 'CHECKS 0 · +200 −8 · CLOSED  (AISI RECREATION)', 120, 958, { font: MONO, size: 28, color: INK }); });
  slam(g, a.in(a.start, 0.1), 1400, 300, () => text(g, '34', 1230, 420, { font: NARROW, size: 360, color: PAPER }), 1.8);
  slam(g, a.in(a.w(/^hours/i), 0.08), 1370, 460, () => text(g, 'HOURS', 1250, 500, { font: NARROW, size: 100, color: PAPER }), 1.5);
  wipe(g, a.in(a.w(/^hours/i) + 0.2, 0.25), 1240, 525, 640, 35, () => text(g, 'SUN 26 JUL 12:45 → MON 27 JUL 23:15 BST', 1250, 550, { font: MONO, size: 20, color: GREY }));
  wipe(g, a.in(a.w(/^puppets/i), 0.3), 1240, 585, 640, 90, () => wrap(g, 'FAKE GITHUB ACCOUNTS VOUCHING FOR ITS OWN MALICIOUS CODE', 1250, 620, 600, { size: 28, color: PAPER }));
  wipe(g, a.in(a.w(/^through/i), 0.35), 1240, 760, 640, 110, () => wrap(g, 'HELD: WORKFLOWS AWAITING APPROVAL FOR A FIRST PULL REQUEST · SPOTTED BY A THIRD-PARTY GITHUB USER', 1250, 790, 600, { size: 24, color: GREY }), true);
  stamp(g, 'AISI INC-2026-07-28-01', PAPER, 'V3.7   UK AI SECURITY INSTITUTE · CLAUDE MYTHOS 5 · PUBLISHED AUG 4');
}

// V3.8 (128.02 s): the intern is live; the researcher is due in '28. The band stops; ’28 lands on its word.
export function fIntern(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, RED);
  slam(g, a.in(a.w(/^'?’?28/i), 0.1), 1500, 450, () => text(g, '’28', 1880, 700, { font: NARROW, size: 700, color: INK, align: 'right' }), 1.8);
  wipe(g, a.in(a.w(/^intern/i), 0.15), 60, 200, 900, 180, () => { box(g, 60, 200, 900, 180, INK); text(g, 'AUTOMATED AI RESEARCH INTERN', 90, 270, { font: MONO, size: 32, color: PAPER }); });
  slam(g, a.in(a.w(/^live/i), 0.08), 300, 320, () => text(g, 'GOAL MET · SEP 6–7, 2026', 90, 340, { font: NARROW, size: 60, color: RED }), 1.5);
  wipe(g, a.in(a.w(/^researcher/i), 0.15), 60, 420, 900, 180, () => { box(g, 60, 420, 900, 180, PAPER); text(g, 'AUTOMATED AI RESEARCHER', 90, 490, { font: MONO, size: 32, color: INK }); });
  slam(g, a.in(a.w(/^due/i), 0.08), 300, 540, () => text(g, 'TARGET · MARCH 2028', 90, 560, { font: NARROW, size: 60, color: INK }), 1.5);
  wipe(g, a.in(a.w(/^bot/i), 0.3), 50, 765, 900, 45, () => text(g, '3.1 AGENT-WORKDAYS PER HUMAN WORKDAY', 60, 800, { font: MONO, size: 34, color: INK }));
  wipe(g, a.in(a.w(/^in$/i, a.w(/^due/i)), 0.35), 50, 830, 1300, 40, () => text(g, 'ALTMAN, OCT 2025: “a true automated AI researcher by March of 2028”', 60, 860, { font: MONO, size: 26, color: INK }));
  stamp(g, '2026-09', INK, 'V3.8   OPENAI');
}

// V3 stop-time, line 1 (130.93 s): the drums cut to a drone. The pause bars draw down slowly; nothing else moves.
export function fPaused(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, INK);
  const tP = a.w(/^paused/i);
  wipe(g, a.in(tP, 0.5), 720, 200, 180, 560, () => box(g, 720, 200, 180, 560, RED), true);
  wipe(g, a.in(tP + 0.2, 0.5), 1020, 200, 180, 560, () => box(g, 1020, 200, 180, 560, RED), true);
  wipe(g, a.in(a.w(/^again/i), 0.4), 400, 790, 1120, 110, () => text(g, 'TRAINING PAUSED', W / 2, 880, { font: NARROW, size: 110, color: PAPER, align: 'center' }));
  wipe(g, a.in(a.w(/^dozens/i), 0.5), 60, 925, 1800, 40, () => text(g, 'TRAINING · EVALUATION · TOOL-USE, ON ITS MOST CAPABLE MODELS · SECOND PAUSE · RESTART FROM A FRESH RUN', W / 2, 950, { font: MONO, size: 22, color: GREY, align: 'center' }));
  wipe(g, a.in(a.w(/^incidents/i), 0.5), 400, 975, 1120, 40, () => text(g, '“DOZENS” MORE INCIDENTS, PER FORTUNE AND AXIOS', W / 2, 1000, { font: MONO, size: 22, color: GREY, align: 'center' }));
  stamp(g, '2026-09-25', PAPER, 'V3 STOP-TIME · OPENAI MISALIGNMENT REPORT');
}

// PC3.1 (137.21 s): first "Critical," then sold as "aligned." The ladder climbs a rung per beat; the launch slams.
export function fAstra(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, PAPER);
  const tiers = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], bp = ctx.audio.beat_period, tC = a.w(/^critical/i);
  tiers.forEach((tn, i) => {
    const y = 760 - i * 190, at = i === 3 ? tC : a.start + i * bp * 0.5;
    slam(g, a.in(at, i === 3 ? 0.1 : 0.06), 460, y + 80, () => {
      box(g, 60, y, 800, 160, i === 3 ? RED : ['#DCDAD2', '#C9C7BF', '#A9A7A0'][i]);
      text(g, tn, 90, y + 110, { font: NARROW, size: 90, color: INK });
    }, i === 3 ? 1.6 : 1.15);
  });
  text(g, 'CYBER RISK', 60, 150, { font: MONO, size: 26, color: INK });
  wipe(g, a.in(a.w(/^first/i), 0.25), 870, 180, 1000, 150, () => {
    box(g, 880, 190, 40, 160, INK);
    text(g, 'SEP 1: GPT-6 ASTRA RATED CRITICAL · THE FIRST EVER', 940, 260, { font: MONO, size: 26, color: INK });
    text(g, 'AUG 10: OPENAI “cannot rule out” IT', 940, 310, { font: MONO, size: 26, color: GREY });
  });
  slam(g, a.in(a.w(/^sold/i), 0.1), 1410, 710, () => {
    sheet(g, 960, 520, 900, 380, { fill: INK, shadow: RED });
    text(g, 'SEP 3 LAUNCH', 1000, 590, { font: MONO, size: 26, color: GREY });
  }, 1.4);
  wipe(g, a.in(a.w(/^you$/i, a.w(/^sold/i)), 0.2), 990, 630, 860, 90, () => text(g, '“the world’s most', 1000, 700, { font: SERIF, size: 76, color: PAPER }));
  wipe(g, a.in(a.w(/^as$/i, a.w(/^sold/i)), 0.2), 990, 710, 860, 90, () => text(g, 'intelligent and', 1000, 780, { font: SERIF, size: 76, color: PAPER }));
  wipe(g, a.in(a.w(/^aligned/i), 0.25), 990, 790, 860, 90, () => text(g, 'aligned model”', 1000, 860, { font: SERIF, size: 76, color: PAPER }));
  stamp(g, '2026-09-03', INK, 'PC3.1   OPENAI');
}

// PC3.2 (140.52 s): "An Alien Mind." The title resolves out of noise through the ratchet, sharpest on "alien mind".
export function fAlien(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, INK);
  const tA = a.w(/^alien/i);
  const u = a.full ? 1 : Math.min(1, Math.max(0, (a.t - a.start) / (tA - a.start)));
  const src = canvas(480, 270), s = src.getContext('2d');
  s.fillStyle = '#000'; s.fillRect(0, 0, 480, 270);
  s.fillStyle = '#fff';
  s.font = `72px ${SERIF}`;
  s.fillText('An Alien', 20, 120);
  s.fillText('Mind', 20, 210);
  const blur = canvas(480, 270), b = blur.getContext('2d');
  b.filter = `blur(${(2.5 + (1 - u) * 14).toFixed(2)}px)`;
  b.drawImage(src, 0, 0);
  // Noise that thins as it resolves (quantized to 12 fps).
  const r = rng(1400 + Math.floor((a.full ? 0 : a.t) * 12));
  b.filter = 'none';
  for (let i = 0; i < 2600 * (1 - u); i++) { b.fillStyle = r() < 0.5 ? '#fff' : '#000'; b.fillRect(r() * 480, r() * 270, 2, 2); }
  dither(g, blur, 0, 0, W, H, { contrast: 1.1 });
  box(g, 0, 880, W, 200, INK);
  wipe(g, a.in(a.w(/^chief/i), 0.3), 50, 915, 1500, 45, () => text(g, 'ESSAY · J. PACHOCKI, CHIEF SCIENTIST, OPENAI · 2026-09-06', 60, 950, { font: MONO, size: 28, color: PAPER }));
  wipe(g, a.in(a.w(/^warns/i), 0.4), 50, 975, 1500, 50, () => text(g, '“no lab has solved alignment and monitoring to a sufficient degree”', 60, 1010, { font: SERIF, size: 34, color: PAPER }));
  if (a.full) tear(g, 1421, 8, 70, 0, 860);
  stamp(g, '2026-09-06', PAPER, 'PC3.2');
}
