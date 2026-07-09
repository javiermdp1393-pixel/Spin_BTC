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
  FINAL: 'final-screen',
  PRO: 'pro-screen'
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

function renderCardRow(containerId, cards, animate) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  cards.forEach((card, i) => {
    const el = createCardElement(card);
    if (animate) applyDealAnimation(el, i);
    container.appendChild(el);
  });
}

// Reparte las 5 comunitarias en dos filas (3 arriba, 2 abajo) para que no
// quede una carta suelta en pantallas estrechas.
function renderCommunityCards(cards, animate) {
  const container = document.getElementById('battle-community-cards');
  container.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'card-row';
  cards.forEach((card, dealIndex) => {
    const el = createCardElement(card);
    if (animate) applyDealAnimation(el, dealIndex);
    row.appendChild(el);
  });
  container.appendChild(row);
}

// Animación de "reparto": la carta cae con un pequeño retardo escalonado.
function applyDealAnimation(cardEl, index) {
  cardEl.classList.add('card--deal');
  cardEl.style.animationDelay = `${index * 55}ms`;
}

function renderHiddenCardRow(containerId, count) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  for (let i = 0; i < count; i++) container.appendChild(createCardBackElement());
}

// Sacude/parpadea la fila de vidas indicada (feedback de pérdida de vida).
function flashLifeLoss(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.classList.remove('life-lost');
  void el.offsetWidth; // reinicia la animación
  el.classList.add('life-lost');
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

function renderPortraitPlaceholder(el, rival) {
  el.classList.add('is-placeholder', `placeholder-${rival.suit}`);
  el.innerHTML = `<span class="portrait-symbol">${rival.suitSymbol}</span>`;
}

function setPortraitElement(el, rival) {
  el.className = el.className.replace(/\s*placeholder-\S+/g, '').replace(/\s*is-placeholder/g, '').trim();
  el.style.backgroundImage = '';

  if (!rival.image) {
    renderPortraitPlaceholder(el, rival);
    return;
  }

  // El retrato se muestra completo (contain) sobre una copia difuminada de la
  // propia imagen, así el hueco alrededor no desentona con el arte. Si la
  // imagen aún no existe (p. ej. el modelo del campeón del día sin subir), el
  // onerror cae al placeholder del palo en vez de mostrar un icono roto.
  const blur = document.createElement('div');
  blur.className = 'portrait-blur';
  blur.style.backgroundImage = `url('${rival.image}')`;

  const img = document.createElement('img');
  img.className = 'portrait-img';
  img.src = rival.image;
  img.alt = rival.name;
  img.onerror = () => renderPortraitPlaceholder(el, rival);

  el.innerHTML = '';
  el.appendChild(blur);
  el.appendChild(img);
}

// --- Pantalla: Registro ---

// Contraseñas válidas de acceso al torneo.
const ACCESS_PASSWORDS = {
  pirulas: { demo: false },
  waterpirulasdemo13: { demo: true }
};

document.getElementById('start-button').addEventListener('click', () => {
  const pwInput = document.getElementById('access-password');
  const errorEl = document.getElementById('access-error');
  const pw = pwInput.value.trim().toLowerCase();
  const access = ACCESS_PASSWORDS[pw];

  if (!access) {
    errorEl.textContent = 'Contraseña no válida. Necesitas una invitación.';
    return;
  }

  errorEl.textContent = '';
  gameState.demoMode = access.demo;
  document.getElementById('demo-note').classList.toggle('hidden', !access.demo);
  gameState.status = 'REGISTER';
  showRegisterView('inscribirse');
  renderRecordsWidget(document.getElementById('records-register'), 'ARCADE');
  showScreen(gameState.status);
});

// Valida nombre/apodo y arranca el torneo en el modo elegido.
function startTournamentFlow(mode) {
  const name = document.getElementById('player-name').value.trim();
  const alias = document.getElementById('player-alias').value.trim();
  const errorEl = document.getElementById('register-error');

  if (!name || !alias) {
    errorEl.textContent = 'La mesa necesita tu nombre y tu apodo antes de empezar.';
    return;
  }

  errorEl.textContent = '';
  gameState.player.name = name;
  gameState.player.alias = alias;
  startTournament(gameState, mode);
  // Bonus x2 del Modo Pro: solo aplica (y se consume) en una run de Arcade.
  gameState.proBonus = mode === 'ARCADE' && consumeProTicket();
  gameState.status = 'RIVAL_INTRO';
  renderRivalIntro();
  showScreen(gameState.status);
}

document.getElementById('register-button').addEventListener('click', () => startTournamentFlow('ARCADE'));
document.getElementById('freezeout-button').addEventListener('click', () => startTournamentFlow('FREEZEOUT'));

// Rival del día por defecto si Supabase no responde: la casa (El Pirulas).
const DEFAULT_DAILY_CHALLENGE = { name: 'El Pirulas', alias: 'Final Hand', totalPrize: 100000, mode: 'ARCADE', date: null };

// Nº de jugadores que ya han batido el desafío de hoy (se muestra en la intro).
let dailyWinnersCount = null;

// Desafío diario: torneo Arcade en el que además hay que superar el premio del
// nº1 del leaderboard (rival del día, servido por el cron de Supabase).
async function startDailyChallengeFlow() {
  const name = document.getElementById('player-name').value.trim();
  const alias = document.getElementById('player-alias').value.trim();
  const errorEl = document.getElementById('register-error');

  if (!name || !alias) {
    errorEl.textContent = 'La mesa necesita tu nombre y tu apodo antes de empezar.';
    return;
  }

  errorEl.textContent = '';
  gameState.player.name = name;
  gameState.player.alias = alias;

  const dailyButton = document.getElementById('daily-button');
  dailyButton.disabled = true;
  const challenge = (await fetchDailyChallenge()) || DEFAULT_DAILY_CHALLENGE;
  // Cuántos jugadores distintos ya han batido el reto de hoy (para la intro).
  const winners = await fetchDailyWinners(200);
  dailyWinnersCount = winners ? new Set(winners.map((w) => `${w.name}|${w.alias || ''}`)).size : null;
  dailyButton.disabled = false;

  startDailyChallenge(gameState, challenge);
  gameState.status = 'RIVAL_INTRO';
  renderRivalIntro();
  showScreen(gameState.status);
}

document.getElementById('daily-button').addEventListener('click', startDailyChallengeFlow);

// Modo Pro: valida nombre/apodo y lanza la mesa Spin&Go a 3 (motor en pro.js,
// UI en pro-ui.js).
function startProFlow() {
  const name = document.getElementById('player-name').value.trim();
  const alias = document.getElementById('player-alias').value.trim();
  const errorEl = document.getElementById('register-error');
  if (!name || !alias) {
    errorEl.textContent = 'La mesa necesita tu nombre y tu apodo antes de empezar.';
    return;
  }
  errorEl.textContent = '';
  startProMode(name, alias);
}

document.getElementById('pro-button').addEventListener('click', startProFlow);

// Consume el ticket x2 del Modo Pro (si existe) al arrancar una run de Arcade.
// Devuelve true si estaba activo (y lo borra: es de un solo uso).
function consumeProTicket() {
  try {
    if (localStorage.getItem('spinho_pro_x2') === '1') {
      localStorage.removeItem('spinho_pro_x2');
      return true;
    }
  } catch (e) { /* sin almacenamiento */ }
  return false;
}

// --- Pantalla de registro: pestañas (INSCRIBIRSE / REGLAS / RECORDS) ---

function showRegisterView(view) {
  document.querySelectorAll('#register-screen .reg-tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.regtab === view);
  });
  document.querySelectorAll('#register-screen .regview').forEach((v) => {
    v.classList.toggle('active', v.id === `regview-${view}`);
  });
  // La tabla de récords se (re)carga al abrir su pestaña, para traer lo último.
  if (view === 'records') renderRecordsWidget(document.getElementById('records-tab'), 'ARCADE');
}

