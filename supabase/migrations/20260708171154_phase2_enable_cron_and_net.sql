-- Fase 2: extensiones para el cron diario y el keep-alive.
-- pg_cron programa jobs dentro de Postgres; pg_net permite hacer peticiones
-- HTTP salientes (para el auto-ping que mantiene el proyecto free-tier despierto).
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
