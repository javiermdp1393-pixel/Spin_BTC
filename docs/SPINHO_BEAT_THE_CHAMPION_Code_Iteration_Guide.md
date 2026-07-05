# SPINHO BEAT THE CHAMPION

**Guía breve de iteración para agente de code**  
Referencia de implementación MVP — flujo, pantallas, estado y criterios de validación

---

## Objetivo de esta guía

Construir primero una **vertical slice jugable de principio a fin**.

La prioridad no es que la lógica de póker sea perfecta en la primera iteración, sino que el flujo completo funcione:

1. portada;
2. registro;
3. presentación de rival;
4. mano;
5. decisión;
6. resolución;
7. recompensa;
8. avance al siguiente rival;
9. pantalla final.

Una vez que ese flujo sea estable, se podrán mejorar visuales, balance, odds, animaciones, assets y dificultad.

---

## 1. Pantalla de portada + registro

La portada funciona como entrada narrativa y primer contacto con la identidad del juego.

### Pantalla de portada

Debe incluir como mínimo:

- título: **SPINHO BEAT THE CHAMPION**;
- imagen hero del torneo;
- botón principal: `Start Tournament` o `Comenzar`.

### Pantalla de registro

Después de pulsar comenzar, el jugador debe introducir:

- `Player name`;
- `Poker nickname`.

### Validación mínima

- No permitir comenzar si alguno de los campos está vacío.
- Guardar ambos valores en `gameState.player`.
- Mostrar nombre o apodo del jugador durante el combate.

### Estado inicial sugerido

```js
const gameState = {
  status: 'LAUNCH',
  player: {
    name: '',
    alias: ''
  },
  currentRivalIndex: 0,
  playerLives: 3,
  totalPrize: 0,
  rewardHistory: []
};
```

### Criterio de validación

El usuario puede abrir la app, pulsar comenzar, introducir nombre y apodo, y pasar a la presentación del primer rival.

---

## 2. Render de rival

Cada rival debe renderizarse desde datos, no hardcodeado en el HTML.

Esto permite cambiar imágenes, textos, dificultad y vidas sin tocar la lógica del juego.

### Datos mínimos por rival

Cada rival debe tener:

- `id`;
- `name`;
- `alias`;
- `image`;
- `introLine`;
- `defeatLine`;
- `lives`;
- `modifier` opcional;
- `finalBoss` opcional.

### Orden de rivales

1. Little Fizz — The Little Fish — 1 vida.
2. Trébol Gordo McBubble — The Bubble Boss — 2 vidas.
3. Octavio Diamante — Eight Hands, One Tell — 3 vidas.
4. Sharko Spades — The River Predator — 3 vidas.
5. Fabrizio — The Heartbreaker — 4 vidas.
6. El Pirulas — Final Hand — 5 vidas.

### Pantalla de intro de rival

Debe mostrar:

- imagen del rival;
- nombre;
- apodo;
- vidas;
- frase de entrada;
- botón para iniciar combate.

### Criterio de validación

Al avanzar por el juego, cada rival aparece con sus datos correctos y su frase de entrada antes del combate.

---

## 3. Motor de mano

La mano se genera completa desde el inicio.

### Reglas visuales

- El jugador ve sus **2 cartas**.
- El jugador ve las **5 cartas comunitarias**.
- El rival aparece con **2 cartas ocultas**.
- No se revela la mano del rival durante la resolución.

### Implementación mínima

1. Crear una baraja estándar de 52 cartas.
2. Barajar la baraja.
3. Repartir 2 cartas al jugador.
4. Repartir 5 cartas comunitarias.
5. Mostrar 2 placeholders de cartas ocultas para el rival.
6. Calcular una lectura de fuerza/equity simplificada.

### Nota importante

Aunque internamente se pueda simular una mano rival o calcular probabilidades, en la UI del MVP la mano rival debe seguir oculta.

### Criterio de validación

Cada nueva mano muestra correctamente 2 cartas del jugador, 5 comunitarias y 2 cartas ocultas para el rival.

---

## 4. Odds simplificadas y rangos de lectura

No conviene mostrar un porcentaje exacto en la UI inicial. Es mejor mostrar una lectura por rangos.

Internamente sí puede existir un `winChance` numérico para resolver la mano.

### Rangos recomendados

| Rango interno aproximado | Etiqueta UI | Significado |
|---:|---|---|
| 0% – 30% | Dead Hand | Muy mala situación |
| 30% – 45% | Risky Call | Mano débil |
| 45% – 55% | Coin Flip | Situación equilibrada |
| 55% – 70% | Playable Spot | Buena oportunidad |
| 70% – 85% | Strong Spot | Mano fuerte |
| 85% – 100% | Monster Hand | Situación excelente |

