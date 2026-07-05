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

// Da formato a un número de vidas que solo puede tener fracciones de 1/4
// (0, 1/4, 1/2 o 3/4), mostrando "2¾" en vez de "2.75".
function formatLifeNumber(lives) {
  const rounded = Math.round(lives * 4) / 4;
  const whole = Math.floor(rounded + 1e-9);
  const quarters = Math.round((rounded - whole) * 4);
  const fractionSymbol = quarters === 1 ? '¼' : quarters === 2 ? '½' : quarters === 3 ? '¾' : '';
  return `${whole}${fractionSymbol}`;
}

// Heart shape en SVG rellenado con un gradiente "de batería": la parte
// roja ocupa exactamente el % indicado y siempre queda dentro del
// contorno del corazón (a diferencia de recortar un glifo de texto, que
// no se ajusta bien a la silueta real).
let heartGradientCounter = 0;
const HEART_SVG_PATH = 'M16 29.3C16 29.3 1.6 20.1 1.6 10 1.6 4.9 5.6 1.6 10 1.6 12.8 1.6 15.2 3.3 16 6 16.8 3.3 19.2 1.6 22 1.6 26.4 1.6 30.4 4.9 30.4 10 30.4 20.1 16 29.3 16 29.3Z';

function renderHeart(fillPercent) {
  heartGradientCounter += 1;
  const gradientId = `heart-grad-${heartGradientCounter}`;
  return `<svg class="heart-svg" viewBox="0 0 32 31" width="18" height="17">
    <defs><linearGradient id="${gradientId}">
      <stop offset="${fillPercent}%" stop-color="#ff3b53" />
      <stop offset="${fillPercent}%" stop-color="#4a4650" />
    </linearGradient></defs>
    <path d="${HEART_SVG_PATH}" fill="url(#${gradientId})" />
  </svg>`;
}

// Construye una fila de corazones donde cada uno se rellena por porcentaje,
// soportando cualquier fracción de vida (no solo mitades).
function renderLivesHearts(lives, maxLives) {
  let html = '';
  for (let i = 0; i < maxLives; i++) {
    const remaining = clamp(lives - i, 0, 1);
    html += renderHeart(Math.round(remaining * 100));
  }
  return `<span class="hearts">${html}</span> <span class="lives-number">${formatLifeNumber(lives)}</span>`;
}

