# Modo Pro (v1.1) — Spin&Go a 3 · Especificación

> Estado: **diseño cerrado**. El winrate objetivo es **~10%** y se calibrará por
> simulación Monte Carlo (como el Desafío diario).

## 1. Concepto

Póker más realista en formato **Spin&Go de 3 jugadores**: tú + **El Pirulas** +
el **campeón del día** (nº1 del ranking Arcade). En vez de mostrar las 5
comunitarias de golpe, se juega **por calles** (preflop → flop → turn → river)
con rondas de apuestas reales. Los corazones funcionan como **fichas**.

- **Condición de victoria**: ser el **último en pie** (los dos rivales a 0
  corazones). Los rivales también se enfrentan y se desgastan entre sí.
- **Sin skill artificial**: los rivales juegan **la mano que les toca** (su
  equity real), no hay handicap de "mejorar su mano".

## 2. Mesa, asientos y ciegas

- 3 asientos con **botón (D)**, **ciega pequeña (SB)** y **ciega grande (BB)**
  que **rotan** cada mano.
- Ciegas forzadas en el preflop:
  - **SB = 1/5** de corazón.
  - **BB = 1/4** de corazón.
  - Botón: no postea.

## 3. Economía (corazones = fichas, suma cero)

- Todo lo apostado va al **bote**; el ganador de la mano se lleva el bote en
  corazones. Es **suma cero**: si ganas una mano de 1 corazón apostado, robas
  exactamente 1 corazón al perdedor.
- **Foldear**: pierdes lo que ya hayas metido en el bote esta mano (no pagas
  más) y quedas fuera de la mano.
- **Apuesta mínima por calle** (unidad base al abrir apuesta):
  | Calle | Unidad de apuesta |
  |---|---|
  | Preflop | igualar la BB (1/4) |
  | Flop | 1/5 |
  | Turn | 1/4 |
  | River | 1/4 |
- **Vidas de inicio: 5** corazones cada jugador.
- **Escalada**: a partir de la **mano 5**, **solo las ciegas** suben +1/4 (SB y
  BB), para acelerar de forma orgánica sin tocar las apuestas de cada calle.

## 4. Ronda de apuestas por calle

Acciones del jugador (y de los rivales):

- **CHECK**: pasar sin apostar, cuando nadie ha apostado por delante. No
  renuncias a la mano; se avanza de calle si todos pasan.
- **PAGAR (CALL)**: igualar la apuesta actual.
- **DOBLAR (RAISE)**: subir la apuesta (2× la apuesta vigente).
- **FOLD**: retirarte (pierdes lo apostado).
- **ALL-IN**: empujar **todos** tus corazones.

Una calle termina cuando todos los activos han igualado la mayor apuesta (o han
pasado en cadena). Tras el river hay **showdown**: gana la mejor mano de 5; en
empate se reparte el bote.

**All-in con stacks distintos**: se simplifica igualando **solo hasta el stack
menor** (sin botes secundarios complejos); el sobrante no cubierto se devuelve.

## 5. IA de los rivales (por equity)

Los rivales **siempre ven el flop** (no foldean preflop). A partir del flop
deciden según su **equity estimada** (Monte Carlo contra manos aleatorias del
resto + board):

- **< 25%** → **FOLD** si hay apuesta que pagar; **CHECK** si es gratis.
- **25%–60%** → van a **turn y river**: pagan/pasan, sin subir fuerte.
- **> 60%** → **ALL-IN**.
- **Frente a un ALL-IN**: el rival **paga si su equity ≥ 40%**, **foldea si es
  menor** (regla propia para responder a un all-in).

## 6. Recompensa / satélite (sin sistema de usuarios)

- **Bonus x2 al siguiente Arcade**: al ganar el Pro se guarda un "ticket x2" en
  `localStorage`. **No caduca**. En la próxima run de Arcade **duplica el prize
  money de toda la run** y se consume al terminarla.
  - **Excepción**: los **jackpots/pelotazos** de la ruleta (JACKPOT ×1000,
    MEGA ×200/×100/×50) **se mantienen tal cual** (no se les aplica el x2); un
    ×2000 sería una locura. El x2 solo dobla los premios **normales** (×2–×10).
  - *Limitación honesta*: es por-dispositivo y borrable (localStorage).
- **Salón de la fama del Pro**: tabla `pro_results` en Supabase (misma idea que
  `daily_results`), histórico global de quién se ha pasado el modo Pro.

## 7. Interfaz (mesa de 3)

- **Franja superior**: los 2 rivales en paralelo (miniatura + corazones +
  apuesta + badge `D`/`SB`/`BB` y estado `PIENSA`/`PAGA`/`ALL-IN`/`FOLD`).
- **Centro**: **BOTE** en corazones, comunitarias por calle, etiqueta de calle y
  `Ronda X · Ciegas Y` (rojo al escalar en la mano 5).
- **Franja inferior (tú)**: tus 2 cartas, corazones, apuesta, equity estimada y
  botones **CHECK / PAGAR / DOBLAR / FOLD / ALL-IN**.
- **Pacing**: las jugadas de la IA se muestran **una a una** con delay y
  etiqueta en su asiento, para seguir la acción multivía.
- **Transferencia de corazones** animada del perdedor al ganador al cerrar mano.
- **Eliminación**: rival a 0 = `FUERA`; la mesa colapsa a 1v1.

## 8. Calibración

Objetivo de winrate: **~10%**. Se ajustará por simulación (vidas de inicio,
tamaño de ciegas/apuestas, umbrales de la IA).

## 9. Fases de construcción

1. **Motor** headless (manos, calles, apuestas, all-in, showdown, transferencia
   de corazones, eliminación) + harness de simulación.
2. **IA** por equity y calibración del winrate a ~10%.
3. **UI** de la mesa de 3 + pacing de la acción.
4. **Recompensa**: ticket x2 en localStorage + tabla `pro_results` y salón de la
   fama en Supabase.
