-- ============================================================
-- Fitterverse CRM — Supabase Migration
-- Run this in the Supabase SQL Editor
-- ============================================================

create table if not exists public.crm_users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  password_hash text not null,
  full_name     text not null,
  role          text not null default 'nutritionist'
                  check (role in ('admin', 'master_coach', 'nutritionist', 'trainer', 'sales')),
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Index for fast login lookup
create index if not exists crm_users_email_idx on public.crm_users (email);

-- Seed: fitterverse.in@gmail.com / Fitterverse@123
-- Password hash generated with Node.js scrypt (salt:hash format)
insert into public.crm_users (email, password_hash, full_name, role)
values (
  'fitterverse.in@gmail.com',
  'd6da09f50159c38b9f01685a3aedd12b:8b064478baed60c50e777e4ade3b9a6679dc93df040f3d24879b4433f0a6e403f41d7616393fd74803561dcabb3eeb3ff1f12dc69e6ec73f7c45c438f216236e',
  'Fitterverse Admin',
  'admin'
)
on conflict (email) do nothing;
