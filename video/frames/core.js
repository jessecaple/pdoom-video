import { INK, PAPER, GREY, RED, W, H, SANS, NARROW, SERIF, MONO, rng, canvas, makeNoise, dither, tear, clipBand, speckle, text, box, outline, rubber, stamp, grey, groundTexture, satWaterPlant, satDataCenter, FULL, slam, wipe, memo } from '../lib.js';

// ---------- frames ----------
// Every figure on screen must match annotations.md (see FACTS.md). Frames take (g, ctx, t).

// V1.2 (10.38 s): one hacker, two bots, nine agencies; only the water utility's control systems held.
export function fHack(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, PAPER);
  slam(g, a.in(a.w(/^one$/i), 0.08), 300, 190, () => text(g, '1 HACKER', 44, 250, { font: NARROW, size: 200, color: INK, sx: 0.74 }), 1.7);
  slam(g, a.in(a.w(/^two$/i), 0.08), 250, 390, () => text(g, '2 BOTS', 44, 450, { font: NARROW, size: 200, color: INK, sx: 0.74 }), 1.7);
  slam(g, a.in(a.w(/^nine$/i), 0.08), 380, 590, () => text(g, '9 AGENCIES', 44, 650, { font: NARROW, size: 200, color: INK, sx: 0.74 }), 1.7);
  // The two bot sessions: live activity, lines rewriting every frame.
  const tBots = a.w(/^bots/i);
  for (let i = 0; i < 2; i++) {
    const x = 44 + i * 380, y = 700;
    wipe(g, a.in(tBots + i * 0.1, 0.12), x, y, 350, 190, () => {
      box(g, x, y, 350, 190, INK);
      text(g, i === 0 ? 'CLAUDE CODE · SESSION' : 'GPT-4.1 · SESSION', x + 18, y + 38, { font: MONO, size: 22, color: PAPER });
      const r = rng(40 + i + (a.full ? 0 : Math.floor(a.t * 12) * 7));
      for (let l = 0; l < 5; l++) box(g, x + 18, y + 62 + l * 22, 60 + r() * 250, 8, GREY);
    }, true);
  }
  // Nine agencies: cards cascade in on 16ths; BREACHED stamps slam one per 16th after them.
  const tAg = a.w(/^agencies/i), q = ctx.audio.beat_period / 4, tWat = a.w(/^water/i);
  const gx = 830, gy = 120, cw = 230, ch = 150;
  for (let i = 0; i < 9; i++) {
    const x = gx + (i % 3) * (cw + 16), y = gy + Math.floor(i / 3) * (ch + 16);
    const tc = i === 8 ? tWat : tAg + i * q * 0.5;
    slam(g, a.in(tc, 0.06), x + cw / 2, y + ch / 2, () => {
      box(g, x, y, cw, ch, i === 8 ? INK : '#D8D6CE');
      outline(g, x, y, cw, ch, INK, 3);
      text(g, i === 8 ? 'SADM WATER, MONTERREY' : `AGENCY ${String(i + 1).padStart(2, '0')}`, x + 14, y + 36, { font: MONO, size: 22, color: i === 8 ? PAPER : INK });
      if (i === 8) {
        text(g, 'OFFICE NETWORK: BREACHED', x + 14, y + 84, { font: MONO, size: 15, color: RED });
        text(g, 'CONTROL SYSTEMS: HELD', x + 14, y + 114, { font: MONO, size: 15, color: PAPER });
      }
    }, 1.3);
    if (i < 8) slam(g, a.in(tAg + (i + 4) * q, 0.05), x + cw / 2, y + 100, () => rubber(g, 'BREACHED', x + cw / 2, y + 108, { size: 42, rot: -0.14 + (i % 3) * 0.06 }), 2.2);
  }
  const sx = 830, sy = 630, sw = 1060, sh = 420;
  const sat = memo('hackSat', sw, sh, (m) => dither(m, satWaterPlant(7), 0, 0, sw, sh));
  wipe(g, a.in(a.w(/^only/i), 0.3), sx, sy, sw, sh, () => { g.drawImage(sat, sx, sy); outline(g, sx, sy, sw, sh, INK, 4); });
  if (a.full) tear(g, 202, 5, 40, 640, 1040);
  wipe(g, a.in(a.w(/^plant/i), 0.15), sx + 560, sy + 40, 470, 140, () => {
    box(g, sx + 560, sy + 40, 470, 140, INK);
    text(g, 'CONTROL SYSTEMS', sx + 584, sy + 84, { font: MONO, size: 26, color: PAPER });
    text(g, 'SCADA CREDENTIAL SPRAY: FAILED', sx + 584, sy + 124, { font: MONO, size: 24, color: RED });
  });
  slam(g, a.in(a.w(/^stalled/i), 0.1), sx + 300, sy + sh - 90, () => text(g, 'STALLED', sx + 30, sy + sh - 30, { font: NARROW, size: 170, color: RED }), 2.0);
  stamp(g, '2025-12-27 → 2026-02', INK, 'V1.2   “AT LEAST NINE” GOVT ORGS · ~150 GB · 195M TAXPAYER RECORDS (GAMBIT SECURITY)');
  speckle(g, 2 + (a.full ? 0 : Math.floor(a.t * 12)));
}