### Implementación inicial recomendada

Para no bloquear el MVP, se puede empezar con una función aproximada por ranking de mano y después mejorarla.

Primera versión aceptable:

- evaluar la mejor mano del jugador con sus 2 cartas y las 5 comunitarias;
- asignar un `winChance` aproximado según fuerza de mano;
- aplicar modificador de dificultad del rival;
- limitar el resultado entre 10% y 90%.

### Ejemplo simplificado

```js
function getFinalWinChance(baseWinChance, rivalModifier) {
  return clamp(baseWinChance - rivalModifier, 0.10, 0.90);
}
```

### Mejora futura

Calcular equity real contra todas las posibles combinaciones de 2 cartas rivales desconocidas.

### Criterio de validación

El Battle Screen muestra una etiqueta cualitativa de odds y la resolución usa un valor interno de probabilidad.

---

## 5. Decisión del jugador

El jugador tiene **3 vidas** al comenzar cada enfrentamiento.

La decisión principal es si acepta la mano o paga un coste para retirarse.

### Acciones

| Acción | Resultado |
|---|---|
| `Push / Go for it` | Resuelve la mano usando `winChance` |
| `Fold` | Resta 0,5 vidas y genera una nueva mano |

### Reglas

- Si el jugador gana el push, el rival pierde 1 vida.
- Si el jugador pierde el push, el jugador pierde 1 vida.
- Si el jugador foldea, pierde 0,5 vidas.
- Si el jugador llega a 0 vidas, se produce `YOU BUST OUT`.
- Al empezar un nuevo rival, el jugador vuelve a 3 vidas.

### Motivo del coste de fold

El fold no debe ser gratuito porque el jugador podría descartar manos indefinidamente hasta encontrar siempre una mano favorable.

El coste de 0,5 vidas crea una decisión intermedia:

- foldear no mata directamente;
- pero abusar del fold sí puede dejar al jugador sin margen.

### Criterio de validación

El jugador puede pushear o foldear. Foldear resta exactamente 0,5 vidas y genera una nueva mano.

---

## 6. Resolución y terminología

La resolución debe sentirse de póker, aunque el sistema sea arcade.

Usar textos cortos, visuales y reutilizables.

### Textos recomendados

| Evento | Texto |
|---|---|
| El jugador gana la mano | `YOU TAKE THE POT` |
| El rival gana la mano | `VILLAIN TAKES THE POT` |
| El jugador foldea | `HAND FOLDED` |
| El jugador pierde el combate | `YOU BUST OUT` |
| El rival es derrotado | `RIVAL FELTED` |
| Jackpot | `JACKPOT` |
| Victoria final | `CHAMPION CROWNED` |

### Pseudocódigo

```js
function resolvePush(winChance) {
  const playerWins = Math.random() <= winChance;

  if (playerWins) {
    currentRival.currentLives -= 1;
    return 'YOU_TAKE_THE_POT';
  }

  gameState.playerLives -= 1;
  return 'VILLAIN_TAKES_THE_POT';
}

function foldHand() {
  gameState.playerLives -= 0.5;

  if (gameState.playerLives <= 0) {
    return 'YOU_BUST_OUT';
  }

  return dealNewHand();
}
```

### Criterio de validación

Después de cada acción, la UI muestra un resultado claro y actualiza correctamente las vidas.

---

## 7. Progresión, recompensa y final

Al derrotar a un rival:

1. Se muestra `RIVAL FELTED`.
2. Se muestra la frase de derrota específica del rival.
3. Se lanza el premio.
4. Se suma al premio acumulado.
5. Se desbloquea el siguiente rival.
6. Se ofrece botón `Next Table` o equivalente.

### Reglas de recompensa

- Premio base por rival: **100.000 EUR**.
- Multiplicador normal: **x2–x10**.
- Probabilidad de multiplicador normal: **99%**.
- Jackpot: **x1000**.
- Probabilidad de jackpot: **1%**.

### Pseudocódigo de recompensa

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

### Final del juego

Tras derrotar a **El Pirulas**, mostrar pantalla final con el texto:

> “Te has convertido en el campeón de SPINHO BEAT THE CHAMPION. Felicidades.”

### Criterio de validación

Se puede avanzar de rival en rival, recibir recompensa tras cada victoria y llegar a la pantalla final tras vencer a El Pirulas.

---

