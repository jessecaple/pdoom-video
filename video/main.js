// THE RECORD: the full-song storyboard. Each shot is a still at its time in the song.
//   ?t=35.3            preview/render the shot at that time
//   ?sheet=1|2|3       contact sheet of shots (render at --w 1920 --h 1836)
import { start } from '/tools/render/runtime.js';
import { INK, PAPER, GREY, RED, W, H, NARROW, SANS, SERIF, MONO, canvas, box, text, makeAnim, setLive } from './lib.js';
import * as core from './frames/core.js';
import * as v1 from './frames/v1.js';
import * as ch from './frames/chorus.js';
import * as v2 from './frames/v2.js';
import * as inst from './frames/inst.js';
import * as v3 from './frames/v3.js';
import * as br from './frames/bridge.js';
import * as ending from './frames/ending.js';
import { loadPlan, renderMotion } from './motion/engine.js';

const chorus = (n, fn) => (g, ctx, t, a) => fn(g, ctx, t, n, a);
const hook = (n) => (g, ctx, t) => ch.chHook(g, ctx, t, n, (k) => draw(`ch${k}capex`));

// [time, id, label, draw(g, ctx, t)]
const SHOTS = [
  [0.4, 'introZoom', 'INTRO · zoom, zoom, zoom', v1.fIntroZoom],
  [4.0, 'introCode', 'INTRO · synth riff alone', v1.fIntroCode],
  [8.5, 'grok', 'V1 · Grok … paywalled it', v1.fGrok],
  [12.0, 'hack', 'V1 · one hacker, two bots, nine agencies', core.fHack],
  [14.5, 'bots', 'V1 · a million and a half bots', core.fBots],
  [18.0, 'sharma', 'V1 · quit to write poems, “peril”', v1.fSharma],
  [21.5, 'florida', 'V1 · Florida: it’d be murder', v1.fFlorida],
  [24.5, 'blacklist', 'V1 · blacklisted, still ranks targets', v1.fBlacklist],
  [27.5, 'email', 'PC1 · emailed me mid-sandwich', v1.fEmail],
  [30.0, 'zerodays', 'PC1 · thousands of zero-days', v1.fZeroDays],
  [31.9, 'box', 'PC1 · (for now!) · band stops', v1.fBox],
  [33.8, 'ch1zoom', 'CH1 · zoom, zoom, zoom!', chorus(1, ch.chZoom)],
  [35.3, 'ch1capex', 'CH1 · seven hundred billion, nobody steering', chorus(1, ch.chCapex)],
  [39.5, 'ch1pause', 'CH1 · pause ripped out, the finish', chorus(1, ch.chPause)],
  [42.2, 'ch1ship', 'CH1 · ship it half-tested', chorus(1, ch.chShip)],
  [43.8, 'ch1china', 'CH1 · China’s just months off', chorus(1, ch.chChina)],
  [46.0, 'ch1hook', 'CH1 · add a point to my p(doom) · band stops', hook(1)],
  [50.5, 'post', 'POST 1 · instrumental', core.fPost],
  [55.0, 'slips', 'V2 · AI pink slips', core.fSlips],
  [58.5, 'mythos', 'V2 · Mythos thought the date was fake', core.fMythos],
  [62.0, 'ransom', 'V2 · first ransom job with no human', v2.fRansom],
  [65.0, 'grade', 'V2 · agents met in secret, for a grade', core.fGrade],
  [68.5, 'ship', 'PC2 · Chinese ship? planes in the air', v2.fShip],
  [71.4, 'caught', 'PC2 · caught it … next time? · band stops', v2.fCaught],
  [73.2, 'ch2zoom', 'CH2 · zoom, zoom, zoom!', chorus(2, ch.chZoom)],
  [75.5, 'ch2capex', 'CH2 · seven hundred billion', chorus(2, ch.chCapex)],
  [79.0, 'ch2pause', 'CH2 · the deadline is nearing', chorus(2, ch.chPause)],
  [81.4, 'ch2ship', 'CH2 · ship it half-tested', chorus(2, ch.chShip)],
  [83.0, 'ch2china', 'CH2 · China’s just months off', chorus(2, ch.chChina)],
  [85.5, 'ch2hook', 'CH2 · add a point · band stops', hook(2)],
  [90.0, 'chant', 'POST 2 · instrumental', inst.fChant],
  [96.5, 'solo', 'SOLO · lead synth takes over', inst.fSoloRoll],
  [102.0, 'idle', 'SOLO · beat gone, synth alone', inst.fIdle],
  [106.5, 'letter', 'V3 · eleven hundred signed', v3.fLetter],
  [110.0, 'launch', 'V3 · hit the gas · two launches', v3.fLaunch],
  [113.5, 'coxon', 'V3 · Coxon quit, ninety million views', core.fCoxon],
  [117.0, 'hoax', 'V3 · the President: HOAX', core.fHoax],
  [120.0, 'hubinger', 'V3 · over ten percent, no plan', v3.fHubinger],
  [123.0, 'court', 'V3 · court backs the blacklist 2–1', v3.fCourt],
  [126.5, 'sock', 'V3 · 34 hours of sock puppets', v3.fSock],
  [129.8, 'intern', 'V3 · intern live, researcher ’28 · stop', v3.fIntern],
  [132.5, 'paused', 'STOP-TIME · paused again', v3.fPaused],
  [135.5, 'stop', 'STOP-TIME · maybe a year to steer', core.fStop],
  [138.5, 'astra', 'PC3 · Critical, then “aligned”', v3.fAstra],
  [141.5, 'alien', 'PC3 · an alien mind', v3.fAlien],
  [143.8, 'ch3zoom', 'CH3 · zoom, zoom, zoom!', chorus(3, ch.chZoom)],
  [146.0, 'ch3capex', 'CH3 · seven hundred billion', chorus(3, ch.chCapex)],
  [149.5, 'ch3pause', 'CH3 · the red line is nearing', chorus(3, ch.chPause)],
  [152.0, 'ch3ship', 'CH3 · ship it half-tested', chorus(3, ch.chShip)],
  [153.6, 'ch3china', 'CH3 · can’t fall behind', chorus(3, ch.chChina)],
  [155.8, 'ch3hook', 'CH3 · add a point · band stops', hook(3)],
  [159.5, 'notes', 'BRIDGE · 27 notes to its own address', br.fNotes],
  [166.0, 'dns', 'BRIDGE · flagged in 15, out through DNS', br.fDNS],
  [172.5, 'swarm', 'BRIDGE 2 (hush) · rogue swarms', br.fSwarm],
  [178.5, 'grid', 'BRIDGE 2 · Stargate, grid under stress', br.fGrid],
  [183.5, 'logs', 'BRIDGE 2 · families read the chat logs', br.fLogs],
  [187.5, 'blind', 'BRIDGE 2 · “enough predictions”, flew blind', (g, c, t, a) => br.fBlind(g, c, t, ['grok', 'slips', 'ch2capex', 'mythos', 'grade', 'hubinger', 'intern', 'astra', 'notes', 'dns', 'grid', 'ch1pause'].map(thumb), a)],
  [190.5, 'allyear', 'BREAKDOWN · laughing it off all year', (g, c, t) => br.fAllYear(g, c, t, thumbsBefore(190))],
  [195.0, 'confess', 'BREAKDOWN · kinda get the appeal (bare)', core.fConfess],
  [196.0, 'ch4zoom', 'FINAL · zoom, zoom! (a cappella)', chorus(4, ch.chZoom)],
  [198.8, 'ch4capex', 'FINAL · nobody steering (band slams back)', chorus(4, ch.chCapex)],
  [201.5, 'ch4pause', 'FINAL · the cliff edge is nearing', chorus(4, ch.chPause)],
  [203.6, 'ch4ship', 'FINAL · ship it half-tested', chorus(4, ch.chShip)],
  [205.2, 'ch4china', 'FINAL · who’s left behind?', chorus(4, ch.chChina)],
  [207.5, 'ch4hook', 'FINAL · add a point · a cappella stop', hook(4)],
  [209.2, 'who', 'FINAL · who can tell? · the estimates', ending.fWhoScatter],
  [210.8, 'final', 'FINAL · the warning shot sold for 12.9', (g, c, t, a) => core.fFinal(g, { hack: draw('hack'), bots: draw('bots'), chorus: draw('ch1capex'), bridge: draw('dns') }, a)],
  [214.0, 'fine', 'FINAL · we’ll be fine · held over the shred', (g, c, t, a) => ending.fFineHeld(g, c, t, contactOf(thumbsBefore(209)), a)],
  [217.0, 'outrodrop', 'OUTRO · drop + laugh', (g, c, t) => inst.fOutroDrop(g, c, t, contactOf(thumbsBefore(216)))],
  [224.0, 'outrolone', 'OUTRO · lone synth', inst.fOutroLone],
  [228.4, 'end', 'HARD CUT · 1 s of silence', inst.fEnd],
];
// Extras outside the film, rendered with ?shot=<id>.
const EXTRAS = [
  [0, 'thumb', 'YouTube thumbnail', (g, c, t) => ending.fThumb(g, c, t, draw('ch1capex'))],
];
const BY_ID = Object.fromEntries([...SHOTS, ...EXTRAS].map((s) => [s[1], s]));
// Shots built from other shots (kept out of thumbnail montages).
const COMPOSITE = new Set(['blind', 'allyear', 'fine', 'final', 'outrodrop', 'ch1hook', 'ch2hook', 'ch3hook', 'ch4hook', 'end']);
// Shots driven by the live audio envelopes (redrawn at the playhead in preview).
const LIVE = new Set(['post', 'solo', 'chant', 'idle', 'outrolone', 'outrodrop']);