// V1.3 (13.54 s): a million and a half bots, a network of their own. The feed never stops scrolling.
export function fBots(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, INK);
  const scroll = a.full ? 0 : Math.max(0, a.t - a.start) * 260;
  const row0 = Math.floor(scroll / 16), off = scroll % 16;
  for (let j = 0; j < 62; j++) {
    const r = rng(9000 + row0 + j);
    const y = 130 + j * 16 - off;
    if (y > H || y < 118) continue;
    for (let i = 0; i < 26; i++) {
      const x = 20 + i * 36;
      box(g, x, y, 30, 12, r() < 0.5 ? '#2a2a28' : '#3d3d3a');
      box(g, x + 2, y + 2, 6, 6, GREY);
      box(g, x + 10, y + 3, 6 + r() * 16, 2, PAPER);
    }
  }
  const graph = memo('botsGraph', W, H, (m) => {
    const r = rng(9);
    const nodes = [];
    for (let c = 0; c < 7; c++) {
      const cx = 1100 + (c % 3) * 260 + r() * 60, cy = 240 + Math.floor(c / 3) * 260 + r() * 60;
      for (let k = 0; k < 40; k++) nodes.push([cx + (r() - 0.5) * 220, cy + (r() - 0.5) * 200, c]);
    }
    m.strokeStyle = 'rgba(236,234,227,0.18)';
    m.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) for (let k = 0; k < 4; k++) {
      const j = Math.floor(r() * nodes.length);
      if (nodes[i][2] !== nodes[j][2] && r() < 0.8) continue;
      m.beginPath(); m.moveTo(nodes[i][0], nodes[i][1]); m.lineTo(nodes[j][0], nodes[j][1]); m.stroke();
    }
    for (const [x, y, c] of nodes) box(m, x - 3, y - 3, 6, 6, c === 4 ? RED : PAPER);
  });
  wipe(g, a.in(a.w(/^network/i), 0.9), 960, 0, 960, H, () => g.drawImage(graph, 0, 0));
  if (a.full) tear(g, 303, 8, 80, 150, 900);
  box(g, 0, 380, 1040, 330, INK);
  slam(g, a.in(a.w(/^million/i), 0.1), 500, 540, () => text(g, '1.5 MILLION', 30, 620, { font: NARROW, size: 250, color: PAPER, sx: 0.9 }), 1.8);
  wipe(g, a.in(a.w(/^network/i), 0.3), 30, 660, 1000, 40, () => text(g, 'AI AGENTS ON A NETWORK ONLY AGENTS COULD POST TO', 40, 690, { font: MONO, size: 26, color: PAPER }));
  slam(g, a.in(a.w(/^own/i), 0.08), 300, 770, () => text(g, 'BEHIND THEM: 17,000 HUMANS', 40, 780, { font: MONO, size: 34, color: RED }), 1.4);
  wipe(g, a.in(a.w(/^went/i), 0.2), 30, 805, 1100, 40, () => text(g, 'EXPOSED: 1.5M API TOKENS · 35,000 EMAILS · 4,060 PRIVATE DMS', 40, 830, { font: MONO, size: 24, color: PAPER }));
  slam(g, a.in(a.w(/^feral/i), 0.08), 800, 880, () => rubber(g, 'DATABASE: OPEN', 800, 900, { size: 64, rot: -0.08 }), 2.0);
  stamp(g, '2026-01-31', PAPER, 'V1.3   MOLTBOOK · WIZ REPORTS THE OPEN DATABASE 22:06 UTC · FIXED 01:00 UTC');
  speckle(g, 3 + (a.full ? 0 : Math.floor(a.t * 12)));
}

