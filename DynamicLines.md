# SPINHO BEAT THE CHAMPION — Rival Dynamic Lines

This file contains the dynamic dialogue lines for the six rivals in **SPINHO BEAT THE CHAMPION**.

Suggested usage:
- `nearDefeat`: trigger when the rival is close to losing (for example, 1 life or less remaining).
- `nearVictory`: trigger when the rival is close to winning (for example, the player has 1 life or less remaining).

## JSON-ready object

```js
const rivalDynamicLines = {
  littleFizz: {
    nearDefeat: [
      "Espera... ¿eso era buena mano?",
      "Me está entrando agua en las odds...",
      "Creo que esta vez el fish soy yo."
    ],
    nearVictory: [
      "¡Ey! Igual no era tan fish como parecía.",
      "Te veo nervioso... ¿foldeamos o qué?",
      "Una mano más y te mando al acuario."
    ]
  },

  mcBubble: {
    nearDefeat: [
      "No puede ser... me estoy desinflando.",
      "La burbuja me acaba de explotar en la cara.",
      "Vale, vale... quizá me he hinchado demasiado."
    ],
    nearVictory: [
      "Estoy a punto de reventar esta mesa.",
      "Presión máxima. Bienvenido a la burbuja.",
      "Una decisión mala más y haces pop."
    ]
  },

  octavioDiamante: {
    nearDefeat: [
      "Ocho manos... y ninguna salida.",
      "Este diamante empieza a agrietarse.",
      "No puede ser. He perdido el tell."
    ],
    nearVictory: [
      "Tengo ocho formas distintas de ganarte.",
      "Cada carta que ves ya la había calculado.",
      "Tu mano tiembla. Mis tentáculos no."
    ]
  },

  sharkoSpades: {
    nearDefeat: [
      "El river... me ha traicionado.",
      "No sangro. Solo espero la siguiente mano.",
      "Un tiburón herido sigue mordiendo."
    ],
    nearVictory: [
      "Huele a bust out.",
      "Estás nadando demasiado lejos de la orilla.",
      "En el river no se juega. Se sobrevive."
    ]
  },

  fabrizio: {
    nearDefeat: [
      "Cuidado... aún puedo romperte el corazón.",
      "No esperaba que tus odds fueran tan elegantes.",
      "Mi corazón sigue latiendo. Tu stack, no sé."
    ],
    nearVictory: [
      "Qué pena. Empezabas a caerme bien.",
      "Voy a ganarte con estilo, como debe ser.",
      "Esto no es una derrota. Es una ruptura."
    ]
  },

  elPirulas: {
    nearDefeat: [
      "Interesante... hacía tiempo que no sudaba.",
      "No cantes victoria. La última mano aún es mía.",
      "Has llegado lejos. Ahora demuestra que no fue suerte."
    ],
    nearVictory: [
      "Te queda una vida y demasiadas dudas.",
      "Esto no es el final del torneo. Es el final de tu historia."
    ]
  }
};
```

## Notes

- Keys are already written in a JavaScript-friendly format.
- If needed, these lines can be split later into separate locale files.
- Recommended trigger thresholds:
  - `nearDefeat`: rival life `<= 1`
  - `nearVictory`: player life `<= 1`

