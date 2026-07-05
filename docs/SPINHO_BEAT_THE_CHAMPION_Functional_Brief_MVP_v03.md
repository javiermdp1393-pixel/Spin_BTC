# SPINHO BEAT THE CHAMPION

**Narrative, Lore, Progression & MVP Mechanics Brief**  
Documento funcional base para prototipo web en HTML / CSS / JavaScript  
Versión 0.3 — odds simplificadas, rival oculto y fold -0,5 vidas

---

## 1. Resumen ejecutivo

**SPINHO BEAT THE CHAMPION** es un juego web narrativo e interactivo, pensado para desarrollarse como una experiencia sencilla pero pulida, alojable en **GitHub Pages**.

El usuario crea un **nombre** y un **apodo de torneo**, entra al circuito de Espinho y progresa a través de una cadena de combates por turnos inspirados en el mundo del póker.

El objetivo del producto es ofrecer una experiencia:

- corta;
- rejugable;
- muy visual;
- arcade;
- con tono cinematográfico y humorístico;
- con una progresión clara de rivales;
- con un sistema de recompensas exagerado y celebratorio.

Cada victoria desbloquea el siguiente rival, otorga un premio base de **100.000 EUR** y activa una ruleta de multiplicadores que puede disparar la recompensa hasta un jackpot extraordinario.

La mecánica MVP propuesta se basa en manos de Hold’em simplificadas:

- el jugador ve sus **2 cartas**;
- el jugador ve las **5 cartas comunitarias** desde el inicio;
- el jugador **nunca ve las cartas del rival**;
- el rival aparece con **2 cartas ocultas**;
- el rival siempre empuja hacia delante;
- el jugador decide entre **Push / Go for it** o **Fold**;
- el fold cuesta **0,5 vidas**;
- el push se resuelve mediante una probabilidad de victoria simplificada.

---

## 2. Premisa narrativa y tono

El jugador llega como un desconocido al torneo de Espinho. No entra como simple visitante: entra para escalar una mesa imposible, derrotar a cinco rivales icónicos asociados a los palos de la baraja y ganarse el derecho de retar al campeón final.

El ascenso no es solo competitivo, también es teatral: cada combate presenta un personaje con identidad propia, una frase de entrada y una dificultad creciente.

### Tono recomendado

- Elegante.
- Humorístico.
- Canalla.
- Ligeramente absurdo.
- Visualmente cercano a casino clandestino, póker televisado y jefes arcade.

La estética mezcla:

- casino oscuro;
- animales antropomórficos;
- trajes temáticos por palo;
- luces rojas y doradas;
- composición de póster;
- frases memorables de villano.

### Frase icónica del jefe final

> “Bienvenido a mi mesa, aquí hasta los ases sudan.”

---

## 3. Pantalla de lanzamiento y registro del jugador

La primera interacción del usuario con la aplicación debe ser una **portada de lanzamiento** con alto impacto visual, seguida del formulario de registro.

La imagen de portada debe funcionar como hero visual principal de producto y reforzar tanto el título del juego como la fantasía del torneo.

### Elementos mínimos de la pantalla de lanzamiento

- Título principal: **SPINHO BEAT THE CHAMPION**.
- Imagen hero del torneo.
- CTA principal: **Comenzar** o **Start Tournament**.
- Transición al registro.

### Registro del jugador

El registro debe pedir:

- nombre del jugador;
- apodo de torneo.

### Copy sugerido

> “El torneo de Espinho no acepta invitados anónimos. Escribe tu nombre, elige tu apodo y toma asiento. La primera mano empieza ahora.”

---

## 4. Escalera de rivales y panel funcional de personajes

El núcleo del juego es una progresión lineal de jefes. Cada rival debe contar con un panel funcional compuesto por:

- nombre;
- apodo;
- imagen;
- afinidad temática;
- frase de entrada;
- frase de derrota;
- rol de diseño;
- vidas del rival.

La frase de entrada se muestra la primera vez que el rival aparece. La frase de derrota se muestra cuando sus vidas llegan a 0.

> Nota de implementación: las rutas de imagen pueden ajustarse según la estructura real del repo.

---

### 4.1 Little Fizz — The Little Fish

**Asset sugerido:** `assets/rivals/little-fizz.png`

