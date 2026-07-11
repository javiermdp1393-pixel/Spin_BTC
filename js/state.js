// Estado central de la partida y funciones puras para mutarlo.
// No toca el DOM: eso es responsabilidad de main.js.

const PLAYER_STARTING_LIVES = 3;
const FOLD_LIFE_COST = 1 / 4;

// Racha: a partir de 3 manos ganadas seguidas, cada victoria hace un corazón
// entero de daño extra al rival.
const STREAK_ACTIVE_THRESHOLD = 3;

// Ajustes del modo Freezeout (torneo a un solo stack). Recuperar media vida
// (no una entera) por rival evita que el colchón de vida haga el modo
// demasiado asequible; calibrado por simulación (victoria óptima ~1-3%).
const FREEZEOUT = {
  startLives: 5,
  maxLives: 5,
  lifePerWin: 0.5, // media vida recuperada al derrotar a un rival (hasta maxLives)
  freeFolds: 1, // folds gratis por rival (no acumulables)
  skillMultiplier: 1.8, // rivales más afilados
  extraRivalLives: 1 // rivales con una vida más
};

// Ajustes del Desafío diario: gauntlet de 3 rivales con un único stack de 3
// vidas no recuperables. Los 2 primeros rivales son aleatorios (dificultad
// Arcade); el 3º es el campeón del día (el nº1 del ranking Arcade). Sin bonus
// de racha y con 1 fold gratis para TODA la run (antes 3: se lo pasaba casi
// cualquiera, así que se endurece sin tocar el resto de la dificultad).
const DAILY = {
  startLives: 3, // 3 vidas para toda la run, no recuperables
  freeFolds: 1, // folds gratis para toda la run (no por rival)
  // El campeón es el combate decisivo con el stack no recuperable: su nº de
  // vidas es la palanca real del winrate. Calibrado por simulación a 5 (+escudo)
  // para dejar la victoria óptima en ~12% (similar al Arcade, bajo el tope 15%).
  championLives: 5, // vidas del campeón del día
  championResist: 1, // escudo del campeón: aguanta 1 golpe sin perder vida
  championSkill: 0.30 // dificultad de cambio de mano (como El Pirulas)
};

function streakBonusDamage(streak) {
  return streak >= STREAK_ACTIVE_THRESHOLD ? 1 : 0;
}

function createInitialState() {
  return {
    status: 'LAUNCH', // LAUNCH, REGISTER, RIVAL_INTRO, BATTLE, REWARD, BUST_OUT, FINAL
    player: { name: '', alias: '' },
    mode: 'ARCADE', // ARCADE | FREEZEOUT
    demoMode: false, // acceso demo/QA: cada mano elimina al rival
    bonusMultiplier: 1, // ticket de bonus activo (x2 Desafío diario / x3 Modo Pro) para esta run de Arcade
    daily: false, // desafío diario: gauntlet de 3 rivales con 3 vidas
    dailyChallenge: null, // { name, alias, totalPrize, mode, date } del campeón del día
    rivalLineup: null, // lista de rivales de la run actual (RIVALS o lineup diario)
    currentRivalIndex: 0,
    playerLives: PLAYER_STARTING_LIVES,
    rivalLives: 0,
    totalPrize: 0,
    winStreak: 0, // manos ganadas seguidas en el combate actual
    resistRemaining: 0, // golpes que el rival aguanta sin perder vida
    freeFoldsRemaining: 0, // folds gratis disponibles en el combate actual
    rivalLine: { victoryShown: false, defeatShown: false, text: '' },
    currentHand: null
  };
}

function isFreezeout(state) {
  return state.mode === 'FREEZEOUT';
}

function isDaily(state) {
  return state.daily === true;
}

// El bonus de racha no aplica en el Desafío diario (no genera corazones extra).
function isStreakActive(state) {
  return !isDaily(state) && state.winStreak >= STREAK_ACTIVE_THRESHOLD;
}

function getCurrentRival(state) {
  const lineup = state.rivalLineup && state.rivalLineup.length ? state.rivalLineup : RIVALS;
  return lineup[state.currentRivalIndex];
}

function playerMaxLives(state) {
  if (isDaily(state)) return DAILY.startLives;
  return isFreezeout(state) ? FREEZEOUT.maxLives : PLAYER_STARTING_LIVES;
}

