// Controlador de pantallas: conecta gameState con el DOM.
// No contiene reglas de juego (eso vive en state.js / poker.js / odds.js / rewards.js).

const gameState = createInitialState();

const SCREEN_IDS = {
  LAUNCH: 'launch-screen',
  REGISTER: 'register-screen',
  RIVAL_INTRO: 'rival-intro-screen',
  BATTLE: 'battle-screen',
  REWARD: 'reward-screen',
  BUST_OUT: 'bust-out-screen',
  FINAL: 'final-screen'
};

// Disposición de los pips centrales de las cartas numéricas, en una rejilla
// de 5 filas x 3 columnas (fila, columna), igual que una baraja física.
const PIP_LAYOUT = {
  '2': [[0, 1], [4, 1]],
  '3': [[0, 1], [2, 1], [4, 1]],
  '4': [[0, 0], [0, 2], [4, 0], [4, 2]],
  '5': [[0, 0], [0, 2], [2, 1], [4, 0], [4, 2]],
  '6': [[0, 0], [0, 2], [2, 0], [2, 2], [4, 0], [4, 2]],
  '7': [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2], [4, 0], [4, 2]],
  '8': [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2], [3, 1], [4, 0], [4, 2]],
  '9': [[0, 0], [0, 2], [1, 0], [1, 2], [2, 1], [3, 0], [3, 2], [4, 0], [4, 2]],
  '10': [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2], [3, 0], [3, 2], [4, 0], [4, 2]]
};

let pendingReward = null;
let rewardSpinInterval = null;

function showScreen(status) {
  Object.values(SCREEN_IDS).forEach((id) => {
    document.getElementById(id).classList.remove('active');
  });
  document.getElementById(SCREEN_IDS[status]).classList.add('active');
}

function createCardElement(card) {
  const el = document.createElement('div');
  const isRed = card.suit === '♥' || card.suit === '♦';
  el.className = 'card ' + (isRed ? 'red' : 'black');

  const cornerTop = document.createElement('div');
  cornerTop.className = 'card-corner corner-top';
  cornerTop.innerHTML = `${card.rank}<br>${card.suit}`;

  const cornerBottom = document.createElement('div');
  cornerBottom.className = 'card-corner corner-bottom';
  cornerBottom.innerHTML = `${card.rank}<br>${card.suit}`;

  const center = document.createElement('div');
  center.className = 'card-center';

  if (card.rank === 'A') {
    center.classList.add('center-ace');
    center.textContent = card.suit;
  } else if (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') {
    center.classList.add('center-face');
    center.innerHTML = `<span class="face-letter">${card.rank}</span><span class="face-suit">${card.suit}</span>`;
  } else {
    center.classList.add('center-pips');
    const layout = PIP_LAYOUT[card.rank] || [];
    layout.forEach(([row, col]) => {
      const pip = document.createElement('span');
      pip.className = 'pip';
      pip.style.gridRow = row + 1;
      pip.style.gridColumn = col + 1;
      pip.textContent = card.suit;
      center.appendChild(pip);
    });
  }

  el.appendChild(cornerTop);
  el.appendChild(center);
  el.appendChild(cornerBottom);
  return el;
}

function createCardBackElement() {
  const el = document.createElement('div');
  el.className = 'card card-back';
  el.textContent = '?';
  return el;
}

function renderCardRow(containerId, cards) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  cards.forEach((card) => container.appendChild(createCardElement(card)));
}

function renderHiddenCardRow(containerId, count) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  for (let i = 0; i < count; i++) container.appendChild(createCardBackElement());
}

// Da formato a un número de vidas que solo puede tener fracciones de 1/3
// (0, 1/3 o 2/3), mostrando "2⅓" en vez de "2.3333333333333335".
function formatLifeNumber(lives) {
  const rounded = Math.round(lives * 3) / 3;
  const whole = Math.floor(rounded + 1e-9);
  const thirds = Math.round((rounded - whole) * 3);
  const fractionSymbol = thirds === 1 ? '⅓' : thirds === 2 ? '⅔' : '';
  return `${whole}${fractionSymbol}`;
}

// Construye una fila de corazones donde cada uno se rellena por porcentaje,
// soportando cualquier fracción de vida (no solo mitades).
function renderLivesHearts(lives, maxLives) {
  let html = '';
  for (let i = 0; i < maxLives; i++) {
    const remaining = clamp(lives - i, 0, 1);
    const fillPercent = Math.round(remaining * 100);
    html += `<span class="heart"><span class="heart-fill" style="width:${fillPercent}%"></span></span>`;
  }
  return `<span class="hearts">${html}</span> <span class="lives-number">${formatLifeNumber(lives)}</span>`;
}

function setPortraitElement(el, rival) {
  el.className = el.className.replace(/placeholder-\S+/g, '').trim();
  if (rival.image) {
    el.style.backgroundImage = `url('${rival.image}')`;
    el.textContent = '';
  } else {
    el.style.backgroundImage = '';
    el.classList.add(`placeholder-${rival.suit}`);
    el.textContent = rival.suitSymbol;
  }
}

