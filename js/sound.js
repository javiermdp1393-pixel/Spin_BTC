// Motor de sonido con Web Audio API: todo se sintetiza en el navegador, sin
// archivos externos (compatible con la CSP de GitHub Pages y sin descargas).
// Un música ambiente tipo casino para los menús + efectos para las acciones.
// Se expone como objeto global `Sound`.

const Sound = (function () {
  const MUTE_KEY = 'spinho_muted';

  let ctx = null;
  let masterGain = null;
  let ambientGain = null;
  let ambientTimer = null;
  let muted = false;

  try {
    muted = localStorage.getItem(MUTE_KEY) === '1';
  } catch (e) {
    muted = false;
  }

  // Se crea el AudioContext en el primer gesto del usuario (los navegadores
  // bloquean el audio automático). Es seguro llamarlo varias veces.
  function init() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      ctx = new AudioCtx();
      masterGain = ctx.createGain();
      masterGain.gain.value = muted ? 0 : 0.9;
      masterGain.connect(ctx.destination);

      ambientGain = ctx.createGain();
      ambientGain.gain.value = 0.0;
      ambientGain.connect(masterGain);
    } catch (e) {
      ctx = null;
    }
  }

  function now() {
    return ctx ? ctx.currentTime : 0;
  }

  // Una nota simple con envolvente ADSR corta.
  function tone(freq, start, duration, { type = 'sine', gain = 0.2, target = masterGain } = {}) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gain, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(g);
    g.connect(target || masterGain);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  // Ráfaga de ruido filtrado (para fichas, whoosh...).
  function noiseBurst(start, duration, { filterType = 'bandpass', freq = 1200, q = 1, gain = 0.2 } = {}) {
    if (!ctx) return;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    src.connect(filter);
    filter.connect(g);
    g.connect(masterGain);
    src.start(start);
    src.stop(start + duration + 0.02);
    return filter;
  }

  // --- Música ambiente de casino: arpegio lento y suave en bucle ---

  const AMBIENT_CHORD = [220.0, 277.18, 329.63, 440.0, 329.63, 277.18]; // Am add estilizado
  let ambientStep = 0;

  function ambientTick() {
    if (!ctx) return;
    const t = now();
    const freq = AMBIENT_CHORD[ambientStep % AMBIENT_CHORD.length];
    ambientStep++;
    tone(freq, t, 1.6, { type: 'triangle', gain: 0.16, target: ambientGain });
    // Nota grave de acompañamiento cada 3 pasos
    if (ambientStep % 3 === 0) {
      tone(freq / 2, t, 2.2, { type: 'sine', gain: 0.12, target: ambientGain });
    }
  }

  function startAmbient() {
    init();
    if (!ctx || ambientTimer) return;
    ambientGain.gain.cancelScheduledValues(now());
    ambientGain.gain.linearRampToValueAtTime(muted ? 0 : 0.5, now() + 1.5);
    ambientTick();
    ambientTimer = setInterval(ambientTick, 900);
  }

  function stopAmbient() {
    if (ambientTimer) {
      clearInterval(ambientTimer);
      ambientTimer = null;
    }
    if (ctx && ambientGain) {
      ambientGain.gain.cancelScheduledValues(now());
      ambientGain.gain.linearRampToValueAtTime(0, now() + 0.6);
    }
  }

  // --- Efectos de sonido ---

  function playDeal() {
    init();
    if (!ctx) return;
    noiseBurst(now(), 0.08, { filterType: 'highpass', freq: 2000, gain: 0.12 });
  }

  function playWin() {
    init();
    if (!ctx) return;
    const t = now();
    // "Cascada de fichas": notas ascendentes + ruido metálico
    [523.25, 659.25, 783.99].forEach((f, i) => tone(f, t + i * 0.07, 0.25, { type: 'square', gain: 0.16 }));
    for (let i = 0; i < 5; i++) noiseBurst(t + i * 0.05, 0.06, { freq: 2600, q: 2, gain: 0.1 });
  }

  function playLose() {
    init();
    if (!ctx) return;
    const t = now();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.5);
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.6);
  }

  function playFold() {
    init();
    if (!ctx) return;
    const t = now();
    const filter = noiseBurst(t, 0.35, { filterType: 'bandpass', freq: 1400, q: 0.8, gain: 0.18 });
    if (filter) filter.frequency.exponentialRampToValueAtTime(300, t + 0.35);
  }

  function playDouble() {
    init();
    if (!ctx) return;
    const t = now();
    tone(330, t, 0.18, { type: 'square', gain: 0.18 });
    tone(494, t + 0.12, 0.28, { type: 'square', gain: 0.18 });
  }

  function playJackpot() {
    init();
    if (!ctx) return;
    const t = now();
    const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1318.5];
    scale.forEach((f, i) => tone(f, t + i * 0.08, 0.4, { type: 'triangle', gain: 0.18 }));
    for (let i = 0; i < 8; i++) noiseBurst(t + 0.2 + i * 0.06, 0.05, { freq: 4000, q: 3, gain: 0.08 });
  }

  function playReward() {
    init();
    if (!ctx) return;
    const t = now();
    [659.25, 830.61, 987.77].forEach((f, i) => tone(f, t + i * 0.09, 0.35, { type: 'triangle', gain: 0.16 }));
  }

  function playChampion() {
    init();
    if (!ctx) return;
    const t = now();
    // Fanfarria: acordes mayores ascendentes
    const chords = [
      [523.25, 659.25, 783.99],
      [587.33, 739.99, 880.0],
      [659.25, 830.61, 987.77, 1318.5]
    ];
    chords.forEach((chord, i) => {
      chord.forEach((f) => tone(f, t + i * 0.25, 0.6, { type: 'sawtooth', gain: 0.12 }));
    });
  }

  // --- Silencio ---

  function setMuted(value) {
    muted = value;
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch (e) {
      // sin persistencia disponible
    }
    if (ctx && masterGain) {
      masterGain.gain.cancelScheduledValues(now());
      masterGain.gain.linearRampToValueAtTime(muted ? 0 : 0.9, now() + 0.2);
    }
  }

  function isMuted() {
    return muted;
  }

  return {
    init, startAmbient, stopAmbient,
    playDeal, playWin, playLose, playFold, playDouble, playJackpot, playReward, playChampion,
    setMuted, isMuted
  };
})();
