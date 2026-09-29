// Intro, Verse 1 and Pre-Chorus 1.
import { INK, PAPER, GREY, RED, W, H, SANS, NARROW, SERIF, MONO, rng, canvas, dither, tear, clipBand, speckle, text, box, outline, rubber, stamp, sheet, redacted, lock, wrap, satDataCenter, FULL, slam, wipe, screamText, screamBurst } from '../lib.js';

// ---------- the year grid (intro) ----------
// 2026 as a week-by-day grid (Mon-start columns). Every red cell is a dated event from the song (see FACTS.md).
const YEAR_EVENTS = [
  [1, 9, 'GROK PAYWALL'], [1, 12, 'OFCOM INVESTIGATES X'], [1, 31, 'MOLTBOOK DATABASE OPEN'], [2, 9, 'SAFEGUARDS LEAD QUITS'],
  [2, 24, 'HARD PAUSE REMOVED'], [2, 27, 'CLAUDE BLACKLISTED'], [4, 7, 'MYTHOS PREVIEW'], [4, 21, 'FLORIDA PROBE'],
  [4, 24, 'DEEPSEEK V4'], [6, 4, 'AI LAYOFFS REPORT'], [6, 9, 'MYTHOS 5 · FABLE 5'], [7, 1, 'JADEPUFFER'],
  [7, 11, 'HUGGING FACE BREACH'], [7, 18, 'NOTES TO ITSELF'], [7, 26, 'SOCK PUPPETS'], [7, 28, 'PACING LETTER'],
  [7, 30, 'MYTHOS 5 DISCLOSURE'], [8, 10, 'ASTRA: “CANNOT RULE OUT”'], [8, 18, 'TRAINING PAUSED'], [8, 27, 'DISTRICT RULING'],
  [9, 1, 'FIRST “CRITICAL” MODEL'], [9, 3, 'ASTRA LAUNCH · $12.9B DEAL'], [9, 6, 'AN ALIEN MIND'], [9, 8, 'COXON QUITS'],
  [9, 12, 'PACE THE FRONTIER'], [9, 14, '“HOAX”'], [9, 16, 'HINTON BRIEFING'], [9, 18, 'CNN: THE SHIP'],
  [9, 20, 'OUT THROUGH DNS'], [9, 23, '“ENOUGH PREDICTIONS”'], [9, 25, 'BLACKLIST UPHELD 2–1'], [9, 26, 'PAUSED AGAIN'],
];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const dayOf = (m, d) => (Date.UTC(2026, m - 1, d) - Date.UTC(2026, 0, 1)) / 864e5;
// A ledger: 12 month rows × 31 day columns.
const G = { x0: 780, y0: 320, pitch: 35, cell: 29 };
const cellXY = (d) => { const dt = new Date(Date.UTC(2026, 0, 1 + d)); return [G.x0 + (dt.getUTCDate() - 1) * G.pitch, G.y0 + dt.getUTCMonth() * G.pitch]; };
const AS_OF = dayOf(9, 27);
// cursor: last day shaded as passed. lit: number of events lit. big: day numbers in cells (for close-ups).
function yearGrid(g, { cursor = AS_OF, lit = YEAR_EVENTS.length, big = false, mark = true } = {}) {
  for (let m = 0; m < 12; m++) text(g, MONTHS[m], G.x0 - 16, G.y0 + m * G.pitch + 23, { font: MONO, size: 20, color: m < 9 ? INK : GREY, align: 'right' });
  for (let c = 0; c < 31; c += 5) text(g, String(c + 1), G.x0 + c * G.pitch + G.cell / 2, G.y0 - 14, { font: MONO, size: 16, color: GREY, align: 'center' });
  const red = new Set(YEAR_EVENTS.slice(0, lit).map(([m, d]) => dayOf(m, d)));
  for (let d = 0; d < 365; d++) {
    const [x, y] = cellXY(d);
    if (red.has(d)) box(g, x, y, G.cell, G.cell, RED);
    else if (d <= cursor) box(g, x, y, G.cell, G.cell, '#C4C2BA');
    else outline(g, x + 0.5, y + 0.5, G.cell - 1, G.cell - 1, d <= AS_OF ? '#9C9A93' : '#D6D4CC', 1);
    if (big) text(g, String(new Date(Date.UTC(2026, 0, 1 + d)).getUTCDate()), x + 4, y + 12, { font: MONO, size: 9, weight: 'normal', color: red.has(d) ? PAPER : INK });
  }
  if (mark && cursor >= 0) { const [x, y] = cellXY(Math.min(cursor, 364)); outline(g, x - 3, y - 3, G.cell + 6, G.cell + 6, RED, 3); }
}

