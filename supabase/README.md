# Backend Supabase — SPINHO BEAT THE CHAMPION

Proyecto: **SPINHOBTC** (`gtnkwiufoutimkakcuvw`, región `eu-west-2`).
URL: `https://gtnkwiufoutimkakcuvw.supabase.co`

Este directorio versiona el backend que ya está **aplicado en el proyecto en
producción**. Sirve como fuente de verdad reproducible.

## Esquema

### `public.scores` — leaderboard global
Cada torneo ganado se guarda aquí. El frontend inserta con la *publishable key*
(`js/supabase-config.js`) y lee el top ordenado por `total_prize`.

- RLS: **lectura pública** + **inserción anónima validada** por CHECK (no permite
  editar ni borrar).

### `public.daily_challenge` — rival del desafío diario (Fase 2)
Snapshot del nº1 del leaderboard congelado por día (`challenge_date`, UTC). El
frontend lo lee para el modo "Desafío diario": hay que superar ese premio para
llevarse la corona del día.

- RLS: **lectura pública**. Solo escribe `refresh_daily_challenge()` (security
  definer) o el service role.

### `public.daily_results` — ganadores del Desafío diario
Cada jugador que derrota al campeón del día deja aquí su marca
(`challenge_date`, `player_name`, `alias`, `total_prize`). El frontend muestra
el roster de quién ha batido el reto de hoy.

- RLS: **lectura pública** + **inserción anónima validada** (la política exige
  `challenge_date = hoy (UTC)`, así nadie rellena resultados de otras fechas).

### `public.pro_results` — salón de la fama del Modo Pro
Cada jugador que se pasa el Modo Pro (último en pie en la mesa Spin&Go a 3) deja
aquí su marca (`player_name`, `alias`, `hands`). El frontend muestra el histórico.

- RLS: **lectura pública** + **inserción anónima validada**.

### `public.refresh_daily_challenge()`
Coge el nº1 actual de `scores` **del modo ARCADE** y lo fija como rival de hoy
(UTC). Si no hay puntuaciones, deja a El Pirulas (100.000 €) por defecto.

## Automatización (pg_cron + pg_net)

Ver `cron_jobs.sql`:

- **`daily-challenge-refresh`** — 03:00 UTC diario → `refresh_daily_challenge()`.
- **`supabase-keepalive`** — 02:00 UTC diario → `net.http_get(...)` contra la API
  REST. Es una petición real al gateway, así que evita la pausa por inactividad
  del free-tier.

## Aplicar en un proyecto limpio

```bash
# migraciones (orden por timestamp del nombre)
supabase db push          # o aplicar los .sql de migrations/ en orden
# jobs de cron (una vez)
psql "$DATABASE_URL" -f cron_jobs.sql
```

Las extensiones `pg_cron` y `pg_net` se habilitan en la primera migración de la
Fase 2.
