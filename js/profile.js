// Perfil local del jugador (sin sistema de usuarios): estadísticas y partida
// guardada, ambos en localStorage. Funciones puras que reciben/devuelven datos;
// main.js las conecta con gameState.

// --- Estadísticas ----------------------------------------------------------

const STATS_KEY = 'spinho_stats_v1';

function emptyStats() {
  return {
    arcade: { played: 0, wins: 0, bestPrize: 0 },
    freezeout: { played: 0, wins: 0, bestPrize: 0 },
    daily: { played: 0, wins: 0, bestPrize: 0 },
    pro: { played: 0, wins: 0, bestPrize: 0 }
  };
}

function getStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return emptyStats();
    return Object.assign(emptyStats(), JSON.parse(raw));
  } catch (e) {
    return emptyStats();
  }
}

// Registra el fin de una partida. mode: 'arcade'|'freezeout'|'daily'|'pro'.
function recordGameResult(mode, won, prize) {
  const stats = getStats();
  const m = stats[mode];
  if (!m) return;
  m.played += 1;
  if (won) m.wins += 1;
  if (prize && prize > m.bestPrize) m.bestPrize = prize;
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) { /* sin almacenamiento */ }
}

// HTML de la tabla de estadísticas (para la pestaña RECORDS).
function statsHtml() {
  const stats = getStats();
  const rows = [
    ['Arcade', stats.arcade, true],
    ['Freezeout', stats.freezeout, true],
    ['Desafío diario', stats.daily, false],
    ['Modo Pro', stats.pro, false]
  ];
  const total = rows.reduce((sum, [, s]) => sum + s.played, 0);
  if (total === 0) {
    return '<p class="records-daily-empty">Aún no has terminado ninguna partida en este dispositivo.</p>';
  }
  const body = rows.map(([label, s, showPrize]) => {
    const wr = s.played ? Math.round((s.wins / s.played) * 100) : 0;
    const prizeTxt = showPrize && s.bestPrize ? ` · récord ${formatEuros(s.bestPrize)}` : '';
    return `<li><span class="records-name">${label}</span>` +
      `<span class="records-amount">${s.wins}/${s.played} · ${wr}%${prizeTxt}</span></li>`;
  }).join('');
  return '<p class="zone-label">Tus estadísticas (este dispositivo)</p>' +
    `<ol class="records-list stats-list">${body}</ol>`;
}

// --- Partida guardada (Arcade / Freezeout) ---------------------------------

const SAVE_KEY = 'spinho_savedgame_v1';

// ¿Es una run que tiene sentido guardar/reanudar? Solo Arcade/Freezeout en
// curso (no demo/QA, no diario, no en pantallas de fin).
function isSaveableRun(state) {
  return !state.demoMode && !state.daily &&
    (state.mode === 'ARCADE' || state.mode === 'FREEZEOUT') &&
    (state.status === 'BATTLE' || state.status === 'RIVAL_INTRO');
}

// Guarda una foto del estado. Se omite rivalLineup (se reconstruye como RIVALS
// al cargar, ya que en Arcade/Freezeout siempre es el lineup fijo).
function saveRunSnapshot(state) {
  if (!isSaveableRun(state)) return;
  const snap = {
    v: 1,
    status: state.status,
    player: state.player,
    mode: state.mode,
    currentRivalIndex: state.currentRivalIndex,
    playerLives: state.playerLives,
    rivalLives: state.rivalLives,
    totalPrize: state.totalPrize,
    winStreak: state.winStreak,
    resistRemaining: state.resistRemaining,
    freeFoldsRemaining: state.freeFoldsRemaining,
    rivalLine: state.rivalLine,
    currentHand: state.currentHand,
    bonusMultiplier: state.bonusMultiplier
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(snap));
  } catch (e) { /* sin almacenamiento */ }
}

function loadRunSnapshot() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const snap = JSON.parse(raw);
    if (!snap || snap.v !== 1) return null;
    if (snap.status !== 'BATTLE' && snap.status !== 'RIVAL_INTRO') return null;
    return snap;
  } catch (e) {
    return null;
  }
}

function clearRunSnapshot() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) { /* sin almacenamiento */ }
}

// Etiqueta corta para el botón "Continuar" (p. ej. "Arcade · Rival 3/6").
function savedRunLabel(snap) {
  if (!snap) return '';
  const modeName = snap.mode === 'FREEZEOUT' ? 'Freezeout' : 'Arcade';
  const total = (typeof RIVALS !== 'undefined') ? RIVALS.length : 6;
  return `${modeName} · Rival ${Math.min(snap.currentRivalIndex + 1, total)}/${total}`;
}