// --- Pantalla: Registro ---

document.getElementById('start-button').addEventListener('click', () => {
  gameState.status = 'REGISTER';
  showScreen(gameState.status);
});

document.getElementById('register-button').addEventListener('click', () => {
  const nameInput = document.getElementById('player-name');
  const aliasInput = document.getElementById('player-alias');
  const errorEl = document.getElementById('register-error');

  const name = nameInput.value.trim();
  const alias = aliasInput.value.trim();

  if (!name || !alias) {
    errorEl.textContent = 'La mesa necesita tu nombre y tu apodo antes de empezar.';
    return;
  }

  errorEl.textContent = '';
  gameState.player.name = name;
  gameState.player.alias = alias;
  gameState.status = 'RIVAL_INTRO';
  renderRivalIntro();
  showScreen(gameState.status);
});

// --- Pantalla: Intro de rival ---

function renderRivalIntro() {
  const rival = getCurrentRival(gameState);
  setPortraitElement(document.getElementById('rival-intro-portrait'), rival);
  document.getElementById('rival-intro-name').textContent = rival.name;
  document.getElementById('rival-intro-alias').textContent = rival.alias;
  document.getElementById('rival-intro-lives').textContent = `Vidas del rival: ${rival.lives}`;

  const modifierEl = document.getElementById('rival-intro-modifier');
  if (rival.modifier > 0) {
    modifierEl.textContent = `Penalización de dificultad: -${Math.round(rival.modifier * 100)}% a tus probabilidades.`;
  } else {
    modifierEl.textContent = '';
  }

  document.getElementById('rival-intro-quote').textContent = `“${rival.introLine}”`;
}

document.getElementById('rival-intro-button').addEventListener('click', () => {
  startRivalEncounter(gameState);
  gameState.status = 'BATTLE';
  renderBattle();
  showScreen(gameState.status);
});

// --- Pantalla: Combate ---

function renderBattle() {
  const rival = getCurrentRival(gameState);
  const hand = gameState.currentHand;

  setPortraitElement(document.getElementById('battle-rival-portrait'), rival);
  document.getElementById('battle-rival-name').textContent = rival.name;
  document.getElementById('battle-rival-alias').textContent = rival.alias;
  document.getElementById('battle-rival-lives').innerHTML = renderLivesHearts(gameState.rivalLives, rival.lives);
  document.getElementById('battle-rival-result-message').textContent = '';
  renderHiddenCardRow('battle-rival-cards', 2);
  document.getElementById('battle-reveal-caption').textContent = '';

  document.getElementById('battle-player-name').textContent = `${gameState.player.name} "${gameState.player.alias}"`;
  document.getElementById('battle-player-lives').innerHTML = renderLivesHearts(gameState.playerLives, PLAYER_STARTING_LIVES);
  renderCardRow('battle-player-cards', hand.playerCards);
  renderCardRow('battle-community-cards', hand.communityCards);

  const winPercent = Math.round(hand.winChance * 100);
  document.getElementById('battle-odds-label').textContent = `${hand.oddsLabel} · ${winPercent}%`;
  document.getElementById('battle-odds-label').title = getOddsDetailText(hand.baseWinChance, rival.modifier);
  document.getElementById('battle-odds-detail').textContent = getOddsDetailText(hand.baseWinChance, rival.modifier);
  document.getElementById('battle-odds-detail').classList.add('hidden');
  document.getElementById('battle-result-message').textContent = '';

  document.getElementById('push-button').classList.remove('hidden');
  document.getElementById('fold-button').classList.remove('hidden');
  document.getElementById('continue-button').classList.add('hidden');
}

document.getElementById('battle-odds-label').addEventListener('click', () => {
  document.getElementById('battle-odds-detail').classList.toggle('hidden');
});

// Refresca los corazones de vidas sin redibujar el resto de la mano, para
// que el coste de un fold o el resultado de un push se vean al instante.
function refreshLivesDisplay() {
  const rival = getCurrentRival(gameState);
  document.getElementById('battle-rival-lives').innerHTML = renderLivesHearts(Math.max(0, gameState.rivalLives), rival.lives);
  document.getElementById('battle-player-lives').innerHTML = renderLivesHearts(Math.max(0, gameState.playerLives), PLAYER_STARTING_LIVES);
}

