-- Jobs de pg_cron (Fase 2). Se aplican una sola vez sobre el proyecto; no van
-- como migración porque cron.schedule es idempotente por nombre (re-ejecutar
-- este fichero simplemente re-programa los mismos dos jobs).
--
-- Nota: la clave usada abajo es la publishable key (pública, la misma que el
-- frontend). No es un secreto: la tabla está protegida por RLS.

-- Job 1: refresca el rival del día a las 03:00 UTC (congela el nº1 del día).
select cron.schedule(
  'daily-challenge-refresh',
  '0 3 * * *',
  $$select public.refresh_daily_challenge();$$
);

-- Job 2: auto-ping diario a la API REST a las 02:00 UTC. Es una petición real
-- al gateway de Supabase (no solo actividad interna de BD), de modo que el
-- proyecto free-tier no se pausa por inactividad.
select cron.schedule(
  'supabase-keepalive',
  '0 2 * * *',
  $$select net.http_get(
      url := 'https://gtnkwiufoutimkakcuvw.supabase.co/rest/v1/daily_challenge?select=challenge_date&limit=1',
      headers := jsonb_build_object(
        'apikey', 'sb_publishable__3esNRjWkxZBdDdyN8mn3w_3IpZMLzu',
        'Authorization', 'Bearer sb_publishable__3esNRjWkxZBdDdyN8mn3w_3IpZMLzu'
      )
    );$$
);

-- Para desprogramarlos:
--   select cron.unschedule('daily-challenge-refresh');
--   select cron.unschedule('supabase-keepalive');
