// Estado central de la partida y funciones puras para mutarlo.
// No toca el DOM: eso es responsabilidad de main.js.

const PLAYER_STARTING_LIVES = 3;
const BASE_PRIZE = 100000;

function createInitialState() {
  return {
    status: 'LAUNCH', // LAUNCH, REGISTER, RIVAL_INTRO, BATTLE, REWARD, BUST_OUT, FINAL
    player: { name: '', alias: '' },
    currentRivalIndex: 0,
    playerLives: PLAYER_STARTING_LIVES,
    rivalLives: 0,
    totalPrize: 0,
    currentHand: null, // { playerCards, communityCards, handCategory, winChance, oddsLabel }
    lastResult: null // texto del último evento (para mostrar en el battle screen)
  };
}

function getCurrentRival(state) {
  return RIVALS[state.currentRivalIndex];
}

// Prepara un nuevo enfrentamiento: resetea vidas del jugador a 3 y carga
// las vidas del rival actual.
function startRivalEncounter(state) {
  const rival = getCurrentRival(state);
  state.playerLives = PLAYER_STARTING_LIVES;
  state.rivalLives = rival.lives;
  state.lastResult = null;
  dealNewHandForState(state);
}

// Reparte una mano nueva y calcula su odds simplificada.
function dealNewHandForState(state) {
  const rival = getCurrentRival(state);
  const hand = dealHand();
  const handCategory = evaluateHandCategory(hand.playerCards, hand.communityCards);
  const winChance = getFinalWinChance(handCategory, rival.modifier);

  state.currentHand = {
    playerCards: hand.playerCards,
    communityCards: hand.communityCards,
    handCategory,
    winChance,
    oddsLabel: getOddsLabel(winChance)
  };
}

// Devuelve el resultado de foldear: resta 0,5 vidas y reparte mano nueva
// si el jugador sigue vivo.
function applyFold(state) {
  state.playerLives -= 0.5;

  if (state.playerLives <= 0) {
    state.status = 'BUST_OUT';
    return { label: 'HAND FOLDED' };
  }

  dealNewHandForState(state);
  return { label: 'HAND FOLDED' };
}

// Resuelve un push usando el winChance de la mano actual.
function applyPush(state) {
  const winChance = state.currentHand.winChance;
  const playerWins = Math.random() <= winChance;

  if (playerWins) {
    state.rivalLives -= 1;
    if (state.rivalLives <= 0) {
      state.status = 'REWARD';
      return { label: 'YOU TAKE THE POT', rivalFelted: true };
    }
    dealNewHandForState(state);
    return { label: 'YOU TAKE THE POT', rivalFelted: false };
  }

  state.playerLives -= 1;
  if (state.playerLives <= 0) {
    state.status = 'BUST_OUT';
    return { label: 'VILLAIN TAKES THE POT', bustOut: true };
  }
  dealNewHandForState(state);
  return { label: 'VILLAIN TAKES THE POT', bustOut: false };
}

// Aplica el premio del rival derrotado y lo suma al total acumulado.
function applyRewardForCurrentRival(state) {
  const reward = rollReward(BASE_PRIZE);
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