**Rol:** primer rival y tutorial narrativo. Es el clásico *fish*: parece ingenuo, imprevisible y ligeramente ridículo, pero suficiente para introducir la fantasía del torneo.

**Frase de entrada:**

> “I swear I had a feeling...”

**Frase de derrota:**

> “Vale... quizá soy más fish que pro.”

**Temática:** rival de entrada / pez novato.  
**Vidas del rival en el MVP:** 1.

---

### 4.2 Trébol Gordo McBubble — The Bubble Boss

**Asset sugerido:** `assets/rivals/trebol-gordo-mcbubble.png`

**Rol:** segundo rival. Introduce presión, faroles y comportamiento más agresivo. La idea de *bubble* conecta tanto con el pez globo como con el momento crítico de los torneos.

**Frase de entrada:**

> “Cuando me hincho, mejor foldear.”

**Frase de derrota:**

> “Se me ha pinchado el farol...”

**Temática:** palo de tréboles / presión de torneo.  
**Vidas del rival en el MVP:** 2.

---

### 4.3 Octavio Diamante — Eight Hands, One Tell

**Asset sugerido:** `assets/rivals/octavio-diamante.png`

**Rol:** tercer rival. Debe sentirse técnico, tramposo y sofisticado. Sus tentáculos permiten exagerar el concepto de control de manos, lectura y multitarea.

**Frase de entrada:**

> “Ocho manos, un solo tell. Intenta encontrarlo.”

**Frase de derrota:**

> “Ocho manos... y ninguna salvación.”

**Temática:** palo de diamantes / control y precisión.  
**Vidas del rival en el MVP:** 3.

---

### 4.4 Sharko Spades — The River Predator

**Asset sugerido:** `assets/rivals/sharko-spades.png`

**Rol:** cuarto rival. Es la amenaza fría, depredadora y agresiva antes del tramo final. Ideal para representar la fase del juego donde el margen de error ya es bajo.

**Frase de entrada:**

> “Yo no persigo manos. Cazo rivers.”

**Frase de derrota:**

> “El river hoy no tenía dientes.”

**Temática:** palo de picas / agresión y peligro.  
**Vidas del rival en el MVP:** 3.

---

### 4.5 Fabrizio — The Heartbreaker

**Asset sugerido:** `assets/rivals/fabrizio-hearts.png`

**Rol:** quinto rival y guardián del campeón. La imagen correcta lo presenta como rey de corazones, reforzando su papel de seductor letal de la mesa.

**Frase de entrada:**

> “No rompo corazones, rompo tus odds.”

**Frase de derrota:**

> “Me has roto el corazón... y el stack.”

**Temática:** palo de corazones / estilo y carisma.  
**Vidas del rival en el MVP:** 4.

---

### 4.6 El Pirulas — Final Hand

**Asset sugerido:** `assets/rivals/el-pirulas.png`

**Rol:** jefe final absoluto. No necesita nombre civil: **El Pirulas** funciona como leyenda de mesa. Debe condensar todas las mecánicas anteriores y simbolizar el cierre del torneo.

**Frase de entrada:**

> “Bienvenido a mi mesa, aquí hasta los ases sudan.”

**Frase de derrota:**

> “La última mano era tuya. Hoy la mesa te pertenece.”

**Temática:** campeón final / cierre de arco.  
**Vidas del rival en el MVP:** 5.

---

## 5. Flujo de avance de la historia

1. Pantalla de lanzamiento con imagen de portada, título y botón de comienzo.
2. Pantalla de registro donde el usuario introduce nombre y apodo.
3. Entrada al torneo de Espinho y presentación del primer rival con su frase de entrada.
4. Combate por turnos contra Little Fizz.
5. Cuando un rival llega a 0 vidas, se muestra su frase de derrota y se pasa a recompensa.
6. Pantalla de victoria de rival: recompensa base, multiplicador y premio acumulado.
7. Repetición del ciclo con Trébol Gordo McBubble, Octavio Diamante, Sharko Spades y Fabrizio.
8. Acceso al combate final contra El Pirulas.
9. Si el jugador vence al campeón, se muestra la pantalla de cierre con mensaje de campeón.

### Pantalla final sugerida

> “Te has convertido en el campeón de SPINHO BEAT THE CHAMPION. Felicidades.”

---

## 6. Sistema de premios y multiplicadores