## 8. Checklist para primera vertical slice

La primera vertical slice debería cumplir:

- [ ] Se puede completar una partida de principio a fin con datos mock si hace falta.
- [ ] Existe pantalla de portada.
- [ ] Existe registro de nombre y apodo.
- [ ] Cada rival se renderiza desde datos.
- [ ] Cada rival muestra intro line y defeat line.
- [ ] Los rivales tienen vidas 1, 2, 3, 3, 4 y 5.
- [ ] El jugador empieza cada rival con 3 vidas.
- [ ] El jugador ve sus 2 cartas.
- [ ] El jugador ve las 5 comunitarias.
- [ ] El rival aparece siempre con 2 cartas ocultas.
- [ ] El fold resta 0,5 vidas y genera nueva mano.
- [ ] El push resuelve con `winChance` y actualiza vidas.
- [ ] El resultado usa textos tipo `YOU TAKE THE POT` o `VILLAIN TAKES THE POT`.
- [ ] Al derrotar a un rival se muestra `RIVAL FELTED`.
- [ ] El premio se calcula al derrotar cada rival.
- [ ] El premio acumulado se actualiza correctamente.
- [ ] La pantalla final aparece tras vencer a El Pirulas.

---

## 9. Orden recomendado de implementación

### Iteración 1 — Skeleton de navegación

Implementar solo:

- portada;
- registro;
- intro de rival;
- pantalla de combate vacía;
- transición entre pantallas.

Objetivo: validar navegación y estados.

---

### Iteración 2 — Datos y render de rivales

Implementar:

- array de rivales;
- render dinámico;
- imagen;
- nombre;
- apodo;
- frase de entrada;
- vidas.

Objetivo: validar progresión de jefes.

---

### Iteración 3 — Motor de mano básico

Implementar:

- baraja;
- shuffle;
- reparto de cartas;
- cartas del jugador;
- mesa completa;
- cartas ocultas del rival.

Objetivo: validar que cada mano se genera correctamente.

---

### Iteración 4 — Acciones Push/Fold

Implementar:

- botón push;
- botón fold;
- coste de fold;
- pérdida de vida por derrota;
- pérdida de vida del rival por victoria.

Objetivo: validar el loop de combate.

---

### Iteración 5 — Odds simplificadas

Implementar:

- cálculo inicial de `winChance`;
- etiqueta cualitativa;
- modificadores por rival;
- clamp entre 10% y 90%.

Objetivo: que las decisiones tengan algo de lectura estratégica.

---

### Iteración 6 — Recompensas y progreso

Implementar:

- `RIVAL FELTED`;
- frase de derrota;
- premio base;
- multiplicador;
- jackpot;
- premio acumulado;
- transición al siguiente rival.

Objetivo: completar el loop de avance.

---

### Iteración 7 — Final del juego

Implementar:

- detección de derrota de El Pirulas;
- pantalla final;
- texto de campeón;
- resumen de premio acumulado si procede.

Objetivo: completar la vertical slice.

---

### Iteración 8 — Pulido visual y UX

Implementar:

- animaciones simples;
- feedback visual de vidas;
- feedback de jackpot;
- mejora de transiciones;
- ajustes de responsive;
- revisión para GitHub Pages.

Objetivo: hacer que el MVP se sienta más acabado.

---

## 10. Criterios técnicos

- Mantener el código simple y entendible.
- No introducir frameworks si no son necesarios.
- Separar datos, estado, lógica y renderizado.
- Preparar el proyecto para GitHub Pages.
- Usar nombres de variables claros.
- Evitar sobreoptimizar.
- No bloquear el avance por querer implementar un motor perfecto de Texas Hold’em.
- Encapsular la lógica de odds para mejorarla más adelante.
- Dejar comentarios solo donde ayuden a entender la lógica.

---

## 11. Prompt corto recomendado para el agente de code

```text
Lee primero los documentos de /docs:
- SPINHO_BEAT_THE_CHAMPION_Functional_Brief_MVP_v03.md
- SPINHO_BEAT_THE_CHAMPION_Code_Iteration_Guide.md

Con base en ellos, implementa la primera versión jugable del MVP de SPINHO BEAT THE CHAMPION.

Prioriza flujo completo: portada, registro, rivales secuenciales, combate simplificado, fold con coste de 0,5 vidas, odds cualitativas, recompensas, multiplicador y pantalla final.

Mantén el código simple, sin frameworks salvo que el repo ya los use, y preparado para GitHub Pages.
```

---

Fin del documento — guía de apoyo para agente de code.
