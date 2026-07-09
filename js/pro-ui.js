// Controlador de la UI del Modo Pro (mesa Spin&Go a 3). Usa el motor de pro.js
// y pinta la pantalla #pro-screen como una mesa de póker: asientos alrededor
// del tapete, bote y comunitarias en el centro, y tus cartas + acciones abajo.
// Depende de globals de main.js/poker.js/leaderboard.js.

let proGame = null;
let proPlayer = { name: '', alias: '' };
const PRO_AI_DELAY = 1000; // ms entre acciones de la IA (legibilidad)
const FICHAS_PER_HEART = 20; // los corazones se muestran como fichas enteras

let proRenderedBoard = 0;
let proYourCardsHand = -1;
let proLastPot = 0;

// Corazones -> fichas (número entero, más legible que 0.25 / 0.75).
function fichas(h) { return Math.round(h * FICHAS_PER_HEART); }

// --- Combinación actual (para el desplegable de odds) ----------------------

function proKCombos(n, k) {
  const res = [];
  const rec = (start, combo) => {
    if (combo.length === k) { res.push(combo.slice()); return; }
    for (let i = start; i < n; i++) { combo.push(i); rec(i + 1, combo); combo.pop(); }
  };
  rec(0, []);
  return res;
}

function proBestHandName(cards) {
  if (!cards || cards.length < 5) return '';
  let best = null;
  for (const combo of proKCombos(cards.length, 5)) {
    const sc = score5(combo.map((i) => cards[i]));
    if (!best || compareScores(sc, best) > 0) best = sc;
  }
  return describeHand(best);
}

// --- Arranque ---------------------------------------------------------------

async function startProMode(name, alias) {
  proPlayer = { name, alias };
  const challenge = (await fetchDailyChallenge()) || DEFAULT_DAILY_CHALLENGE;
  let champName = challenge.name || 'Campeón';
  let champAlias = challenge.alias || '';
  if (champName === 'El Pirulas') { champName = 'Campeón del día'; champAlias = champAlias || 'Cowden'; }

  proGame = createProGame([
    { id: 'you', name: name, alias: alias, isHuman: true },
    { id: 'pir', name: 'El Pirulas', alias: 'Final Hand' },
    { id: 'champ', name: champName, alias: champAlias }
  ]);

  proSetupSeats(champName);
  proRenderedBoard = 0; proYourCardsHand = -1; proLastPot = 0;
  document.getElementById('pro-result').classList.add('hidden');
  document.getElementById('pro-next-hand').classList.add('hidden');
  document.getElementById('pro-actions').classList.remove('hidden');
  document.getElementById('pro-odds-detail').classList.add('hidden');
  gameState.status = 'PRO';
  showScreen('PRO');
  Sound.playMusic('mesas');

  startProHand(proGame);
  driveProUntilHuman();
}

// Avatares de la mesa. Usa la misma técnica que los retratos del resto del
// juego (copia difuminada de fondo + foto completa en "contain" encima) para
// que la cara nunca quede recortada, aunque la foto sea de cuerpo entero.
function setProAvatarImage(el, imageUrl, name) {
  el.textContent = '';
  const blur = document.createElement('div');
  blur.className = 'pro-avatar-blur';
  blur.style.backgroundImage = `url('${imageUrl}')`;
  const img = document.createElement('img');
  img.className = 'pro-avatar-img';
  img.src = imageUrl;
  img.alt = name;
  img.onerror = () => { el.innerHTML = ''; el.textContent = (name || '?').charAt(0).toUpperCase(); };
  el.innerHTML = '';
  el.appendChild(blur);
  el.appendChild(img);
}

function proSetupSeats() {
  const avatars = {
    0: null,
    1: 'assets/rivals/el-pirulas.jpg',
    2: 'assets/rivals/daily-champion.png?v=2'
  };
  [0, 1, 2].forEach((i) => {
    const av = document.getElementById('pro-avatar-' + i);
    if (!av) return;
    if (avatars[i]) setProAvatarImage(av, avatars[i], proGame.seats[i].name);
    else { av.innerHTML = ''; av.textContent = (proGame.seats[i].name || '?').charAt(0).toUpperCase(); }
  });
}

