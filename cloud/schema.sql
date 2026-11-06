-- =====================================================================
-- Mi Cultivo · esquema de Supabase
-- Pegalo entero en: Supabase > SQL Editor > New query > Run
-- Se puede correr más de una vez sin romper nada.
-- Idea de seguridad: NADIE escribe directo en las tablas. Todo pasa por
-- funciones que revisan quién sos y a qué grupo pertenecés (RLS + RPC).
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- tablas ----------
create table if not exists public.grows (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 40),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  invite_code text not null unique,
  created_at  timestamptz not null default now()
);

create table if not exists public.grow_members (
  grow_id      uuid not null references public.grows(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null default 'member' check (role in ('owner','member')),
  display_name text not null check (char_length(display_name) between 1 and 30),
  joined_at    timestamptz not null default now(),
  primary key (grow_id, user_id),
  unique (user_id)                       -- una persona, un grupo
);

create table if not exists public.grow_state (
  grow_id    uuid primary key references public.grows(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  rev        bigint not null default 0,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

-- tabla chiquita que solo avisa "hay una versión nueva" (para tiempo real)
create table if not exists public.grow_rev (
  grow_id    uuid primary key references public.grows(id) on delete cascade,
  rev        bigint not null default 0,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create table if not exists public.join_attempts (
  user_id uuid not null,
  at      timestamptz not null default now()
);
create index if not exists join_attempts_idx on public.join_attempts (user_id, at);

create table if not exists public.ai_usage (
  user_id uuid not null,
  day     date not null default current_date,
  n       int  not null default 0,
  primary key (user_id, day)
);

alter table public.grows         enable row level security;
alter table public.grow_members  enable row level security;
alter table public.grow_state    enable row level security;
alter table public.grow_rev      enable row level security;
alter table public.join_attempts enable row level security;
alter table public.ai_usage      enable row level security;

-- nadie escribe directo: se sacan todos los permisos de escritura
revoke all on public.grows, public.grow_members, public.grow_state, public.grow_rev,
              public.join_attempts, public.ai_usage from anon, authenticated;
grant select on public.grows, public.grow_members, public.grow_state, public.grow_rev to authenticated;

-- ---------- ayudas ----------
create or replace function public.is_member(p_grow uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.grow_members m where m.grow_id = p_grow and m.user_id = (select auth.uid()));
$$;

create or replace function public.is_member_text(p_grow text)
returns boolean language sql stable security definer set search_path = '' as $$
  select case when p_grow ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              then public.is_member(p_grow::uuid) else false end;
$$;

create or replace function public.gen_code()
returns text language plpgsql volatile security definer set search_path = '' as $$
declare
  alpha constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- sin 0/O/1/I
  b bytea := extensions.gen_random_bytes(10);
  r text := '';
begin
  for i in 0..9 loop
    r := r || substr(alpha, (get_byte(b, i) % 32) + 1, 1);
  end loop;
  return r;
end $$;

-- ---------- políticas de lectura ----------
drop policy if exists grows_read on public.grows;
create policy grows_read on public.grows for select to authenticated using (public.is_member(id));

drop policy if exists members_read on public.grow_members;
create policy members_read on public.grow_members for select to authenticated using (public.is_member(grow_id));

drop policy if exists state_read on public.grow_state;
create policy state_read on public.grow_state for select to authenticated using (public.is_member(grow_id));

drop policy if exists rev_read on public.grow_rev;
create policy rev_read on public.grow_rev for select to authenticated using (public.is_member(grow_id));

-- ---------- funciones que usa la app ----------
create or replace function public.create_grow(p_name text, p_display text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  gid uuid;
  code text;
  nm text := btrim(coalesce(p_name, ''));
  dn text := btrim(coalesce(p_display, ''));
begin
  if uid is null then raise exception 'Tenés que iniciar sesión'; end if;
  if char_length(nm) not between 1 and 40 then raise exception 'El nombre del grupo tiene que tener entre 1 y 40 letras'; end if;
  if char_length(dn) not between 1 and 30 then raise exception 'Tu nombre tiene que tener entre 1 y 30 letras'; end if;
  if exists (select 1 from public.grow_members where user_id = uid) then raise exception 'Ya estás en un grupo'; end if;
  loop
    code := public.gen_code();
    exit when not exists (select 1 from public.grows where invite_code = code);
  end loop;
  insert into public.grows (name, owner_id, invite_code) values (nm, uid, code) returning id into gid;
  insert into public.grow_members (grow_id, user_id, role, display_name) values (gid, uid, 'owner', dn);
  insert into public.grow_state (grow_id, updated_by) values (gid, uid);
  insert into public.grow_rev (grow_id, updated_by) values (gid, uid);
  return jsonb_build_object('id', gid, 'name', nm, 'invite_code', code);
end $$;

create or replace function public.join_grow(p_code text, p_display text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  g public.grows%rowtype;
  dn text := btrim(coalesce(p_display, ''));
  cd text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  tries int;
  cnt int;
begin
  if uid is null then raise exception 'Tenés que iniciar sesión'; end if;
  if char_length(dn) not between 1 and 30 then raise exception 'Tu nombre tiene que tener entre 1 y 30 letras'; end if;
  if exists (select 1 from public.grow_members where user_id = uid) then raise exception 'Ya estás en un grupo'; end if;
  -- freno anti-adivinar: máximo 8 intentos por hora
  delete from public.join_attempts where at < now() - interval '1 day';
  select count(*) into tries from public.join_attempts where user_id = uid and at > now() - interval '1 hour';
  if tries >= 8 then return jsonb_build_object('ok', false, 'error', 'Demasiados intentos. Probá de nuevo en un rato'); end if;
  insert into public.join_attempts (user_id) values (uid);
  select * into g from public.grows where invite_code = cd;
  if not found then return jsonb_build_object('ok', false, 'error', 'Ese código no existe'); end if;   -- no se tira error: así el intento queda anotado
  select count(*) into cnt from public.grow_members where grow_id = g.id;
  if cnt >= 6 then return jsonb_build_object('ok', false, 'error', 'El grupo ya está completo'); end if;
  insert into public.grow_members (grow_id, user_id, role, display_name) values (g.id, uid, 'member', dn);
  delete from public.join_attempts where user_id = uid;
  return jsonb_build_object('ok', true, 'id', g.id, 'name', g.name, 'invite_code', g.invite_code);
end $$;

create or replace function public.my_grow()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  m public.grow_members%rowtype;
  g public.grows%rowtype;
begin
  if uid is null then return null; end if;
  select * into m from public.grow_members where user_id = uid;
  if not found then return null; end if;
  select * into g from public.grows where id = m.grow_id;
  return jsonb_build_object(
    'id', g.id, 'name', g.name, 'invite_code', g.invite_code, 'role', m.role, 'display_name', m.display_name, 'me', uid,
    'members', (select coalesce(jsonb_agg(jsonb_build_object('user_id', x.user_id, 'display_name', x.display_name, 'role', x.role) order by x.joined_at), '[]'::jsonb)
                from public.grow_members x where x.grow_id = g.id));
end $$;

-- guarda con control de versiones: si alguien guardó antes que vos, devuelve conflicto
create or replace function public.save_state(p_grow uuid, p_base_rev bigint, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  newrev bigint;
  cur bigint;
begin
  if uid is null or not public.is_member(p_grow) then raise exception 'No tenés acceso a este grupo'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' then raise exception 'Datos inválidos'; end if;
  if octet_length(p_data::text) > 3000000 then raise exception 'Los datos son demasiado grandes'; end if;
  update public.grow_state
     set data = p_data, rev = rev + 1, updated_at = now(), updated_by = uid
   where grow_id = p_grow and rev = p_base_rev
   returning rev into newrev;
  if newrev is null then
    select rev into cur from public.grow_state where grow_id = p_grow;
    return jsonb_build_object('ok', false, 'conflict', true, 'rev', cur);
  end if;
  update public.grow_rev set rev = newrev, updated_at = now(), updated_by = uid where grow_id = p_grow;
  return jsonb_build_object('ok', true, 'rev', newrev);
end $$;

create or replace function public.rotate_code(p_grow uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); code text;
begin
  if not exists (select 1 from public.grows where id = p_grow and owner_id = uid) then raise exception 'Solo quien creó el grupo puede hacer esto'; end if;
  loop
    code := public.gen_code();
    exit when not exists (select 1 from public.grows where invite_code = code);
  end loop;
  update public.grows set invite_code = code where id = p_grow;
  return code;
end $$;

create or replace function public.remove_member(p_grow uuid, p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid());
begin
  if not exists (select 1 from public.grows where id = p_grow and owner_id = uid) then raise exception 'Solo quien creó el grupo puede hacer esto'; end if;
  if p_user = uid then raise exception 'No podés sacarte a vos mismo'; end if;
  delete from public.grow_members where grow_id = p_grow and user_id = p_user;
end $$;

create or replace function public.leave_grow()
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); m public.grow_members%rowtype; cnt int;
begin
  select * into m from public.grow_members where user_id = uid;
  if not found then return; end if;
  select count(*) into cnt from public.grow_members where grow_id = m.grow_id;
  if m.role = 'owner' and cnt > 1 then raise exception 'Sos quien creó el grupo: primero sacá a los demás o borrá el grupo'; end if;
  if m.role = 'owner' then delete from public.grows where id = m.grow_id; else delete from public.grow_members where user_id = uid; end if;
end $$;

create or replace function public.delete_grow(p_grow uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid());
begin
  if not exists (select 1 from public.grows where id = p_grow and owner_id = uid) then raise exception 'Solo quien creó el grupo puede hacer esto'; end if;
  delete from public.grows where id = p_grow;
end $$;

-- cuota diaria de IA: solo la usa la función del servidor (service_role)
create or replace function public.ai_take(p_user uuid, p_limit int)
returns boolean language plpgsql security definer set search_path = '' as $$
declare cur int;
begin
  insert into public.ai_usage (user_id, day, n) values (p_user, current_date, 0) on conflict (user_id, day) do nothing;
  update public.ai_usage set n = n + 1 where user_id = p_user and day = current_date and n < p_limit returning n into cur;
  return cur is not null;
end $$;

-- permisos de ejecución: solo usuarios logueados (y ai_take solo el servidor)
revoke all on function public.is_member(uuid), public.is_member_text(text), public.gen_code(),
  public.create_grow(text, text), public.join_grow(text, text), public.my_grow(),
  public.save_state(uuid, bigint, jsonb), public.rotate_code(uuid), public.remove_member(uuid, uuid),
  public.leave_grow(), public.delete_grow(uuid), public.ai_take(uuid, int) from public, anon, authenticated;
grant execute on function public.is_member(uuid), public.is_member_text(text), public.create_grow(text, text),
  public.join_grow(text, text), public.my_grow(), public.save_state(uuid, bigint, jsonb), public.rotate_code(uuid),
  public.remove_member(uuid, uuid), public.leave_grow(), public.delete_grow(uuid) to authenticated;
grant execute on function public.ai_take(uuid, int) to service_role;

-- ---------- fotos (Storage privado, solo miembros del grupo) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('grow-photos', 'grow-photos', false, 1500000, array['image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = 1500000, allowed_mime_types = array['image/jpeg'];

drop policy if exists photos_read on storage.objects;
create policy photos_read on storage.objects for select to authenticated
  using (bucket_id = 'grow-photos' and public.is_member_text((storage.foldername(name))[1]));
drop policy if exists photos_insert on storage.objects;
create policy photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'grow-photos' and public.is_member_text((storage.foldername(name))[1]));
drop policy if exists photos_delete on storage.objects;
create policy photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'grow-photos' and public.is_member_text((storage.foldername(name))[1]));

-- ---------- tiempo real: solo el avisador chiquito ----------
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'grow_rev') then
    alter publication supabase_realtime add table public.grow_rev;
  end if;
end $$;
