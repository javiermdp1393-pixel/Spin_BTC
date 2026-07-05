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
    nearDefeatLines: ['Espera... ¿eso era buena mano?', 'Me está entrando agua en las odds...', 'Creo que esta vez el fish soy yo.'],
    nearVictoryLines: ['¡Ey! Igual no era tan fish como parecía.', 'Te veo nervioso... ¿foldeamos o qué?', 'Una mano más y te mando al acuario.'],
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
    nearDefeatLines: ['No puede ser... me estoy desinflando.', 'La burbuja me acaba de explotar en la cara.', 'Vale, vale... quizá me he hinchado demasiado.'],
    nearVictoryLines: ['Estoy a punto de reventar esta mesa.', 'Presión máxima. Bienvenido a la burbuja.', 'Una decisión mala más y haces pop.'],
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
    nearDefeatLines: ['Ocho manos... y ninguna salida.', 'Este diamante empieza a agrietarse.', 'No puede ser. He perdido el tell.'],
    nearVictoryLines: ['Tengo ocho formas distintas de ganarte.', 'Cada carta que ves ya la había calculado.', 'Tu mano tiembla. Mis tentáculos no.'],
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
    nearDefeatLines: ['El river... me ha traicionado.', 'No sangro. Solo espero la siguiente mano.', 'Un tiburón herido sigue mordiendo.'],
    nearVictoryLines: ['Huele a bust out.', 'Estás nadando demasiado lejos de la orilla.', 'En el river no se juega. Se sobrevive.'],
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
    nearDefeatLines: ['Cuidado... aún puedo romperte el corazón.', 'No esperaba que tus odds fueran tan elegantes.', 'Mi corazón sigue latiendo. Tu stack, no sé.'],
    nearVictoryLines: ['Qué pena. Empezabas a caerme bien.', 'Voy a ganarte con estilo, como debe ser.', 'Esto no es una derrota. Es una ruptura.'],
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
    nearDefeatLines: ['Interesante... hacía tiempo que no sudaba.', 'No cantes victoria. La última mano aún es mía.', 'Has llegado lejos. Ahora demuestra que no fue suerte.'],
    nearVictoryLines: ['Te queda una vida y demasiadas dudas.', 'Esto no es el final del torneo. Es el final de tu historia.'],
    rivalSkill: 0.30,
    // Habilidad especial del jefe final: la primera mano que le ganas la
    // aguanta sin perder vida. Se muestra en su pantalla de presentación.
    special: 'Segunda vida del campeón: la primera mano que le ganes, la resiste sin perder ni medio corazón.',
    // No se especificó premio base para El Pirulas en el encargo (solo del 1 al 5).
    // Se deja en 100.000 EUR como cierre de escalera; ajustar si se quiere otro valor.
    basePrize: 100000,
    finalBoss: true,
    // Ajustes especiales en modo Freezeout (tras feedback de playtesting):
    // sin vida extra (se queda en sus 5 base, con los 2 seguros intactos),
    // skill fijado en 50% (en vez del 54% que salía de aplicar el multiplicador
    // general x1.8), y el doble de folds gratis para compensar lo duro que es.
    freezeoutExtraLives: 0,
    freezeoutSkill: 0.50,
    freezeoutFreeFolds: 2
  }
];
