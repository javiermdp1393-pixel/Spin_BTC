// Motor de póker: baraja, reparto, evaluación completa de manos de 5 cartas
// con desempates, y resolución de showdown real jugador vs rival.
//
// A diferencia de la primera iteración (que asignaba un winChance fijo por
// categoría de mano), aquí la probabilidad se estima por Monte Carlo contra
// manos de rival reales, y el resultado de cada mano se decide comparando la
// mejor combinación de 5 cartas de cada uno. Así el % varía de forma
// coherente y "gana la mejor mano", como en una partida estándar.

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Nº de simulaciones para estimar la equity mostrada al jugador.
// Suficiente para un % estable sin penalizar el rendimiento.
const EQUITY_TRIALS = 240;

// Todas las combinaciones de 5 índices dentro de 7 cartas (C(7,5) = 21).
const COMBOS_5_OF_7 = (function () {
  const combos = [];
  for (let a = 0; a < 7; a++)
    for (let b = a + 1; b < 7; b++)
      for (let c = b + 1; c < 7; c++)
        for (let d = c + 1; d < 7; d++)
          for (let e = d + 1; e < 7; e++) combos.push([a, b, c, d, e]);
  return combos;
})();

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Reparte la mano visible del jugador: 2 cartas propias + 5 comunitarias.
// La mano del rival se genera en el momento de resolver (nunca se muestra
// antes de decidir).
function dealHand() {
  const deck = shuffleDeck(createDeck());
  return {
    playerCards: [deck[0], deck[1]],
    communityCards: [deck[2], deck[3], deck[4], deck[5], deck[6]]
  };
}

function rankToValue(rank) {
  return RANKS.indexOf(rank) + 2; // '2' -> 2 ... 'A' -> 14
}

function cardsEqual(a, b) {
  return a.rank === b.rank && a.suit === b.suit;
}

function getRemainingDeck(usedCards) {
  return createDeck().filter((card) => !usedCards.some((used) => cardsEqual(used, card)));
}

// Puntúa una mano concreta de 5 cartas y devuelve un array comparable:
// [categoría, desempate1, desempate2, ...]. Arrays mayores ganan al
// compararse lexicográficamente (ver compareScores).
function score5(cards) {
  const values = cards.map((c) => rankToValue(c.rank)).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);
  const isFlush = suits.every((s) => s === suits[0]);

  const unique = [...new Set(values)];
  let isStraight = false;
  let straightHigh = 0;
  if (unique.length === 5) {
    if (unique[0] - unique[4] === 4) {
      isStraight = true;
      straightHigh = unique[0];
    } else if (unique[0] === 14 && unique[1] === 5 && unique[4] === 2) {
      // Rueda A-2-3-4-5: el As cuenta como 1 y la escalera es al 5.
      isStraight = true;
      straightHigh = 5;
    }
  }

  const countByValue = {};
  values.forEach((v) => {
    countByValue[v] = (countByValue[v] || 0) + 1;
  });
  // Grupos ordenados por frecuencia y, a igualdad, por valor: así el primer
  // grupo es el trío/pareja principal y el resto quedan como kickers.
  const groups = Object.keys(countByValue)
    .map((v) => ({ value: Number(v), count: countByValue[v] }))
    .sort((a, b) => b.count - a.count || b.value - a.value);
  const counts = groups.map((g) => g.count);
  const groupValues = groups.map((g) => g.value);

  if (isStraight && isFlush) return [8, straightHigh];
  if (counts[0] === 4) return [7, groupValues[0], groupValues[1]];
  if (counts[0] === 3 && counts[1] === 2) return [6, groupValues[0], groupValues[1]];
  if (isFlush) return [5, ...values];
  if (isStraight) return [4, straightHigh];
  if (counts[0] === 3) return [3, ...groupValues];
  if (counts[0] === 2 && counts[1] === 2) return [2, groupValues[0], groupValues[1], groupValues[2]];
  if (counts[0] === 2) return [1, ...groupValues];
  return [0, ...values];
}

