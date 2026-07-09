// Motor del modo Pro (Spin&Go a 3, v1.1). Lógica pura, sin DOM.
//
// Póker por calles (preflop/flop/turn/river) con rondas de apuestas reales a 3
// jugadores. Los corazones son fichas (suma cero): el ganador de la mano se
// lleva el bote. Los rivales juegan su equity real (sin skill). Ver
// docs/PRO_MODE.md para la especificación.
//
// Depende de poker.js: createDeck, shuffleDeck, bestHand, compareScores,
// describeHand, cardsEqual.

// Fracciones de corazón usadas como fichas.
const PRO = {
  startHearts: 5, // corazones del jugador
  rivalStartHearts: 8, // los rivales (campeones) arrancan más profundos: sube la
  // dificultad sin darles skill (juegan su mano real). Calibrado ~18-20% winrate.
  sb: 1 / 5, // ciega pequeña
  bb: 1 / 4, // ciega grande
  streetBet: { FLOP: 1 / 5, TURN: 1 / 4, RIVER: 1 / 4 }, // apuesta base al abrir
  blindStepHand: 5, // a partir de esta mano suben las ciegas
  blindStep: 1 / 4, // +1/4 por escalón
  blindStepEvery: 4, // un escalón nuevo cada N manos desde blindStepHand
  equityTrials: 200, // Monte Carlo multivía para la IA
  // Umbrales de decisión de la IA (equity 0..1):
  aiFold: 0.25, // por debajo: foldea a una apuesta
  aiAllIn: 0.60, // por encima: all-in
  aiCallAllIn: 0.40 // equity mínima para pagar un all-in ajeno
};

const STREETS = ['PREFLOP', 'FLOP', 'TURN', 'RIVER'];

function proRound(x) {
  // Redondeo fino para no arrastrar ruido de coma flotante.
  return Math.round(x * 10000) / 10000;
}

// --- Equity multivía -------------------------------------------------------

// Probabilidad de que `hole` gane el showdown contra `nOpp` manos aleatorias
// dado el `board` actual (se completa hasta 5 cartas). Empates cuentan como
// fracción. Monte Carlo.
function multiwayEquity(hole, board, nOpp, trials) {
  const t = trials || PRO.equityTrials;
  if (nOpp <= 0) return 1;
  const used = [...hole, ...board];
  let score = 0;
  for (let i = 0; i < t; i++) {
    const deck = shuffleDeck(getRemainingDeck(used));
    let idx = 0;
    const fullBoard = board.slice();
    while (fullBoard.length < 5) fullBoard.push(deck[idx++]);
    const opps = [];
    for (let o = 0; o < nOpp; o++) opps.push([deck[idx++], deck[idx++]]);

    const myBest = bestHand([...hole, ...fullBoard]);
    let better = 0;
    let equal = 0;
    for (const opp of opps) {
      const cmp = compareScores(bestHand([...opp, ...fullBoard]), myBest);
      if (cmp > 0) { better++; break; }
      if (cmp === 0) equal++;
    }
    if (better === 0) score += 1 / (1 + equal);
  }
  return score / t;
}

// --- Construcción y reparto ------------------------------------------------

function createProGame(seats) {
  // seats: [{ id, name, alias, isHuman }] (3). El asiento 0 es el jugador.
  return {
    seats: seats.map((s) => ({
      id: s.id, name: s.name, alias: s.alias || '', isHuman: !!s.isHuman,
      hearts: s.isHuman ? PRO.startHearts : PRO.rivalStartHearts, hole: [], inHand: false, allIn: false,
      committed: 0, streetBet: 0, out: false, lastAction: ''
    })),
    buttonIndex: 0,
    handNumber: 0,
    street: null,
    board: [],
    pot: 0,
    currentBet: 0,
    toAct: -1,
    needsToAct: [],
    status: 'READY', // READY | BETTING | HAND_OVER | GAME_OVER
    result: null, // 'WIN' | 'LOSE' (para el humano) al acabar el juego
    lastHand: null // resumen de la última mano para la UI
  };
}

function activeSeats(game) {
  return game.seats.filter((s) => !s.out);
}

function blindsForHand(n) {
  let sb = PRO.sb;
  let bb = PRO.bb;
  if (n >= PRO.blindStepHand) {
    const steps = 1 + Math.floor((n - PRO.blindStepHand) / PRO.blindStepEvery);
    sb = proRound(sb + steps * PRO.blindStep);
    bb = proRound(bb + steps * PRO.blindStep);
  }
  return { sb, bb };
}

