-- MALAEb V1 database schema
-- Run this file in Supabase SQL Editor.
-- RLS is enabled. Public visitors can read active channels and published matches.
-- Only authenticated users listed in admin_users can manage content.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  home_team text not null,
  away_team text not null,
  competition text not null default '',
  kickoff timestamptz,
  status text not null default 'scheduled'
    check (status in ('scheduled','live','finished','postponed')),
  score text,
  created_at timestamptz not null default now()
);

create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  official_url text not null,
  embed_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.matches enable row level security;
alter table public.channels enable row level security;

-- Admin membership is only readable by the signed-in account itself.
create policy "admins can read own membership"
on public.admin_users for select to authenticated
using (user_id = (select auth.uid()));

-- Public can read match schedule/results.
create policy "public read matches"
on public.matches for select to anon, authenticated
using (true);

-- Public can read active channels only.
create policy "public read active channels"
on public.channels for select to anon, authenticated
using (is_active = true);

-- Only accounts explicitly inserted into admin_users can write.
create policy "admins insert matches"
on public.matches for insert to authenticated
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));

create policy "admins update matches"
on public.matches for update to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())))
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));

create policy "admins delete matches"
on public.matches for delete to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));

create policy "admins insert channels"
on public.channels for insert to authenticated
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));

create policy "admins update channels"
on public.channels for update to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())))
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));

create policy "admins delete channels"
on public.channels for delete to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));

-- After creating your admin account in Supabase Auth, run:
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'YOUR_ADMIN_EMAIL';