// Skill efectivo del rival. En el desafío diario los 2 aleatorios usan su
// dificultad Arcade y el campeón la del jefe; en Freezeout todos suben.
function effectiveRivalSkill(state, rival) {
  if (isDaily(state)) {
    return rival.dailyChampion ? DAILY.championSkill : rival.rivalSkill;
  }
  const mul = isFreezeout(state) ? FREEZEOUT.skillMultiplier : 1;
  return Math.min(0.9, rival.rivalSkill * mul);
}

// Vidas de arranque del rival. Daily: campeón con DAILY.championLives, resto
// con sus vidas Arcade. Freezeout: todos +1 (salvo freezeoutLives propio).
function rivalLivesFor(state, rival) {
  if (isDaily(state)) return rival.dailyChampion ? DAILY.championLives : rival.lives;
  if (!isFreezeout(state)) return rival.lives;
  if (rival.freezeoutLives != null) return rival.freezeoutLives;
  return rival.lives + FREEZEOUT.extraRivalLives;
}

// Golpes que el rival resiste sin perder vida (habilidad de jefe / protección).
function getResistCount(state, rival) {
  if (isDaily(state)) return rival.dailyChampion ? DAILY.championResist : 0;
  if (isFreezeout(state)) {
    if (rival.id === 'el-pirulas') return 2;
    if (rival.id === 'fabrizio') return 1;
    return 0;
  }
  return rival.finalBoss ? 1 : 0;
}

// Las vidas se mueven en fracciones de 1/4 (fold) o 1 (mano perdida).
function roundLife(value) {
  return Math.round(value * 4) / 4;
}

// Arranca el torneo en un modo concreto (conserva demoMode ya fijado).
// El primer enfrentamiento se prepara al pulsar "Sentarse a la mesa".
function startTournament(state, mode) {
  state.mode = mode;
  state.daily = false;
  state.dailyChallenge = null;
  state.rivalLineup = RIVALS;
  state.currentRivalIndex = 0;
  state.totalPrize = 0;
  state.playerLives = mode === 'FREEZEOUT' ? FREEZEOUT.startLives : PLAYER_STARTING_LIVES;
}

// Construye el rival "campeón del día" a partir del nº1 del ranking Arcade.
// Es un modelo sin rostro (misma imagen para todos) con el nombre/apodo del
// jugador que lidera. Dificultad de jefe: 3 vidas, 1 escudo y skill de Pirulas.
function buildDailyChampionRival(challenge) {
  const name = (challenge && challenge.name) ? challenge.name : 'El Pirulas';
  const alias = (challenge && challenge.alias) ? challenge.alias : 'Campeón del día';
  return {
    id: 'daily-champion',
    name,
    alias,
    suit: 'champion',
    suitSymbol: '👑',
    // ?v=N fuerza a navegador/CDN a re-descargar la imagen cuando se sustituye
    // el modelo (mismo nombre de fichero): súbelo el número al cambiar el arte.
    image: 'assets/rivals/daily-champion.png?v=2',
    introLine: 'Hoy el trono es mío. Veamos si aguantas hasta el final.',
    defeatLine: 'Me has arrebatado la corona del día... disfrútala, dura 24 horas.',
    nearDefeatLines: ['¿En serio vas a quitarme el trono?', 'No cantes victoria todavía.', 'Una mano más y esto se acaba.'],
    nearVictoryLines: ['El trono no se hereda, se defiende.', 'Estás a una mano de caer.'],
    rivalSkill: DAILY.championSkill,
    lives: DAILY.championLives,
    special: 'El campeón del día resiste el primer golpe sin perder vida.',
    dailyChampion: true,
    basePrize: 100000
  };
}

// Lineup del desafío diario: 2 rivales aleatorios de los normales (sin El
// Pirulas), ordenados de menos a más duro, + el campeón del día al final.
function buildDailyLineup(challenge) {
  const pool = RIVALS.filter((r) => !r.finalBoss);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const two = shuffled.slice(0, 2).sort((a, b) => a.basePrize - b.basePrize);
  return [...two, buildDailyChampionRival(challenge)];
}

// Arranca el desafío diario: gauntlet de 3 rivales con un único stack de 3
// vidas no recuperables y 1 fold gratis para toda la run. `challenge` =
// { name, alias, totalPrize, mode, date } del campeón del día.
function startDailyChallenge(state, challenge) {
  state.mode = 'ARCADE'; // reglas base (odds/premios) tipo Arcade
  state.daily = true;
  state.dailyChallenge = challenge;
  state.rivalLineup = buildDailyLineup(challenge);
  state.currentRivalIndex = 0;
  state.totalPrize = 0;
  state.playerLives = DAILY.startLives;
  state.freeFoldsRemaining = DAILY.freeFolds; // para toda la run
}

