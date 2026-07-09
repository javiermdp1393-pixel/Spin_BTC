-- Salón de la fama del Modo Pro: cada jugador que se pasa el Pro (último en pie
-- en la mesa de 3) deja aquí su marca, con las manos que tardó.
create table if not exists public.pro_results (
  id          uuid primary key default gen_random_uuid(),
  player_name text not null check (char_length(player_name) between 1 and 40),
  alias       text check (alias is null or char_length(alias) <= 40),
  hands       integer check (hands is null or (hands >= 0 and hands <= 100000)),
  created_at  timestamptz not null default now()
);

create index if not exists pro_results_created_idx on public.pro_results (created_at desc);

alter table public.pro_results enable row level security;

drop policy if exists pro_results_public_read on public.pro_results;
create policy pro_results_public_read
  on public.pro_results for select to public using (true);

drop policy if exists pro_results_anon_insert on public.pro_results;
create policy pro_results_anon_insert
  on public.pro_results for insert to anon
  with check (
    char_length(player_name) between 1 and 40
    and (alias is null or char_length(alias) <= 40)
    and (hands is null or (hands >= 0 and hands <= 100000))
  );