// Índice del siguiente asiento vivo (no `out`) a partir de `from` (exclusivo).
function nextAlive(game, from) {
  const n = game.seats.length;
  for (let k = 1; k <= n; k++) {
    const i = (from + k) % n;
    if (!game.seats[i].out) return i;
  }
  return from;
}

// Pone una ficha forzada (ciega) respetando el stack del asiento.
function postBlind(game, seatIndex, amount) {
  const seat = game.seats[seatIndex];
  const pay = Math.min(amount, seat.hearts);
  seat.hearts = proRound(seat.hearts - pay);
  seat.streetBet = proRound(seat.streetBet + pay);
  seat.committed = proRound(seat.committed + pay);
  game.pot = proRound(game.pot + pay);
  if (seat.hearts <= 1e-9) seat.allIn = true;
  game.currentBet = Math.max(game.currentBet, seat.streetBet);
}

// Arranca una mano nueva: rota el botón, reparte, postea ciegas y abre el
// preflop. Requiere >= 2 asientos vivos.
function startProHand(game) {
  const alive = activeSeats(game);
  if (alive.length < 2) { game.status = 'GAME_OVER'; return game; }

  game.handNumber += 1;
  game.buttonIndex = nextAlive(game, game.buttonIndex);
  const blinds = blindsForHand(game.handNumber);

  const deck = shuffleDeck(createDeck());
  let d = 0;
  game.seats.forEach((s) => {
    s.hole = []; s.inHand = !s.out; s.allIn = false;
    s.committed = 0; s.streetBet = 0; s.lastAction = '';
  });
  activeSeats(game).forEach((s) => { s.hole = [deck[d++], deck[d++]]; });

  game.deckRest = deck.slice(d); // resto para el board
  game.board = [];
  game.pot = 0;
  game.currentBet = 0;
  game.street = 'PREFLOP';
  game.blinds = blinds;
  game.lastHand = null;

  // Ciegas: heads-up (2 vivos) → botón es SB; si 3 → SB y BB tras el botón.
  const sbIndex = alive.length === 2 ? game.buttonIndex : nextAlive(game, game.buttonIndex);
  const bbIndex = nextAlive(game, sbIndex);
  postBlind(game, sbIndex, blinds.sb);
  postBlind(game, bbIndex, blinds.bb);
  game.sbIndex = sbIndex;
  game.bbIndex = bbIndex;

  // Primer en actuar preflop: el siguiente al BB (o el SB en heads-up).
  const first = alive.length === 2 ? sbIndex : nextAlive(game, bbIndex);
  beginBettingRound(game, first, bbIndex);
  return game;
}

// Prepara una ronda de apuestas: quién actúa y quién falta por hablar.
function beginBettingRound(game, firstToAct, aggressorIndex) {
  game.status = 'BETTING';
  game.needsToAct = game.seats
    .map((s, i) => i)
    .filter((i) => !game.seats[i].out && game.seats[i].inHand && !game.seats[i].allIn);
  game.toAct = seatCanAct(game, firstToAct) ? firstToAct : nextActor(game, firstToAct);
  if (game.toAct === -1) endBettingRound(game);
}

function seatCanAct(game, i) {
  const s = game.seats[i];
  return s && !s.out && s.inHand && !s.allIn && game.needsToAct.includes(i);
}

function nextActor(game, from) {
  const n = game.seats.length;
  for (let k = 1; k <= n; k++) {
    const i = (from + k) % n;
    if (seatCanAct(game, i)) return i;
  }
  return -1;
}

function seatsInHand(game) {
  return game.seats.filter((s) => s.inHand && !s.out);
}

// --- Acciones ---------------------------------------------------------------

// Acciones legales del asiento que tiene el turno.
function legalProActions(game) {
  if (game.status !== 'BETTING' || game.toAct < 0) return [];
  const seat = game.seats[game.toAct];
  const toCall = proRound(game.currentBet - seat.streetBet);
  const actions = [];
  if (toCall <= 1e-9) {
    actions.push({ type: 'CHECK' });
  } else {
    actions.push({ type: 'FOLD' });
    if (seat.hearts > 1e-9) actions.push({ type: 'CALL', amount: Math.min(toCall, seat.hearts) });
  }
  // Subir (DOBLAR): llevar la apuesta al doble de la vigente (o abrir con la
  // apuesta base de la calle), si el stack lo permite por encima de igualar.
  const raiseTo = game.currentBet > 1e-9
    ? proRound(game.currentBet * 2)
    : (game.street === 'PREFLOP' ? game.blinds.bb : PRO.streetBet[game.street]);
  const raiseCost = proRound(raiseTo - seat.streetBet);
  if (raiseCost > toCall + 1e-9 && seat.hearts > raiseCost + 1e-9) {
    actions.push({ type: 'RAISE', to: raiseTo, amount: raiseCost });
  }
  if (seat.hearts > 1e-9) actions.push({ type: 'ALLIN', amount: seat.hearts });
  return actions;
}