document.querySelectorAll('#register-screen .reg-tab').forEach((tab) => {
  tab.addEventListener('click', () => showRegisterView(tab.dataset.regtab));
});

// Switch de reglas por modo dentro de la pestaña REGLAS.
document.querySelectorAll('.rules-mode-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const modeKey = btn.dataset.rulesmode;
    document.querySelectorAll('.rules-mode-btn').forEach((b) => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.rules-body').forEach((body) => {
      body.classList.toggle('active', body.id === `rules-${modeKey}`);
    });
  });
});

// --- Pantalla: Intro de rival ---

function renderRivalIntro() {
  const rival = getCurrentRival(gameState);

  // Banner del desafío diario: progreso del gauntlet (rival X/3, vidas y folds).
  const dailyEl = document.getElementById('rival-intro-daily');
  if (gameState.daily) {
    const total = (gameState.rivalLineup && gameState.rivalLineup.length) || 3;
    const idx = gameState.currentRivalIndex + 1;
    const folds = gameState.freeFoldsRemaining;
    dailyEl.textContent = rival.dailyChampion
      ? `👑 Rival ${idx}/${total} — El campeón del día. ¡Destrónalo para llevarte la corona!`
      : `👑 Desafío diario · Rival ${idx}/${total} · 3 vidas no recuperables · ${folds} fold${folds === 1 ? '' : 's'} gratis`;
    dailyEl.classList.remove('hidden');
  } else {
    dailyEl.textContent = '';
    dailyEl.classList.add('hidden');
  }

  // Cuántos jugadores ya han batido el reto de hoy.
  const winnersEl = document.getElementById('rival-intro-winners');
  if (gameState.daily && dailyWinnersCount) {
    winnersEl.textContent = `🏅 ${dailyWinnersCount} ${dailyWinnersCount === 1 ? 'jugador ya ha' : 'jugadores ya han'} batido el reto de hoy`;
    winnersEl.classList.remove('hidden');
  } else {
    winnersEl.textContent = '';
    winnersEl.classList.add('hidden');
  }

  setPortraitElement(document.getElementById('rival-intro-portrait'), rival);
  document.getElementById('rival-intro-name').textContent = rival.name;
  document.getElementById('rival-intro-alias').textContent = rival.alias;
  document.getElementById('rival-intro-lives').textContent = `Vidas del rival: ${rivalLivesFor(gameState, rival)}`;

  const modifierEl = document.getElementById('rival-intro-modifier');
  const skill = effectiveRivalSkill(gameState, rival);
  if (skill > 0) {
    modifierEl.textContent = `Ventaja del rival: mejora su mano en el ${Math.round(skill * 100)}% de las manos.`;
  } else {
    modifierEl.textContent = '';
  }

  // Protección / habilidad: nº de golpes que aguanta sin perder vida.
  const specialEl = document.getElementById('rival-intro-special');
  const resist = getResistCount(gameState, rival);
  if (resist > 0) {
    const flavour = rival.special ? rival.special + ' ' : '';
    specialEl.textContent = `⚡ ${flavour}Aguanta ${resist} ${resist === 1 ? 'golpe' : 'golpes'} sin perder vida.`;
  } else {
    specialEl.textContent = '';
  }

  document.getElementById('rival-intro-quote').textContent = `“${rival.introLine}”`;
  renderRoadmap('rival-intro-roadmap');
  Sound.playMusic(rival.finalBoss ? 'pirulas' : 'mesas');
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
  document.getElementById('battle-rival-lives').innerHTML = renderLivesHearts(gameState.rivalLives, rivalLivesFor(gameState, rival));
  document.getElementById('battle-rival-result-message').textContent = '';
  renderHiddenCardRow('battle-rival-cards', 2);
  document.getElementById('battle-reveal-caption').textContent = '';

  const playerAvatarEl = document.getElementById('battle-player-avatar');
  if (playerAvatarEl) playerAvatarEl.textContent = (gameState.player.name || '?').charAt(0).toUpperCase();
  document.getElementById('battle-player-name').textContent = `${gameState.player.name} "${gameState.player.alias}"`;
  document.getElementById('battle-player-lives').innerHTML = renderLivesHearts(gameState.playerLives, playerMaxLives(gameState));
  renderCardRow('battle-player-cards', hand.playerCards, true);
  renderCommunityCards(hand.communityCards, true);
  Sound.playDeal();

  // El rival puede soltar una frase si está cerca de perder o de ganar.
  maybeTriggerRivalLine(gameState);
  document.getElementById('battle-rival-line').textContent = gameState.rivalLine.text ? `“${gameState.rivalLine.text}”` : '';

  const winPercent = Math.round(hand.winChance * 100);
  const detailText = getOddsDetailText(hand.winChance, hand.playerHandName, effectiveRivalSkill(gameState, rival));
  document.getElementById('battle-odds-label').textContent = `${hand.oddsLabel} · ${winPercent}%`;
  document.getElementById('battle-odds-label').title = detailText;
  document.getElementById('battle-odds-detail').textContent = detailText;
  document.getElementById('battle-odds-detail').classList.add('hidden');
  document.getElementById('battle-result-message').textContent = '';
  renderStreakBadge();

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

  // Aviso de fold gratis (modo Freezeout).
  const foldButton = document.getElementById('fold-button');
  const freefoldHint = document.getElementById('freefold-hint');
  if (gameState.freeFoldsRemaining > 0) {
    foldButton.textContent = 'FOLD ✦';
    freefoldHint.textContent = `Tienes ${gameState.freeFoldsRemaining} fold gratis contra este rival.`;
  } else {
    foldButton.textContent = 'FOLD';
    freefoldHint.textContent = '';
  }
}

