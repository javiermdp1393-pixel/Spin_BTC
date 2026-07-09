// Controlador de la UI del Modo Pro (mesa Spin&Go a 3). Usa el motor de pro.js
// y pinta la pantalla #pro-screen: asientos, bote, comunitarias, acciones del
// jugador y pacing de la IA. Depende de globals de main.js/leaderboard.js
// (createCardElement, escapeHtml, showScreen, gameState, Sound, fetch*...).

let proGame = null;
let proPlayer = { name: '', alias: '' };
const PRO_AI_DELAY = 800; // ms entre acciones de la IA (legibilidad)

// Formatea corazones/fichas (2 decimales, sin ceros sobrantes): 5, 4.75, 0.2.
function proNum(v) {
  return (Math.round(v * 100) / 100).toString();
}

// Arranca una partida de Modo Pro. Rivales: El Pirulas + campeón del día.
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

  document.getElementById('pro-result').classList.add('hidden');
  document.getElementById('pro-next-hand').classList.add('hidden');
  document.getElementById('pro-actions').classList.remove('hidden');
  gameState.status = 'PRO';
  showScreen('PRO');
  Sound.playMusic('mesas');

  startProHand(proGame);
  driveProUntilHuman();
}

// --- Pintado ----------------------------------------------------------------

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
  if (!s.inHand) return 'FOLD';
  if (proGame.status === 'BETTING' && proGame.toAct === i) return 'PIENSA…';
  return s.lastAction || '';
}

function renderProRivalSeat(i) {
  const el = document.getElementById('pro-seat-' + i);
  if (!el) return;
  const s = proGame.seats[i];
  el.classList.toggle('folded', !s.inHand && !s.out);
  el.classList.toggle('out', s.out);
  el.classList.toggle('allin', s.allIn && !s.out);
  el.classList.toggle('active', proGame.status === 'BETTING' && proGame.toAct === i);
  const badge = proSeatBadge(i);
  const bet = s.streetBet > 1e-9 ? `<div class="pro-seat-bet">apuesta ${proNum(s.streetBet)}</div>` : '';
  el.innerHTML =
    `<div class="pro-seat-top"><span class="pro-seat-name">${escapeHtml(s.name)}</span>` +
    (badge ? `<span class="pro-seat-badge">${badge}</span>` : '') + '</div>' +
    `<div class="pro-seat-hearts">❤ ${proNum(s.hearts)}</div>` +
    `<div class="pro-seat-state">${proSeatState(i, s)}</div>` +
    bet;
}

function renderProBoard() {
  const el = document.getElementById('pro-board');
  el.innerHTML = '';
  proGame.board.forEach((c) => el.appendChild(createCardElement(c)));
}

const PRO_STREET_LABEL = { PREFLOP: 'PREFLOP', FLOP: 'FLOP', TURN: 'TURN', RIVER: 'RIVER' };

function renderProTable() {
  const g = proGame;
  renderProRivalSeat(1);
  renderProRivalSeat(2);

  document.getElementById('pro-street').textContent =
    `${PRO_STREET_LABEL[g.street] || ''} · Mano ${g.handNumber} · Ciegas ${proNum(g.blinds.sb)}/${proNum(g.blinds.bb)}`;
  document.getElementById('pro-pot').innerHTML = `BOTE&nbsp;&nbsp;❤ ${proNum(g.pot)}`;
  renderProBoard();

  const you = g.seats[0];
  document.getElementById('pro-you-name').textContent = `${you.name}${you.alias ? ` "${you.alias}"` : ''}`;
  document.getElementById('pro-you-badge').textContent = proSeatBadge(0);
  document.getElementById('pro-you-hearts').innerHTML = `❤ ${proNum(you.hearts)}`;
  const yb = document.getElementById('pro-you-bet');
  yb.textContent = you.streetBet > 1e-9 ? `apuesta ${proNum(you.streetBet)}` : '';

  const cards = document.getElementById('pro-your-cards');
  cards.innerHTML = '';
  you.hole.forEach((c) => cards.appendChild(createCardElement(c)));
}

// --- Bucle de juego (pacing IA) --------------------------------------------

function driveProUntilHuman() {
  if (!proGame) return;
  renderProTable();
  const g = proGame;
  if (g.status === 'HAND_OVER') return showProHandOver();
  if (g.status === 'GAME_OVER') return showProGameOver();
  // BETTING
  if (g.toAct === 0) return showProHumanTurn();
  // turno de un rival: se muestra con delay para poder seguirlo
  setProActionsEnabled(false);
  document.getElementById('pro-msg').textContent = `${g.seats[g.toAct].name} piensa…`;
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
  const eq = multiwayEquity(you.hole, g.board, nOpp, 200);
  document.getElementById('pro-odds').textContent = `Tu probabilidad de ganar: ${Math.round(eq * 100)}%`;
  document.getElementById('pro-msg').textContent = 'Te toca';

  const labels = {
    CHECK: 'CHECK',
    CALL: (a) => `PAGAR ${proNum(a.amount)}`,
    RAISE: (a) => `DOBLAR a ${proNum(a.to)}`,
    FOLD: 'FOLD',
    ALLIN: (a) => `ALL-IN ${proNum(a.amount)}`
  };
  document.querySelectorAll('#pro-actions button[data-pro]').forEach((btn) => {
    const type = btn.dataset.pro;
    const a = legal.find((x) => x.type === type);
    if (!a) { btn.classList.add('hidden'); btn.disabled = true; return; }
    btn.classList.remove('hidden');
    btn.disabled = false;
    const lab = labels[type];
    btn.textContent = typeof lab === 'function' ? lab(a) : lab;
  });
}

function setProActionsEnabled(on) {
  document.querySelectorAll('#pro-actions button[data-pro]').forEach((b) => { b.disabled = !on; });
  if (!on) document.getElementById('pro-odds').textContent = '';
}

function showProHandOver() {
  const g = proGame;
  setProActionsEnabled(false);
  document.getElementById('pro-actions').classList.add('hidden');
  const lh = g.lastHand;

  // Enseña las cartas de los rivales que llegaron al showdown.
  if (lh && lh.showdown) {
    lh.showdown.forEach((sd) => {
      const idx = g.seats.findIndex((s) => s.id === sd.id);
      if (idx === 1 || idx === 2) {
        const el = document.getElementById('pro-seat-' + idx);
        const row = document.createElement('div');
        row.className = 'pro-seat-cards card-row';
        sd.hole.forEach((c) => row.appendChild(createCardElement(c)));
        el.appendChild(row);
      }
    });
  }

  const winnerNames = lh.winners.map((id) => g.seats.find((s) => s.id === id).name).join(' y ');
  let msg = `${winnerNames} se lleva el bote`;
  if (lh && lh.showdown) {
    const w = lh.showdown.find((sd) => lh.winners.includes(sd.id));
    if (w) msg = `${winnerNames} gana con ${w.hand}`;
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
    msgEl.textContent = 'Te has quedado sin corazones. La próxima vez será.';
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
  Sound.playDeal();
  applyProAction(proGame, action);
  driveProUntilHuman();
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