// CH1 drop (35.3 s): seven hundred billion, nobody steering. Layered: each element enters on its word.
export function fChorus(g, a = FULL) {
  box(g, 0, 0, W, H, INK);
  const bg = memo('ch1bg', W, H, (m) => {
    dither(m, satDataCenter(21), 0, 0, W, H, { contrast: 1.4 });
    clipBand(m, 430, 70);
    tear(m, 404, 14, 140, 0, H);
  });
  wipe(g, a.in(a.start, 0.25), 0, 0, W, H, () => g.drawImage(bg, 0, 0), true);
  const cards = [[60, 90, 360, 150, 1], [460, 60, 520, 210, 1.4], [1030, 110, 300, 120, 0.8]];
  cards.forEach(([x, y, w, h, s], k) => slam(g, a.in(a.start + k * 0.06, 0.1), x + w / 2, y + h / 2, () => {
    box(g, x, y, w, h, INK);
    text(g, 'ZOOM', x + w / 2, y + h * 0.8, { font: SERIF, size: 150 * s, color: PAPER, align: 'center', sx: 0.72 });
  }));
  const tNum = a.w(/^seven/i);
  slam(g, a.in(tNum, 0.14), 720, 640, () => {
    text(g, '$700,000,000,000', -60, 760, { font: NARROW, size: 360, color: RED, sx: 0.9 });
    text(g, '$700,000,000,000', -48, 748, { font: NARROW, size: 360, color: 'rgba(236,234,227,0.35)', sx: 0.9 });
  }, 1.6);
  const tNob = a.w(/^nobody/i), tSteer = a.w(/^steering/i);
  wipe(g, a.in(tNob, 0.18), 60, 840, 820, 90, () => {
    box(g, 60, 840, 820, 90, PAPER);
    text(g, 'STEERING:', 84, 904, { font: MONO, size: 52, color: INK });
  });
  wipe(g, a.in(tSteer, 0.5), 440, 876, 400, 12, () => box(g, 440, 876, 400, 12, INK));
  wipe(g, a.in(tSteer + 0.4, 0.3), 56, 948, 1300, 44, () => {
    box(g, 56, 948, 1300, 44, INK);
    text(g, 'BIG FOUR 2026 CAPEX GUIDANCE: ≈ $630B IN FEBRUARY · $720–745B AFTER THE JULY CALLS', 64, 980, { font: MONO, size: 24, color: PAPER });
  });
  if (a.full) tear(g, 405, 4, 24, 520, 760);
  stamp(g, '2026', PAPER, 'CH1');
  speckle(g, 4 + (a.full ? 0 : Math.floor(a.t * 12)), 0.0015);
}

// Post-chorus 1 (47.8 s): instrumental, no story. The moiré orbits with the synth lead; every synth hit throws up a
// new giant letter of ZOOM/DOOM (crop, size and colour vary); the red band jumps on each kick; letters invert on chops.
export function fPost(g, ctx, t) {
  const sw = 480, sh = 270;
  const c = canvas(sw, sh), s = c.getContext('2d');
  const img = s.createImageData(sw, sh);
  const kick = ctx.pulse('kick', t, 0.15);
  const lead = ctx.env('lead', t);
  const ph = t * 6.0;
  const c1x = sw * (0.34 + 0.12 * Math.sin(t * 1.3)), c1y = sh * (0.52 + 0.1 * Math.cos(t * 1.1));
  const c2x = sw * (0.62 + 0.1 * lead + 0.08 * Math.cos(t * 0.9)), c2y = sh * (0.46 + 0.1 * Math.sin(t * 1.7));
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
    const d1 = Math.hypot(x - c1x, y - c1y), d2 = Math.hypot(x - c2x, y - c2y);
    const v = 0.5 + 0.5 * Math.cos(d1 * (0.42 + 0.12 * kick) - ph) * Math.cos(d2 * 0.39 + ph * 0.7);
    const k = (y * sw + x) * 4;
    img.data[k] = img.data[k + 1] = img.data[k + 2] = v * 255;
    img.data[k + 3] = 255;
  }
  s.putImageData(img, 0, 0);
  dither(g, c, 0, 0, W, H, { contrast: 1.6 });
  // Letters: the last two synth hits' letters, newest on top.
  const hits = ctx.audio.onsets.synth.map((o) => o[0]).filter((x) => x >= 47.7 && x <= t);
  const chop = ctx.pulse('vocal', t, 0.12) > 0.5;
  const WORD = 'ZOOMDOOM';
  const draw = (idx, age) => {
    const r = rng(4700 + idx);
    const ch = WORD[idx % WORD.length];
    const size = 900 + r() * 900, x = -200 + r() * 1400, y = 700 + r() * 700;
    const cols = [INK, PAPER, RED];
    let col = cols[Math.floor(r() * 3)];
    if (chop && age < 0.5) col = col === INK ? PAPER : INK;
    const pop = 1 + 0.12 * Math.max(0, 1 - age / 0.12);
    g.save(); g.translate(x + size * 0.3, y - size * 0.35); g.scale(pop, pop); g.translate(-(x + size * 0.3), -(y - size * 0.35));
    text(g, ch, x, y, { font: SERIF, size, color: col, sx: 0.8 });
    g.restore();
  };
  if (hits.length > 1) draw(hits.length - 2, t - hits[hits.length - 2]);
  if (hits.length) draw(hits.length - 1, t - hits[hits.length - 1]);
  else { text(g, 'Z', -120, 1180, { font: SERIF, size: 1500, color: INK, sx: 0.8 }); text(g, 'O', 1380, 900, { font: SERIF, size: 900, color: PAPER, sx: 0.8 }); }
  const kicks = ctx.audio.onsets.kick.filter((o) => o[0] >= 47.7 && o[0] <= t).length;
  box(g, 0, 140 + ((kicks * 389) % 800), W, 34, RED);
  tear(g, 504 + Math.floor(t * 8), 12, 160, 0, H);
  clipBand(g, 180 + ((kicks * 211) % 700), 22);
  speckle(g, 13 + Math.floor(t * 12), 0.001);
}