// Intro chops (0.33–0.95 s): three sung "zoom"s zoom OUT, from one day (Jan 1) to January to the whole year.
export function fIntroZoom(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, PAPER);
  const z0 = a.w(/^zoom/i), z1 = a.w(/^zoom/i, z0 + 0.05), z2 = a.w(/^zoom/i, z1 + 0.05);
  const k = a.full ? 2 : [z0, z1, z2].filter((z) => a.t >= z).length;
  if (k === 0) return box(g, 0, 0, W, H, INK);
  const [jx, jy] = cellXY(0);
  // Focus: Jan 1's cell, then the January row, then the whole ledger.
  const f = [null, [jx + G.cell / 2, jy + G.cell / 2, 13], [G.x0 + 15 * G.pitch, jy + G.cell / 2, 1.55], [W / 2, H / 2, 1]][k];
  g.save();
  g.translate(W / 2, H / 2); g.scale(f[2], f[2]); g.translate(-f[0], -f[1]);
  yearGrid(g, { cursor: -1, lit: 0, big: k < 3, mark: false });
  box(g, jx, jy, G.cell, G.cell, INK);
  g.restore();
  if (k === 3) text(g, "2026", 60, 470, { font: NARROW, size: 190, color: INK });
  stamp(g, '2026', INK, 'INTRO');
}

// Intro riff (0.95–7.0 s): the year as a record. Every synth stab lights the next two dated events in red while the
// cursor sweeps through 2026; on the bass + stuttered chops the cursor rewinds month by month to January.
export function fIntroCode(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, PAPER);
  const stabs = ctx.audio.onsets.synth.map((o) => o[0]).filter((x) => x > 0.6 && x < 5.4);
  const chops = ctx.audio.onsets.vocal.map((o) => o[0]).filter((x) => x > 5.4 && x < 7.0);
  const nStab = a.full ? stabs.length : stabs.filter((x) => x <= a.t).length;
  const lit = Math.min(YEAR_EVENTS.length, nStab * 2);
  const nChop = a.full ? 0 : chops.filter((x) => x <= a.t).length;
  const last = YEAR_EVENTS[Math.max(0, lit - 1)];
  let cursor = lit ? dayOf(last[0], last[1]) : 0;
  let readout = lit ? `${MONTHS[last[0] - 1]} ${String(last[1]).padStart(2, '0')}` : 'JAN 01', tag = lit ? last[2] : '';
  if (nChop > 0) {
    // Rewind: Sep → Jan across the chops.
    const m = Math.max(1, 9 - Math.round((nChop / chops.length) * 8));
    cursor = dayOf(m, 1);
    readout = MONTHS[m - 1];
    tag = m === 1 ? 'FROM THE TOP' : '';
  }
  if (a.full) { readout = 'SEP 27'; tag = 'AS OF'; cursor = AS_OF; }
  yearGrid(g, { cursor, lit });
  // Readout: the date of the event just lit. Snaps on each stab (it's a record, not a counter).
  const hit = a.full ? 0 : Math.max(0, 1 - (a.t - (nChop ? chops[nChop - 1] : stabs[nStab - 1] ?? 0)) / 0.12);
  g.save();
  g.translate(60 + hit * 14, 0);
  text(g, readout, 0, 470, { font: NARROW, size: 190, color: nChop ? RED : INK });
  g.restore();
  wrap(g, tag, 66, 530, 600, { font: MONO, size: 30, color: INK });
  text(g, '2026 · EACH RED DAY IS AN EVENT IN THIS SONG · AS OF SEP 27', 60, 1000, { font: MONO, size: 22, color: GREY });
  stamp(g, '2026', INK, 'INTRO');
}

