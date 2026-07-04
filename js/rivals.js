// Datos de los rivales del torneo de Espinho.
// Cada rival define su presentación narrativa y sus reglas de combate.
// El campo "image" puede ser null: en ese caso la UI dibuja un panel
// placeholder con el color/símbolo del palo en lugar de una foto.
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
    modifier: 0
  },
  {
    id: 'trebol-gordo-mcbubble',
    name: 'Trébol Gordo McBubble',
    alias: 'The Bubble Boss',
    suit: 'clubs',
    suitSymbol: '♣',
    image: null,
    introLine: 'Cuando me hincho, mejor foldear.',
    defeatLine: 'Se me ha pinchado el farol...',
    lives: 2,
    modifier: 0.03
  },
  {
    id: 'octavio-diamante',
    name: 'Octavio Diamante',
    alias: 'Eight Hands, One Tell',
    suit: 'diamonds',
    suitSymbol: '♦',
    image: null,
    introLine: 'Ocho manos, un solo tell. Intenta encontrarlo.',
    defeatLine: 'Ocho manos... y ninguna salvación.',
    lives: 3,
    modifier: 0.05
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
    modifier: 0.07
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
    modifier: 0.10
  },
  {
    id: 'el-pirulas',
    name: 'El Pirulas',
    alias: 'Final Hand',
    suit: 'champion',
    suitSymbol: '👑',
    image: null,
    introLine: 'Bienvenido a mi mesa, aquí hasta los ases sudan.',
    defeatLine: 'La última mano era tuya. Hoy la mesa te pertenece.',
    lives: 5,
    modifier: 0.12,
    finalBoss: true
  }
];
