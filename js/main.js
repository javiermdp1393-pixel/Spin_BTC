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
  el.innerHTML = `<span class="card-rank">${card.rank}</span><span class="card-suit">${card.suit}</span>`;
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

// Construye el HTML de una fila de vidas en forma de corazones, soportando
// medias vidas (coste del fold).
function renderLivesHearts(lives, maxLives) {
  let html = '';
  for (let i = 0; i < maxLives; i++) {
    const remaining = clamp(lives - i, 0, 1);
    const cssClass = remaining >= 1 ? 'full' : remaining >= 0.5 ? 'half' : 'empty';
    html += `<span class="heart ${cssClass}"></span>`;
  }
  return `<span class="hearts">${html}</span> <span class="lives-number">${lives}</span>`;
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
  renderHiddenCardRow('battle-rival-cards', 2);

  document.getElementById('battle-player-name').textContent = `${gameState.player.name} "${gameState.player.alias}"`;
  document.getElementById('battle-player-lives').innerHTML = renderLivesHearts(gameState.playerLives, PLAYER_STARTING_LIVES);
  renderCardRow('battle-player-cards', hand.playerCards);
  renderCardRow('battle-community-cards', hand.communityCards);

  document.getElementById('battle-odds-label').textContent = hand.oddsLabel;
  document.getElementById('battle-result-message').textContent = '';

  document.getElementById('push-button').classList.remove('hidden');
  document.getElementById('fold-button').classList.remove('hidden');
  document.getElementById('continue-button').classList.add('hidden');
}

function showBattleResult(label) {
  document.getElementById('battle-result-message').textContent = label;
  document.getElementById('push-button').classList.add('hidden');
  document.getElementById('fold-button').classList.add('hidden');

  if (gameState.status === 'BATTLE') {
    // Sigue el mismo enfrentamiento: se reparte mano nueva al continuar.
    document.getElementById('continue-button').classList.remove('hidden');
  } else {
    // El enfrentamiento terminó (REWARD o BUST_OUT): avanzar tras una pausa breve.
    setTimeout(() => goToNextScreenAfterBattle(), 1400);
  }
}

document.getElementById('push-button').addEventListener('click', () => {
  const result = applyPush(gameState);
  showBattleResult(result.label);
});

document.getElementById('fold-button').addEventListener('click', () => {
  const result = applyFold(gameState);
  showBattleResult(result.label);
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
  const reward = applyRewardForCurrentRival(gameState);

  document.getElementById('reward-defeat-line').textContent = `“${rival.defeatLine}”`;
  document.getElementById('reward-base').textContent = formatEuros(reward.basePrize);
  document.getElementById('reward-multiplier').textContent = `x${reward.multiplier}`;
  document.getElementById('reward-amount').textContent = formatEuros(reward.amount);
  document.getElementById('reward-total').textContent = formatEuros(gameState.totalPrize);

  const jackpotBanner = document.getElementById('reward-jackpot-banner');
  jackpotBanner.classList.toggle('hidden', reward.type !== 'JACKPOT');
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