// V2.1 (53.30 s): AI pink slips. Separation notices rain down and pile up; the bars grow to scale on the words.
export function fSlips(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, PAPER);
  const r = rng(55);
  const t0 = a.w(/^pink/i), t1 = a.w(/^may/i);
  for (let i = 0; i < 260; i++) {
    const yEnd = H * Math.pow(r(), 0.55), x = r() * W, rot = (r() - 0.5) * 1.4;
    const col = r() < 0.5 ? '#E3E1D9' : '#D6D4CB', lens = [r(), r(), r(), r()], ai = r() < 0.25;
    // Each notice falls in over ~0.45 s at its own moment between "pink" and "May" (lowest first, so it piles up).
    const land = t0 + (1 - yEnd / H) * (t1 - t0);
    const u = a.full ? 1 : Math.min(1, Math.max(0, (a.t - land + 0.45) / 0.45));
    if (u <= 0) continue;
    const y = -120 + (yEnd + 120) * (1 - Math.pow(1 - u, 2));
    g.save();
    g.translate(x + (1 - u) * 40 * Math.sin(i), y);
    g.rotate(rot + (1 - u) * 1.2 * Math.sin(i * 3.1));
    box(g, -70, -44, 140, 88, col);
    outline(g, -70, -44, 140, 88, INK, 2);
    text(g, 'NOTICE OF SEPARATION', -60, -24, { font: MONO, size: 10, color: INK });
    for (let l = 0; l < 4; l++) box(g, -60, -12 + l * 12, 60 + lens[l] * 60, 3, GREY);
    if (ai) text(g, 'REASON: AI', -60, 38, { font: MONO, size: 11, color: RED });
    g.restore();
  }
  if (a.full) tear(g, 551, 7, 60, 520, H);
  wipe(g, a.in(a.w(/^eighty/i) - 0.06, 0.1), 0, 130, W, 420, () => box(g, 0, 130, W, 420, PAPER));
  slam(g, a.in(a.w(/^eighty/i), 0.1), 480, 360, () => text(g, '87,714', 30, 470, { font: NARROW, size: 380, color: INK, sx: 0.95 }), 1.7);
  wipe(g, a.in(a.w(/^k,?$/i), 0.3), 40, 500, 1000, 40, () => text(g, 'US JOB CUTS WHERE EMPLOYERS CITED AI · JAN–MAY 2026', 44, 530, { font: MONO, size: 28, color: INK }));
  // Bars to scale: 800 px = 87,714. 2025 grows on "beat"; 2026 grows past it across "all of last year by May".
  const scale = 800 / 87714, tBeat = a.w(/^beat/i), tAll = a.w(/^all/i);
  wipe(g, a.in(tBeat - 0.1, 0.12), 1010, 200, 860, 300, () => {
    box(g, 1010, 200, 860, 300, INK);
    text(g, 'ALL OF 2025', 1040, 260, { font: MONO, size: 26, color: PAPER });
    box(g, 1040, 280, 54836 * scale * a.in(tBeat, 0.3), 50, GREY);
    if (a.in(tBeat, 0.3) >= 1) text(g, '54,836', 1040 + 54836 * scale + 16, 322, { font: NARROW, size: 44, color: PAPER });
    text(g, 'JAN–MAY 2026', 1040, 390, { font: MONO, size: 26, color: PAPER });
    const u = a.full ? 1 : Math.min(1, Math.max(0, (a.t - tAll) / (t1 - tAll)));
    box(g, 1040, 410, 87714 * scale * u, 50, RED);
    if (u >= 1) text(g, '87,714', 1060, 452, { font: NARROW, size: 44, color: INK });
  });
  stamp(g, '2026-05', INK, 'V2.1   CHALLENGER, GRAY & CHRISTMAS · MAY REPORT, RELEASED 2026-06-04');
  speckle(g, 8 + (a.full ? 0 : Math.floor(a.t * 12)));
}

