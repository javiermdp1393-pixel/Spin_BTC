// Datos de los rivales del torneo de Espinho.
// Cada rival define su presentación narrativa y sus reglas de combate.
// El campo "image" puede ser null: en ese caso la UI dibuja un panel
// placeholder con el color/símbolo del palo en lugar de una foto.
// "basePrize" es el premio base (antes de multiplicador) al derrotarlo,
// en escalera según la dificultad del rival.
// "rivalSkill" es el handicap (0..1): probabilidad de que el rival, al
// repartirse su mano, mire dos candidatas y se quede con la mejor. A mayor
// skill, con más frecuencia juega la mejor mano, así que es más difícil.
const RIVALS = [
  {
    id: 'little-fizz',
    name: 'Little Fizz',
    alias: 'The Little Fish',
    suit: 'starter',
    suitSymbol: '🐟',
    image: 'assets/rivals/little-fizz.jpg',
    introLine: 'I swear I had a feeling...',
    defeatLine: 'Vale... quizá soy más fish que pro.',
    lives: 1,
    rivalSkill: 0,
    basePrize: 15000
  },
  {
    id: 'trebol-gordo-mcbubble',
    name: 'Trébol Gordo McBubble',
    alias: 'The Bubble Boss',
    suit: 'clubs',
    suitSymbol: '♣',
    image: 'assets/rivals/trebol-gordo-mcbubble.jpg',
    introLine: 'Cuando me hincho, mejor foldear.',
    defeatLine: 'Se me ha pinchado el farol...',
    lives: 2,
    rivalSkill: 0.08,
    basePrize: 25000
  },
  {
    id: 'octavio-diamante',
    name: 'Octavio Diamante',
    alias: 'Eight Hands, One Tell',
    suit: 'diamonds',
    suitSymbol: '♦',
    image: 'assets/rivals/octavio-diamante.jpg',
    introLine: 'Ocho manos, un solo tell. Intenta encontrarlo.',
    defeatLine: 'Ocho manos... y ninguna salvación.',
    lives: 3,
    rivalSkill: 0.14,
    basePrize: 42500
  },
  {
    id: 'sharko-spades',
    name: 'Sharko Spades',
    alias: 'The River Predator',
    suit: 'spades',
    suitSymbol: '♠',
    image: 'assets/rivals/sharko-spades.jpg',
    introLine: 'Yo no persigo manos. Cazo rivers.',
    defeatLine: 'El river hoy no tenía dientes.',
    lives: 3,
    rivalSkill: 0.19,
    basePrize: 63000
  },
  {
    id: 'fabrizio',
    name: 'Fabrizio',
    alias: 'The Heartbreaker',
    suit: 'hearts',
    suitSymbol: '♥',
    image: 'assets/rivals/fabrizio-hearts.jpg',
    introLine: 'No rompo corazones, rompo tus odds.',
    defeatLine: 'Me has roto el corazón... y el stack.',
    lives: 4,
    rivalSkill: 0.25,
    basePrize: 78500
  },
  {
    id: 'el-pirulas',
    name: 'El Pirulas',
    alias: 'Final Hand',
    suit: 'champion',
    suitSymbol: '👑',
    image: 'assets/rivals/el-pirulas.jpg',
    introLine: 'Bienvenido a mi mesa, aquí hasta los ases sudan.',
    defeatLine: 'Ninguna mesa me había visto caer... hasta esta noche. La corona de Espinho ya es tuya, campeón.',
    lives: 5,
    rivalSkill: 0.30,
    // Habilidad especial del jefe final: la primera mano que le ganas la
    // aguanta sin perder vida. Se muestra en su pantalla de presentación.
    special: 'Segunda vida del campeón: la primera mano que le ganes, la resiste sin perder ni medio corazón.',
    // No se especificó premio base para El Pirulas en el encargo (solo del 1 al 5).
    // Se deja en 100.000 EUR como cierre de escalera; ajustar si se quiere otro valor.
    basePrize: 100000,
    finalBoss: true
  }
];
