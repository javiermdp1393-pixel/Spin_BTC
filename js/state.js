// Estado central de la partida y funciones puras para mutarlo.
// No toca el DOM: eso es responsabilidad de main.js.

const PLAYER_STARTING_LIVES = 3;
const FOLD_LIFE_COST = 1 / 4;

// Racha: a partir de 2 manos ganadas seguidas, cada victoria hace medio
// corazón de daño extra al rival.
const STREAK_ACTIVE_THRESHOLD = 2;
const STREAK_BONUS_DAMAGE = 0.5;

function createInitialState() {
  return {
    status: 'LAUNCH', // LAUNCH, REGISTER, RIVAL_INTRO, BATTLE, REWARD, BUST_OUT, FINAL
    player: { name: '', alias: '' },
    currentRivalIndex: 0,
    playerLives: PLAYER_STARTING_LIVES,
    rivalLives: 0,
    totalPrize: 0,
    winStreak: 0, // manos ganadas seguidas en el combate actual
    bossResistUsed: false, // habilidad de El Pirulas (resiste el primer golpe)
    currentHand: null // { playerCards, communityCards, winChance, oddsLabel, playerHandName }
  };
}

function isStreakActive(state) {
  return state.winStreak >= STREAK_ACTIVE_THRESHOLD;
}

function getCurrentRival(state) {
  return RIVALS[state.currentRivalIndex];
}

// Las vidas se mueven en fracciones de 1/4 (fold) o 1 (mano perdida).
// Redondear al cuarto evita arrastrar errores de punto flotante.
function roundLife(value) {
  return Math.round(value * 4) / 4;
}

// Prepara un nuevo enfrentamiento: resetea vidas del jugador a 3 y carga
// las vidas del rival actual.
function startRivalEncounter(state) {
  const rival = getCurrentRival(state);
  state.playerLives = PLAYER_STARTING_LIVES;
  state.rivalLives = rival.lives;
  state.winStreak = 0;
  state.bossResistUsed = false;
  dealNewHandForState(state);
}

// Reparte una mano nueva y estima su probabilidad de victoria (Monte Carlo
// contra manos de rival reales, aplicando su handicap).
function dealNewHandForState(state) {
  const rival = getCurrentRival(state);
  const hand = dealHand();
  const winChance = estimateWinChance(hand.playerCards, hand.communityCards, rival.rivalSkill);

  state.currentHand = {
    playerCards: hand.playerCards,
    communityCards: hand.communityCards,
    winChance,
    oddsLabel: getOddsLabel(winChance),
    playerHandName: describePlayerHand(hand.playerCards, hand.communityCards)
  };
}

// Foldear cuesta 1/4 de vida, rompe la racha y reparte mano nueva.
function applyFold(state) {
  state.winStreak = 0;
  state.playerLives = roundLife(state.playerLives - FOLD_LIFE_COST);

  if (state.playerLives <= 0) {
    state.status = 'BUST_OUT';
    return { label: 'HAND FOLDED', location: 'player', outcome: 'FOLD' };
  }

  dealNewHandForState(state);
  return { label: 'HAND FOLDED', location: 'player', outcome: 'FOLD' };
}

// Resolución común de una mano jugada (CALL o Doblar). "stake" son las vidas
// en juego (1 normal, 2 al doblar). Aplica racha (daño extra) y la habilidad
// de resistencia de El Pirulas.
function resolveHand(state, stake, doubled) {
  const rival = getCurrentRival(state);
  const hand = state.currentHand;
  const showdown = resolveShowdown(hand.playerCards, hand.communityCards, rival.rivalSkill);

  const base = {
    revealCards: showdown.rivalCards,
    playerHandName: showdown.playerHandName,
    rivalHandName: showdown.rivalHandName,
    doubled
  };

  // Empate: se reparte mano nueva sin coste de vidas y sin romper la racha.
  if (showdown.cmp === 0) {
    dealNewHandForState(state);
    return { ...base, label: 'SPLIT POT', location: 'player', outcome: 'TIE' };
  }

  // Victoria del jugador.
  if (showdown.cmp > 0) {
    state.winStreak += 1;

    // El Pirulas resiste el primer golpe: cuenta como mano ganada (mantiene
    // la racha) pero no pierde vida.
    if (rival.finalBoss && !state.bossResistUsed) {
      state.bossResistUsed = true;
      dealNewHandForState(state);
      return { ...base, label: 'EL PIRULAS RESISTE', location: 'player', outcome: 'WIN', rivalFelted: false, bossResisted: true };
    }

    const bonus = isStreakActive(state) ? STREAK_BONUS_DAMAGE : 0;
    state.rivalLives = roundLife(state.rivalLives - (stake + bonus));
    const rivalFelted = state.rivalLives <= 0;
    if (rivalFelted) state.status = 'REWARD';
    else dealNewHandForState(state);
    return {
      ...base,
      label: doubled ? 'YOU TAKE THE POT ×2' : 'YOU TAKE THE POT',
      location: 'player', outcome: 'WIN', rivalFelted,
      streakBonus: bonus, streakCount: state.winStreak
    };
  }

  // Derrota del jugador: rompe la racha.
  state.winStreak = 0;
  state.playerLives = roundLife(state.playerLives - stake);
  const bustOut = state.playerLives <= 0;
  if (bustOut) state.status = 'BUST_OUT';
  else dealNewHandForState(state);
  return {
    ...base,
    label: doubled ? 'VILLAIN TAKES THE POT ×2' : 'VILLAIN TAKES THE POT',
    location: 'rival', outcome: 'LOSE', bustOut
  };
}

function applyPush(state) {
  return resolveHand(state, 1, false);
}

// Solo se puede doblar con 2 vidas o más (regla del juego).
function canDouble(state) {
  return state.playerLives >= 2 - 1e-9;
}

// Doblar: mismo showdown con el doble en juego (2 vidas).
function applyDouble(state) {
  return resolveHand(state, 2, true);
}

// Aplica el premio del rival derrotado (premio base propio x multiplicador)
// y lo suma al total acumulado.
function applyRewardForCurrentRival(state) {
  const rival = getCurrentRival(state);
  const reward = rollReward(rival.basePrize);
  state.totalPrize += reward.amount;
  return reward;
}

// Avanza al siguiente rival o marca el torneo como completado.
function advanceToNextRival(state) {
  state.currentRivalIndex += 1;
  if (state.currentRivalIndex >= RIVALS.length) {
    state.status = 'FINAL';
  } else {
    state.status = 'RIVAL_INTRO';
  }
}

// Reinicia el torneo completo tras un BUST_OUT, conservando nombre/apodo.
function restartTournament(state) {
  const player = state.player;
  Object.assign(state, createInitialState());
  state.player = player;
  state.status = 'RIVAL_INTRO';
}
