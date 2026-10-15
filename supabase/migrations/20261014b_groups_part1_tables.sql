-- Phase 0.5, part 1 of 2 (APPLIED to project xddlhansbkjhvbztecyq as "groups_and_currency_part1_tables").
-- Adds groups + group_members, backfills a personal group for every existing user and moves their
-- tournament into it. Non-destructive: the old user_id column and policies are left in place so the
-- previous app version keeps working until part 2 runs.

-- ---------------------------------------------------------------- groups
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  currency text not null default 'GBP' check (currency ~ '^[A-Z]{3}$'),
  timezone text not null default 'Europe/London',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('owner', 'director', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index group_members_user_id_idx on public.group_members (user_id);

create trigger groups_set_updated_at before update on public.groups
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- tournaments -> group ownership
alter table public.tournaments
  add column group_id uuid references public.groups(id) on delete cascade,
  add column currency text not null default 'GBP' check (currency ~ '^[A-Z]{3}$');

-- Back-fill: every existing user gets a personal group they own, and their tournament moves into it.
with src as (
  select u.id as user_id, p.first_name
  from auth.users u
  left join public.profiles p on p.id = u.id
), new_groups as (
  insert into public.groups (name, created_by)
  select coalesce(nullif(trim(first_name), '') || '''s Family Pot', 'My Family Pot'), user_id
  from src
  returning id, created_by
), members as (
  insert into public.group_members (group_id, user_id, role)
  select id, created_by, 'owner' from new_groups
  returning group_id, user_id
)
update public.tournaments t
set group_id = m.group_id
from members m
where t.user_id = m.user_id;

alter table public.tournaments alter column group_id set not null;

