// Odds simplificadas. La probabilidad numérica ahora la calcula poker.js por
// Monte Carlo (estimateWinChance); aquí solo la traducimos a la lectura
// cualitativa y al texto de detalle para la UI.

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Traduce el winChance interno (0..1) a una etiqueta cualitativa.
function getOddsLabel(winChance) {
  if (winChance < 0.30) return 'Dead Hand';
  if (winChance < 0.45) return 'Risky Call';
  if (winChance < 0.55) return 'Coin Flip';
  if (winChance < 0.70) return 'Playable Spot';
  if (winChance < 0.85) return 'Strong Spot';
  return 'Monster Hand';
}

// Texto de detalle (tooltip / desplegable) con la mano actual del jugador,
// la probabilidad estimada y, si procede, el handicap del rival.
function getOddsDetailText(winChance, playerHandName, rivalSkill) {
  let text = `Tu mejor mano ahora: ${playerHandName}. Probabilidad estimada de ganar: ${Math.round(winChance * 100)}%.`;
  if (rivalSkill > 0) {
    text += ` El rival mejora su mano el ${Math.round(rivalSkill * 100)}% de las veces.`;
  }
  return text;
}
