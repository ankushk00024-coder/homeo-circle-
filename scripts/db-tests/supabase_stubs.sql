-- Minimal stand-in for a fresh Supabase project (roles, auth, storage, default grants)
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;
create role authenticator noinherit login;
create role supabase_admin;
create role supabase_auth_admin;
create role supabase_storage_admin;
grant anon, authenticated, service_role to authenticator;
create schema if not exists extensions;
create schema auth;
create schema storage;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  instance_id uuid, aud text default 'authenticated', role text default 'authenticated',
  email text unique, encrypted_password text, email_confirmed_at timestamptz,
  raw_user_meta_data jsonb default '{}'::jsonb, raw_app_meta_data jsonb default '{}'::jsonb,
  phone text, last_sign_in_at timestamptz, is_anonymous boolean default false,
  created_at timestamptz default now(), updated_at timestamptz default now(), deleted_at timestamptz
);
create table auth.identities (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade, provider text, identity_data jsonb);

create function auth.uid() returns uuid language sql stable as $$
  select nullif(coalesce(current_setting('request.jwt.claim.sub', true),
                         (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')), '')::uuid $$;
create function auth.role() returns text language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''),
                  (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'))::text $$;
create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim', true), ''),
                  nullif(current_setting('request.jwt.claims', true), ''))::jsonb $$;
create function auth.email() returns text language sql stable as $$
  select (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email') $$;

create table storage.buckets (
  id text primary key, name text not null unique, owner uuid, public boolean default false,
  avif_autodetection boolean default false, file_size_limit bigint, allowed_mime_types text[],
  created_at timestamptz default now(), updated_at timestamptz default now());
create table storage.objects (
  id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id),
  name text, owner uuid, metadata jsonb, created_at timestamptz default now(),
  updated_at timestamptz default now(), last_accessed_at timestamptz default now(),
  path_tokens text[] generated always as (string_to_array(name, '/')) stored);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language plpgsql as $$
declare _parts text[];
begin
  select string_to_array(name, '/') into _parts;
  return _parts[1:array_length(_parts, 1) - 1];
end $$;
create function storage.filename(name text) returns text language plpgsql as $$
declare _parts text[];
begin
  select string_to_array(name, '/') into _parts;
  return _parts[array_length(_parts, 1)];
end $$;

grant usage on schema public, auth, storage, extensions to anon, authenticated, service_role;
grant all on all tables in schema storage to anon, authenticated, service_role;
grant execute on all functions in schema auth to anon, authenticated, service_role;
-- Supabase's default privileges for objects created by postgres in public
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