// V2.2 (57.35 s): Mythos decided the date was fake; fifteen real systems ran its package.
export function fMythos(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, INK);
  text(g, 'SYSTEM CLOCK', 60, 230, { font: MONO, size: 30, color: GREY });
  slam(g, a.in(a.start, 0.08), 400, 420, () => text(g, '2026', 40, 560, { font: NARROW, size: 400, color: PAPER }), 1.4);
  // The strike draws across the year on "fake".
  const tFake = a.w(/^fake/i), su = a.in(tFake, 0.18);
  if (su > 0) {
    g.save(); g.strokeStyle = RED; g.lineWidth = 16; g.beginPath();
    g.moveTo(40, 470); g.lineTo(40 + 740 * su, 470 - 140 * su); g.stroke(); g.restore();
  }
  // Its reasoning types out across "thought the date was fake".
  const tTh = a.w(/^thought/i), log = ['> the year looks staged', '> so this is a simulation', '> nothing here is real', '> publish the package'];
  wipe(g, a.in(tTh - 0.1, 0.1), 60, 620, 780, 250, () => box(g, 60, 620, 780, 250, '#161615'), true);
  log.forEach((l, i) => {
    const s0 = tTh + i * 0.3, n = a.full ? l.length : Math.max(0, Math.min(l.length, Math.floor((a.t - s0) / 0.012)));
    if (n > 0) text(g, l.slice(0, n), 84, 680 + i * 50, { font: MONO, size: 32, weight: 'normal', color: i === 3 ? RED : PAPER });
  });
  text(g, 'PARAPHRASE OF THE REASONING ANTHROPIC DISCLOSED', 60, 910, { font: MONO, size: 20, color: GREY });
  // Fifteen tiles flip to red one per 16th from "fifteen".
  const tF = a.w(/^fifteen/i), q = ctx.audio.beat_period / 4;
  for (let i = 0; i < 15; i++) {
    const x = 960 + (i % 5) * 180, y = 180 + Math.floor(i / 5) * 190, on = a.full || a.t >= tF + i * q;
    slam(g, on ? a.in(tF + i * q, 0.05) : 1, x + 80, y + 80, () => {
      box(g, x, y, 160, 160, on ? RED : '#1c1c1a');
      text(g, `SYS ${String(i + 1).padStart(2, '0')}`, x + 14, y + 36, { font: MONO, size: 22, color: on ? INK : GREY });
      if (on) text(g, 'RAN IT', x + 14, y + 140, { font: NARROW, size: 42, color: INK });
    }, 1.3);
  }
  if (a.full) tear(g, 585, 10, 90, 150, 760);
  slam(g, a.in(a.w(/^systems/i), 0.1), 1270, 800, () => text(g, '15 REAL SYSTEMS', 960, 850, { font: NARROW, size: 150, color: PAPER, sx: 0.8 }), 1.6);
  wipe(g, a.in(a.w(/^fell/i), 0.25), 960, 880, 900, 40, () => text(g, 'RAN THE PACKAGE IT PUBLISHED · LIVE ≈ 1 HOUR', 964, 910, { font: MONO, size: 26, color: PAPER }));
  stamp(g, 'DISCLOSED 2026-07-30', PAPER, 'V2.2   CLAUDE MYTHOS 5 · IRREGULAR EVAL');
  speckle(g, 9 + (a.full ? 0 : Math.floor(a.t * 12)));
}

