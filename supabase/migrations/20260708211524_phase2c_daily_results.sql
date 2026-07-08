-- Ganadores del Desafío diario: cada jugador que derrota al campeón del día
-- deja aquí su marca. Se muestra el roster de quién ha batido el reto de hoy.
create table if not exists public.daily_results (
  id             uuid primary key default gen_random_uuid(),
  challenge_date date not null default (now() at time zone 'utc')::date,
  player_name    text not null check (char_length(player_name) between 1 and 40),
  alias          text check (alias is null or char_length(alias) <= 40),
  total_prize    bigint not null check (total_prize >= 0 and total_prize <= 100000000),
  created_at     timestamptz not null default now()
);

create index if not exists daily_results_date_idx on public.daily_results (challenge_date, total_prize desc);

alter table public.daily_results enable row level security;

drop policy if exists daily_results_public_read on public.daily_results;
create policy daily_results_public_read
  on public.daily_results
  for select
  to public
  using (true);

-- Inserción anónima validada. La política (a diferencia de un CHECK de columna)
-- sí puede usar now(): solo se admiten marcas del día en curso (UTC), así nadie
-- rellena resultados de otras fechas.
drop policy if exists daily_results_anon_insert on public.daily_results;
create policy daily_results_anon_insert
  on public.daily_results
  for insert
  to anon
  with check (
    char_length(player_name) between 1 and 40
    and (alias is null or char_length(alias) <= 40)
    and total_prize >= 0 and total_prize <= 100000000
    and challenge_date = (now() at time zone 'utc')::date
  );