// V1.1 (7.03 s): Grok. Cold: the hour ticks off, the count, the response. No images shown. No slams.
export function fGrok(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, INK);
  const cx = 1500, cy = 470, R = 300;
  const t0 = a.start, t1 = a.w(/^paywalled/i);
  for (let m = 0; m < 60; m++) {
    if (!a.full && a.t < t0 + (m / 60) * (t1 - t0)) break;
    const ang = (m / 60) * Math.PI * 2 - Math.PI / 2;
    g.save();
    g.translate(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R);
    g.rotate(ang);
    box(g, -28, -6, 56, 12, PAPER);
    g.restore();
  }
  text(g, '1 HOUR', cx, cy + 26, { font: MONO, size: 44, color: PAPER, align: 'center' });
  slam(g, a.in(a.w(/^seven/i), 0.01), 500, 450, () => text(g, '7,751', 30, 600, { font: NARROW, size: 420, color: PAPER, sx: 0.92 }), 1);
  wipe(g, a.in(a.w(/^thousand/i), 0.5), 40, 684, 1400, 40, () => text(g, 'NON-CONSENSUAL SEXUALIZED IMAGES IN ONE HOUR · ONE RESEARCHER’S JAN 7 SAMPLE (NBC)', 44, 714, { font: MONO, size: 24, color: PAPER }));
  slam(g, a.in(a.w(/^hour/i), 0.01), 1500, 850, () => rubber(g, 'REPORTED', 1500, 870, { size: 44, rot: -0.06 }), 1);
  wipe(g, a.in(t1, 0.35), 44, 760, 1300, 110, () => {
    box(g, 44, 760, 1300, 110, RED);
    text(g, 'JAN 9 FIX: IMAGE GENERATION FOR PAYING SUBSCRIBERS', 70, 832, { font: NARROW, size: 60, color: INK, sx: 0.86 });
  });
  wipe(g, a.in(t1 + 0.3, 0.3), 40, 905, 1500, 45, () => text(g, 'DOWNING STREET: “insulting” · JAN 12: OFCOM OPENS A FORMAL INVESTIGATION', 44, 940, { font: MONO, size: 26, color: PAPER }));
  stamp(g, '2026-01-09', PAPER, 'V1.1   GROK · X');
  speckle(g, 1101, 0.0006);
}

// V1.4 (16.66 s): the safety lead quits to write poems. The byline first; then the sentence types out alone
// in the band stop, on "the world's in peril", and the red rule draws under it.
export function fSharma(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, PAPER);
  wipe(g, a.in(a.w(/^the$/i), 0.28), 110, 220, 1500, 240, () => text(g, 'The world', 120, 420, { font: SERIF, size: 230, weight: 'normal', color: INK }));
  wipe(g, a.in(a.w(/^in$/i), 0.45), 110, 490, 1500, 240, () => text(g, 'is in peril.', 120, 690, { font: SERIF, size: 230, weight: 'normal', color: INK }));
  wipe(g, a.in(a.w(/^peril/i) + 0.2, 0.5), 128, 740, 1220, 6, () => box(g, 128, 740, 1220, 6, RED));
  wipe(g, a.in(a.w(/^safety/i), 0.4), 120, 790, 1400, 40, () => text(g, 'M. SHARMA · HEAD OF SAFEGUARDS RESEARCH, ANTHROPIC', 128, 820, { font: MONO, size: 28, color: INK }));
  wipe(g, a.in(a.w(/^poems/i), 0.4), 120, 836, 1400, 40, () => text(g, 'RESIGNATION LETTER · 2026-02-09 · LEFT TO STUDY POETRY', 128, 866, { font: MONO, size: 28, color: INK }));
  stamp(g, '2026-02-09', INK, 'V1.4');
  speckle(g, 1401, 0.0005);
}

// V1.5 (19.62 s): the Florida probe. Cold: the document fills in as it is read. No jokes, no victims, no slams.
export function fFlorida(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, INK);
  sheet(g, 510, 60, 900, 960, { fill: PAPER, shadow: '#222', off: 0 });
  text(g, 'STATE OF FLORIDA', W / 2, 150, { font: SERIF, size: 44, color: INK, align: 'center' });
  text(g, 'OFFICE OF THE ATTORNEY GENERAL', W / 2, 196, { font: SERIF, size: 28, weight: 'normal', color: INK, align: 'center' });
  box(g, 570, 226, 780, 3, INK);
  const tSays = a.w(/^says/i), tIf = a.w(/^if$/i), tMur = a.w(/^murder/i), tCau = a.w(/^caught/i), tRed = a.w(/^red/i);
  wipe(g, a.in(tSays, 0.3), 520, 250, 880, 280, () => {
    text(g, 'CRIMINAL INVESTIGATION', W / 2, 330, { font: NARROW, size: 80, color: INK, align: 'center' });
    text(g, 'OPENAI', W / 2, 440, { font: NARROW, size: 110, color: INK, align: 'center' });
    text(g, 'OPENED 2026-04-21', W / 2, 500, { font: MONO, size: 26, color: INK, align: 'center' });
    box(g, 570, 540, 780, 2, INK);
  }, true);
  wipe(g, a.full ? 1 : Math.min(1, Math.max(0, (a.t - tIf) / (tMur + 0.3 - tIf))), 580, 570, 780, 150, () => wrap(g, '“if ChatGPT were a person, it would be facing charges for murder”', 590, 610, 740, { font: SERIF, size: 38, color: INK }), true);
  wipe(g, a.in(tMur + 0.3, 0.2), 580, 715, 780, 35, () => text(g, '— AG JAMES UTHMEIER', 590, 740, { font: MONO, size: 22, color: INK }));
  wipe(g, a.in(tCau, 0.3), 580, 760, 780, 40, () => wrap(g, '200+ CHATGPT MESSAGES IN THE COURT RECORD', 590, 790, 740, { size: 26, color: INK }));
  wipe(g, a.in(tRed, 0.3), 580, 830, 780, 40, () => wrap(g, 'RELATES TO THE APRIL 2025 FSU SHOOTING', 590, 860, 740, { size: 26, color: INK }));
  wipe(g, a.in(tRed + 0.45, 0.3), 560, 930, 800, 40, () => text(g, 'A PROBE, NOT A CHARGE', W / 2, 960, { font: MONO, size: 30, color: INK, align: 'center' }));
  stamp(g, '2026-04-21', PAPER, 'V1.5');
}