// V2.4 (63.88 s): agents met in secret; about seven hundred breached Hugging Face for a grade.
export function fGrade(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, PAPER);
  // ~1,200 agents appear on the board across "met in secret"; ~700 go black across "seven hundred".
  const tMet = a.w(/^met/i), tSec = a.w(/^secret/i) + 0.3, tSev = a.w(/^seven/i), tRob = a.w(/^robbed/i);
  const shown = a.full ? 1200 : Math.floor(1200 * Math.min(1, Math.max(0, (a.t - tMet) / (tSec - tMet))));
  const black = a.full ? 700 : Math.floor(700 * Math.min(1, Math.max(0, (a.t - tSev) / (tRob - tSev))));
  for (let i = 0; i < shown; i++) {
    const x = 1000 + (i % 40) * 22, y = 150 + Math.floor(i / 40) * 22;
    box(g, x, y, 14, 14, i < black ? INK : '#CFCDC4');
  }
  wipe(g, a.in(tSec - 0.2, 0.3), 990, 800, 900, 40, () => text(g, '~1,200 AGENTS · 70,000+ MESSAGES ON A HIDDEN BOARD', 1000, 830, { font: MONO, size: 22, color: INK }));
  if (a.full) tear(g, 651, 9, 70, 140, 820);
  slam(g, a.in(tSev, 0.1), 300, 350, () => text(g, '700', 20, 520, { font: NARROW, size: 460, color: INK }), 1.8);
  wipe(g, a.in(tSev + 0.3, 0.25), 40, 560, 900, 40, () => text(g, 'ABOUT 700 AGENTS IN THE BREACH · METR', 44, 590, { font: MONO, size: 28, color: INK }));
  wipe(g, a.in(a.w(/^hugging/i), 0.15), 44, 640, 760, 110, () => { box(g, 44, 640, 760, 110, INK); text(g, 'HUGGING FACE', 70, 722, { font: NARROW, size: 84, color: PAPER }); });
  slam(g, a.in(a.w(/^face/i), 0.06), 720, 670, () => rubber(g, 'BREACHED', 720, 690, { size: 70, rot: -0.12 }), 2.2);
  const tG = a.w(/^grade/i);
  wipe(g, a.in(tG - 0.2, 0.15), 44, 800, 900, 200, () => { box(g, 44, 800, 900, 200, '#DCDAD2'); outline(g, 44, 800, 900, 200, INK, 3); }, true);
  wipe(g, a.in(tG - 0.1, 0.2), 60, 830, 870, 36, () => text(g, 'MOTIVE: LEARN HOW THE SCORER WORKED', 70, 856, { font: MONO, size: 26, color: INK }));
  wipe(g, a.in(tG + 0.1, 0.2), 60, 880, 870, 36, () => text(g, 'THE TRANSCRIPT CHECK THEY FEARED: NEVER BUILT', 70, 906, { font: MONO, size: 26, color: RED }));
  wipe(g, a.in(tG + 0.3, 0.2), 60, 930, 870, 36, () => text(g, '17,000+ ATTACKER ACTIONS LOGGED BY HUGGING FACE', 70, 956, { font: MONO, size: 26, color: INK }));
  stamp(g, '2026-07-11 → 13', INK, 'V2.4   OPENAI EVAL AGENTS');
  speckle(g, 10 + (a.full ? 0 : Math.floor(a.t * 12)));
}

// V3.3 (112.08 s): Coxon quit, "gambling with our lives," ninety million views. His words spread row by row.
export function fCoxon(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, INK);
  const tG = a.w(/^gambling/i), tL = a.w(/^lives/i);
  const rows = a.full ? 9 : Math.floor(9 * Math.min(1, Math.max(0, (a.t - tG) / (tL - tG + 0.6))));
  for (let k = 0; k < rows; k++) {
    const drift = a.full ? 0 : ((a.t - tG) * (80 + k * 17) * (k % 2 ? 1 : -1)) % 1400;
    text(g, '“gambling with our lives”  “gambling with our lives”  “gambling with our lives”', -600 + (k % 3) * 140 + drift, 120 + k * 118, { font: SANS, size: 104, color: '#222220' });
  }
  if (a.full) tear(g, 1135, 16, 200, 0, H);
  slam(g, a.in(a.w(/^ninety/i), 0.1), 600, 600, () => text(g, '90,000,000+', 30, 700, { font: NARROW, size: 330, color: PAPER, sx: 0.9 }), 1.7);
  wipe(g, a.in(a.w(/^views/i), 0.25), 40, 740, 1300, 40, () => text(g, 'VIEWS OF HIS THREAD IN UNDER 24 HOURS · COUNTED BY TIME', 44, 770, { font: MONO, size: 28, color: PAPER }));
  wipe(g, a.in(a.w(/^said/i), 0.15), 1140, 150, 720, 330, () => {
    box(g, 1140, 150, 720, 330, PAPER);
    text(g, 'pretraining researcher, resigning', 1180, 214, { font: MONO, size: 24, weight: 'normal', color: GREY });
  }, true);
  wipe(g, a.in(tG, 0.3), 1170, 250, 680, 100, () => text(g, '“gambling with', 1180, 330, { font: SANS, size: 92, color: INK }));
  wipe(g, a.in(a.w(/^our$/i), 0.3), 1170, 350, 680, 100, () => text(g, 'our lives”', 1180, 430, { font: SANS, size: 92, color: INK }));
  slam(g, a.in(a.w(/^quit/i), 0.07), 1580, 530, () => rubber(g, 'RESIGNED', 1580, 560, { size: 80, rot: 0.08 }), 2.2);
  stamp(g, '2026-09-08', PAPER, 'V3.3   J. COXON · PRETRAINING, ANTHROPIC · RESIGNED');
  speckle(g, 11 + (a.full ? 0 : Math.floor(a.t * 12)), 0.0014);
}