Cada rival vencido otorga un premio base de **100.000 EUR**.

Tras la victoria se activa una tirada de multiplicador:

- el 99% de las veces, el multiplicador estará comprendido entre **x2 y x10**;
- el 1% restante corresponde a un jackpot extraordinario de **x1000**.

### Reglas

| Concepto | Valor |
|---|---:|
| Premio base por victoria | 100.000 EUR |
| Multiplicadores normales | x2, x3, x4, x5, x6, x7, x8, x9, x10 |
| Probabilidad rango normal | 99% |
| Jackpot | x1000 |
| Probabilidad jackpot | 1% |

### Objetivo UX

La recompensa debe sentirse:

- celebratoria;
- exagerada;
- rápida;
- visual;
- muy compartible;
- especialmente espectacular cuando aparece el jackpot.

### Pseudocódigo

```js
function rollReward(basePrize = 100000) {
  const jackpot = Math.random() < 0.01;

  if (jackpot) {
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
```

---

## 7. Mecánica MVP propuesta: Poker Duel Lite

La propuesta encaja bien para un MVP porque elimina la complejidad de implementar una partida completa de Texas Hold’em, pero conserva lo esencial:

- lectura de mano;
- gestión del riesgo;
- decisión push/fold;
- sensación de apuesta;
- progresión por jefes;
- tensión por vidas.

---

### 7.1 Estructura de cada enfrentamiento

- Cada enfrentamiento se divide en manos independientes.
- El jugador empieza cada enfrentamiento con **3 vidas** u oportunidades.
- Cada rival tiene un número de vidas propio, que aumenta conforme avanza la escalera del torneo.
- Para ganar un enfrentamiento, el jugador debe reducir a 0 las vidas del rival antes de perder sus 3 vidas.
- Al comenzar cada mano se muestran al jugador sus 2 cartas y las 5 cartas comunitarias.
- Las 2 cartas del rival aparecen siempre como cartas boca abajo.
- No se muestra la mano real del rival en ningún momento del MVP.
- El jugador decide entre **Ir a por ello** o **Foldear**.
- El rival siempre toma la acción agresiva: empuja, paga o va hacia delante.
- El rival no foldea.

---

### 7.2 Tabla de vidas por rival

| Orden | Rival | Apodo | Vidas |
|---:|---|---|---:|
| 1 | Little Fizz | The Little Fish | 1 |
| 2 | Trébol Gordo McBubble | The Bubble Boss | 2 |
| 3 | Octavio Diamante | Eight Hands, One Tell | 3 |
| 4 | Sharko Spades | The River Predator | 3 |
| 5 | Fabrizio | The Heartbreaker | 4 |
| 6 | El Pirulas | Final Hand | 5 |

---

### 7.3 Display de combate

El **Battle Screen** debe comunicar la información suficiente para que el jugador decida, pero sin mostrar la solución completa.

La mano del rival debe permanecer oculta para conservar misterio, velocidad y tensión arcade.

### Zonas del display

**Zona jugador**

- 2 cartas visibles.
- Vidas restantes.
- Nombre y apodo elegidos en el registro.

**Zona mesa**

- 5 cartas comunitarias visibles desde el inicio de la mano.

**Zona rival**

- Retrato.
- Nombre.
- Apodo.
- Vidas restantes.
- 2 cartas boca abajo.

**Indicador de odds**

- Etiqueta o barra por rangos.
- Preferiblemente sin mostrar porcentaje exacto en el MVP.

**Acciones**

- `Push / Go for it / Ir a por ello`.
- `Fold / Foldear`.

**Resultado**

- No revelar cartas del rival.
- Mostrar un mensaje claro de pot ganado o pot perdido.

---

### 7.4 Decisión del jugador y coste del fold

El fold no puede ser gratuito, porque permitiría al usuario descartar manos indefinidamente hasta encontrar siempre una situación favorable.

La regla recomendada es que foldear cueste **0,5 vidas**.

Este castigo es comedido, evita el abuso y permite que el jugador use el fold como herramienta estratégica sin convertirlo en una acción dominante.

| Acción | Consecuencia |
|---|---|
| Ir a por ello y ganar | El rival pierde 1 vida |
| Ir a por ello y perder | El jugador pierde 1 vida |
| Foldear | El jugador pierde 0,5 vidas y se reparte nueva mano |
| Jugador a 0 vidas o menos | `YOU BUST OUT` |
| Rival a 0 vidas o menos | `RIVAL FELTED` |

