// Sistema de premios: premio base x multiplicador.
// Distribución: 1% x1000 (jackpot), 1.5% x200, 2% x100, 2.5% x50 (premios
// gordos), y el 93% restante entre x2 y x10 con reparto lineal decreciente
// (cuanto mayor el multiplicador, menos probable; x10 queda ~2%, muy por
// debajo del tope del 10%).

// Pesos lineales decrecientes para x2..x10: [9,8,7,6,5,4,3,2,1].
const NORMAL_MULTIPLIER_WEIGHTS = (function () {
  const weights = [];
  for (let m = 2; m <= 10; m++) weights.push({ m, w: 11 - m });
  return weights;
})();

function pickNormalMultiplier() {
  const total = NORMAL_MULTIPLIER_WEIGHTS.reduce((sum, x) => sum + x.w, 0);
  let r = Math.random() * total;
  for (const { m, w } of NORMAL_MULTIPLIER_WEIGHTS) {
    if (r < w) return m;
    r -= w;
  }
  return 2;
}

function rollReward(basePrize = 100000) {
  const r = Math.random();

  if (r < 0.01) {
    return { basePrize, multiplier: 1000, amount: basePrize * 1000, type: 'JACKPOT' };
  }
  if (r < 0.025) {
    return { basePrize, multiplier: 200, amount: basePrize * 200, type: 'MEGA' };
  }
  if (r < 0.045) {
    return { basePrize, multiplier: 100, amount: basePrize * 100, type: 'MEGA' };
  }
  if (r < 0.07) {
    return { basePrize, multiplier: 50, amount: basePrize * 50, type: 'MEGA' };
  }

  const multiplier = pickNormalMultiplier();
  return { basePrize, multiplier, amount: basePrize * multiplier, type: 'NORMAL' };
}

function formatEuros(amount) {
  return amount.toLocaleString('es-ES') + ' EUR';
}
