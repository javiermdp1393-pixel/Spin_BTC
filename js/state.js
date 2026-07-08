// Estado central de la partida y funciones puras para mutarlo.
// No toca el DOM: eso es responsabilidad de main.js.

const PLAYER_STARTING_LIVES = 3;
const FOLD_LIFE_COST = 1 / 4;

// Racha: a partir de 3 manos ganadas seguidas, cada victoria hace un corazón
// entero de daño extra al rival.
const STREAK_ACTIVE_THRESHOLD = 3;

// Ajustes del modo Freezeout (torneo a un solo stack). Los valores de
// dificultad (skill y vidas extra de los rivales) están calibrados por
// simulación para dejar la victoria óptima en ~4-5%, la mitad del arcade.
const FREEZEOUT = {
  startLives: 5,
  maxLives: 5,
  lifePerWin: 1, // vida recuperada al derrotar a un rival (hasta maxLives)
  freeFolds: 1, // folds gratis por rival (no acumulables)
  skillMultiplier: 1.8, // rivales más afilados
  extraRivalLives: 1 // rivales con una vida más
};

function streakBonusDamage(streak) {
  return streak >= STREAK_ACTIVE_THRESHOLD ? 1 : 0;
}

function createInitialState() {
  return {
    status: 'LAUNCH', // LAUNCH, REGISTER, RIVAL_INTRO, BATTLE, REWARD, BUST_OUT, FINAL
    player: { name: '', alias: '' },
    mode: 'ARCADE', // ARCADE | FREEZEOUT
    demoMode: false, // acceso demo/QA: cada mano elimina al rival
    currentRivalIndex: 0,
    playerLives: PLAYER_STARTING_LIVES,
    rivalLives: 0,
    totalPrize: 0,
    winStreak: 0, // manos ganadas seguidas en el combate actual
    resistRemaining: 0, // golpes que el rival aguanta sin perder vida
    freeFoldsRemaining: 0, // folds gratis disponibles en el combate actual
    rivalLine: { victoryShown: false, defeatShown: false, text: '' },
    currentHand: null
  };
}

function isFreezeout(state) {
  return state.mode === 'FREEZEOUT';
}

function isStreakActive(state) {
  return state.winStreak >= STREAK_ACTIVE_THRESHOLD;
}

function getCurrentRival(state) {
  return RIVALS[state.currentRivalIndex];
}

function playerMaxLives(state) {
  return isFreezeout(state) ? FREEZEOUT.maxLives : PLAYER_STARTING_LIVES;
}

// Skill efectivo del rival (mayor en Freezeout), con tope de seguridad.
function effectiveRivalSkill(state, rival) {
  const mul = isFreezeout(state) ? FREEZEOUT.skillMultiplier : 1;
  return Math.min(0.9, rival.rivalSkill * mul);
}

// Vidas de arranque del rival. En Freezeout todos suman una vida extra,
// salvo que el rival defina un "freezeoutLives" propio (el jefe final).
function rivalLivesFor(state, rival) {
  if (!isFreezeout(state)) return rival.lives;
  if (rival.freezeoutLives != null) return rival.freezeoutLives;
  return rival.lives + FREEZEOUT.extraRivalLives;
}

// Golpes que el rival resiste sin perder vida (habilidad de jefe / protección).
function getResistCount(state, rival) {
  if (isFreezeout(state)) {
    if (rival.id === 'el-pirulas') return 2;
    if (rival.id === 'fabrizio') return 1;
    return 0;
  }
  return rival.finalBoss ? 1 : 0;
}

// Las vidas se mueven en fracciones de 1/4 (fold) o 1 (mano perdida).
function roundLife(value) {
  return Math.round(value * 4) / 4;
}

// Arranca el torneo en un modo concreto (conserva demoMode ya fijado).
// El primer enfrentamiento se prepara al pulsar "Sentarse a la mesa".
function startTournament(state, mode) {
  state.mode = mode;
  state.currentRivalIndex = 0;
  state.totalPrize = 0;
  state.playerLives = mode === 'FREEZEOUT' ? FREEZEOUT.startLives : PLAYER_STARTING_LIVES;
}

// Prepara un nuevo enfrentamiento. En Arcade las vidas se resetean a 3; en
// Freezeout se conserva el stack entre rivales.
function startRivalEncounter(state) {
  const rival = getCurrentRival(state);
  if (!isFreezeout(state)) state.playerLives = PLAYER_STARTING_LIVES;
  state.rivalLives = rivalLivesFor(state, rival);
  state.winStreak = 0;
  state.resistRemaining = getResistCount(state, rival);
  state.freeFoldsRemaining = isFreezeout(state) ? FREEZEOUT.freeFolds : 0;
  state.rivalLine = { victoryShown: false, defeatShown: false, text: '' };
  dealNewHandForState(state);
}