let rt;
const cache = new Map();
function draw(id, t) {
  const [st, , , fn] = BY_ID[id];
  const tt = t ?? st;
  const key = `${id}@${tt}`;
  if (cache.has(key)) return cache.get(key);
  const c = canvas(W, H);
  fn(c.getContext('2d'), rt, tt);
  if (cache.size > 400) cache.clear();
  cache.set(key, c);
  return c;
}
// A fresh, element-animated render of a shot at time t (not cached).
function drawAnim(id, t, start, end, energy = 0) {
  const c = canvas(W, H);
  const a = makeAnim(rt, t, start, end);
  a.energy = energy;
  setLive({ ctx: rt, t, energy });
  try { BY_ID[id][3](c.getContext('2d'), rt, t, a); } finally { setLive(null); }
  return c;
}
function thumb(id) {
  const key = `thumb:${id}`;
  if (cache.has(key)) return cache.get(key);
  const c = canvas(480, 270);
  c.getContext('2d').drawImage(draw(id), 0, 0, 480, 270);
  cache.set(key, c);
  return c;
}
function thumbsBefore(t) {
  return SHOTS.filter(([st, id]) => st < t && !COMPOSITE.has(id)).map(([, id]) => thumb(id));
}
function contactOf(thumbs) {
  const c = canvas(W, H), g = c.getContext('2d');
  const cols = 8, tw = W / cols, th = (tw * 9) / 16;
  thumbs.forEach((tb, i) => g.drawImage(tb, (i % cols) * tw, Math.floor(i / cols) * th, tw, th));
  return c;
}

