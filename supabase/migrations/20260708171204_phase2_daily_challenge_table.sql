-- Snapshot diario del "rival del desafío": el nº1 del leaderboard congelado
-- para todo el día. Una fila por fecha (UTC). Lectura pública; solo la
-- función refresh (security definer) o el service role escriben.
create table if not exists public.daily_challenge (
  challenge_date  date primary key default (now() at time zone 'utc')::date,
  player_name     text not null check (char_length(player_name) between 1 and 40),
  alias           text check (alias is null or char_length(alias) <= 40),
  total_prize     bigint not null check (total_prize >= 0 and total_prize <= 100000000),
  mode            text check (mode = any (array['ARCADE','FREEZEOUT'])),
  source_score_id uuid references public.scores(id) on delete set null,
  created_at      timestamptz not null default now()
);

alter table public.daily_challenge enable row level security;

drop policy if exists daily_challenge_public_read on public.daily_challenge;
create policy daily_challenge_public_read
  on public.daily_challenge
  for select
  to public
  using (true);