// --- Pintado de la mesa -----------------------------------------------------

function proSeatBadge(i) {
  const g = proGame;
  const parts = [];
  if (i === g.buttonIndex) parts.push('D');
  if (i === g.sbIndex) parts.push('SB');
  if (i === g.bbIndex) parts.push('BB');
  return parts.join('·');
}

function proSeatState(i, s) {
  if (s.out) return 'FUERA';
  if (!s.inHand) return 'SE RETIRA';
  if (proGame.status === 'BETTING' && proGame.toAct === i) return 'pensando…';
  return { PAGA: 'PAGA', SUBE: 'SUBE', FOLD: 'SE RETIRA', 'ALL-IN': 'ALL-IN', CHECK: 'PASA' }[s.lastAction] || '';
}

function renderProSeat(i) {
  const g = proGame;
  const s = g.seats[i];
  const seatEl = document.getElementById('pro-seat-' + i);
  if (!seatEl) return;

  seatEl.classList.toggle('folded', !s.inHand && !s.out);
  seatEl.classList.toggle('out', s.out);
  seatEl.classList.toggle('allin', s.allIn && !s.out);
  seatEl.classList.toggle('active', g.status === 'BETTING' && g.toAct === i);
  const isDealer = i === g.buttonIndex && !s.out;
  seatEl.classList.toggle('has-dealer', isDealer);

  const nameEl = document.getElementById('pro-name-' + i);
  if (nameEl) nameEl.textContent = s.name;
  const badgeEl = document.getElementById('pro-badge-' + i);
  if (badgeEl) { const b = proSeatBadge(i); badgeEl.textContent = b; badgeEl.classList.toggle('hidden', !b); }
  const stackEl = document.getElementById('pro-stack-' + i);
  if (stackEl) stackEl.innerHTML = `<span class="pro-chip-ico"></span>${fichas(s.hearts)}`;
  const stateEl = document.getElementById('pro-state-' + i);
  if (stateEl) stateEl.textContent = proSeatState(i, s);

  const betEl = document.getElementById('pro-bet-' + i);
  if (betEl) {
    if (s.streetBet > 1e-9) {
      betEl.innerHTML = `<span class="pro-chip-ico"></span>${fichas(s.streetBet)}`;
      betEl.classList.remove('hidden');
    } else {
      betEl.classList.add('hidden');
    }
  }
}

function renderProBoard() {
  const el = document.getElementById('pro-board');
  const b = proGame.board;
  if (b.length < proRenderedBoard) { el.innerHTML = ''; proRenderedBoard = 0; }
  for (let i = proRenderedBoard; i < b.length; i++) el.appendChild(createCardElement(b[i]));
  proRenderedBoard = b.length;
}

const PRO_STREET_LABEL = { PREFLOP: 'PREFLOP', FLOP: 'FLOP', TURN: 'TURN', RIVER: 'RIVER' };

function renderProTable() {
  const g = proGame;
  [0, 1, 2].forEach(renderProSeat);

  document.getElementById('pro-street').textContent =
    `${PRO_STREET_LABEL[g.street] || ''} · Mano ${g.handNumber} · Ciegas ${fichas(g.blinds.sb)}/${fichas(g.blinds.bb)}`;

  const potEl = document.getElementById('pro-pot');
  potEl.innerHTML = `BOTE <span class="pro-chip-ico"></span>${fichas(g.pot)}`;
  if (g.pot > proLastPot + 1e-9) { potEl.classList.remove('pro-pot-bump'); void potEl.offsetWidth; potEl.classList.add('pro-pot-bump'); }
  proLastPot = g.pot;

  renderProBoard();

  // tus cartas (solo se re-reparten al cambiar de mano, para animar una vez)
  if (proYourCardsHand !== g.handNumber) {
    const cards = document.getElementById('pro-your-cards');
    cards.innerHTML = '';
    g.seats[0].hole.forEach((c) => cards.appendChild(createCardElement(c)));
    proYourCardsHand = g.handNumber;
    // limpia cartas reveladas de rivales de la mano anterior
    document.getElementById('pro-cards-1').innerHTML = '';
    document.getElementById('pro-cards-2').innerHTML = '';
  }
}

