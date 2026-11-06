-- =====================================================================
-- Mi Cultivo · avisos al celular (push)
-- Pegalo entero en: Supabase > SQL Editor > New query > Run
-- Se puede correr más de una vez sin romper nada.
-- Las tablas no tienen permisos para nadie: solo se tocan con las
-- funciones de abajo (que revisan quién sos) y con la función "notify".
-- =====================================================================

create table if not exists public.push_subs (
  endpoint   text primary key check (char_length(endpoint) <= 1000),
  user_id    uuid not null references auth.users(id) on delete cascade,
  p256dh     text not null check (char_length(p256dh) <= 200),
  auth       text not null check (char_length(auth) <= 100),
  created_at timestamptz not null default now()
);

create table if not exists public.push_plan (
  id         bigint generated always as identity primary key,
  endpoint   text not null references public.push_subs(endpoint) on delete cascade,
  at         timestamptz not null,
  title      text not null,
  body       text not null,
  sent       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists push_plan_due on public.push_plan (at) where not sent;
create index if not exists push_plan_endpoint on public.push_plan (endpoint);

alter table public.push_subs enable row level security;
alter table public.push_plan enable row level security;
revoke all on table public.push_subs, public.push_plan from anon, authenticated;

-- este celu activa los avisos
create or replace function public.push_subscribe(p_endpoint text, p_p256dh text, p_auth text)
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'Iniciá sesión'; end if;
  if p_endpoint is null or p_endpoint !~ '^https://' or char_length(p_endpoint) > 1000 then raise exception 'Suscripción inválida'; end if;
  insert into public.push_subs (endpoint, user_id, p256dh, auth) values (p_endpoint, uid, p_p256dh, p_auth)
  on conflict (endpoint) do update set user_id = uid, p256dh = excluded.p256dh, auth = excluded.auth, created_at = now();
  -- como mucho 5 dispositivos por persona: se quedan los más nuevos
  delete from public.push_subs where user_id = uid and endpoint in
    (select endpoint from public.push_subs where user_id = uid order by created_at desc offset 5);
end $$;

-- este celu apaga los avisos
create or replace function public.push_unsubscribe(p_endpoint text)
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid());
begin
  if uid is null then return; end if;
  delete from public.push_subs where endpoint = p_endpoint and user_id = uid;
end $$;

-- el celu manda lo que viene en los próximos días (reemplaza lo anterior que no salió)
create or replace function public.push_plan_set(p_endpoint text, p_items jsonb)
returns int language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); n int := 0; it jsonb; t timestamptz;
begin
  if uid is null then raise exception 'Iniciá sesión'; end if;
  if not exists (select 1 from public.push_subs where endpoint = p_endpoint and user_id = uid) then
    raise exception 'Primero activá los avisos en este celu';
  end if;
  if jsonb_typeof(p_items) <> 'array' then raise exception 'Formato inválido'; end if;
  delete from public.push_plan where endpoint = p_endpoint and not sent;
  for it in select * from jsonb_array_elements(p_items) loop
    exit when n >= 40;
    begin
      t := to_timestamp(((it->>'at')::numeric) / 1000.0);
    exception when others then continue;
    end;
    if t < now() - interval '1 minute' or t > now() + interval '9 days' then continue; end if;
    if coalesce(btrim(it->>'title'), '') = '' then continue; end if;
    insert into public.push_plan (endpoint, at, title, body)
    values (p_endpoint, t, left(it->>'title', 80), left(coalesce(it->>'body', ''), 200));
    n := n + 1;
  end loop;
  delete from public.push_plan where sent and at < now() - interval '2 days';
  return n;
end $$;

-- aviso de prueba: sale en los próximos 5 minutos
create or replace function public.push_test(p_endpoint text)
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'Iniciá sesión'; end if;
  if not exists (select 1 from public.push_subs where endpoint = p_endpoint and user_id = uid) then
    raise exception 'Primero activá los avisos en este celu';
  end if;
  if exists (select 1 from public.push_plan where endpoint = p_endpoint and title = 'Prueba de avisos' and created_at > now() - interval '1 minute') then return; end if;
  insert into public.push_plan (endpoint, at, title, body)
  values (p_endpoint, now(), 'Prueba de avisos', 'Si ves esto, los avisos de Mi Cultivo funcionan en este celu.');
end $$;

revoke all on function public.push_subscribe(text, text, text), public.push_unsubscribe(text),
  public.push_plan_set(text, jsonb), public.push_test(text) from public, anon, authenticated;
grant execute on function public.push_subscribe(text, text, text), public.push_unsubscribe(text),
  public.push_plan_set(text, jsonb), public.push_test(text) to authenticated;