function setPortraitElement(el, rival) {
  el.className = el.className.replace(/\s*placeholder-\S+/g, '').replace(/\s*is-placeholder/g, '').trim();
  el.style.backgroundImage = '';

  if (rival.image) {
    // El retrato se muestra completo (contain) sobre una copia difuminada de
    // la propia imagen, así el hueco alrededor no muestra un color que
    // desentone con el fondo del arte de cada personaje.
    el.innerHTML =
      `<div class="portrait-blur" style="background-image:url('${rival.image}')"></div>` +
      `<img class="portrait-img" src="${rival.image}" alt="${rival.name}">`;
  } else {
    el.classList.add('is-placeholder', `placeholder-${rival.suit}`);
    el.innerHTML = `<span class="portrait-symbol">${rival.suitSymbol}</span>`;
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
  if (rival.rivalSkill > 0) {
    modifierEl.textContent = `Ventaja del rival: mejora su mano en el ${Math.round(rival.rivalSkill * 100)}% de las manos.`;
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
  const detailText = getOddsDetailText(hand.winChance, hand.playerHandName, rival.rivalSkill);
  document.getElementById('battle-odds-label').textContent = `${hand.oddsLabel} · ${winPercent}%`;
  document.getElementById('battle-odds-label').title = detailText;
  document.getElementById('battle-odds-detail').textContent = detailText;
  document.getElementById('battle-odds-detail').classList.add('hidden');
  document.getElementById('battle-result-message').textContent = '';

  document.getElementById('push-button').classList.remove('hidden');
  document.getElementById('fold-button').classList.remove('hidden');
  document.getElementById('continue-button').classList.add('hidden');

  // El botón Doblar solo está disponible con 2 vidas o más.
  const doubleButton = document.getElementById('double-button');
  const doubleHint = document.getElementById('double-hint');
  doubleButton.classList.remove('hidden');
  if (canDouble(gameState)) {
    doubleButton.disabled = false;
    doubleHint.textContent = 'Doblar: pones 2 vidas en juego, ganas o pierdes el doble.';
  } else {
    doubleButton.disabled = true;
    doubleHint.textContent = 'Necesitas 2 vidas o más para Doblar.';
  }
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

  // Tras un push se muestran las cartas reales del rival y qué combinación
  // ganó, para que el resultado sea legible como una mano de póker.
  if (result.revealCards) {
    renderCardRow('battle-rival-cards', result.revealCards);
    document.getElementById('battle-reveal-caption').textContent = buildComboCaption(result);
  }

  document.getElementById('push-button').classList.add('hidden');
  document.getElementById('fold-button').classList.add('hidden');
  document.getElementById('double-button').classList.add('hidden');
  document.getElementById('double-hint').textContent = '';

  // El juego nunca avanza solo: siempre espera a que el jugador pulse
  // Continuar, tanto si sigue el combate como si terminó (recompensa/bust).
  document.getElementById('continue-button').classList.remove('hidden');
}

// Frase que explica qué combinación decidió la mano.
function buildComboCaption(result) {
  const rival = getCurrentRival(gameState);
  const doubleNote = result.doubled ? ' (jugada doble)' : '';

  if (result.outcome === 'WIN') {
    const damage = result.doubled ? 'pierde 2 vidas' : 'pierde 1 vida';
    return `Ganas con ${result.playerHandName}${doubleNote}. ${rival.name} tenía ${result.rivalHandName} y ${damage}.`;
  }
  if (result.outcome === 'LOSE') {
    const damage = result.doubled ? 'Pierdes 2 vidas' : 'Pierdes 1 vida';
    return `${rival.name} gana con ${result.rivalHandName}${doubleNote}. Tú tenías ${result.playerHandName}. ${damage}.`;
  }
  if (result.outcome === 'TIE') {
    return `Empate: ${result.playerHandName} en ambos. Se reparte de nuevo.`;
  }
  return '';
}

document.getElementById('push-button').addEventListener('click', () => {
  const result = applyPush(gameState);
  showBattleResult(result);
});

document.getElementById('double-button').addEventListener('click', () => {
  if (!canDouble(gameState)) return;
  const result = applyDouble(gameState);
  showBattleResult(result);
});

document.getElementById('fold-button').addEventListener('click', () => {
  const result = applyFold(gameState);
  showBattleResult(result);
});

document.getElementById('continue-button').addEventListener('click', () => {
  if (gameState.status === 'BATTLE') {
    // Sigue el mismo enfrentamiento: mostrar la mano nueva ya repartida.
    renderBattle();
  } else if (gameState.status === 'REWARD') {
    renderReward();
    showScreen('REWARD');
  } else if (gameState.status === 'BUST_OUT') {
    renderBustOut();
    showScreen('BUST_OUT');
  }
});

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
  setPortraitElement(document.getElementById('final-portrait'), { image: 'assets/champion.jpg', name: 'Campeón', suit: 'champion', suitSymbol: '👑' });
  document.getElementById('final-total').textContent = formatEuros(gameState.totalPrize);

  const runEntry = {
    name: gameState.player.name,
    alias: gameState.player.alias,
    totalPrize: gameState.totalPrize,
    date: new Date().toISOString()
  };
  const leaderboard = saveRunToLeaderboard(runEntry);
  renderLeaderboardList(leaderboard, runEntry);
}

// Pinta el histórico de mejores premios (guardado en este mismo navegador)
// y marca si la partida recién ganada es un nuevo récord personal.
function renderLeaderboardList(leaderboard, currentRunEntry) {
  const listEl = document.getElementById('leaderboard-list');
  listEl.innerHTML = '';

  leaderboard.forEach((entry) => {
    const li = document.createElement('li');
    const isCurrentRun = entry === currentRunEntry;
    if (isCurrentRun) li.classList.add('current-run');
    li.innerHTML = `<span class="leaderboard-name">${entry.name} "${entry.alias}"</span><span class="leaderboard-amount">${formatEuros(entry.totalPrize)}</span>`;
    listEl.appendChild(li);
  });

  const isNewRecord = leaderboard[0] === currentRunEntry && leaderboard.length > 0;
  document.getElementById('final-new-record').classList.toggle('hidden', !isNewRecord);
}