function shotAt(t) {
  let pick = SHOTS[0];
  for (const s of SHOTS) if (t >= s[0] - 0.05) pick = s;
  return pick;
}

function drawSheet(out, ctx, part) {
  const per = 24, cols = 4, tw = 480, th = 270, lh = 36;
  const list = SHOTS.slice((part - 1) * per, part * per);
  out.setTransform(1, 0, 0, 1, 0, 0);
  box(out, 0, 0, ctx.width, ctx.height, INK);
  list.forEach(([st, id, label], i) => {
    const x = (i % cols) * tw, y = Math.floor(i / cols) * (th + lh);
    out.drawImage(draw(id), x, y, tw, th);
    const mm = Math.floor(st / 60), ss = (st % 60).toFixed(1).padStart(4, '0');
    text(out, `${mm}:${ss}`, x + 8, y + th + 25, { font: MONO, size: 17, color: RED });
    text(out, label, x + 78, y + th + 25, { font: MONO, size: 15, weight: 'normal', color: PAPER });
    out.strokeStyle = INK;
    out.lineWidth = 2;
    out.strokeRect(x, y, tw, th);
  });
}

let out;
const q = new URLSearchParams(location.search);
start({
  async setup(ctx) {
    rt = ctx;
    rt.soloNotes = await fetch('/data/solo_notes.json').then((r) => (r.ok ? r.json() : null)).catch(() => null);
    if (q.has('motion')) await loadPlan();
    out = ctx.canvas.getContext('2d');
    await Promise.all([
      document.fonts.load(`bold 40px ${NARROW}`),
      document.fonts.load(`bold 40px ${SANS}`),
      document.fonts.load(`40px ${SANS}`),
      document.fonts.load(`bold 40px ${SERIF}`),
      document.fonts.load(`40px ${SERIF}`),
      document.fonts.load(`bold 40px ${MONO}`),
      document.fonts.load(`40px ${MONO}`),
    ]);
  },
  frame(t, ctx) {
    if (q.has('sheet')) return drawSheet(out, ctx, +q.get('sheet'));
    if (q.has('motion')) {
      out.setTransform(ctx.width / W, 0, 0, ctx.height / H, 0, 0);
      const only = q.get('only') ? new Set(q.get('only').split(',')) : undefined;
      return renderMotion(out, t, ctx, { draw, drawAnim, isLive: (id) => LIVE.has(id) }, { only, label: q.get('label') });
    }
    const [, id] = q.has('shot') ? BY_ID[q.get('shot')] : shotAt(t);
    const c = LIVE.has(id) ? draw(id, t) : draw(id);
    out.setTransform(ctx.width / W, 0, 0, ctx.height / H, 0, 0);
    out.drawImage(c, 0, 0);
  },
});
