-- Leaderboard global. Cada torneo ganado se guarda aquí y el ranking se lee
-- compartido entre dispositivos. RLS: lectura pública + inserción anónima
-- validada por CHECK (la publishable key del frontend solo puede insertar
-- filas bien formadas; no puede editar ni borrar).
create table if not exists public.scores (
  id            uuid primary key default gen_random_uuid(),
  player_name   text not null check (char_length(player_name) between 1 and 40),
  alias         text check (alias is null or char_length(alias) <= 40),
  total_prize   bigint not null check (total_prize >= 0 and total_prize <= 100000000),
  mode          text not null check (mode = any (array['ARCADE','FREEZEOUT'])),
  rival_reached text check (rival_reached is null or char_length(rival_reached) <= 60),
  created_at    timestamptz not null default now()
);

alter table public.scores enable row level security;

drop policy if exists scores_public_read on public.scores;
create policy scores_public_read
  on public.scores
  for select
  to public
  using (true);

drop policy if exists scores_anon_insert on public.scores;
create policy scores_anon_insert
  on public.scores
  for insert
  to anon
  with check (
    char_length(player_name) between 1 and 40
    and (alias is null or char_length(alias) <= 40)
    and mode = any (array['ARCADE','FREEZEOUT'])
    and total_prize >= 0 and total_prize <= 100000000
  );