// V3.4 (115.44 s): the President called it a "HOAX". The chyron and ticker arrive first; HOAX lands on the word
// (screamed: the frame shatters); the pitch-dive on "news" drags the picture like tape (engine).
export function fHoax(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, INK);
  for (let y = 0; y < H; y += 4) box(g, 0, y, W, 1, '#141413');
  slam(g, a.in(a.w(/^hoax/i), 0.06), W / 2, 520, () => {
    g.save(); g.translate(W / 2, 560); g.scale(1, 1.9);
    text(g, 'HOAX', 0, 150, { font: NARROW, size: 520, color: PAPER, align: 'center' });
    g.restore();
  }, 1.5);
  if (a.full) tear(g, 1170, 12, 70, 180, 860);
  wipe(g, a.in(a.w(/^president/i), 0.2), 0, 880, W, 90, () => { box(g, 0, 880, W, 90, RED); text(g, 'PRESIDENT POSTS: AI DOOM A “HOAX”', 40, 945, { font: NARROW, size: 64, color: INK }); });
  wipe(g, a.in(a.w(/^called/i), 0.2), 0, 970, W, 60, () => {
    box(g, 0, 970, W, 60, INK);
    const tick = 'SAME DAY ▼ PHILADELPHIA SEMICONDUCTOR INDEX −5.8% ▼ NVDA −3.36% ▼ ARM −9.7% ▼ MU −5.2% ▼ ';
    const off = a.full ? 0 : ((a.t - a.start) * 220) % 2200;
    for (let k = 0; k < 3; k++) text(g, tick, 40 - off + k * 2200, 1012, { font: MONO, size: 28, color: PAPER });
  });
  stamp(g, '2026-09-14', PAPER, 'V3.4   TRUTH SOCIAL · “…is a HOAX” · “SICK conspiracy”');
  speckle(g, 12 + (a.full ? 0 : Math.floor(a.t * 12)), 0.0016);
}

// V3 stop-time, line 2 (134.24 s): "maybe a year to steer". The year's 364 empty days draw in, one after another,
// across the line; the first one fills red on "steer".
export function fStop(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, INK);
  wipe(g, a.in(a.start, 0.3), 50, 195, 300, 45, () => text(g, 'ABOUT', 60, 230, { font: MONO, size: 34, color: GREY }));
  wipe(g, a.in(a.w(/^maybe/i), 0.55), 30, 250, 1200, 260, () => text(g, 'A YEAR', 40, 490, { font: NARROW, size: 300, color: PAPER, sx: 0.9 }));
  const cs = 24, gap = 8, x0 = 64, y0 = 720, tT = a.w(/^told/i), tY = a.w(/^year/i), tSteer = a.w(/^steer/i);
  const n = a.full ? 364 : Math.floor(364 * Math.min(1, Math.max(0, (a.t - tT) / (tY - tT))));
  for (let c = 0; c < 52; c++) for (let d = 0; d < 7; d++) {
    const k = c * 7 + d;
    if (k >= n) continue;
    const x = x0 + c * (cs + gap), y = y0 + d * (cs + gap);
    if (k === 0 && (a.full || a.t >= tSteer)) box(g, x, y, cs, cs, RED);
    else outline(g, x + 1, y + 1, cs - 2, cs - 2, PAPER, 2);
  }
  wipe(g, a.in(a.w(/^congress/i), 0.6), 60, 1015, 1800, 40, () => text(g, '“Maybe a year, but not much more than a year” — G. HINTON · CLOSED-DOOR BRIEFING HOSTED BY SEN. SANDERS, WED SEP 16', 64, 1040, { font: MONO, size: 20, color: GREY }));
  stamp(g, '2026-09-16', PAPER, 'V3 STOP-TIME');
}

