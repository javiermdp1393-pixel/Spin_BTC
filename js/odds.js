// Odds simplificadas. Encapsulado a propósito para poder sustituir esta
// aproximación por un cálculo real de equity (combinaciones de mano rival)
// en una futura iteración sin tocar el resto del juego.

// winChance base según categoría de mano (0 = High Card ... 8 = Straight Flush).
const BASE_WIN_CHANCE_BY_CATEGORY = [0.30, 0.42, 0.55, 0.65, 0.72, 0.78, 0.85, 0.92, 0.97];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Combina la fuerza de la mano del jugador con el modificador oculto del
// rival para obtener la probabilidad final de ganar el push.
function getFinalWinChance(handCategory, rivalModifier) {
  const baseWinChance = BASE_WIN_CHANCE_BY_CATEGORY[handCategory];
  return clamp(baseWinChance - rivalModifier, 0.10, 0.90);
}

// Traduce el winChance interno a una etiqueta cualitativa para la UI,
// sin revelar nunca el porcentaje exacto al jugador.
function getOddsLabel(winChance) {
  if (winChance < 0.30) return 'Dead Hand';
  if (winChance < 0.45) return 'Risky Call';
  if (winChance < 0.55) return 'Coin Flip';
  if (winChance < 0.70) return 'Playable Spot';
  if (winChance < 0.85) return 'Strong Spot';
  return 'Monster Hand';
}
