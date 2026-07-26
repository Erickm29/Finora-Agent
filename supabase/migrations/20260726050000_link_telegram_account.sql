-- Vinculación real entre la cuenta web y Telegram.
--
-- El bot crea un perfil propio la primera vez que alguien le escribe
-- (profiles.telegram_user_id). Si esa persona después vincula desde el
-- dashboard, `update profiles set telegram_user_id = ...` choca contra la
-- constraint unique y la vinculación falla, dejando las metas creadas por el
-- bot huérfanas en un perfil que la web nunca ve.
--
-- Esta función absorbe el perfil del bot dentro del perfil web en una sola
-- transacción: mueve metas, transacciones, acciones pendientes y sesiones de
-- conversación, y recién entonces libera y reasigna el telegram_user_id.

create or replace function public.link_telegram_account(
  p_user_id uuid,
  p_telegram_id bigint,
  p_display_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bot_profile_id uuid;
begin
  select id into v_bot_profile_id
  from public.profiles
  where telegram_user_id = p_telegram_id;

  if v_bot_profile_id is not null and v_bot_profile_id = p_user_id then
    return p_user_id;
  end if;

  insert into public.profiles (id, display_name)
  values (p_user_id, p_display_name)
  on conflict (id) do nothing;

  if v_bot_profile_id is not null then
    -- Se libera la constraint unique antes de reasignar el id de Telegram.
    update public.profiles
    set telegram_user_id = null
    where id = v_bot_profile_id;

    update public.goals set user_id = p_user_id where user_id = v_bot_profile_id;
    update public.goal_transactions set user_id = p_user_id where user_id = v_bot_profile_id;
    update public.pending_actions set user_id = p_user_id where user_id = v_bot_profile_id;

    -- conversation_sessions es unique (user_id, channel, external_chat_id):
    -- si el perfil web ya tiene una sesión equivalente, la del bot se descarta.
    delete from public.conversation_sessions as old
    where old.user_id = v_bot_profile_id
      and exists (
        select 1
        from public.conversation_sessions as keep
        where keep.user_id = p_user_id
          and keep.channel = old.channel
          and keep.external_chat_id = old.external_chat_id
      );

    update public.conversation_sessions
    set user_id = p_user_id
    where user_id = v_bot_profile_id;

    delete from public.telegram_link_tokens where user_id = v_bot_profile_id;
    delete from public.profiles where id = v_bot_profile_id;
  end if;

  update public.profiles
  set telegram_user_id = p_telegram_id,
      display_name = coalesce(display_name, p_display_name)
  where id = p_user_id;

  return p_user_id;
end;
$$;

-- Solo la API (service role) vincula cuentas; el cliente web nunca la llama.
revoke all on function public.link_telegram_account(uuid, bigint, text) from public;
revoke all on function public.link_telegram_account(uuid, bigint, text) from anon;
revoke all on function public.link_telegram_account(uuid, bigint, text) from authenticated;

create index if not exists telegram_link_tokens_user_idx
  on public.telegram_link_tokens (user_id);