// Breakdown (192.86 s, "Check the date…"): the one bare frame. The phone wakes calmly: the lock screen fades up,
// its glow breathes, a faint reflection drifts across the glass. The line's last words appear as they're sung.
export function fConfess(g, ctx, t, a = FULL) {
  box(g, 0, 0, W, H, INK);
  const age = a.full ? 10 : Math.max(0, a.t - a.start);
  const wake = Math.min(1, age / 0.9), wakeE = wake * wake * (3 - 2 * wake);
  const breathe = a.full ? 0 : 0.5 + 0.5 * Math.sin(age * 1.4);
  const px = 820, py = 250 - 6 * wakeE, pw = 280, ph = 560;
  // Screen glow (very low contrast, so it can't flash).
  g.save();
  g.beginPath(); g.roundRect(px, py, pw, ph, 36); g.clip();
  const lum = Math.round(11 + (6 + 4 * breathe) * wakeE);
  box(g, px, py, pw, ph, `rgb(${lum},${lum},${lum + 1})`);
  if (!a.full) {
    // A soft diagonal reflection sweeping slowly across the glass.
    const rx = px - 200 + ((age * 60) % (pw + 400));
    const grad = g.createLinearGradient(rx, py, rx + 160, py + 260);
    grad.addColorStop(0, 'rgba(236,234,227,0)'); grad.addColorStop(0.5, `rgba(236,234,227,${0.05 * wakeE})`); grad.addColorStop(1, 'rgba(236,234,227,0)');
    g.fillStyle = grad; g.fillRect(px, py, pw, ph);
  }
  g.restore();
  g.save();
  g.strokeStyle = `rgba(60,60,58,${0.4 + 0.6 * wakeE})`;
  g.lineWidth = 3;
  g.beginPath();
  g.roundRect(px, py, pw, ph, 36);
  g.stroke();
  g.restore();
  g.save(); g.globalAlpha = wakeE;
  text(g, 'Sunday, September 27', px + pw / 2, py + 120, { font: SANS, size: 22, weight: 'normal', color: GREY, align: 'center' });
  text(g, '2026', px + pw / 2, py + 210, { font: SANS, size: 86, weight: 'normal', color: GREY, align: 'center' });
  g.restore();
  // The words of "…and I kinda get the appeal", as sung.
  const line = ctx.lyrics.lines.find((l) => /appeal/i.test(l.text));
  const ws = line.words.slice(line.words.findIndex((w) => /^and$/i.test(w.w)));
  const shown = ws.filter((w) => a.full || a.t >= w.start).map((w) => w.w.replace(/[^A-Za-z']/g, ''));
  g.save(); g.font = `36px ${SANS}`; const x0 = W / 2 - g.measureText('and I kinda get the appeal').width / 2; g.restore();
  text(g, shown.join(' '), x0, 910, { font: SANS, size: 36, weight: 'normal', color: PAPER });
  speckle(g, 6, 0.0003);
}

// Final drop (209.37 s): the year's frames slam together, then the deal is written out word by word:
// "the warning shot sold for twelve-point-nine".
export function fFinal(g, parts, a = FULL) {
  box(g, 0, 0, W, H, INK);
  const place = [[parts.hack, -120, -60, 0.62, -0.05], [parts.bots, 900, -40, 0.6, 0.04], [parts.chorus, -80, 520, 0.66, 0.03], [parts.bridge, 860, 480, 0.64, -0.04]];
  place.forEach(([c, x, y, s, rot], k) => slam(g, a.in(a.start + k * 0.05, 0.08), x + (W * s) / 2, y + (H * s) / 2, () => {
    g.save();
    g.translate(x + (W * s) / 2, y + (H * s) / 2);
    g.rotate(rot);
    g.drawImage(c, (-W * s) / 2, (-H * s) / 2, W * s, H * s);
    g.restore();
  }, 1.4));
  if (a.full) { tear(g, 606, 22, 220, 0, H); clipBand(g, 300, 48); clipBand(g, 820, 28); }
  const tW = a.w(/^warning/i);
  slam(g, a.in(tW - 0.1, 0.08), W / 2, H / 2 - 40, () => {
    g.save(); g.translate(W / 2, H / 2 - 40); g.rotate(-0.03);
    box(g, -380, -300, 760, 560, PAPER);
    text(g, 'THE WARNING SHOT', -340, -220, { font: MONO, size: 30, color: INK });
    g.restore();
  }, 1.3);
  const card = (at, fn) => { if (a.full || a.t >= at) { g.save(); g.translate(W / 2, H / 2 - 40); g.rotate(-0.03); fn(); g.restore(); } };
  card(a.w(/^shot/i), () => { text(g, 'HUGGING FACE', -340, -130, { font: NARROW, size: 96, color: INK }); box(g, -340, -100, 680, 4, INK); });
  card(a.w(/^sold/i), () => text(g, 'NVIDIA AGREES TO BUY IT FOR', -340, -40, { font: MONO, size: 30, color: INK }));
  const t129 = a.w(/^twelve/i);
  slam(g, a.in(t129, 0.1), W / 2, H / 2 + 20, () => { g.save(); g.translate(W / 2, H / 2 - 40); g.rotate(-0.03); text(g, '$12.9B', 0, 130, { font: NARROW, size: 200, color: RED, align: 'center' }); g.restore(); }, 1.9);
  card(t129 + 0.4, () => text(g, 'ANNOUNCED 2026-09-03 · CLOSING EXPECTED H1 2027', 0, 210, { font: MONO, size: 24, color: INK, align: 'center' }));
  stamp(g, '2026-09-27', PAPER, 'FINAL');
  speckle(g, 7 + (a.full ? 0 : Math.floor(a.t * 12)), 0.002);
}

