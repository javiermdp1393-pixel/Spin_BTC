// Motor de cartas mínimo: baraja, reparto y evaluación aproximada de la
// fuerza de mano (jugador). No es un motor completo de Texas Hold'em:
// solo detecta la categoría de mano (pareja, color, escalera...) para
// alimentar el cálculo de odds simplificadas en odds.js.

const SUITS = ['♠', '♥', '♦', '♣'];
const RED_SUITS = ['♥', '♦'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const HAND_CATEGORY_NAMES = [
  'High Card',
  'Pair',
  'Two Pair',
  'Three of a Kind',
  'Straight',
  'Flush',
  'Full House',
  'Four of a Kind',
  'Straight Flush'
];

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

// Reparte una mano nueva: 2 cartas de jugador + 5 comunitarias.
// Las cartas del rival quedan implícitas (nunca se muestran ni se usan).
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

// Evalúa la mejor categoría de mano posible combinando las 2 cartas del
// jugador con las 5 comunitarias (7 cartas). Devuelve un índice 0-8,
// donde 8 es la mejor categoría (Straight Flush).
function evaluateHandCategory(playerCards, communityCards) {
  const cards = [...playerCards, ...communityCards];
  const values = cards.map((c) => rankToValue(c.rank));

  const suitCounts = {};
  cards.forEach((c) => {
    suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
  });
  const flushSuit = Object.keys(suitCounts).find((s) => suitCounts[s] >= 5);
  const isFlush = Boolean(flushSuit);

  const rankCounts = {};
  values.forEach((v) => {
    rankCounts[v] = (rankCounts[v] || 0) + 1;
  });
  const counts = Object.values(rankCounts).sort((a, b) => b - a);

  const isStraightIn = (valueList) => {
    let uniqueSorted = [...new Set(valueList)].sort((a, b) => a - b);
    if (uniqueSorted.includes(14)) uniqueSorted = [1, ...uniqueSorted]; // As bajo (rueda A-2-3-4-5)
    for (let i = 0; i <= uniqueSorted.length - 5; i++) {
      const window = uniqueSorted.slice(i, i + 5);
      if (window[4] - window[0] === 4) return true;
    }
    return false;
  };

  const isStraight = isStraightIn(values);
  const isStraightFlush = isFlush && isStraightIn(cards.filter((c) => c.suit === flushSuit).map((c) => rankToValue(c.rank)));

  if (isStraightFlush) return 8;
  if (counts[0] === 4) return 7;
  if (counts[0] === 3 && counts[1] >= 2) return 6;
  if (isFlush) return 5;
  if (isStraight) return 4;
  if (counts[0] === 3) return 3;
  if (counts[0] === 2 && counts[1] === 2) return 2;
  if (counts[0] === 2) return 1;
  return 0;
}

function cardsEqual(a, b) {
  return a.rank === b.rank && a.suit === b.suit;
}

function getRemainingDeck(usedCards) {
  return createDeck().filter((card) => !usedCards.some((used) => cardsEqual(used, card)));
}

// Busca 2 cartas de rival "plausibles" para mostrar como flavor tras resolver
// un push: si el jugador ganó, una mano que habría perdido; si perdió, una
// mano que le habría ganado. No es la mano real del rival (nunca existió),
// es solo una reconstrucción narrativa coherente con el resultado.
// Devuelve { cards, matched }: matched indica si se encontró una combinación
// que realmente cumple la condición (si no, cards es un par al azar).
function pickRevealRivalCards(playerCards, communityCards, playerCategory, wantWeakerThanPlayer) {
  const used = [...playerCards, ...communityCards];
  const remaining = shuffleDeck(getRemainingDeck(used));
  const maxPairsToCheck = 20;

  for (let i = 0; i < maxPairsToCheck && i * 2 + 1 < remaining.length; i++) {
    const candidate = [remaining[i * 2], remaining[i * 2 + 1]];
    const category = evaluateHandCategory(candidate, communityCards);
    if (wantWeakerThanPlayer && category < playerCategory) return { cards: candidate, matched: true };
    if (!wantWeakerThanPlayer && category > playerCategory) return { cards: candidate, matched: true };
  }

  return { cards: [remaining[0], remaining[1]], matched: false };
}