function putIn(game, seat, amount) {
  const pay = Math.min(amount, seat.hearts);
  seat.hearts = proRound(seat.hearts - pay);
  seat.streetBet = proRound(seat.streetBet + pay);
  seat.committed = proRound(seat.committed + pay);
  game.pot = proRound(game.pot + pay);
  if (seat.hearts <= 1e-9) seat.allIn = true;
  return pay;
}

// Aplica la acción del asiento en turno y avanza el estado.
function applyProAction(game, action) {
  if (game.status !== 'BETTING') return game;
  const i = game.toAct;
  const seat = game.seats[i];
  const toCall = proRound(game.currentBet - seat.streetBet);

  removeFromQueue(game, i);

  if (action.type === 'FOLD') {
    seat.inHand = false; seat.lastAction = 'FOLD';
  } else if (action.type === 'CHECK') {
    seat.lastAction = 'CHECK';
  } else if (action.type === 'CALL') {
    putIn(game, seat, toCall); seat.lastAction = 'PAGA';
  } else if (action.type === 'RAISE') {
    putIn(game, seat, action.to - seat.streetBet);
    game.currentBet = Math.max(game.currentBet, seat.streetBet);
    seat.lastAction = 'SUBE';
    resetQueueAfterRaise(game, i);
  } else if (action.type === 'ALLIN') {
    putIn(game, seat, seat.hearts);
    if (seat.streetBet > game.currentBet) {
      game.currentBet = seat.streetBet;
      resetQueueAfterRaise(game, i);
    }
    seat.lastAction = 'ALL-IN';
  }

  // ¿Solo queda uno en la mano? Gana sin showdown.
  if (seatsInHand(game).length === 1) { awardUncontested(game); return game; }

  game.toAct = nextActor(game, i);
  if (game.toAct === -1) endBettingRound(game);
  return game;
}

function removeFromQueue(game, i) {
  game.needsToAct = game.needsToAct.filter((x) => x !== i);
}

// Tras una subida, todos los demás activos (no all-in) vuelven a deber acción.
function resetQueueAfterRaise(game, raiserIndex) {
  game.needsToAct = game.seats
    .map((s, idx) => idx)
    .filter((idx) => idx !== raiserIndex && !game.seats[idx].out && game.seats[idx].inHand && !game.seats[idx].allIn);
}

// --- Fin de calle / mano ----------------------------------------------------

function endBettingRound(game) {
  // Si quedan >=2 en mano pero <=1 puede actuar (resto all-in), se corre el
  // board hasta el river y se resuelve.
  const contenders = seatsInHand(game);
  const canStillAct = contenders.filter((s) => !s.allIn);
  if (game.street === 'RIVER' || canStillAct.length <= 1) {
    dealToRiver(game);
    showdown(game);
    return;
  }
  advanceStreet(game);
}

function advanceStreet(game) {
  const nextIdx = STREETS.indexOf(game.street) + 1;
  game.street = STREETS[nextIdx];
  if (game.street === 'FLOP') dealBoard(game, 3);
  else dealBoard(game, 1);
  game.currentBet = 0;
  game.seats.forEach((s) => { s.streetBet = 0; if (s.inHand && !s.allIn) s.lastAction = ''; });
  // Primero en hablar postflop: el primer vivo tras el botón.
  const first = nextAlive(game, game.buttonIndex);
  beginBettingRound(game, first, -1);
}

function dealBoard(game, n) {
  for (let k = 0; k < n; k++) game.board.push(game.deckRest.shift());
}

function dealToRiver(game) {
  while (game.board.length < 5) game.board.push(game.deckRest.shift());
  game.street = 'RIVER';
}

// Reparte el bote en showdown entre las mejores manos (suma cero: cada
// perdedor "paga" con lo que puso; el ganador recibe el bote). Con stacks
// distintos se simplifica al stack menor (el sobrante no cubierto se devuelve).
function showdown(game) {
  const contenders = seatsInHand(game);

  // Devolución del exceso no igualado (simplificación de side pots al menor):
  // el mayor commit por encima del segundo mayor se devuelve a su dueño.
  refundUncalled(game, contenders);

  let best = null;
  const scored = contenders.map((s) => {
    const sc = bestHand([...s.hole, ...game.board]);
    if (best === null || compareScores(sc, best) > 0) best = sc;
    return { seat: s, score: sc };
  });
  const winners = scored.filter((x) => compareScores(x.score, best) === 0).map((x) => x.seat);
  const share = proRound(game.pot / winners.length);
  winners.forEach((w) => { w.hearts = proRound(w.hearts + share); });

  finishHand(game, winners, scored);
}