// Prepara un nuevo enfrentamiento. En Arcade las vidas se resetean a 3; en
// Freezeout y en el Desafío diario se conserva el stack entre rivales.
function startRivalEncounter(state) {
  const rival = getCurrentRival(state);
  if (!isFreezeout(state) && !isDaily(state)) state.playerLives = PLAYER_STARTING_LIVES;
  state.rivalLives = rivalLivesFor(state, rival);
  state.winStreak = 0;
  state.resistRemaining = getResistCount(state, rival);
  // Daily: los folds gratis son para toda la run, no se reinician por rival.
  if (!isDaily(state)) {
    state.freeFoldsRemaining = isFreezeout(state) ? FREEZEOUT.freeFolds : 0;
  }
  state.rivalLine = { victoryShown: false, defeatShown: false, text: '' };
  dealNewHandForState(state);
}

// Reparte una mano nueva y estima su probabilidad de victoria.
function dealNewHandForState(state) {
  const rival = getCurrentRival(state);
  const skill = effectiveRivalSkill(state, rival);
  const hand = dealHand();
  const winChance = estimateWinChance(hand.playerCards, hand.communityCards, skill);

  state.currentHand = {
    playerCards: hand.playerCards,
    communityCards: hand.communityCards,
    winChance,
    oddsLabel: getOddsLabel(winChance),
    playerHandName: describePlayerHand(hand.playerCards, hand.communityCards)
  };
}

// Comprueba si el rival debe soltar una frase (cerca de perder o de ganar).
// Solo una vez por condición y combate. Devuelve true si se ha activado una.
function maybeTriggerRivalLine(state) {
  const rival = getCurrentRival(state);
  const line = state.rivalLine;

  if (!line.defeatShown && state.rivalLives <= 1) {
    line.defeatShown = true;
    const pool = rival.nearDefeatLines || [];
    if (pool.length) {
      line.text = pool[Math.floor(Math.random() * pool.length)];
      return true;
    }
  }
  if (!line.victoryShown && state.playerLives <= 1) {
    line.victoryShown = true;
    const pool = rival.nearVictoryLines || [];
    if (pool.length) {
      line.text = pool[Math.floor(Math.random() * pool.length)];
      return true;
    }
  }
  return false;
}

// Foldear. En Freezeout el primer fold de cada rival es gratis.
function applyFold(state) {
  state.winStreak = 0;

  let freeFold = false;
  if (state.freeFoldsRemaining > 0) {
    state.freeFoldsRemaining -= 1;
    freeFold = true;
  } else {
    state.playerLives = roundLife(state.playerLives - FOLD_LIFE_COST);
  }

  if (state.playerLives <= 0) {
    state.status = 'BUST_OUT';
    return { label: 'HAND FOLDED', location: 'player', outcome: 'FOLD', freeFold };
  }

  dealNewHandForState(state);
  return { label: freeFold ? 'FREE FOLD' : 'HAND FOLDED', location: 'player', outcome: 'FOLD', freeFold };
}

