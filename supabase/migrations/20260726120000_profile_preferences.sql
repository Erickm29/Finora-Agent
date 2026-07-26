-- Preferencias de digest / briefing Wallbit (Sprint 3 Track B).
alter table public.profiles
  add column if not exists preferences jsonb not null default '{}'::jsonb;

comment on column public.profiles.preferences is
  'JSON: digest_enabled, digest_local_time, timezone, last_digest_date';
