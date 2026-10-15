-- Phase 0.5, part 2 of 2 (PENDING - run after part 1).
-- Moves tournament ownership from users to groups (drops the old per-user policies / unique(user_id) /
-- FK, renames user_id -> created_by), converts buy-in to minor units, adds role-based RLS through a
-- non-exposed private.has_group_role() helper, and provisions a personal group on signup/login.
-- Contains DROP statements, so it is the step that needs explicit approval.
-- Verified against a local Postgres 16 with a mocked Supabase auth schema (tenant isolation, viewer /
-- director / owner roles, anon access, signup trigger, addUserLogin impersonation).

drop policy "tournaments_select_own" on public.tournaments;
drop policy "tournaments_insert_own" on public.tournaments;
drop policy "tournaments_update_own" on public.tournaments;
drop policy "tournaments_delete_own" on public.tournaments;

alter table public.tournaments drop constraint if exists tournaments_user_id_key;
alter table public.tournaments drop constraint if exists tournaments_user_id_fkey;
alter table public.tournaments rename column user_id to created_by;
alter table public.tournaments alter column created_by drop not null;
alter table public.tournaments
  add constraint tournaments_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;
create index tournaments_group_id_idx on public.tournaments (group_id);

-- Money in integer minor units: money.buyIn (pounds) -> money.buyInMinor (pence).
update public.tournaments
set money = (money - 'buyIn')
  || jsonb_build_object('buyInMinor', round(coalesce((money ->> 'buyIn')::numeric, 0) * 100)::bigint)
where money ? 'buyIn';

alter table public.tournaments
  alter column money set default '{"buyInMinor":1000,"placesPaid":3,"split":[50,30,20]}'::jsonb;

-- ---------------------------------------------------------------- authorisation helper (not exposed via the API)
create schema if not exists private;
grant usage on schema private to authenticated;

create function private.has_group_role(p_group uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members m
    where m.group_id = p_group
      and m.user_id = (select auth.uid())
      and m.role = any (p_roles)
  );
$$;

revoke all on function private.has_group_role(uuid, text[]) from public, anon;
grant execute on function private.has_group_role(uuid, text[]) to authenticated;

-- ---------------------------------------------------------------- RLS
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- Groups are created only by the security-definer functions below, so there is no insert policy.
create policy "groups_select_member" on public.groups
  for select to authenticated
  using (private.has_group_role(id, array['owner', 'director', 'viewer']));
create policy "groups_update_owner" on public.groups
  for update to authenticated
  using (private.has_group_role(id, array['owner']))
  with check (private.has_group_role(id, array['owner']));
create policy "groups_delete_owner" on public.groups
  for delete to authenticated
  using (private.has_group_role(id, array['owner']));

-- Memberships are added by functions (personal group now, invites later), so there is no insert policy.
create policy "members_select_same_group" on public.group_members
  for select to authenticated
  using (private.has_group_role(group_id, array['owner', 'director', 'viewer']));
create policy "members_update_owner" on public.group_members
  for update to authenticated
  using (private.has_group_role(group_id, array['owner']))
  with check (private.has_group_role(group_id, array['owner']));
create policy "members_delete_owner_or_self" on public.group_members
  for delete to authenticated
  using (private.has_group_role(group_id, array['owner']) or user_id = (select auth.uid()));

create policy "tournaments_select_member" on public.tournaments
  for select to authenticated
  using (private.has_group_role(group_id, array['owner', 'director', 'viewer']));
create policy "tournaments_insert_editor" on public.tournaments
  for insert to authenticated
  with check (private.has_group_role(group_id, array['owner', 'director']));
create policy "tournaments_update_editor" on public.tournaments
  for update to authenticated
  using (private.has_group_role(group_id, array['owner', 'director']))
  with check (private.has_group_role(group_id, array['owner', 'director']));
create policy "tournaments_delete_editor" on public.tournaments
  for delete to authenticated
  using (private.has_group_role(group_id, array['owner', 'director']));

-- ---------------------------------------------------------------- personal group provisioning
-- Idempotent: returns the user's oldest group (their "personal" one), creating group, owner membership
-- and a default tournament if they are missing.
create function private.ensure_personal_group(p_user uuid, p_first_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  gid uuid;
begin
  select m.group_id into gid
  from public.group_members m
  where m.user_id = p_user
  order by m.created_at asc
  limit 1;

  if gid is null then
    insert into public.groups (name, created_by)
    values (coalesce(nullif(trim(p_first_name), '') || '''s Family Pot', 'My Family Pot'), p_user)
    returning id into gid;

    insert into public.group_members (group_id, user_id, role) values (gid, p_user, 'owner');
  end if;

  if not exists (select 1 from public.tournaments t where t.group_id = gid) then
    insert into public.tournaments (group_id, created_by, currency)
    values (gid, p_user, (select g.currency from public.groups g where g.id = gid));
  end if;

  return gid;
end;
$$;

revoke all on function private.ensure_personal_group(uuid, text) from public, anon, authenticated;

-- Signup trigger: profile + personal group + default tournament.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_first text := new.raw_user_meta_data ->> 'given_name';
begin
  insert into public.profiles (id, first_name, surname, picture)
  values (
    new.id,
    v_first,
    new.raw_user_meta_data ->> 'family_name',
    new.raw_user_meta_data ->> 'picture'
  )
  on conflict (id) do nothing;

  perform private.ensure_personal_group(new.id, v_first);
  return new;
end;
$$;

-- Same name/signature the app calls. Identity still comes from auth.uid(); null arguments no longer erase stored values.
create or replace function public."addUserLogin"(auserid uuid, afirstname text, asurname text, picture text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  uid uuid := auth.uid();
  v_first text;
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
    set first_name = coalesce(excluded.first_name, public.profiles.first_name),
        surname    = coalesce(excluded.surname, public.profiles.surname),
        picture    = coalesce(excluded.picture, public.profiles.picture);

  select p.first_name into v_first from public.profiles p where p.id = uid;
  perform private.ensure_personal_group(uid, v_first);
end;
$$;

revoke execute on function public."addUserLogin"(uuid, text, text, text) from public, anon;
grant execute on function public."addUserLogin"(uuid, text, text, text) to authenticated;