// Resolución común de una mano jugada (CALL o Doblar).
function resolveHand(state, stake, doubled) {
  const rival = getCurrentRival(state);
  const hand = state.currentHand;
  const showdown = resolveShowdown(hand.playerCards, hand.communityCards, effectiveRivalSkill(state, rival));

  const base = {
    revealCards: showdown.rivalCards,
    playerHandName: showdown.playerHandName,
    rivalHandName: showdown.rivalHandName,
    doubled
  };

  // Modo demo/QA: la mano jugada elimina al rival (para recorrer pantallas).
  if (state.demoMode) {
    state.rivalLives = 0;
    state.status = 'REWARD';
    return { ...base, label: doubled ? 'YOU TAKE THE POT ×2' : 'YOU TAKE THE POT', location: 'player', outcome: 'WIN', rivalFelted: true, demo: true };
  }

  // Empate: se reparte mano nueva sin coste de vidas y sin romper la racha.
  if (showdown.cmp === 0) {
    dealNewHandForState(state);
    return { ...base, label: 'SPLIT POT', location: 'player', outcome: 'TIE' };
  }

  // Victoria del jugador.
  if (showdown.cmp > 0) {
    state.winStreak += 1;

    // El rival resiste el golpe (habilidad de jefe / protección): no pierde
    // vida pero cuenta como mano ganada.
    if (state.resistRemaining > 0) {
      state.resistRemaining -= 1;
      dealNewHandForState(state);
      const resistLabel = rival.finalBoss ? 'EL PIRULAS RESISTE' : (rival.dailyChampion ? 'EL CAMPEÓN RESISTE' : 'EL RIVAL RESISTE');
      return { ...base, label: resistLabel, location: 'player', outcome: 'WIN', rivalFelted: false, bossResisted: true };
    }

    // El Desafío diario no genera corazones extra por racha.
    const bonus = isDaily(state) ? 0 : streakBonusDamage(state.winStreak);
    state.rivalLives = roundLife(state.rivalLives - (stake + bonus));
    const rivalFelted = state.rivalLives <= 0;
    if (rivalFelted) state.status = 'REWARD';
    else dealNewHandForState(state);
    return {
      ...base,
      label: doubled ? 'YOU TAKE THE POT ×2' : 'YOU TAKE THE POT',
      location: 'player', outcome: 'WIN', rivalFelted,
      streakBonus: bonus, streakCount: state.winStreak
    };
  }

  // Derrota del jugador: rompe la racha.
  state.winStreak = 0;
  state.playerLives = roundLife(state.playerLives - stake);
  const bustOut = state.playerLives <= 0;
  if (bustOut) state.status = 'BUST_OUT';
  else dealNewHandForState(state);
  return {
    ...base,
    label: doubled ? 'VILLAIN TAKES THE POT ×2' : 'VILLAIN TAKES THE POT',
    location: 'rival', outcome: 'LOSE', bustOut
  };
}

function applyPush(state) {
  return resolveHand(state, 1, false);
}

// Solo se puede doblar con 2 vidas o más (regla del juego).
function canDouble(state) {
  return state.playerLives >= 2 - 1e-9;
}

// Doblar: mismo showdown con el doble en juego (2 vidas).
function applyDouble(state) {
  return resolveHand(state, 2, true);
}

// Aplica el premio del rival derrotado (premio base propio x multiplicador).
function applyRewardForCurrentRival(state) {
  const rival = getCurrentRival(state);
  const reward = rollReward(rival.basePrize);
  // Ticket de bonus (x2 Desafío diario / x3 Modo Pro): multiplica los premios
  // NORMALES de toda la run, pero deja los jackpots/pelotazos como estaban
  // (un x3000 sería una locura).
  if (state.bonusMultiplier > 1 && reward.type === 'NORMAL') {
    reward.amount *= state.bonusMultiplier;
    reward.bonusMultiplier = state.bonusMultiplier;
  }
  state.totalPrize += reward.amount;
  return reward;
}

// Avanza al siguiente rival. En Freezeout recupera media vida (hasta el máximo);
// en el Desafío diario no hay recuperación (stack único no recuperable).
function advanceToNextRival(state) {
  if (isFreezeout(state)) {
    state.playerLives = Math.min(FREEZEOUT.maxLives, state.playerLives + FREEZEOUT.lifePerWin);
  }
  state.currentRivalIndex += 1;
  const lineup = state.rivalLineup && state.rivalLineup.length ? state.rivalLineup : RIVALS;
  if (state.currentRivalIndex >= lineup.length) {
    state.status = 'FINAL';
  } else {
    state.status = 'RIVAL_INTRO';
  }
}

// Reinicia el torneo tras un BUST_OUT, conservando nombre/apodo, modo y demo.
// En el Desafío diario se rearma una run nueva (nuevos rivales aleatorios).
function restartTournament(state) {
  const { player, mode, demoMode, daily, dailyChallenge } = state;
  Object.assign(state, createInitialState());
  state.player = player;
  state.demoMode = demoMode;
  // El ticket de bonus es de un solo uso para la run que empezaste: si has
  // busteado (llegas aquí desde el bust out), lo pierdes — el reintento NO
  // conserva el bonus.
  if (daily) {
    startDailyChallenge(state, dailyChallenge);
  } else {
    state.mode = mode;
    state.rivalLineup = RIVALS;
    state.playerLives = mode === 'FREEZEOUT' ? FREEZEOUT.startLives : PLAYER_STARTING_LIVES;
  }
  state.status = 'RIVAL_INTRO';
}