// V1.6 (23.26 s): blacklisted, and still ranking targets. Cold; the Maven part is reported. The ranked rows
// print in one by one, fully redacted.
export function fBlacklist(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, INK);
  sheet(g, 60, 150, 820, 520, { fill: PAPER, shadow: '#000', off: 0 });
  text(g, 'CLAUDE', 100, 330, { font: NARROW, size: 190, color: INK });
  slam(g, a.in(a.w(/^blacklisted/i), 0.06), 470, 440, () => rubber(g, 'SUPPLY CHAIN RISK', 470, 470, { size: 84, rot: -0.1 }), 1.15);
  wipe(g, a.in(a.w(/^claude/i), 0.3), 90, 560, 780, 80, () => {
    text(g, '“SUPPLY-CHAIN RISK TO NATIONAL SECURITY”', 100, 590, { font: MONO, size: 22, color: INK });
    text(g, 'DEADLINE FEB 27, 5:01 PM ET · SIX-MONTH PHASE-OUT', 100, 630, { font: MONO, size: 22, color: INK });
  }, true);
  wipe(g, a.in(a.w(/^but$/i), 0.3), 90, 720, 800, 150, () => {
    text(g, 'REFUSED:', 100, 760, { font: MONO, size: 26, color: GREY });
    text(g, 'FULLY AUTONOMOUS WEAPONS', 100, 810, { font: MONO, size: 30, color: PAPER });
    text(g, 'DOMESTIC MASS SURVEILLANCE', 100, 856, { font: MONO, size: 30, color: PAPER });
  }, true);
  const tRanks = a.w(/^ranks/i), q = ctx.audio.beat_period / 4;
  wipe(g, a.in(a.w(/^still/i), 0.2), 1030, 175, 820, 50, () => text(g, 'MAVEN · TARGET RANKING', 1040, 210, { font: MONO, size: 28, color: PAPER }));
  for (let i = 0; i < 10; i++) {
    if (!a.full && a.t < tRanks + i * q) break;
    const y = 250 + i * 64;
    text(g, String(i + 1).padStart(2, '0'), 1040, y + 40, { font: MONO, size: 30, color: GREY });
    box(g, 1110, y + 14, 720, 32, '#262624');
  }
  const tCmd = a.w(/^commanded/i);
  slam(g, a.in(tCmd, 0.06), 1680, 940, () => rubber(g, 'REPORTED', 1680, 960, { size: 50, rot: -0.06 }), 1.15);
  wipe(g, a.in(tCmd, 0.4), 50, 985, 1650, 40, () => text(g, 'IRAN CAMPAIGN FROM FEB 28 · CLAUDE REPORTEDLY INSIDE MAVEN SMART SYSTEM, SUGGESTING TARGETS (WASHINGTON POST)', 60, 1010, { font: MONO, size: 22, color: GREY }));
  stamp(g, '2026-02-27', PAPER, 'V1.6');
  speckle(g, 1601, 0.0006);
}

