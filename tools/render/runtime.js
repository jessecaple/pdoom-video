// Shared video runtime. A page calls:
//
//   import { start } from '/tools/render/runtime.js';
//   start({ setup: async (ctx) => {...}, frame: (t, ctx) => {...} });
//
// setup(ctx) runs once. frame(t, ctx) must draw song time t (seconds) into ctx.canvas
// as a pure function of t: no Date, performance.now, Math.random or rAF-driven state.
// Use ctx.rand(seed) for randomness.
//
// Modes:
//   preview (default): plays /song.wav and draws at audio.currentTime.
//     Keys: space play/pause, left/right seek 1 s (shift: 5 s), ',' '.' step a frame, h hide HUD.
//     URL: ?t=33.5 start time, &w=&h= render size (default 1920x1080).
//   render (?render=1): used by render.mjs, which calls window.__frame(t) per frame.

export async function start({ setup, frame }) {
  const q = new URLSearchParams(location.search);
  const renderMode = q.has('render');
  const width = +(q.get('w') || 1920);
  const height = +(q.get('h') || 1080);

  const [audio, lyrics] = await Promise.all([
    fetch('/data/audio.json').then((r) => r.json()),
    fetch('/data/lyrics.json').then((r) => r.json()),
  ]);

  document.body.style.cssText = 'margin:0;background:#000;overflow:hidden';
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  if (renderMode) {
    canvas.style.cssText = `display:block;width:${width}px;height:${height}px`;
  } else {
    canvas.style.cssText = 'display:block;width:100vw;height:100vh;object-fit:contain';
  }
  document.body.appendChild(canvas);

  const ctx = { canvas, width, height, audio, lyrics, renderMode, ...helpers(audio, lyrics) };
  await setup(ctx);
  if (document.fonts) await document.fonts.ready;

  window.__frame = async (t) => {
    await frame(t, ctx);
  };
  window.__ready = true;
  if (!renderMode) preview(ctx, frame, +(q.get('t') || 0));
}

function helpers(audio, lyrics) {
  const env = audio.envelopes;
  const fps = audio.fps; // envelope sample rate (60 Hz)
  const beats = audio.beats;
  const downbeats = audio.downbeats;
  const lines = lyrics.lines;

  // Index of the last element of a sorted numeric array that is <= t (or -1).
  const floorIdx = (arr, t, key = (x) => x) => {
    let lo = 0, hi = arr.length - 1, ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (key(arr[mid]) <= t) { ans = mid; lo = mid + 1; } else hi = mid - 1;
    }
    return ans;
  };

  return {
    // Envelope value at time t, linearly interpolated. name: rms, low, mid, high, drums, bass,
    // synth, vocal, lead, backing, kick, snare, hats, loudness_db, centroid, flux, intensity.
    env(name, t) {
      const a = env[name];
      const x = Math.max(0, Math.min(a.length - 1.001, t * fps));
      const i = Math.floor(x);
      return a[i] + (a[i + 1] - a[i]) * (x - i);
    },
    // Beat grid position: { beat, beatPhase, bar, barPhase } (bar 0 = first downbeat).
    grid(t) {
      const bp = audio.beat_period;
      const b = (t - audio.tempo.first_downbeat) / bp;
      const bar = (t - audio.tempo.first_downbeat) / audio.tempo.bar_length;
      return { beat: Math.floor(b), beatPhase: b - Math.floor(b), bar: Math.floor(bar), barPhase: bar - Math.floor(bar) };
    },
    // Current section object from audio.sections ({id, label, start, end, ...}).
    section(t) {
      return audio.sections[Math.max(0, floorIdx(audio.sections, t, (s) => s.start))];
    },
    // Decaying pulse from onsets of a stem (kick, snare, hat, toms, cymbal, bass, synth, vocal).
    // Sum of strength * exp(-(t - onset) / tau) over the last few onsets.
    pulse(stem, t, tau = 0.12) {
      const on = audio.onsets[stem];
      let i = floorIdx(on, t, (o) => o[0]);
      let sum = 0;
      for (let k = 0; k < 6 && i >= 0; k++, i--) {
        const dt = t - on[i][0];
        if (dt > tau * 6) break;
        sum += on[i][1] * Math.exp(-dt / tau);
      }
      return sum;
    },
    // The lyric line being sung at t (or null), and the word within it.
    line(t) {
      const i = floorIdx(lines, t, (l) => l.start);
      if (i < 0) return null;
      const l = lines[i];
      return t <= l.end + 0.25 ? l : null;
    },
    lineIndex(t) {
      return floorIdx(lines, t, (l) => l.start);
    },
    word(t) {
      const l = this.line(t);
      if (!l || !l.words) return null;
      const j = floorIdx(l.words, t, (w) => w.start);
      return j >= 0 ? l.words[j] : null;
    },
    beats,
    downbeats,
    // Deterministic PRNG (mulberry32). Call rand(seed)() for a sequence.
    rand(seed) {
      let a = seed >>> 0;
      return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let r = Math.imul(a ^ (a >>> 15), 1 | a);
        r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
      };
    },
  };
}

function preview(ctx, frame, t0) {
  const el = new Audio('/song.wav');
  el.currentTime = t0;
  const hud = document.createElement('div');
  hud.style.cssText =
    'position:fixed;left:8px;bottom:8px;font:12px monospace;color:#fff;background:#000a;padding:4px 8px;pointer-events:none';
  document.body.appendChild(hud);
  let hudOn = true;
  let busy = false;
  const loop = async () => {
    if (!busy) {
      busy = true;
      const t = el.currentTime;
      await frame(t, ctx);
      const s = ctx.section(t);
      const g = ctx.grid(t);
      const l = ctx.line(t);
      hud.textContent = hudOn
        ? `${t.toFixed(2)}s  ${s.label}  bar ${g.bar}.${Math.floor(g.beatPhase * 4)}  ${l ? l.text : ''}`
        : '';
      busy = false;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 5 : 1;
    if (e.key === ' ') { el.paused ? el.play() : el.pause(); e.preventDefault(); }
    if (e.key === 'ArrowRight') el.currentTime += step;
    if (e.key === 'ArrowLeft') el.currentTime = Math.max(0, el.currentTime - step);
    if (e.key === '.') { el.pause(); el.currentTime += 1 / 60; }
    if (e.key === ',') { el.pause(); el.currentTime = Math.max(0, el.currentTime - 1 / 60); }
    if (e.key === 'h') hudOn = !hudOn;
  });
}
