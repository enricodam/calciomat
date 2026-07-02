/* ============ CalcioMat — suoni sintetizzati (Web Audio, zero file) ============ */
const Sfx = (() => {
  let ctx = null;
  let enabled = true;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, { type = 'sine', vol = 0.25, when = 0, slide = 0 } = {}) {
    const c = ensure(); if (!c || !enabled) return;
    const t0 = c.currentTime + when;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  function noise(dur, { vol = 0.3, when = 0, freq = 1000, q = 1, type = 'bandpass', rampVol = null } = {}) {
    const c = ensure(); if (!c || !enabled) return;
    const t0 = c.currentTime + when;
    const len = Math.ceil(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain();
    if (rampVol) {
      g.gain.setValueAtTime(0.001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + dur * rampVol);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    } else {
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    }
    src.connect(f).connect(g).connect(c.destination);
    src.start(t0); src.stop(t0 + dur + 0.05);
  }

  return {
    setEnabled(v) { enabled = v; },
    unlock() { ensure(); },

    click()   { tone(650, 0.06, { type: 'square', vol: 0.08 }); },

    correct() {
      tone(660, 0.12, { type: 'triangle', vol: 0.3 });
      tone(880, 0.16, { type: 'triangle', vol: 0.3, when: 0.09 });
    },

    wrong() {
      tone(200, 0.28, { type: 'sawtooth', vol: 0.22, slide: -80 });
      tone(150, 0.28, { type: 'square', vol: 0.12, when: 0.02 });
    },

    whistle(long = false) {
      const blast = (when, dur) => {
        tone(2350, dur, { type: 'square', vol: 0.13, when });
        tone(2820, dur, { type: 'square', vol: 0.07, when });
        noise(dur, { vol: 0.05, when, freq: 2600, q: 8 });
      };
      if (long) { blast(0, 0.14); blast(0.2, 0.14); blast(0.4, 0.55); }
      else blast(0, 0.35);
    },

    kick() {
      noise(0.09, { vol: 0.4, freq: 300, q: 0.7, type: 'lowpass' });
      tone(90, 0.1, { type: 'sine', vol: 0.35, slide: -50 });
    },

    bounce() { tone(220, 0.08, { type: 'sine', vol: 0.2, slide: -60 }); },

    pass() {
      noise(0.06, { vol: 0.3, freq: 500, q: 0.8, type: 'lowpass' });
      tone(140, 0.07, { type: 'sine', vol: 0.25, slide: -40 });
    },

    passOk() {
      tone(520, 0.09, { type: 'triangle', vol: 0.18 });
      tone(700, 0.12, { type: 'triangle', vol: 0.18, when: 0.07 });
    },

    intercept() {
      noise(0.1, { vol: 0.35, freq: 350, q: 0.8, type: 'lowpass' });
      tone(180, 0.3, { type: 'sawtooth', vol: 0.16, slide: -60, when: 0.06 });
      noise(0.8, { vol: 0.16, freq: 600, q: 0.6, rampVol: 0.25, when: 0.1 });
    },

    goal() {
      // boato della folla + fanfara
      noise(2.0, { vol: 0.35, freq: 900, q: 0.4, rampVol: 0.15 });
      noise(2.2, { vol: 0.2, freq: 2400, q: 0.5, rampVol: 0.2 });
      [523, 659, 784, 1047].forEach((f, i) =>
        tone(f, 0.32, { type: 'triangle', vol: 0.22, when: 0.15 + i * 0.13 }));
    },

    ohh() {
      // delusione della folla
      noise(1.1, { vol: 0.25, freq: 500, q: 0.6, rampVol: 0.25 });
      tone(330, 0.7, { type: 'sine', vol: 0.1, slide: -140, when: 0.1 });
    },

    save() {
      noise(0.12, { vol: 0.4, freq: 400, q: 0.8, type: 'lowpass' });
      noise(0.9, { vol: 0.18, freq: 800, q: 0.5, rampVol: 0.2, when: 0.1 });
    },

    trophy() {
      [523, 659, 784, 1047, 1319].forEach((f, i) =>
        tone(f, 0.4, { type: 'triangle', vol: 0.24, when: i * 0.14 }));
      noise(2.2, { vol: 0.15, freq: 1500, q: 0.4, rampVol: 0.3, when: 0.3 });
    },

    tick() { tone(1000, 0.04, { type: 'square', vol: 0.06 }); },
  };
})();
