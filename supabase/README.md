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

### `public.refresh_daily_challenge()`
Coge el nº1 actual de `scores` y lo fija como rival de hoy (UTC). Si no hay
puntuaciones, deja a El Pirulas (100.000 €) como rival por defecto.

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
