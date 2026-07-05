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
    // PLACEHOLDER: sustituir por DynamicLines.md
    nearDefeatLines: ['Vale... esto pinta mal para el pececito.', '¡No, mi torneo no puede acabar tan pronto!', '¡Solo me queda una ficha, glub!'],
    nearVictoryLines: ['¿El novato ya tiembla? Glub glub.', 'Hasta un pez chico puede morder.'],
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
    // PLACEHOLDER: sustituir por DynamicLines.md
    nearDefeatLines: ['Se me está deshinchando el farol...', '¡Que alguien me traiga aire!', 'El globo hace pfff...'],
    nearVictoryLines: ['Cuando yo me hincho, tú te encoges.', 'Este bubble te va a estallar en la cara.'],
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
    // PLACEHOLDER: sustituir por DynamicLines.md
    nearDefeatLines: ['Ocho manos... y ninguna me salva.', 'Mis tentáculos empiezan a temblar.', 'Se me escapa el control.'],
    nearVictoryLines: ['Ocho manos contra las tuyas. Adivina.', 'Controlo cada carta de esta mesa.'],
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
    // PLACEHOLDER: sustituir por DynamicLines.md
    nearDefeatLines: ['El river se me escapa entre los dientes...', 'Hoy el depredador sangra.', 'Aguas turbias para mí.'],
    nearVictoryLines: ['Huelo tu sangre en el fieltro.', 'No persigo manos: te cazo a ti.'],
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
    // PLACEHOLDER: sustituir por DynamicLines.md
    nearDefeatLines: ['Me has roto el corazón antes de tiempo...', 'El galán se retira herido.', 'Mi encanto ya no basta.'],
    nearVictoryLines: ['Rompo corazones y stacks, guapo.', 'Esta mano te la voy a partir en dos.'],
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
    // PLACEHOLDER: sustituir por DynamicLines.md
    nearDefeatLines: ['Imposible... ninguna mesa me vio caer.', 'El campeón no puede caer... ¿o sí?', 'El trono me tiembla bajo los pies.'],
    nearVictoryLines: ['Aquí hasta los ases sudan, y tú ya goteas.', 'Bienvenido a mi mesa: tu última mano.'],
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
