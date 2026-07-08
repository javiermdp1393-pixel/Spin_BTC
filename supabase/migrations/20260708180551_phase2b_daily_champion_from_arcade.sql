-- El campeón del día pasa a ser el nº1 del ranking ARCADE en concreto (antes
-- era el nº1 global). Si no hay puntuaciones Arcade, El Pirulas por defecto.
-- (El Desafío diario usa reglas Arcade, así que su campeón sale del top Arcade.)
create or replace function public.refresh_daily_challenge()
returns public.daily_challenge
language plpgsql
security definer
set search_path = public
as $$
declare
  top_score public.scores%rowtype;
  today     date := (now() at time zone 'utc')::date;
  result    public.daily_challenge%rowtype;
begin
  select * into top_score
  from public.scores
  where mode = 'ARCADE'
  order by total_prize desc, created_at asc
  limit 1;

  insert into public.daily_challenge as dc
    (challenge_date, player_name, alias, total_prize, mode, source_score_id, created_at)
  values (
    today,
    coalesce(top_score.player_name, 'El Pirulas'),
    coalesce(top_score.alias, 'Final Hand'),
    coalesce(top_score.total_prize, 100000),
    coalesce(top_score.mode, 'ARCADE'),
    top_score.id,
    now()
  )
  on conflict (challenge_date) do update
    set player_name     = excluded.player_name,
        alias           = excluded.alias,
        total_prize     = excluded.total_prize,
        mode            = excluded.mode,
        source_score_id = excluded.source_score_id,
        created_at      = now()
  returning dc.* into result;

  return result;
end;
$$;

revoke all on function public.refresh_daily_challenge() from public, anon, authenticated;
