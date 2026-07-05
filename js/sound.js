// Motor de audio: música de fondo (archivos reales por pantalla) + efectos
// de sonido sintetizados con Web Audio (reparto, ruleta, ganar/perder...).
// Se expone como objeto global `Sound`.

const Sound = (function () {
  const MUTE_KEY = 'spinho_muted';
  const MUSIC_VOLUME = 0.55;

  const MUSIC_FILES = {
    lobby: 'assets/audio/lobby.mp3',
    mesas: 'assets/audio/mesas.mp3',
    pirulas: 'assets/audio/pirulas.mp3',
    champion: 'assets/audio/champion.mp3',
    derrota: 'assets/audio/derrota.mp3'
  };

  let ctx = null;
  let sfxGain = null;
  let muted = false;

  const musicEls = {};
  let currentMusic = null;
  const fadeTimers = {};

  try {
    muted = localStorage.getItem(MUTE_KEY) === '1';
  } catch (e) {
    muted = false;
  }

  // --- Efectos: AudioContext (se crea en el primer gesto del usuario) ---

  function init() {
    if (!ctx) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          ctx = new AudioCtx();
          sfxGain = ctx.createGain();
          sfxGain.gain.value = muted ? 0 : 0.9;
          sfxGain.connect(ctx.destination);
        }
      } catch (e) {
        ctx = null;
      }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function now() {
    return ctx ? ctx.currentTime : 0;
  }

  function tone(freq, start, duration, { type = 'sine', gain = 0.2 } = {}) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gain, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(g);
    g.connect(sfxGain);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  function noiseBurst(start, duration, { filterType = 'bandpass', freq = 1200, q = 1, gain = 0.2 } = {}) {
    if (!ctx) return null;
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
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
    g.connect(sfxGain);
    src.start(start);
    src.stop(start + duration + 0.02);
    return filter;
  }

  // Reparto: "flick" de carta del crupier — ruido corto con barrido + un tap.
  function playDeal() {
    init();
    if (!ctx) return;
    const t = now();
    const filter = noiseBurst(t, 0.07, { filterType: 'bandpass', freq: 2200, q: 0.7, gain: 0.16 });
    if (filter) filter.frequency.exponentialRampToValueAtTime(700, t + 0.07);
    tone(150, t, 0.05, { type: 'sine', gain: 0.08 });
  }

  // Ficha/click de la ruleta girando.
  function playRouletteTick() {
    init();
    if (!ctx) return;
    noiseBurst(now(), 0.03, { filterType: 'highpass', freq: 3000, gain: 0.14 });
  }

  function playRouletteStop() {
    init();
    if (!ctx) return;
    const t = now();
    tone(880, t, 0.15, { type: 'triangle', gain: 0.18 });
    tone(1174.66, t + 0.08, 0.25, { type: 'triangle', gain: 0.18 });
  }

  function playWin() {
    init();
    if (!ctx) return;
    const t = now();
    [523.25, 659.25, 783.99].forEach((f, i) => tone(f, t + i * 0.07, 0.25, { type: 'square', gain: 0.15 }));
    for (let i = 0; i < 5; i++) noiseBurst(t + i * 0.05, 0.06, { freq: 2600, q: 2, gain: 0.09 });
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
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    osc.connect(g);
    g.connect(sfxGain);
    osc.start(t);
    osc.stop(t + 0.6);
  }

  function playFold() {
    init();
    if (!ctx) return;
    const t = now();
    const filter = noiseBurst(t, 0.35, { filterType: 'bandpass', freq: 1400, q: 0.8, gain: 0.16 });
    if (filter) filter.frequency.exponentialRampToValueAtTime(300, t + 0.35);
  }

  function playDouble() {
    init();
    if (!ctx) return;
    const t = now();
    tone(330, t, 0.18, { type: 'square', gain: 0.17 });
    tone(494, t + 0.12, 0.28, { type: 'square', gain: 0.17 });
  }

  function playJackpot() {
    init();
    if (!ctx) return;
    const t = now();
    const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1318.5];
    scale.forEach((f, i) => tone(f, t + i * 0.08, 0.4, { type: 'triangle', gain: 0.16 }));
    for (let i = 0; i < 8; i++) noiseBurst(t + 0.2 + i * 0.06, 0.05, { freq: 4000, q: 3, gain: 0.07 });
  }

  function playReward() {
    init();
    if (!ctx) return;
    const t = now();
    [659.25, 830.61, 987.77].forEach((f, i) => tone(f, t + i * 0.09, 0.35, { type: 'triangle', gain: 0.15 }));
  }

  // --- Música de fondo: archivos reales, uno por contexto ---

  function ensureMusicEl(name) {
    if (!musicEls[name]) {
      const el = new Audio(MUSIC_FILES[name]);
      el.loop = true;
      el.preload = 'auto';
      el.volume = 0;
      musicEls[name] = el;
    }
    return musicEls[name];
  }

  function fadeTo(el, targetVol, ms, onDone) {
    const key = el.src;
    if (fadeTimers[key]) clearInterval(fadeTimers[key]);
    const steps = Math.max(1, Math.round(ms / 40));
    const startVol = el.volume;
    let step = 0;
    fadeTimers[key] = setInterval(() => {
      step++;
      el.volume = Math.min(1, Math.max(0, startVol + (targetVol - startVol) * (step / steps)));
      if (step >= steps) {
        clearInterval(fadeTimers[key]);
        fadeTimers[key] = null;
        if (onDone) onDone();
      }
    }, 40);
  }

  function startMusic(name) {
    const el = ensureMusicEl(name);
    el.volume = 0;
    const p = el.play();
    if (p && p.catch) p.catch(() => {});
    fadeTo(el, MUSIC_VOLUME, 600);
  }

  // Cambia la música de fondo con un fundido cruzado. Si está silenciado solo
  // recuerda cuál debería sonar (se arranca al quitar el mute).
  function playMusic(name) {
    if (!MUSIC_FILES[name] || currentMusic === name) return;
    const prev = currentMusic ? musicEls[currentMusic] : null;
    currentMusic = name;
    if (prev) {
      fadeTo(prev, 0, 500, () => prev.pause());
    }
    if (!muted) startMusic(name);
  }

  // --- Silencio (afecta a música y efectos) ---

  function setMuted(value) {
    muted = value;
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch (e) {
      // sin persistencia
    }
    if (ctx && sfxGain) {
      sfxGain.gain.cancelScheduledValues(now());
      sfxGain.gain.linearRampToValueAtTime(muted ? 0 : 0.9, now() + 0.15);
    }
    if (muted) {
      Object.values(musicEls).forEach((el) => {
        fadeTo(el, 0, 300, () => el.pause());
      });
    } else if (currentMusic) {
      startMusic(currentMusic);
    }
  }

  function isMuted() {
    return muted;
  }

  return {
    init,
    playMusic,
    playDeal, playRouletteTick, playRouletteStop,
    playWin, playLose, playFold, playDouble, playJackpot, playReward,
    setMuted, isMuted
  };
})();