function compareScores(a, b) {
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

// Mejor mano de 5 posible dentro de un conjunto de 7 cartas.
function bestHand(sevenCards) {
  let best = null;
  for (const combo of COMBOS_5_OF_7) {
    const score = score5(combo.map((i) => sevenCards[i]));
    if (best === null || compareScores(score, best) > 0) best = score;
  }
  return best;
}

function pickTwoDistinct(deck) {
  const i = Math.floor(Math.random() * deck.length);
  let j;
  do {
    j = Math.floor(Math.random() * deck.length);
  } while (j === i);
  return [deck[i], deck[j]];
}

// Genera la mano del rival aplicando su handicap: con probabilidad "skill"
// el rival recibe dos manos candidatas y se queda con la mejor (juega mejor
// que el azar). Con skill 0 es un reparto totalmente justo.
function drawRivalHand(deck, communityCards, skill) {
  const first = pickTwoDistinct(deck);
  if (Math.random() >= skill) return first;

  const second = pickTwoDistinct(deck);
  const firstBest = bestHand([...first, ...communityCards]);
  const secondBest = bestHand([...second, ...communityCards]);
  return compareScores(firstBest, secondBest) >= 0 ? first : second;
}

// Estima por Monte Carlo la probabilidad de que la mano del jugador gane el
// showdown contra el rival (teniendo en cuenta su handicap). Ties cuentan
// como media victoria.
function estimateWinChance(playerCards, communityCards, skill, trials = EQUITY_TRIALS) {
  const deck = getRemainingDeck([...playerCards, ...communityCards]);
  const playerBest = bestHand([...playerCards, ...communityCards]);
  let score = 0;
  for (let t = 0; t < trials; t++) {
    const rivalCards = drawRivalHand(deck, communityCards, skill);
    const rivalBest = bestHand([...rivalCards, ...communityCards]);
    const cmp = compareScores(playerBest, rivalBest);
    if (cmp > 0) score += 1;
    else if (cmp === 0) score += 0.5;
  }
  return score / trials;
}

// Resuelve una mano real: reparte la mano del rival y compara combinaciones.
// cmp > 0 gana el jugador, cmp < 0 gana el rival, cmp === 0 empate.
function resolveShowdown(playerCards, communityCards, skill) {
  const deck = getRemainingDeck([...playerCards, ...communityCards]);
  const rivalCards = drawRivalHand(deck, communityCards, skill);
  const playerBest = bestHand([...playerCards, ...communityCards]);
  const rivalBest = bestHand([...rivalCards, ...communityCards]);
  return {
    rivalCards,
    playerHandName: describeHand(playerBest),
    rivalHandName: describeHand(rivalBest),
    cmp: compareScores(playerBest, rivalBest)
  };
}

function valueToRankName(value) {
  return RANKS[value - 2];
}

// Descripción legible de una mano puntuada, incluyendo el rango relevante
// para distinguir, por ejemplo, "Pareja de Q" de "Pareja de 5".
function describeHand(score) {
  const category = score[0];
  switch (category) {
    case 8: return 'Escalera de color';
    case 7: return `Póker de ${valueToRankName(score[1])}`;
    case 6: return `Full de ${valueToRankName(score[1])}`;
    case 5: return 'Color';
    case 4: return `Escalera al ${valueToRankName(score[1])}`;
    case 3: return `Trío de ${valueToRankName(score[1])}`;
    case 2: return `Doble pareja de ${valueToRankName(score[1])} y ${valueToRankName(score[2])}`;
    case 1: return `Pareja de ${valueToRankName(score[1])}`;
    default: return `Carta alta ${valueToRankName(score[1])}`;
  }
}

function describePlayerHand(playerCards, communityCards) {
  return describeHand(bestHand([...playerCards, ...communityCards]));
}