function showBattleResult(result) {
  refreshLivesDisplay();
  document.getElementById('battle-result-message').textContent = '';
  document.getElementById('battle-rival-result-message').textContent = '';

  if (result.location === 'rival') {
    document.getElementById('battle-rival-result-message').textContent = result.label;
  } else {
    document.getElementById('battle-result-message').textContent = result.label;
  }

  // Cuando se resuelve un push, se enseñan (solo a nivel narrativo) 2 cartas
  // de rival coherentes con el resultado, en vez de dejar las boca abajo.
  if (result.revealCards) {
    renderCardRow('battle-rival-cards', result.revealCards);
    const rival = getCurrentRival(gameState);
    let captionText;
    if (result.playerWon) {
      captionText = result.revealMatched ? `${rival.name} se guardaba una mano perdedora.` : `${rival.name} enseña sus cartas.`;
    } else {
      captionText = result.revealMatched ? `La mano que te ha ganado ${rival.name}.` : `${rival.name} enseña sus cartas.`;
    }
    document.getElementById('battle-reveal-caption').textContent = captionText;
  }

  document.getElementById('push-button').classList.add('hidden');
  document.getElementById('fold-button').classList.add('hidden');

  if (gameState.status === 'BATTLE') {
    // Sigue el mismo enfrentamiento: se reparte mano nueva al continuar.
    document.getElementById('continue-button').classList.remove('hidden');
  } else {
    // El enfrentamiento terminó (REWARD o BUST_OUT): avanzar tras una pausa breve.
    setTimeout(() => goToNextScreenAfterBattle(), 1600);
  }
}

document.getElementById('push-button').addEventListener('click', () => {
  const result = applyPush(gameState);
  showBattleResult(result);
});

document.getElementById('fold-button').addEventListener('click', () => {
  const result = applyFold(gameState);
  showBattleResult(result);
});

document.getElementById('continue-button').addEventListener('click', () => {
  renderBattle();
});

function goToNextScreenAfterBattle() {
  if (gameState.status === 'REWARD') {
    renderReward();
  } else if (gameState.status === 'BUST_OUT') {
    renderBustOut();
  }
  showScreen(gameState.status);
}

// --- Pantalla: Recompensa ---

function renderReward() {
  const rival = getCurrentRival(gameState);
  pendingReward = applyRewardForCurrentRival(gameState);

  document.getElementById('reward-defeat-line').textContent = `“${rival.defeatLine}”`;
  document.getElementById('reward-box').classList.add('hidden');
  document.getElementById('reward-reel').classList.add('hidden');
  document.getElementById('reward-jackpot-banner').classList.add('hidden');
  document.getElementById('next-table-button').classList.add('hidden');

  const spinButton = document.getElementById('spin-reward-button');
  spinButton.classList.remove('hidden');
  spinButton.disabled = false;
}

document.getElementById('spin-reward-button').addEventListener('click', () => {
  const spinButton = document.getElementById('spin-reward-button');
  spinButton.disabled = true;

  const reelContainer = document.getElementById('reward-reel');
  const reelValue = document.getElementById('reward-reel-value');
  reelContainer.classList.remove('hidden');

  const possibleMultipliers = [2, 3, 4, 5, 6, 7, 8, 9, 10, 1000];
  let ticks = 0;
  const totalTicks = 16;

  rewardSpinInterval = setInterval(() => {
    ticks++;
    const randomMultiplier = possibleMultipliers[Math.floor(Math.random() * possibleMultipliers.length)];
    reelValue.textContent = `x${randomMultiplier}`;

    if (ticks >= totalTicks) {
      clearInterval(rewardSpinInterval);
      reelValue.textContent = `x${pendingReward.multiplier}`;
      setTimeout(revealRewardBreakdown, 500);
    }
  }, 90);
});

function revealRewardBreakdown() {
  document.getElementById('reward-reel').classList.add('hidden');
  document.getElementById('spin-reward-button').classList.add('hidden');

  document.getElementById('reward-base').textContent = formatEuros(pendingReward.basePrize);
  document.getElementById('reward-multiplier').textContent = `x${pendingReward.multiplier}`;
  document.getElementById('reward-amount').textContent = formatEuros(pendingReward.amount);
  document.getElementById('reward-total').textContent = formatEuros(gameState.totalPrize);
  document.getElementById('reward-jackpot-banner').classList.toggle('hidden', pendingReward.type !== 'JACKPOT');

  document.getElementById('reward-box').classList.remove('hidden');
  document.getElementById('next-table-button').classList.remove('hidden');
}

document.getElementById('next-table-button').addEventListener('click', () => {
  advanceToNextRival(gameState);
  if (gameState.status === 'RIVAL_INTRO') {
    renderRivalIntro();
  } else if (gameState.status === 'FINAL') {
    renderFinal();
  }
  showScreen(gameState.status);
});

// --- Pantalla: Bust out ---

function renderBustOut() {
  document.getElementById('bustout-total').textContent = formatEuros(gameState.totalPrize);
}

document.getElementById('retry-button').addEventListener('click', () => {
  restartTournament(gameState);
  renderRivalIntro();
  showScreen(gameState.status);
});

// --- Pantalla: Final ---

function renderFinal() {
  document.getElementById('final-total').textContent = formatEuros(gameState.totalPrize);
}
