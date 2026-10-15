-- Applied to project "The Family Pot" (xddlhansbkjhvbztecyq) on 2026-10-14
-- as migration "initial_schema_profiles_tournaments".

-- Profiles: one row per auth user
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  surname text,
  picture text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tournaments: one configuration per user (the app currently assumes this)
create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  title text not null default 'My Tournament',
  description text not null default '',
  starting_stack integer not null default 10000,
  chipset jsonb not null default '[
    {"id":0,"value":25,"primarycolour":"#2e9e4f","secondarycolour":"#fff","style":"round","visible":true},
    {"id":1,"value":100,"primarycolour":"#222222","secondarycolour":"#fff","style":"round","visible":true},
    {"id":2,"value":500,"primarycolour":"#3b6fd4","secondarycolour":"#fff","style":"round","visible":true},
    {"id":3,"value":1000,"primarycolour":"#d4a83b","secondarycolour":"#fff","style":"round","visible":true}
  ]'::jsonb,
  blinds jsonb not null default '[
    {"level":0,"blinds":[100,200],"level_length":20},
    {"level":1,"blinds":[200,400],"level_length":20},
    {"level":2,"blinds":[300,600],"level_length":20},
    {"level":3,"blinds":[500,1000],"level_length":20},
    {"level":4,"blinds":[800,1600],"level_length":20},
    {"level":5,"blinds":[1000,2000],"level_length":20},
    {"level":6,"blinds":[1500,3000],"level_length":20},
    {"level":7,"blinds":[2000,4000],"level_length":20}
  ]'::jsonb,
  money jsonb not null default '{"buyIn":10,"placesPaid":3,"split":[50,30,20]}'::jsonb,
  seating jsonb not null default '{"enabled":false,"seats":9}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tournaments_blinds_is_array check (jsonb_typeof(blinds) = 'array'),
  constraint tournaments_chipset_is_array check (jsonb_typeof(chipset) = 'array'),
  constraint tournaments_money_is_object check (jsonb_typeof(money) = 'object'),
  constraint tournaments_seating_is_object check (jsonb_typeof(seating) = 'object')
);

-- updated_at maintenance
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger tournaments_set_updated_at before update on public.tournaments
  for each row execute function public.set_updated_at();

-- Row level security: users only ever see / change their own rows
alter table public.profiles enable row level security;
alter table public.tournaments enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "tournaments_select_own" on public.tournaments
  for select to authenticated using (user_id = (select auth.uid()));
create policy "tournaments_insert_own" on public.tournaments
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "tournaments_update_own" on public.tournaments
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "tournaments_delete_own" on public.tournaments
  for delete to authenticated using (user_id = (select auth.uid()));

-- On signup: create profile + default tournament (fixes the "no row yet" first-run crash)
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, surname, picture)
  values (
    new.id,
    new.raw_user_meta_data ->> 'given_name',
    new.raw_user_meta_data ->> 'family_name',
    new.raw_user_meta_data ->> 'picture'
  )
  on conflict (id) do nothing;

  insert into public.tournaments (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- Keeps the name/signature the app already calls (rpc 'addUserLogin'), but derives identity
-- from the caller's JWT instead of trusting the argument.
create function public."addUserLogin"(auserid uuid, afirstname text, asurname text, picture text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if auserid is distinct from uid then
    raise exception 'user id mismatch' using errcode = '42501';
  end if;

  insert into public.profiles (id, first_name, surname, picture)
  values (uid, afirstname, asurname, picture)
  on conflict (id) do update
    set first_name = excluded.first_name,
        surname = excluded.surname,
        picture = excluded.picture;

  insert into public.tournaments (user_id) values (uid)
  on conflict (user_id) do nothing;
end;
$$;

revoke execute on function public."addUserLogin"(uuid, text, text, text) from public, anon;
grant execute on function public."addUserLogin"(uuid, text, text, text) to authenticated;