### Empates

Recomendación MVP:

- repetir mano sin pérdida de vida;
- o tratarlo como medio daño si se quiere endurecer la dificultad.

Para la primera versión, se recomienda **repetir mano sin pérdida de vida**.

---

### 7.5 Lógica recomendada de odds simplificadas

Como la mesa ya está completa, las odds representan la probabilidad estimada de que la mano del jugador gane contra una mano rival desconocida.

La solución más sólida es calcular la equity del jugador contra todas las posibles combinaciones de 2 cartas que podría tener el rival.

### Proceso recomendado

1. Crear una baraja estándar.
2. Retirar las 2 cartas del jugador.
3. Retirar las 5 cartas comunitarias.
4. Generar todas las combinaciones posibles de 2 cartas rivales con las cartas restantes.
5. Evaluar la mejor mano del jugador.
6. Evaluar la mejor mano del rival para cada combinación posible.
7. Contar victorias, derrotas y empates.
8. Calcular la equity.

### Fórmula

```js
equity = (wins + ties * 0.5) / totalOpponentCombos;
```

### Resolución simplificada

Al pulsar **Push / Go for it**, el juego usa esa equity como probabilidad de victoria.

```js
const playerWins = Math.random() <= finalWinChance;
```

Esto mantiene el azar, pero permite que el jugador sienta que sus decisiones importan.

---

### 7.6 Rangos cualitativos de odds

En el MVP no se recomienda mostrar un porcentaje exacto al usuario. Es mejor mostrar un rango cualitativo.

| Equity interna | Lectura en UI | Sentido de diseño |
|---:|---|---|
| 0% – 30% | Dead Hand | Muy mala situación |
| 30% – 45% | Risky Call | Mano débil |
| 45% – 55% | Coin Flip | Situación equilibrada |
| 55% – 70% | Playable Spot | Buena oportunidad |
| 70% – 85% | Strong Spot | Mano fuerte |
| 85% – 100% | Monster Hand | Situación excelente |

Este sistema evita que el jugador optimice con precisión matemática absoluta y refuerza el tono arcade.

---

### 7.7 Modificadores de dificultad por rival

Además de las vidas, cada rival puede aplicar un pequeño modificador oculto sobre la probabilidad final del jugador.

| Rival | Modificador sugerido |
|---|---:|
| Little Fizz | 0% |
| Trébol Gordo McBubble | -3% |
| Octavio Diamante | -5% |
| Sharko Spades | -7% |
| Fabrizio | -10% |
| El Pirulas | -12% |

### Regla de seguridad

Conviene aplicar límites para evitar probabilidades imposibles o demasiado extremas.

```js
finalWinChance = clamp(playerEquity - rivalModifier, 0.10, 0.90);
```

Así siempre existe una pequeña posibilidad de milagro o tragedia, algo muy coherente con el póker.

---

### 7.8 Estados de resultado y terminología

La resolución debe sonar a póker, aunque el juego sea arcade.

| Evento | Texto recomendado |
|---|---|
| El jugador gana la mano | `YOU TAKE THE POT` |
| El rival gana la mano | `VILLAIN TAKES THE POT` |
| El jugador foldea | `HAND FOLDED` |
| El jugador pierde el combate | `YOU BUST OUT` |
| El rival es derrotado | `RIVAL FELTED` |
| Jackpot | `JACKPOT` |
| Victoria final | `CHAMPION CROWNED` |

### Pseudocódigo de resolución

```js
function resolvePush(finalWinChance) {
  const playerWins = Math.random() <= finalWinChance;

  if (playerWins) {
    currentRival.currentLives -= 1;
    return {
      result: 'PLAYER_WINS_POT',
      label: 'YOU TAKE THE POT'
    };
  }

  gameState.playerLives -= 1;

  return {
    result: 'RIVAL_WINS_POT',
    label: 'VILLAIN TAKES THE POT'
  };
}

function foldHand() {
  gameState.playerLives -= 0.5;

  return {
    result: 'HAND_FOLDED',
    label: 'HAND FOLDED',
    cost: 0.5
  };
}
```

---

## 8. Modelo técnico propuesto