// --- Bucle de juego (pacing de la IA) --------------------------------------

function driveProUntilHuman() {
  if (!proGame) return;
  renderProTable();
  const g = proGame;
  if (g.status === 'HAND_OVER') return showProHandOver();
  if (g.status === 'GAME_OVER') return showProGameOver();
  if (g.toAct === 0) return showProHumanTurn();

  setProActionsEnabled(false);
  document.getElementById('pro-odds').classList.add('hidden');
  document.getElementById('pro-odds-detail').classList.add('hidden');
  document.getElementById('pro-msg').textContent = `Turno de ${g.seats[g.toAct].name}…`;
  setTimeout(() => {
    if (!proGame || proGame !== g) return;
    const legal = legalProActions(g);
    applyProAction(g, proRivalAction(g, legal));
    driveProUntilHuman();
  }, PRO_AI_DELAY);
}

function showProHumanTurn() {
  const g = proGame;
  const you = g.seats[0];
  const legal = legalProActions(g);
  const nOpp = seatsInHand(g).filter((s) => s !== you).length;
  const eq = multiwayEquity(you.hole, g.board, nOpp, 220);
  const pct = Math.round(eq * 100);

  const handName = g.board.length >= 3 ? proBestHandName([...you.hole, ...g.board]) : '';
  const oddsBtn = document.getElementById('pro-odds');
  oddsBtn.classList.remove('hidden');
  oddsBtn.textContent = handName ? `${handName} · ${pct}% de ganar ▾` : `${pct}% de ganar ▾`;
  const detail = document.getElementById('pro-odds-detail');
  detail.textContent = handName
    ? `Tu mejor mano ahora: ${handName}. Probabilidad estimada de ganar la mano: ${pct}%.`
    : `Preflop (aún sin comunitarias). Probabilidad estimada con tus dos cartas: ${pct}%.`;
  detail.classList.add('hidden');

  document.getElementById('pro-msg').textContent = '👉 TU TURNO';

  const labels = {
    CHECK: () => 'PASAR',
    CALL: (a) => `PAGAR ${fichas(a.amount)}`,
    RAISE: (a) => `SUBIR a ${fichas(a.to)}`,
    FOLD: () => 'RETIRARSE',
    ALLIN: (a) => `ALL-IN ${fichas(a.amount)}`
  };
  document.querySelectorAll('#pro-actions button[data-pro]').forEach((btn) => {
    const a = legal.find((x) => x.type === btn.dataset.pro);
    if (!a) { btn.classList.add('hidden'); btn.disabled = true; return; }
    btn.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = labels[btn.dataset.pro](a);
  });
}

function setProActionsEnabled(on) {
  document.querySelectorAll('#pro-actions button[data-pro]').forEach((b) => { b.disabled = !on; });
}

function showProHandOver() {
  const g = proGame;
  setProActionsEnabled(false);
  document.getElementById('pro-actions').classList.add('hidden');
  document.getElementById('pro-odds').classList.add('hidden');
  document.getElementById('pro-odds-detail').classList.add('hidden');
  const lh = g.lastHand;

  if (lh && lh.showdown) {
    lh.showdown.forEach((sd) => {
      const idx = g.seats.findIndex((s) => s.id === sd.id);
      const row = document.getElementById('pro-cards-' + idx);
      if (row && (idx === 1 || idx === 2)) {
        row.innerHTML = '';
        sd.hole.forEach((c) => row.appendChild(createCardElement(c)));
      }
    });
  }

  const winnerNames = lh.winners.map((id) => g.seats.find((s) => s.id === id).name).join(' y ');
  let msg = `🏆 ${winnerNames} se lleva el bote`;
  if (lh && lh.showdown) {
    const w = lh.showdown.find((sd) => lh.winners.includes(sd.id));
    if (w) msg = `🏆 ${winnerNames} gana con ${w.hand}`;
  }
  document.getElementById('pro-msg').textContent = msg;
  document.getElementById('pro-next-hand').classList.remove('hidden');
}

