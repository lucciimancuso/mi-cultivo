-- =====================================================================
-- Mi Cultivo · borrar mi cuenta
-- Pegalo entero en: Supabase > SQL Editor > New query > Run
-- Se puede correr más de una vez sin romper nada.
-- Es lo que usa el botón "Borrar mi cuenta" (Ajustes > Cuenta y grupo).
--
-- Qué hace:
--  * Quien creó el grupo y todavía tiene gente en él: no puede borrarse (primero tiene que sacar a los demás o borrar el grupo).
--  * Quien creó el grupo y está solo: se borra el grupo (plantas, historial) y la cuenta. Las fotos las borra la app antes de llamar a esto.
--  * Un miembro común: sale del grupo y se borra la cuenta. Lo que cargó queda en el grupo.
--  * p_dry = true solo revisa que se pueda, sin borrar nada (la app lo usa antes de borrar las fotos).
-- Al borrar la cuenta se borran también sus avisos del celu (push_subs y push_plan) por las claves en cascada.
-- =====================================================================

create or replace function public.delete_my_account(p_dry boolean default false)
returns void language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  m public.grow_members%rowtype;
  cnt int;
begin
  if uid is null then raise exception 'Tenés que iniciar sesión'; end if;
  select * into m from public.grow_members where user_id = uid;
  if found then
    select count(*) into cnt from public.grow_members where grow_id = m.grow_id;
    if m.role = 'owner' and cnt > 1 then
      raise exception 'Sos quien creó el grupo: primero sacá a los demás o borrá el grupo';
    end if;
  end if;
  if p_dry then return; end if;
  if found and m.role = 'owner' then
    delete from public.grows where id = m.grow_id;   -- se lleva grow_members, grow_state y grow_rev
  end if;
  delete from public.join_attempts where user_id = uid;
  delete from public.ai_usage where user_id = uid;
  delete from auth.users where id = uid;              -- se lleva grow_members (si era miembro), push_subs y push_plan
end $$;

revoke all on function public.delete_my_account(boolean) from public, anon, authenticated;
grant execute on function public.delete_my_account(boolean) to authenticated;
