// Sistema de premios: premio base x multiplicador, con jackpot raro x1000.

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollReward(basePrize = 100000) {
  const isJackpot = Math.random() < 0.01;

  if (isJackpot) {
    return {
      basePrize,
      multiplier: 1000,
      amount: basePrize * 1000,
      type: 'JACKPOT'
    };
  }

  const multiplier = randomInteger(2, 10);
  return {
    basePrize,
    multiplier,
    amount: basePrize * multiplier,
    type: 'NORMAL'
  };
}

function formatEuros(amount) {
  return amount.toLocaleString('es-ES') + ' EUR';
}
