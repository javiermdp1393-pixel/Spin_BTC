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
    currentHand: null // { playerCards, communityCards, handCategory, baseWinChance, winChance, oddsLabel }
  };
}

function getCurrentRival(state) {
  return RIVALS[state.currentRivalIndex];
}

// Las vidas se mueven en fracciones de 1/3 (fold) o 1 (push). Redondear a la
// sexta parte evita arrastrar errores de punto flotante (p.ej. 1.9999999997).
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

// Reparte una mano nueva y calcula su odds simplificada.
function dealNewHandForState(state) {
  const rival = getCurrentRival(state);
  const hand = dealHand();
  const handCategory = evaluateHandCategory(hand.playerCards, hand.communityCards);
  const baseWinChance = BASE_WIN_CHANCE_BY_CATEGORY[handCategory];
  const winChance = getFinalWinChance(handCategory, rival.modifier);

  state.currentHand = {
    playerCards: hand.playerCards,
    communityCards: hand.communityCards,
    handCategory,
    baseWinChance,
    winChance,
    oddsLabel: getOddsLabel(winChance)
  };
}

// Resta el coste del fold (1/3 de vida) y reparte mano nueva si el jugador
// sigue vivo.
function applyFold(state) {
  state.playerLives = roundLife(state.playerLives - FOLD_LIFE_COST);

  if (state.playerLives <= 0) {
    state.status = 'BUST_OUT';
    return { label: 'HAND FOLDED', location: 'player' };
  }

  dealNewHandForState(state);
  return { label: 'HAND FOLDED', location: 'player' };
}

// Resuelve un push usando el winChance de la mano actual. Además reconstruye
// (solo a efectos narrativos) unas cartas de rival plausibles coherentes con
// el resultado: si gana el jugador, una mano rival que habría perdido; si
// pierde, una que le habría ganado.
function applyPush(state) {
  const hand = state.currentHand;
  const playerWins = Math.random() <= hand.winChance;
  const reveal = pickRevealRivalCards(hand.playerCards, hand.communityCards, hand.handCategory, playerWins);

  if (playerWins) {
    state.rivalLives -= 1;
    const rivalFelted = state.rivalLives <= 0;
    if (rivalFelted) state.status = 'REWARD';
    else dealNewHandForState(state);
    return { label: 'YOU TAKE THE POT', location: 'player', rivalFelted, revealCards: reveal.cards, revealMatched: reveal.matched, playerWon: true };
  }

  state.playerLives = roundLife(state.playerLives - 1);
  const bustOut = state.playerLives <= 0;
  if (bustOut) state.status = 'BUST_OUT';
  else dealNewHandForState(state);
  return { label: 'VILLAIN TAKES THE POT', location: 'rival', bustOut, revealCards: reveal.cards, revealMatched: reveal.matched, playerWon: false };
}

// Aplica el premio del rival derrotado (premio base propio del rival x
// multiplicador) y lo suma al total acumulado.
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
