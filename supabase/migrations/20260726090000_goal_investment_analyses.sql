-- Análisis de inversión por meta: se genera al crear la meta (Telegram o web)
-- y se reutiliza desde el dashboard sin volver a golpear Firecrawl/Exa.

create table if not exists public.goal_investment_analyses (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null unique references public.goals (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'ready', 'failed')),
  content jsonb,
  sources jsonb not null default '[]'::jsonb,
  provider text,
  model text,
  error text,
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goal_investment_analyses_user_idx
  on public.goal_investment_analyses (user_id, updated_at desc);

-- Lecturas de caché: última foto fresca por (query, source).
create index if not exists market_snapshots_query_source_idx
  on public.market_snapshots (query, source, fetched_at desc);

alter table public.goal_investment_analyses enable row level security;

create policy goal_investment_analyses_all_own on public.goal_investment_analyses
  for all using (
    user_id = auth.uid()
    or user_id in (select id from public.profiles where auth_user_id = auth.uid())
  )
  with check (
    user_id = auth.uid()
    or user_id in (select id from public.profiles where auth_user_id = auth.uid())
  );