// Reparte una mano nueva y estima su probabilidad de victoria.
function dealNewHandForState(state) {
  const rival = getCurrentRival(state);
  const skill = effectiveRivalSkill(state, rival);
  const hand = dealHand();
  const winChance = estimateWinChance(hand.playerCards, hand.communityCards, skill);

  state.currentHand = {
    playerCards: hand.playerCards,
    communityCards: hand.communityCards,
    winChance,
    oddsLabel: getOddsLabel(winChance),
    playerHandName: describePlayerHand(hand.playerCards, hand.communityCards)
  };
}

// Comprueba si el rival debe soltar una frase (cerca de perder o de ganar).
// Solo una vez por condición y combate. Devuelve true si se ha activado una.
function maybeTriggerRivalLine(state) {
  const rival = getCurrentRival(state);
  const line = state.rivalLine;

  if (!line.defeatShown && state.rivalLives <= 1) {
    line.defeatShown = true;
    const pool = rival.nearDefeatLines || [];
    if (pool.length) {
      line.text = pool[Math.floor(Math.random() * pool.length)];
      return true;
    }
  }
  if (!line.victoryShown && state.playerLives <= 1) {
    line.victoryShown = true;
    const pool = rival.nearVictoryLines || [];
    if (pool.length) {
      line.text = pool[Math.floor(Math.random() * pool.length)];
      return true;
    }
  }
  return false;
}

// Foldear. En Freezeout el primer fold de cada rival es gratis.
function applyFold(state) {
  state.winStreak = 0;

  let freeFold = false;
  if (state.freeFoldsRemaining > 0) {
    state.freeFoldsRemaining -= 1;
    freeFold = true;
  } else {
    state.playerLives = roundLife(state.playerLives - FOLD_LIFE_COST);
  }

  if (state.playerLives <= 0) {
    state.status = 'BUST_OUT';
    return { label: 'HAND FOLDED', location: 'player', outcome: 'FOLD', freeFold };
  }

  dealNewHandForState(state);
  return { label: freeFold ? 'FREE FOLD' : 'HAND FOLDED', location: 'player', outcome: 'FOLD', freeFold };
}

// Resolución común de una mano jugada (CALL o Doblar).
function resolveHand(state, stake, doubled) {
  const rival = getCurrentRival(state);
  const hand = state.currentHand;
  const showdown = resolveShowdown(hand.playerCards, hand.communityCards, effectiveRivalSkill(state, rival));

  const base = {
    revealCards: showdown.rivalCards,
    playerHandName: showdown.playerHandName,
    rivalHandName: showdown.rivalHandName,
    doubled
  };

  // Modo demo/QA: la mano jugada elimina al rival (para recorrer pantallas).
  if (state.demoMode) {
    state.rivalLives = 0;
    state.status = 'REWARD';
    return { ...base, label: doubled ? 'YOU TAKE THE POT ×2' : 'YOU TAKE THE POT', location: 'player', outcome: 'WIN', rivalFelted: true, demo: true };
  }

  // Empate: se reparte mano nueva sin coste de vidas y sin romper la racha.
  if (showdown.cmp === 0) {
    dealNewHandForState(state);
    return { ...base, label: 'SPLIT POT', location: 'player', outcome: 'TIE' };
  }

  // Victoria del jugador.
  if (showdown.cmp > 0) {
    state.winStreak += 1;

    // El rival resiste el golpe (habilidad de jefe / protección): no pierde
    // vida pero cuenta como mano ganada.
    if (state.resistRemaining > 0) {
      state.resistRemaining -= 1;
      dealNewHandForState(state);
      return { ...base, label: rival.finalBoss ? 'EL PIRULAS RESISTE' : 'EL RIVAL RESISTE', location: 'player', outcome: 'WIN', rivalFelted: false, bossResisted: true };
    }

    const bonus = streakBonusDamage(state.winStreak);
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

// Aplica el premio del rival derrotado (premio base propio x multiplicador).
function applyRewardForCurrentRival(state) {
  const rival = getCurrentRival(state);
  const reward = rollReward(rival.basePrize);
  state.totalPrize += reward.amount;
  return reward;
}

// Avanza al siguiente rival. En Freezeout recupera una vida (hasta el máximo).
function advanceToNextRival(state) {
  if (isFreezeout(state)) {
    state.playerLives = Math.min(FREEZEOUT.maxLives, state.playerLives + FREEZEOUT.lifePerWin);
  }
  state.currentRivalIndex += 1;
  if (state.currentRivalIndex >= RIVALS.length) {
    state.status = 'FINAL';
  } else {
    state.status = 'RIVAL_INTRO';
  }
}

// Reinicia el torneo tras un BUST_OUT, conservando nombre/apodo, modo y demo.
function restartTournament(state) {
  const { player, mode, demoMode } = state;
  Object.assign(state, createInitialState());
  state.player = player;
  state.mode = mode;
  state.demoMode = demoMode;
  state.playerLives = mode === 'FREEZEOUT' ? FREEZEOUT.startLives : PLAYER_STARTING_LIVES;
  state.status = 'RIVAL_INTRO';
}