function proHofHtml(hof) {
  if (!hof) return '';
  if (!hof.length) return '<p class="records-daily-empty">Aún nadie se ha pasado el Pro. ¡Eres el primero!</p>';
  const rows = hof.map((w) => {
    const aliasTxt = w.alias ? ` "${escapeHtml(w.alias)}"` : '';
    const handsTxt = w.hands != null ? `<span class="records-date">${w.hands} manos</span>` : '';
    return `<li><span class="records-name">${escapeHtml(w.name)}${aliasTxt} ${handsTxt}</span></li>`;
  }).join('');
  return '<p class="zone-label">Salón de la fama · Modo Pro</p>' + `<ol class="records-list">${rows}</ol>`;
}

async function showProGameOver() {
  const g = proGame;
  setProActionsEnabled(false);
  document.getElementById('pro-actions').classList.add('hidden');
  document.getElementById('pro-next-hand').classList.add('hidden');
  document.getElementById('pro-odds').classList.add('hidden');
  document.getElementById('pro-odds-detail').classList.add('hidden');

  const win = g.result === 'WIN';
  document.getElementById('pro-result-title').textContent = win ? '¡HAS GANADO EL PRO!' : 'FUERA DEL PRO';
  const msgEl = document.getElementById('pro-result-msg');
  const hofEl = document.getElementById('pro-result-hof');

  if (win) {
    try { localStorage.setItem('spinho_pro_x2', '1'); } catch (e) { /* sin almacenamiento */ }
    msgEl.textContent = `Último en pie en ${g.handNumber} manos. 🎟️ Ganas un x2 para tu próxima run de Arcade (los jackpots no se doblan).`;
    Sound.playMusic('champion');
    await submitProWin({ name: proPlayer.name, alias: proPlayer.alias, hands: g.handNumber });
    hofEl.innerHTML = proHofHtml(await fetchProHallOfFame(20));
  } else {
    msgEl.textContent = 'Te has quedado sin fichas. La próxima vez será.';
    Sound.playMusic('derrota');
    hofEl.innerHTML = '';
  }
  document.getElementById('pro-result').classList.remove('hidden');
}

// --- Eventos ----------------------------------------------------------------

document.getElementById('pro-actions').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-pro]');
  if (!btn || btn.disabled || !proGame) return;
  const legal = legalProActions(proGame);
  const action = legal.find((a) => a.type === btn.dataset.pro);
  if (!action) return;
  setProActionsEnabled(false);
  document.getElementById('pro-odds').classList.add('hidden');
  document.getElementById('pro-odds-detail').classList.add('hidden');
  Sound.playDeal();
  applyProAction(proGame, action);
  driveProUntilHuman();
});

document.getElementById('pro-odds').addEventListener('click', () => {
  document.getElementById('pro-odds-detail').classList.toggle('hidden');
});

document.getElementById('pro-next-hand').addEventListener('click', () => {
  if (!proGame) return;
  document.getElementById('pro-next-hand').classList.add('hidden');
  document.getElementById('pro-actions').classList.remove('hidden');
  startProHand(proGame);
  driveProUntilHuman();
});

document.getElementById('pro-result-back').addEventListener('click', () => {
  document.getElementById('pro-result').classList.add('hidden');
  proGame = null;
  gameState.status = 'REGISTER';
  showRegisterView('inscribirse');
  renderRecordsWidget(document.getElementById('records-register'), 'ARCADE');
  showScreen('REGISTER');
});