Arquitectura recomendada: separar contenido, lógica y presentación.

La información de rivales, imágenes, frases, niveles de dificultad, vidas, frases de entrada, frases de derrota y recompensas debe vivir en un JSON de configuración.

La interfaz consume esa configuración y renderiza las pantallas según el estado de partida.

### Estado base

```js
const gameState = {
  player: {
    name: '',
    alias: ''
  },
  currentRivalIndex: 0,
  playerLives: 3,
  totalPrize: 0,
  defeatedRivals: [],
  rewardHistory: [],
  status: 'LAUNCH' // LAUNCH, REGISTERING, INTRO, BATTLE, REWARD, FINAL, COMPLETED
};
```

### Configuración de rivales

```js
const rivals = [
  {
    id: 'little-fizz',
    name: 'Little Fizz',
    alias: 'The Little Fish',
    suit: 'starter',
    image: 'assets/rivals/little-fizz.png',
    introLine: 'I swear I had a feeling...',
    defeatLine: 'Vale... quizá soy más fish que pro.',
    difficulty: 1,
    lives: 1,
    modifier: 0,
    unlocked: true
  },
  {
    id: 'trebol-gordo-mcbubble',
    name: 'Trébol Gordo McBubble',
    alias: 'The Bubble Boss',
    suit: 'clubs',
    image: 'assets/rivals/trebol-gordo-mcbubble.png',
    introLine: 'Cuando me hincho, mejor foldear.',
    defeatLine: 'Se me ha pinchado el farol...',
    difficulty: 2,
    lives: 2,
    modifier: 0.03
  },
  {
    id: 'octavio-diamante',
    name: 'Octavio Diamante',
    alias: 'Eight Hands, One Tell',
    suit: 'diamonds',
    image: 'assets/rivals/octavio-diamante.png',
    introLine: 'Ocho manos, un solo tell. Intenta encontrarlo.',
    defeatLine: 'Ocho manos... y ninguna salvación.',
    difficulty: 3,
    lives: 3,
    modifier: 0.05
  },
  {
    id: 'sharko-spades',
    name: 'Sharko Spades',
    alias: 'The River Predator',
    suit: 'spades',
    image: 'assets/rivals/sharko-spades.png',
    introLine: 'Yo no persigo manos. Cazo rivers.',
    defeatLine: 'El river hoy no tenía dientes.',
    difficulty: 4,
    lives: 3,
    modifier: 0.07
  },
  {
    id: 'fabrizio',
    name: 'Fabrizio',
    alias: 'The Heartbreaker',
    suit: 'hearts',
    image: 'assets/rivals/fabrizio-hearts.png',
    introLine: 'No rompo corazones, rompo tus odds.',
    defeatLine: 'Me has roto el corazón... y el stack.',
    difficulty: 5,
    lives: 4,
    modifier: 0.10
  },
  {
    id: 'el-pirulas',
    name: 'El Pirulas',
    alias: 'Final Hand',
    suit: 'champion',
    image: 'assets/rivals/el-pirulas.png',
    introLine: 'Bienvenido a mi mesa, aquí hasta los ases sudan.',
    defeatLine: 'La última mano era tuya. Hoy la mesa te pertenece.',
    difficulty: 6,
    lives: 5,
    modifier: 0.12,
    finalBoss: true
  }
];
```

---

## 9. Pantallas del prototipo

### 9.1 Launch Screen / Portada

- Imagen hero.
- Título.
- CTA de comienzo.

### 9.2 Register Screen

- Campo de nombre.
- Campo de apodo.
- Botón para entrar al torneo.

### 9.3 Rival Intro Screen

- Imagen del rival.
- Nombre.
- Apodo.
- Frase de entrada.

### 9.4 Battle Screen

- Cartas del jugador.
- Mesa completa.
- Cartas rivales ocultas.
- Vidas.
- Botón **Ir a por ello**.
- Botón **Foldear**.
- Indicador de odds por rangos.

### 9.5 Pot Result Screen

- No revela las cartas del rival.
- Muestra `YOU TAKE THE POT` o `VILLAIN TAKES THE POT`.

### 9.6 Rival Felted Screen

- Frase de derrota del rival.
- Transición a recompensa.

### 9.7 Reward Screen

- Recompensa base.
- Multiplicador.
- Jackpot si ocurre.
- Premio acumulado.

