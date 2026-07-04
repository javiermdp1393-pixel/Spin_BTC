// Estado central de la partida y funciones puras para mutarlo.
// No toca el DOM: eso es responsabilidad de main.js.

const PLAYER_STARTING_LIVES = 3;
const FOLD_LIFE_COST = 1 / 3;

function createInitialState() {
  return {
    status: 'LAUNCH', // LAUNCH, REGISTER, RIVAL_INTRO, BATTLE, REWARD, BUST_OUT, FINAL
    player: { name: '', alias: '' },
    currentRivalIndex: 0,
    playerLives: PLAYER_STARTING_LIVES,
    rivalLives: 0,
    totalPrize: 0,
    currentHand: null // { playerCards, communityCards, winChance, oddsLabel, playerHandName }
  };
}

function getCurrentRival(state) {
  return RIVALS[state.currentRivalIndex];
}

// Las vidas se mueven en fracciones de 1/3 (fold) o 1 (mano perdida).
// Redondear a la sexta parte evita arrastrar errores de punto flotante.
function roundLife(value) {
  return Math.round(value * 6) / 6;
}

// Prepara un nuevo enfrentamiento: resetea vidas del jugador a 3 y carga
// las vidas del rival actual.
function startRivalEncounter(state) {
  const rival = getCurrentRival(state);
  state.playerLives = PLAYER_STARTING_LIVES;
  state.rivalLives = rival.lives;
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

// Foldear cuesta 1/3 de vida y reparte mano nueva si el jugador sigue vivo.
function applyFold(state) {
  state.playerLives = roundLife(state.playerLives - FOLD_LIFE_COST);

  if (state.playerLives <= 0) {
    state.status = 'BUST_OUT';
    return { label: 'HAND FOLDED', location: 'player', outcome: 'FOLD' };
  }

  dealNewHandForState(state);
  return { label: 'HAND FOLDED', location: 'player', outcome: 'FOLD' };
}

// Resuelve un push como un showdown real: gana la mejor combinación de 5
// cartas. Devuelve las cartas reales del rival (que ya se pueden mostrar) y
// las categorías de ambas manos para la UI.
function applyPush(state) {
  const rival = getCurrentRival(state);
  const hand = state.currentHand;
  const showdown = resolveShowdown(hand.playerCards, hand.communityCards, rival.rivalSkill);

  const base = {
    revealCards: showdown.rivalCards,
    playerHandName: showdown.playerHandName,
    rivalHandName: showdown.rivalHandName
  };

  // Empate: se reparte mano nueva sin coste de vidas (regla del MVP).
  if (showdown.cmp === 0) {
    dealNewHandForState(state);
    return { ...base, label: 'SPLIT POT', location: 'player', outcome: 'TIE' };
  }

  if (showdown.cmp > 0) {
    state.rivalLives -= 1;
    const rivalFelted = state.rivalLives <= 0;
    if (rivalFelted) state.status = 'REWARD';
    else dealNewHandForState(state);
    return { ...base, label: 'YOU TAKE THE POT', location: 'player', outcome: 'WIN', rivalFelted };
  }

  state.playerLives = roundLife(state.playerLives - 1);
  const bustOut = state.playerLives <= 0;
  if (bustOut) state.status = 'BUST_OUT';
  else dealNewHandForState(state);
  return { ...base, label: 'VILLAIN TAKES THE POT', location: 'rival', outcome: 'LOSE', bustOut };
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