document.getElementById('battle-odds-label').addEventListener('click', () => {
  document.getElementById('battle-odds-detail').classList.toggle('hidden');
});

// Refresca los corazones de vidas sin redibujar el resto de la mano, para
// que el coste de un fold o el resultado de un push se vean al instante.
function refreshLivesDisplay() {
  const rival = getCurrentRival(gameState);
  document.getElementById('battle-rival-lives').innerHTML = renderLivesHearts(Math.max(0, gameState.rivalLives), rivalLivesFor(gameState, rival));
  document.getElementById('battle-player-lives').innerHTML = renderLivesHearts(Math.max(0, gameState.playerLives), playerMaxLives(gameState));
}

function showBattleResult(result) {
  refreshLivesDisplay();
  renderStreakBadge();
  document.getElementById('battle-result-message').textContent = '';
  document.getElementById('battle-rival-result-message').textContent = '';

  if (result.location === 'rival') {
    document.getElementById('battle-rival-result-message').textContent = result.label;
  } else {
    document.getElementById('battle-result-message').textContent = result.label;
  }

  // Feedback de vida perdida + sonido según el resultado.
  if (result.outcome === 'LOSE') {
    flashLifeLoss('battle-player-lives');
    Sound.playLose();
  } else if (result.outcome === 'WIN') {
    if (!result.bossResisted) flashLifeLoss('battle-rival-lives');
    Sound.playWin();
  } else if (result.outcome === 'FOLD') {
    if (!result.freeFold) flashLifeLoss('battle-player-lives'); // el fold gratis no cuesta vida
    Sound.playFold();
  }

  // Tras un push se muestran las cartas reales del rival y qué combinación
  // ganó, para que el resultado sea legible como una mano de póker.
  if (result.revealCards) {
    renderCardRow('battle-rival-cards', result.revealCards, true);
    document.getElementById('battle-reveal-caption').textContent = buildComboCaption(result);
  }

  document.getElementById('push-button').classList.add('hidden');
  document.getElementById('fold-button').classList.add('hidden');
  document.getElementById('double-button').classList.add('hidden');
  document.getElementById('double-hint').textContent = '';
  document.getElementById('freefold-hint').textContent = '';

  // El juego nunca avanza solo: siempre espera a que el jugador pulse
  // Continuar, tanto si sigue el combate como si terminó (recompensa/bust).
  document.getElementById('continue-button').classList.remove('hidden');
}

