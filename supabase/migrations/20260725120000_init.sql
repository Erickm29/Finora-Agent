-- Finora schema: Bolivia / BOB (pesos bolivianos)
-- Telegram-first: profiles.id no requiere auth.users (el bot crea UUID propios).
-- Web Auth: el trigger crea profile con el mismo id que auth.users.
-- Apply with Supabase CLI, MCP apply_migration, or SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  display_name text,
  telegram_user_id bigint unique,
  locale text not null default 'es-BO',
  currency text not null default 'BOB',
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  target_amount_bobs numeric not null check (target_amount_bobs > 0),
  target_months int not null check (target_months > 0),
  base_monthly_bobs numeric not null check (base_monthly_bobs > 0),
  accumulated_bobs numeric not null default 0,
  status text not null default 'active'
    check (status in ('active', 'paused', 'completed', 'cancelled')),
  product_url text,
  last_price_check_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goal_transactions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('contribution', 'withdrawal', 'adjustment')),
  amount_bobs numeric not null check (amount_bobs > 0),
  source text not null
    check (source in ('microsaving', 'manual', 'salary_margin', 'change')),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.pending_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  goal_id uuid references public.goals (id) on delete set null,
  kind text not null
    check (kind in ('wallbit_convert', 'apply_microsaving', 'confirm_withdrawal')),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'expired', 'failed')),
  channel_created text not null check (channel_created in ('telegram', 'web')),
  confirm_token text not null unique,
  expires_at timestamptz not null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  channel text not null,
  external_chat_id text not null,
  active_goal_id uuid references public.goals (id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (user_id, channel, external_chat_id)
);

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.conversation_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'tool', 'system')),
  content text not null,
  tool_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.market_snapshots (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  source text not null check (source in ('firecrawl', 'exa')),
  data jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now()
);

create table if not exists public.telegram_link_tokens (
  token text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists goals_user_status_idx on public.goals (user_id, status);
create index if not exists pending_actions_user_status_idx
  on public.pending_actions (user_id, status);
create index if not exists profiles_telegram_user_id_idx
  on public.profiles (telegram_user_id)
  where telegram_user_id is not null;
create index if not exists goal_transactions_goal_created_idx
  on public.goal_transactions (goal_id, created_at desc);
create index if not exists conversation_sessions_user_channel_idx
  on public.conversation_sessions (user_id, channel);

alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.goal_transactions enable row level security;
alter table public.pending_actions enable row level security;
alter table public.conversation_sessions enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.market_snapshots enable row level security;
alter table public.telegram_link_tokens enable row level security;

-- RLS: web (anon/authenticated JWT). API bot usa service role (bypassa RLS).
create policy profiles_select_own on public.profiles
  for select using (
    id = auth.uid() or auth_user_id = auth.uid()
  );
create policy profiles_update_own on public.profiles
  for update using (
    id = auth.uid() or auth_user_id = auth.uid()
  );

create policy goals_all_own on public.goals
  for all using (
    user_id = auth.uid()
    or user_id in (select id from public.profiles where auth_user_id = auth.uid())
  )
  with check (
    user_id = auth.uid()
    or user_id in (select id from public.profiles where auth_user_id = auth.uid())
  );

create policy goal_transactions_all_own on public.goal_transactions
  for all using (
    user_id = auth.uid()
    or user_id in (select id from public.profiles where auth_user_id = auth.uid())
  )
  with check (
    user_id = auth.uid()
    or user_id in (select id from public.profiles where auth_user_id = auth.uid())
  );

create policy pending_actions_all_own on public.pending_actions
  for all using (
    user_id = auth.uid()
    or user_id in (select id from public.profiles where auth_user_id = auth.uid())
  )
  with check (
    user_id = auth.uid()
    or user_id in (select id from public.profiles where auth_user_id = auth.uid())
  );

create policy conversation_sessions_all_own on public.conversation_sessions
  for all using (
    user_id = auth.uid()
    or user_id in (select id from public.profiles where auth_user_id = auth.uid())
  )
  with check (
    user_id = auth.uid()
    or user_id in (select id from public.profiles where auth_user_id = auth.uid())
  );

create policy conversation_messages_all_own on public.conversation_messages
  for all using (
    exists (
      select 1 from public.conversation_sessions s
      where s.id = session_id
        and (
          s.user_id = auth.uid()
          or s.user_id in (select id from public.profiles where auth_user_id = auth.uid())
        )
    )
  )
  with check (
    exists (
      select 1 from public.conversation_sessions s
      where s.id = session_id
        and (
          s.user_id = auth.uid()
          or s.user_id in (select id from public.profiles where auth_user_id = auth.uid())
        )
    )
  );

create policy telegram_link_tokens_all_own on public.telegram_link_tokens
  for all using (
    user_id = auth.uid()
    or user_id in (select id from public.profiles where auth_user_id = auth.uid())
  )
  with check (
    user_id = auth.uid()
    or user_id in (select id from public.profiles where auth_user_id = auth.uid())
  );

-- market_snapshots: readable by authenticated users; writes via service role
create policy market_snapshots_select_auth on public.market_snapshots
  for select to authenticated using (true);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, auth_user_id, display_name)
  values (
    new.id,
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.email)
  )
  on conflict (id) do update
    set auth_user_id = excluded.auth_user_id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