function refundUncalled(game, contenders) {
  if (contenders.length < 2) return;
  const commits = game.seats.map((s) => s.committed);
  const sorted = [...commits].sort((a, b) => b - a);
  const top = sorted[0];
  const second = sorted[1];
  if (top > second + 1e-9) {
    const owner = game.seats.find((s) => Math.abs(s.committed - top) < 1e-9);
    const back = proRound(top - second);
    owner.hearts = proRound(owner.hearts + back);
    game.pot = proRound(game.pot - back);
    owner.committed = second;
  }
}

// Un solo contendiente: se lleva el bote sin enseñar cartas.
function awardUncontested(game) {
  const winner = seatsInHand(game)[0];
  refundUncalled(game, [winner]);
  winner.hearts = proRound(winner.hearts + game.pot);
  finishHand(game, [winner], null);
}

function finishHand(game, winners, scored) {
  game.pot = 0;
  game.status = 'HAND_OVER';
  // Elimina a quien se quede sin corazones.
  game.seats.forEach((s) => { if (!s.out && s.hearts <= 1e-9) { s.out = true; s.hearts = 0; } });

  game.lastHand = {
    winners: winners.map((w) => w.id),
    board: game.board.slice(),
    showdown: scored ? scored.map((x) => ({ id: x.seat.id, hole: x.seat.hole, hand: describeHand(x.score) })) : null
  };

  const human = game.seats[0];
  const aliveNow = activeSeats(game);
  if (human.out) { game.status = 'GAME_OVER'; game.result = 'LOSE'; }
  else if (aliveNow.length === 1) { game.status = 'GAME_OVER'; game.result = 'WIN'; }
}

// --- IA de los rivales ------------------------------------------------------

// Decide la acción de un asiento rival según su equity. `legal` = acciones
// legales calculadas por legalProActions (el rival está en turno).
function proRivalAction(game, legal) {
  const seat = game.seats[game.toAct];
  const toCall = proRound(game.currentBet - seat.streetBet);
  const facingBet = toCall > 1e-9;
  const have = (type) => legal.find((a) => a.type === type);

  // Preflop: siempre va al flop (paga ciegas/apuestas normales). Ante un
  // all-in preflop aplica el umbral de pagar all-in.
  if (game.street === 'PREFLOP') {
    if (facingBet && isAllInBet(game)) return decideVsAllIn(game, legal);
    return have('CALL') || have('CHECK');
  }

  const nOpp = seatsInHand(game).filter((s) => s !== seat).length;
  const eq = multiwayEquity(seat.hole, game.board, nOpp);

  if (facingBet && isAllInBet(game)) return decideVsAllIn(game, legal, eq);

  if (eq >= PRO.aiAllIn) return have('ALLIN') || have('RAISE') || have('CALL') || have('CHECK');
  if (eq < PRO.aiFold) return facingBet ? { type: 'FOLD' } : (have('CHECK') || { type: 'FOLD' });
  // 25%–60%: acompaña (paga/pasa), sin subir.
  return have('CALL') || have('CHECK') || { type: 'FOLD' };
}

// ¿La apuesta vigente proviene de un all-in de otro asiento?
function isAllInBet(game) {
  return game.seats.some((s) => s.allIn && s.inHand && Math.abs(s.streetBet - game.currentBet) < 1e-9 && game.currentBet > 1e-9);
}

function decideVsAllIn(game, legal, precomputedEq) {
  const seat = game.seats[game.toAct];
  const nOpp = seatsInHand(game).filter((s) => s !== seat).length;
  const eq = precomputedEq != null ? precomputedEq : multiwayEquity(seat.hole, game.board, nOpp);
  if (eq >= PRO.aiCallAllIn) {
    const call = legal.find((a) => a.type === 'CALL');
    const allin = legal.find((a) => a.type === 'ALLIN');
    return call || allin || { type: 'CHECK' };
  }
  return legal.find((a) => a.type === 'FOLD') || { type: 'CHECK' };
}

// Exporta para Node (simulación/tests). En navegador es no-op.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PRO, createProGame, startProHand, legalProActions, applyProAction,
    proRivalAction, multiwayEquity, activeSeats, seatsInHand
  };
}