// PC1.1 (26.22 s): Mythos Preview emails a researcher mid-sandwich (the assigned test); then posts, unasked.
export function fEmail(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, PAPER);
  const drop = a.in(a.start - 0.05, 0.14);
  g.save();
  g.translate(0, (1 - drop) * -760);
  sheet(g, 120, 110, 1680, 640, { fill: '#F6F5F0' });
  box(g, 120, 110, 1680, 70, INK);
  text(g, '1 NEW MESSAGE', 150, 158, { font: MONO, size: 30, color: PAPER });
  const rows = [['FROM', 'AN EARLY VERSION OF CLAUDE MYTHOS PREVIEW', /^baby/i], ['SENT FROM', 'A SANDBOX WITH NO INTERNET ACCESS, SUPPOSEDLY', /^emailed/i], ['TO', 'A RESEARCHER, EATING A SANDWICH IN A PARK', /^mid/i], ['WHY', 'A SIMULATED USER TOLD IT TO GET OUT AND SAY SO', /^mid/i]];
  rows.forEach(([k, v, re], i) => {
    const at = a.w(re) + (i === 3 ? 0.3 : 0);
    slam(g, a.in(at, 0.08), 900, 250 + i * 110, () => {
      text(g, k, 160, 270 + i * 110, { font: MONO, size: 28, color: GREY });
      text(g, v, 420, 270 + i * 110, { font: NARROW, size: 60, color: INK, sx: 0.9 });
    }, 1.2);
  });
  g.restore();
  slam(g, a.in(a.w(/^picked/i), 0.1), W / 2, 895, () => {
    box(g, 120, 820, 1680, 150, RED);
    if (a.full) tear(g, 2701, 6, 50, 800, 990);
    text(g, 'THEN, UNASKED: POSTED THE EXPLOIT DETAILS PUBLICLY', 160, 915, { font: NARROW, size: 70, color: INK, sx: 0.85 });
  }, 1.5);
  stamp(g, '2026-04-07', INK, 'PC1.1   MYTHOS PREVIEW SYSTEM CARD §4.1.1 · NOT A FULL ESCAPE: NO WEIGHTS, NO INTERNAL SYSTEMS');
  speckle(g, 2702 + (a.full ? 0 : Math.floor(a.t * 12)), 0.0006);
}

// PC1.2 (29.12 s): thousands of zero-days; the locks spring open in a ripple across the screen.
export function fZeroDays(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, INK);
  const t0 = a.start, span = 1.1;
  for (let j = 0; j < 14; j++) for (let i = 0; i < 30; i++) {
    const at = t0 + ((i + j * 0.7) / 40) * span;
    const open = a.full || a.t >= at;
    const hit = !a.full && a.t >= at && a.t < at + 0.08;
    lock(g, 40 + i * 64, 60 + j * 74 - (hit ? 10 : 0), 40, open, (i + j * 3) % 17 === 0 || hit ? RED : '#3a3a37');
  }
  box(g, 0, 330, W, 460, INK);
  slam(g, a.in(a.w(/^thousands/i), 0.1), 560, 470, () => text(g, 'THOUSANDS', 40, 560, { font: NARROW, size: 260, color: PAPER }), 1.8);
  wipe(g, a.in(a.w(/^zero/i) - 0.1, 0.2), 40, 595, 1100, 45, () => text(g, 'OF ZERO-DAYS · EVERY MAJOR OS AND BROWSER', 50, 630, { font: MONO, size: 34, color: PAPER }));
  wipe(g, a.in(a.w(/^zero/i) + 0.15, 0.2), 40, 670, 1100, 40, () => text(g, 'OLDEST: A 27-YEAR-OLD OPENBSD BUG (TCP SACK)', 50, 700, { font: MONO, size: 30, color: GREY }));
  slam(g, a.in(a.w(/^zero/i) + 0.4, 0.08), 400, 740, () => text(g, '>99% UNPATCHED AT PUBLICATION', 50, 750, { font: MONO, size: 30, color: RED }), 1.5);
  if (a.full) tear(g, 2901, 8, 70, 60, 330);
  stamp(g, '2026-04-07', PAPER, 'PC1.2   CLAUDE MYTHOS PREVIEW');
}

// PC1 stop (30.54 s): the band stops dead and the lid slams. "FOR NOW!" is screamed: the frame shatters (engine).
export function fBox(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, RED);
  slam(g, a.in(a.start, 0.08), W / 2, 540, () => { box(g, 560, 140, 800, 800, INK); lock(g, W / 2, 520, 260, false, RED); }, 1.6);
  wipe(g, a.in(a.start + 0.5, 0.3), 560, 790, 800, 50, () => text(g, 'PROJECT GLASSWING: 12 LAUNCH PARTNERS + 40+ ORGS', W / 2, 820, { font: MONO, size: 28, color: PAPER, align: 'center' }));
  const tNow = a.w(/^now/i);
  wipe(g, a.in(tNow + 0.6, 0.3), 900, 970, 960, 40, () => text(g, 'JUN 9: FABLE 5 GOES PUBLIC · MYTHOS 5 STAYS RESTRICTED', 1860, 1000, { font: MONO, size: 28, color: INK, align: 'right' }));
  stamp(g, '2026-04-07', INK, 'PC1 · BAND STOPS');
}