### 9.8 Progress Screen

- Rival derrotado.
- Siguiente rival desbloqueado.
- Premio acumulado.

### 9.9 Final Victory Screen

- Mensaje final de campeón.

---

## 10. Frases y microcopy sugeridos

| Momento | Texto |
|---|---|
| Registro | “Escribe tu nombre. Elige tu apodo. El torneo ya te está mirando.” |
| Decisión | “La mesa está servida. ¿Vas a por ello o tiras la mano?” |
| Fold | “HAND FOLDED. Has cedido medio stack de vida para esperar una mesa mejor.” |
| Pot ganado | “YOU TAKE THE POT.” |
| Pot perdido | “VILLAIN TAKES THE POT.” |
| Rival derrotado | “RIVAL FELTED. El siguiente asiento ya te espera.” |
| Jackpot | “¡JACKPOT! La mesa enmudece. El premio se dispara.” |
| Derrota del jugador | “YOU BUST OUT. No era tu mesa. Vuelve a sentarte.” |
| Victoria final | “Te has convertido en el campeón de SPINHO BEAT THE CHAMPION. Felicidades.” |

---

## 11. Roadmap de desarrollo recomendado

1. **Fase 1 — Documento funcional y definición cerrada de mecánica.**
2. **Fase 2 — Estructura HTML / CSS del prototipo.**
3. **Fase 3 — Implementación del flujo base:** launch, registro, progresión y recompensas.
4. **Fase 4 — Implementación del Battle Screen:** vidas, cartas visibles del jugador, mesa completa y cartas ocultas del rival.
5. **Fase 5 — Implementación de evaluador de manos u odds simplificadas.**
6. **Fase 6 — Implementación de fold -0,5 vidas, pot result y frases de derrota.**
7. **Fase 7 — Pulido de UX, animaciones, microcopy y feedback visual de jackpot.**
8. **Fase 8 — Publicación en GitHub Pages.**

---

## 12. Preguntas abiertas para el agente de IA / diseño

- ¿El daño crítico debe depender de la equity, del ranking de mano o de ambos?
- ¿Las odds deben mostrarse únicamente como etiqueta o también como barra visual?
- ¿Conviene que El Pirulas tenga una habilidad especial adicional o basta con sus 5 vidas?
- ¿El jackpot x1000 puede aparecer contra cualquier rival o debería reservarse para momentos especiales?
- ¿La derrota reinicia el torneo completo o permite repetir desde el rival actual?
- ¿En una versión posterior, las 3 vidas deben resetearse por rival, recuperarse parcialmente o arrastrarse durante todo el torneo?

---

## 13. Criterios de aceptación del prototipo

- El usuario puede acceder a una portada de lanzamiento con el título correcto: **SPINHO BEAT THE CHAMPION**.
- El usuario puede introducir nombre y apodo antes de iniciar el torneo.
- Los rivales aparecen en orden y el siguiente solo se desbloquea tras ganar al anterior.
- Cada rival muestra nombre, apodo, imagen, frase de entrada, frase de derrota, dificultad y vidas.
- Fabrizio utiliza la imagen correcta como rey de corazones.
- El Pirulas aparece como jefe final con panel visual funcional propio.
- El Battle Screen muestra las 2 cartas del jugador y las 5 comunitarias.
- El Battle Screen muestra 2 cartas ocultas del rival y no revela su mano en ningún momento.
- El jugador puede elegir **Ir a por ello** o **Foldear**.
- Foldear resta exactamente **0,5 vidas** al jugador.
- El rival siempre empuja hacia delante y no foldea.
- El sistema de vidas funciona correctamente para jugador y rival.
- El resultado de mano usa mensajes tipo `YOU TAKE THE POT` o `VILLAIN TAKES THE POT`.
- Al derrotar a un rival se muestra su frase de derrota y después la pantalla de recompensa.
- El sistema de premios aplica correctamente el premio base y el multiplicador.
- La probabilidad del jackpot x1000 es aproximadamente del 1%.
- Tras vencer a El Pirulas, aparece la pantalla final de campeón.
- El prototipo es publicable como web estática en GitHub Pages.

---

Documento compilado y actualizado listo para utilizarse como base de desarrollo, prompt para agente de IA, README técnico o especificación de prototipo.
