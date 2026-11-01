-- =====================================================================
--  MelTeInvita · ESQUEMA DE SUPABASE
--  ---------------------------------------------------------------------
--  Ejecuta este archivo completo en Supabase → SQL Editor.
--  Es idempotente: puedes volver a ejecutarlo sin perder datos.
--
--  Antes de usarlo:
--   1. Crea el usuario administrador en Authentication → Users.
--   2. Desactiva "Allow new users to sign up" en Authentication → Providers.
--   3. Sustituye el email del final por el de ese usuario y ejecuta
--      el INSERT de administradores.
--
--  Modelo de seguridad:
--   · `bodas` guarda la invitación y el token del portal. Solo el
--     administrador autenticado puede escribir. El público puede leer
--     únicamente id + data (nunca el token) a través de `bodas_publicas`.
--   · `confirmaciones` no es accesible directamente por el público.
--     Se escribe con la función `crear_confirmacion` (validada y con
--     límite de frecuencia) y se lee con `rsvp_por_token`.
--   · El token del portal es aleatorio, largo y por boda. No se publica.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. ADMINISTRADORES
-- ---------------------------------------------------------------------
create table if not exists public.administradores (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.administradores enable row level security;
revoke all on public.administradores from anon, authenticated;

-- Devuelve true solo si el usuario autenticado está en la lista.
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.administradores a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.es_admin() from public;
grant execute on function public.es_admin() to authenticated;

-- ---------------------------------------------------------------------
-- 2. BODAS (una fila por invitación publicada)
-- ---------------------------------------------------------------------
create table if not exists public.bodas (
  id text primary key check (id ~ '^[a-z0-9-]{2,64}$'),
  data jsonb not null default '{}'::jsonb,
  token text not null unique check (length(token) >= 32),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bodas enable row level security;

-- El público puede leer la fila, pero solo tiene privilegios de columna
-- sobre id, data y updated_at. `token` queda fuera de su alcance.
drop policy if exists "bodas_lectura_publica" on public.bodas;
create policy "bodas_lectura_publica"
  on public.bodas for select
  to anon, authenticated
  using (true);

drop policy if exists "bodas_alta_admin" on public.bodas;
create policy "bodas_alta_admin"
  on public.bodas for insert
  to authenticated
  with check (public.es_admin());

drop policy if exists "bodas_edicion_admin" on public.bodas;
create policy "bodas_edicion_admin"
  on public.bodas for update
  to authenticated
  using (public.es_admin())
  with check (public.es_admin());

drop policy if exists "bodas_borrado_admin" on public.bodas;
create policy "bodas_borrado_admin"
  on public.bodas for delete
  to authenticated
  using (public.es_admin());

revoke all on public.bodas from anon, authenticated;
grant select (id, data, updated_at) on public.bodas to anon;
grant select, insert, update, delete on public.bodas to authenticated;

-- Vista pública: nunca expone el token ni datos internos.
drop view if exists public.bodas_publicas;
create view public.bodas_publicas
with (security_invoker = true)
as
  select id, data, updated_at
  from public.bodas
  where data is not null
    and data <> '{}'::jsonb;

revoke all on public.bodas_publicas from anon, authenticated;
grant select on public.bodas_publicas to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. CONFIRMACIONES (RSVP)
-- ---------------------------------------------------------------------
create table if not exists public.confirmaciones (
  id uuid primary key default gen_random_uuid(),
  boda_id text not null references public.bodas(id) on delete cascade,
  client_id text not null,
  nombre text not null check (length(nombre) between 2 and 160),
  asiste text not null check (asiste in ('Sí', 'No')),
  personas integer not null default 1 check (personas between 1 and 10),
  menu text not null default '',
  bus text not null default '',
  alergias text not null default '',
  cancion text not null default '',
  acompanantes jsonb not null default '[]'::jsonb,
  consentimiento boolean not null default true,
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint confirmaciones_cliente_unico unique (boda_id, client_id)
);

create index if not exists confirmaciones_boda_fecha_idx
  on public.confirmaciones (boda_id, created_at desc);

alter table public.confirmaciones enable row level security;

drop policy if exists "confirmaciones_lectura_admin" on public.confirmaciones;
create policy "confirmaciones_lectura_admin"
  on public.confirmaciones for select
  to authenticated
  using (public.es_admin());

drop policy if exists "confirmaciones_borrado_admin" on public.confirmaciones;
create policy "confirmaciones_borrado_admin"
  on public.confirmaciones for delete
  to authenticated
  using (public.es_admin());

revoke all on public.confirmaciones from anon, authenticated;
grant select, delete on public.confirmaciones to authenticated;

-- Sella la fecha de actualización sin depender del cliente.
create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bodas_updated_at on public.bodas;
create trigger bodas_updated_at
  before update on public.bodas
  for each row execute function public.tocar_updated_at();

drop trigger if exists confirmaciones_updated_at on public.confirmaciones;
create trigger confirmaciones_updated_at
  before update on public.confirmaciones
  for each row execute function public.tocar_updated_at();

-- ---------------------------------------------------------------------
-- 4. ALTA PÚBLICA DE RSVP (RPC)
-- ---------------------------------------------------------------------
create or replace function public.crear_confirmacion(
  p_boda text,
  p_nombre text,
  p_asiste text,
  p_personas integer,
  p_menu text,
  p_bus text,
  p_alergias text,
  p_cancion text,
  p_acompanantes jsonb,
  p_client_id text,
  p_consentimiento boolean,
  p_website text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_slug text := lower(btrim(coalesce(p_boda, '')));
  v_nombre text := btrim(coalesce(p_nombre, ''));
  v_asiste text := btrim(coalesce(p_asiste, ''));
  v_client text := left(coalesce(nullif(btrim(p_client_id), ''), gen_random_uuid()::text), 100);
  v_max integer := 10;
  v_personas integer := coalesce(p_personas, 1);
  v_acompanantes jsonb := '[]'::jsonb;
  v_id uuid;
begin
  -- Campo trampa: un bot lo rellena. Respondemos como si todo fuese bien.
  if btrim(coalesce(p_website, '')) <> '' then
    return jsonb_build_object('ok', true, 'skipped', true);
  end if;

  if v_slug = '' then
    raise exception 'Falta la boda.' using errcode = '22023';
  end if;

  if not exists (select 1 from public.bodas b where b.id = v_slug) then
    raise exception 'La invitación no existe o ya no está disponible.' using errcode = '22023';
  end if;

  if length(v_nombre) < 2 or length(v_nombre) > 160 then
    raise exception 'El nombre no es válido.' using errcode = '22023';
  end if;

  if v_asiste is null or v_asiste not in ('Sí', 'No', 'Si', 'si', 'YES', 'Yes', 'yes') then
    raise exception 'La respuesta de asistencia no es válida.' using errcode = '22023';
  end if;
  v_asiste := case when lower(v_asiste) in ('sí', 'si', 'yes') then 'Sí' else 'No' end;

  if p_consentimiento is not true then
    raise exception 'Debes aceptar la política de privacidad.' using errcode = '22023';
  end if;

  -- Límite de personas configurado por los novios (máximo absoluto 10).
  select greatest(1, least(10, coalesce((b.data ->> 'maxGuests')::integer, 10)))
    into v_max
    from public.bodas b
   where b.id = v_slug;
  v_max := coalesce(v_max, 10);

  if v_asiste = 'Sí' then
    v_personas := greatest(1, least(v_max, v_personas));

    select coalesce(jsonb_agg(jsonb_build_object(
             'name', left(btrim(coalesce(elem ->> 'name', '')), 80),
             'menu', left(btrim(coalesce(elem ->> 'menu', '')), 40)
           )), '[]'::jsonb)
      into v_acompanantes
      from (
        select elem
        from jsonb_array_elements(
          case when jsonb_typeof(coalesce(p_acompanantes, '[]'::jsonb)) = 'array'
               then coalesce(p_acompanantes, '[]'::jsonb)
               else '[]'::jsonb end
        ) as t(elem)
        where btrim(coalesce(elem ->> 'name', '')) <> ''
        limit 9
      ) sub;
  else
    v_personas := 1;
    v_acompanantes := '[]'::jsonb;
  end if;

  -- Evita ráfagas: si el mismo navegador acaba de escribir, no duplicamos.
  if exists (
    select 1 from public.confirmaciones c
     where c.boda_id = v_slug
       and c.client_id = v_client
       and c.updated_at > now() - interval '3 seconds'
  ) then
    return jsonb_build_object('ok', true, 'throttled', true);
  end if;

  insert into public.confirmaciones (
    boda_id, client_id, nombre, asiste, personas, menu, bus,
    alergias, cancion, acompanantes, consentimiento, consent_at
  ) values (
    v_slug,
    v_client,
    v_nombre,
    v_asiste,
    v_personas,
    left(btrim(coalesce(p_menu, '')), 60),
    left(btrim(coalesce(p_bus, '')), 20),
    case when v_asiste = 'Sí' then left(btrim(coalesce(p_alergias, '')), 300) else '' end,
    case when v_asiste = 'Sí' then left(btrim(coalesce(p_cancion, '')), 160) else '' end,
    v_acompanantes,
    true,
    now()
  )
  on conflict (boda_id, client_id) do update set
    nombre = excluded.nombre,
    asiste = excluded.asiste,
    personas = excluded.personas,
    menu = excluded.menu,
    bus = excluded.bus,
    alergias = excluded.alergias,
    cancion = excluded.cancion,
    acompanantes = excluded.acompanantes,
    consentimiento = true,
    consent_at = now(),
    updated_at = now()
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

revoke all on function public.crear_confirmacion(
  text, text, text, integer, text, text, text, text, jsonb, text, boolean, text
) from public;
grant execute on function public.crear_confirmacion(
  text, text, text, integer, text, text, text, text, jsonb, text, boolean, text
) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. LECTURA DEL PORTAL DE NOVIOS (RPC con token)
-- ---------------------------------------------------------------------
create or replace function public.rsvp_por_token(p_boda text, p_token text)
returns table (
  id uuid,
  nombre text,
  asiste text,
  personas integer,
  menu text,
  bus text,
  alergias text,
  cancion text,
  acompanantes jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_slug text := lower(btrim(coalesce(p_boda, '')));
  v_token text := btrim(coalesce(p_token, ''));
begin
  if length(v_token) < 32 then
    raise exception 'La clave no es válida.' using errcode = '28000';
  end if;

  if not exists (
    select 1 from public.bodas b
     where b.id = v_slug
       and b.token = v_token
  ) then
    raise exception 'La clave no es válida.' using errcode = '28000';
  end if;

  return query
    select c.id, c.nombre, c.asiste, c.personas, c.menu, c.bus,
           c.alergias, c.cancion, c.acompanantes, c.created_at, c.updated_at
      from public.confirmaciones c
     where c.boda_id = v_slug
     order by c.created_at desc;
end;
$$;

revoke all on function public.rsvp_por_token(text, text) from public;
grant execute on function public.rsvp_por_token(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 6. BORRADO Y CONSERVACIÓN
-- ---------------------------------------------------------------------
-- Borra una boda, sus confirmaciones y sus fotos. Solo el administrador.
create or replace function public.borrar_boda(p_boda text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.es_admin() then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;

  delete from storage.objects
   where bucket_id = 'fotos-bodas'
     and (name = p_boda or name like p_boda || '/%');

  delete from public.bodas where id = p_boda;
end;
$$;

revoke all on function public.borrar_boda(text) from public;
grant execute on function public.borrar_boda(text) to authenticated;

-- Limpieza de confirmaciones de bodas ya celebradas. Por defecto borra
-- los RSVP 30 días después de la fecha de la boda (política de privacidad).
-- `limpiar_confirmaciones_antiguas` es la versión manual para el panel:
-- exige sesión de administrador. Para pg_cron usa la variante _cron, que
-- no depende de un JWT y solo puede ejecutar el rol que la programe.
create or replace function public.limpiar_confirmaciones_antiguas(p_dias integer default 30)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_dias integer := greatest(7, coalesce(p_dias, 30));
  v_total integer;
begin
  if not public.es_admin() then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;

  delete from public.confirmaciones c
   using public.bodas b
   where c.boda_id = b.id
     and (b.data ->> 'date') ~ '^\d{4}-\d{2}-\d{2}$'
     and (b.data ->> 'date')::date < current_date - make_interval(days => v_dias);
  get diagnostics v_total = row_count;

  -- Red de seguridad: respuestas huérfanas de más de dos años.
  delete from public.confirmaciones
   where created_at < now() - interval '2 years';

  return v_total;
end;
$$;

revoke all on function public.limpiar_confirmaciones_antiguas(integer) from public;
grant execute on function public.limpiar_confirmaciones_antiguas(integer) to authenticated;

-- Variante para pg_cron. No comprueba auth.jwt() porque el planificador no
-- tiene sesión de usuario. Revocada para anon/authenticated: solo la puede
-- invocar el rol propietario o service_role.
create or replace function public.limpiar_confirmaciones_cron(p_dias integer default 30)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_dias integer := greatest(7, coalesce(p_dias, 30));
  v_total integer;
begin
  delete from public.confirmaciones c
   using public.bodas b
   where c.boda_id = b.id
     and (b.data ->> 'date') ~ '^\d{4}-\d{2}-\d{2}$'
     and (b.data ->> 'date')::date < current_date - make_interval(days => v_dias);
  get diagnostics v_total = row_count;

  delete from public.confirmaciones
   where created_at < now() - interval '2 years';

  return v_total;
end;
$$;

revoke all on function public.limpiar_confirmaciones_cron(integer) from public, anon, authenticated;
grant execute on function public.limpiar_confirmaciones_cron(integer) to service_role;

-- Programación recomendada (ejecutar una vez como postgres):
--   select cron.schedule('limpiar-rsvp', '0 4 * * 1',
--     $$select public.limpiar_confirmaciones_cron(30)$$);

-- ---------------------------------------------------------------------
-- 7. STORAGE DE FOTOS
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fotos-bodas',
  'fotos-bodas',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "fotos_lectura_publica" on storage.objects;
create policy "fotos_lectura_publica"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'fotos-bodas');

drop policy if exists "fotos_alta_admin" on storage.objects;
create policy "fotos_alta_admin"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'fotos-bodas' and public.es_admin());

drop policy if exists "fotos_edicion_admin" on storage.objects;
create policy "fotos_edicion_admin"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'fotos-bodas' and public.es_admin())
  with check (bucket_id = 'fotos-bodas' and public.es_admin());

drop policy if exists "fotos_borrado_admin" on storage.objects;
create policy "fotos_borrado_admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'fotos-bodas' and public.es_admin());

-- ---------------------------------------------------------------------
-- 8. ALTA DEL ADMINISTRADOR
-- ---------------------------------------------------------------------
-- Cambia el email y ejecútalo DESPUÉS de crear el usuario en Auth:
--
-- insert into public.administradores (email)
-- values ('tu-email@ejemplo.com')
-- on conflict (email) do nothing;
--
-- Comprobación rápida:
-- select * from public.administradores;

-- ---------------------------------------------------------------------
-- 9. RECARGA DEL CACHÉ DE POSTGREST
-- ---------------------------------------------------------------------
notify pgrst, 'reload schema';