// Muestra la insignia de racha cuando está activa (2+ victorias seguidas).
function renderStreakBadge() {
  const badge = document.getElementById('battle-streak');
  if (isStreakActive(gameState)) {
    badge.textContent = `🔥 Racha ×${gameState.winStreak} — golpe reforzado (+1 corazón)`;
    badge.classList.remove('hidden');
  } else {
    badge.textContent = '';
    badge.classList.add('hidden');
  }
}

// Frase que explica qué combinación decidió la mano.
function buildComboCaption(result) {
  const rival = getCurrentRival(gameState);
  const doubleNote = result.doubled ? ' (jugada doble)' : '';

  if (result.bossResisted) {
    return `¡${rival.name} resiste el golpe! Ganas con ${result.playerHandName} pero el campeón no pierde vida esta vez.`;
  }
  if (result.outcome === 'WIN') {
    const base = result.doubled ? 2 : 1;
    const total = base + (result.streakBonus || 0);
    const damage = `pierde ${formatLifeNumber(total)} ${total === 1 ? 'vida' : 'vidas'}`;
    const streakNote = result.streakBonus ? ' (+1 por racha)' : '';
    return `Ganas con ${result.playerHandName}${doubleNote}. ${rival.name} tenía ${result.rivalHandName} y ${damage}${streakNote}.`;
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

// --- Roadmap / bracket del torneo ---
// Muestra la escalera de rivales: los ya derrotados y el actual con su
// nombre, el jefe final siempre visible, y los futuros ocultos ("???").
function renderRoadmap(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const lineup = (gameState.rivalLineup && gameState.rivalLineup.length) ? gameState.rivalLineup : RIVALS;
  lineup.forEach((rival, index) => {
    const node = document.createElement('div');
    node.className = 'roadmap-node';

    const isBoss = rival.finalBoss || rival.dailyChampion;
    const defeated = index < gameState.currentRivalIndex;
    const current = index === gameState.currentRivalIndex;
    // Se revela el nombre de: derrotados, el actual y siempre el jefe/campeón.
    const revealed = defeated || current || isBoss;

    if (defeated) node.classList.add('defeated');
    if (current) node.classList.add('current');
    if (isBoss) node.classList.add('boss');

    const icon = document.createElement('div');
    icon.className = 'roadmap-icon';
    if (revealed && rival.image) {
      icon.style.backgroundImage = `url('${rival.image}')`;
    } else if (revealed) {
      icon.textContent = rival.suitSymbol;
    } else {
      icon.textContent = '?';
      node.classList.add('hidden-rival');
    }

    const label = document.createElement('div');
    label.className = 'roadmap-label';
    label.textContent = revealed ? (isBoss ? '👑 ' + rival.name : rival.name) : '???';

    node.appendChild(icon);
    node.appendChild(label);
    container.appendChild(node);
  });
}

document.getElementById('push-button').addEventListener('click', () => {
  const result = applyPush(gameState);
  showBattleResult(result);
});

document.getElementById('double-button').addEventListener('click', () => {
  if (!canDouble(gameState)) return;
  Sound.playDouble();
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

  renderRoadmap('reward-roadmap');
}

document.getElementById('spin-reward-button').addEventListener('click', () => {
  const spinButton = document.getElementById('spin-reward-button');
  spinButton.disabled = true;

  const reelContainer = document.getElementById('reward-reel');
  const reelValue = document.getElementById('reward-reel-value');
  reelContainer.classList.remove('hidden');

  const possibleMultipliers = [2, 3, 4, 5, 6, 7, 8, 9, 10, 50, 100, 200, 1000];
  let ticks = 0;
  const totalTicks = 16;

  rewardSpinInterval = setInterval(() => {
    ticks++;
    const randomMultiplier = possibleMultipliers[Math.floor(Math.random() * possibleMultipliers.length)];
    reelValue.textContent = `x${randomMultiplier}`;
    Sound.playRouletteTick();

    if (ticks >= totalTicks) {
      clearInterval(rewardSpinInterval);
      reelValue.textContent = `x${pendingReward.multiplier}`;
      Sound.playRouletteStop();
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

  const banner = document.getElementById('reward-jackpot-banner');
  if (pendingReward.type === 'JACKPOT') {
    banner.textContent = '¡JACKPOT!';
    banner.classList.remove('hidden');
  } else if (pendingReward.type === 'MEGA') {
    banner.textContent = '¡PELOTAZO!';
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }

  document.getElementById('reward-pro-note').classList.toggle('hidden', !pendingReward.proDoubled);

  document.getElementById('reward-box').classList.remove('hidden');
  document.getElementById('next-table-button').classList.remove('hidden');

  if (pendingReward.type === 'JACKPOT' || pendingReward.type === 'MEGA') Sound.playJackpot();
  else Sound.playReward();
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
  Sound.playMusic('derrota');
  renderRecordsWidget(document.getElementById('records-bustout'), gameState.mode);
}

document.getElementById('retry-button').addEventListener('click', () => {
  restartTournament(gameState);
  renderRivalIntro();
  showScreen(gameState.status);
});

// --- Pantalla: Final ---

async function renderFinal() {
  setPortraitElement(document.getElementById('final-portrait'), { image: 'assets/champion.jpg', name: 'Campeón', suit: 'champion', suitSymbol: '👑' });
  document.getElementById('final-total').textContent = formatEuros(gameState.totalPrize);
  Sound.playMusic('champion');

  renderDailyResult();

  // El Desafío diario no puntúa en el ranking mundial (otras reglas). En su
  // lugar registra que has batido el reto y muestra el roster de ganadores de
  // hoy, además del top Arcade como referencia.
  if (gameState.daily) {
    await submitDailyWin({
      name: gameState.player.name,
      alias: gameState.player.alias,
      totalPrize: gameState.totalPrize
    });
    const winners = await fetchDailyHallOfFame(20);
    renderDailyWinners(winners);
    setLeaderboardStatus('El Desafío diario no cuenta para el ranking mundial.');
    const topDaily = await fetchTopScores();
    if (topDaily) renderLeaderboardList(topDaily, null);
    return;
  }
  document.getElementById('daily-winners').classList.add('hidden');

  const runEntry = {
    name: gameState.player.name,
    alias: gameState.player.alias,
    totalPrize: gameState.totalPrize,
    mode: gameState.mode,
    rivalReached: 'El Pirulas',
    date: new Date().toISOString()
  };

  // Guardado local inmediato: sirve de fallback si Supabase no responde y
  // permite pintar algo al instante mientras llega la respuesta del servidor.
  const localList = saveRunToLeaderboard(runEntry);
  setLeaderboardStatus('Enviando tu marca al ranking mundial…');
  renderLeaderboardList(localList, runEntry.date);

  // Envío a Supabase y refresco con el ranking global real.
  const inserted = await submitScore(runEntry);
  const top = await fetchTopScores();

  if (top) {
    renderLeaderboardList(top, inserted ? inserted.id : null);
    setLeaderboardStatus(inserted ? '' : 'No pudimos guardar tu marca online, pero aquí tienes el ranking mundial.');
  } else {
    // Supabase no disponible: nos quedamos con el histórico local.
    setLeaderboardStatus('Sin conexión con el ranking mundial. Mostrando tu histórico local.');
    renderLeaderboardList(localList, runEntry.date);
  }
}

// Resultado del desafío diario en la pantalla final. Llegar aquí en modo
// diario significa haber vencido a los 3 rivales, incluido el campeón del día.
function renderDailyResult() {
  const el = document.getElementById('final-daily');
  if (!gameState.daily) {
    el.textContent = '';
    el.classList.add('hidden');
    return;
  }
  const c = gameState.dailyChallenge || {};
  const aliasTxt = c.alias ? ` "${c.alias}"` : '';
  const name = c.name || 'el campeón';
  const ownRecord = c.name === gameState.player.name && c.alias === gameState.player.alias;
  el.textContent = ownRecord
    ? '👑 Has defendido tu propio trono del día. Sigues siendo el campeón.'
    : `👑 ¡Has destronado a ${name}${aliasTxt}! La corona del desafío de hoy es tuya.`;
  el.classList.remove('hidden', 'daily-banner-fail');
  el.classList.add('daily-banner-win');
}

// Salón de la fama del desafío diario en la pantalla final (histórico de todos
// los que lo han batido). Deduplica por jugador quedándose con su mejor premio.
function renderDailyWinners(winners) {
  const el = document.getElementById('daily-winners');
  if (!el) return;
  if (!winners || !winners.length) {
    el.innerHTML = '';
    el.classList.add('hidden');
    return;
  }
  const list = dedupeDailyWinners(winners);
  el.innerHTML = `<p class="zone-label">Salón de la fama · Desafío diario (${list.length})</p>` +
    `<ol class="records-list">${dailyWinnersRowsHtml(list)}</ol>`;
  el.classList.remove('hidden');
}

function setLeaderboardStatus(text) {
  const el = document.getElementById('leaderboard-status');
  if (!el) return;
  el.textContent = text || '';
  el.classList.toggle('hidden', !text);
}

// Escapa texto de usuario (nombre/apodo) antes de meterlo en innerHTML.
function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Pinta el ranking (global de Supabase o histórico local) y marca la partida
// recién jugada. `currentId` identifica esa entrada (id de Supabase o fecha
// local); si es la primera de la lista, se anuncia récord.
function renderLeaderboardList(entries, currentId) {
  const listEl = document.getElementById('leaderboard-list');
  listEl.innerHTML = '';

  let currentRank = -1;
  entries.forEach((entry, index) => {
    const li = document.createElement('li');
    const isCurrentRun = currentId != null && entry.id === currentId;
    if (isCurrentRun) {
      li.classList.add('current-run');
      currentRank = index;
    }
    const aliasHtml = entry.alias ? ` "${escapeHtml(entry.alias)}"` : '';
    const modeTag = entry.mode
      ? `<span class="leaderboard-mode leaderboard-mode-${entry.mode.toLowerCase()}">${entry.mode === 'FREEZEOUT' ? 'Freezeout' : 'Arcade'}</span>`
      : '';
    li.innerHTML =
      `<span class="leaderboard-name">${escapeHtml(entry.name)}${aliasHtml}</span>` +
      modeTag +
      `<span class="leaderboard-amount">${formatEuros(entry.totalPrize)}</span>`;
    listEl.appendChild(li);
  });

  const isNewRecord = currentRank === 0;
  document.getElementById('final-new-record').classList.toggle('hidden', !isNewRecord);
}

// --- Sonido: arranque y botón de silencio ---

// La música del lobby arranca en el primer gesto del usuario (los navegadores
// bloquean el audio automático). Basta con tocar la pantalla.
function enableAudioOnce() {
  Sound.init();
  Sound.playMusic('lobby');
  document.removeEventListener('pointerdown', enableAudioOnce);
}
document.addEventListener('pointerdown', enableAudioOnce);

document.getElementById('start-button').addEventListener('click', () => {
  Sound.init();
  Sound.playMusic('lobby');
});

const muteButton = document.getElementById('mute-button');
function refreshMuteButton() {
  muteButton.textContent = Sound.isMuted() ? '🔇' : '🔊';
  muteButton.setAttribute('aria-label', Sound.isMuted() ? 'Activar sonido' : 'Silenciar sonido');
}
muteButton.addEventListener('click', () => {
  Sound.init();
  Sound.setMuted(!Sound.isMuted());
  refreshMuteButton();
});
refreshMuteButton();
