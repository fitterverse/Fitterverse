-- ============================================================
-- Fitterverse CRM — Social Planner Migration
-- Run this in the Supabase SQL Editor after crm_migration.sql
-- ============================================================

create table if not exists public.social_posts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  platforms   text[] not null default array['instagram']::text[]
                check (
                  coalesce(array_length(platforms, 1), 0) >= 1
                  and platforms <@ array['instagram', 'facebook']::text[]
                ),
  caption     text not null default '',
  hashtags    text not null default '',
  asset_path  text not null default '',
  planned_for timestamptz,
  status      text not null default 'draft'
                check (status in ('idea', 'draft', 'ready', 'posted')),
  notes       text not null default '',
  posted_at   timestamptz,
  created_by  uuid references public.crm_users (id) on delete set null,
  updated_by  uuid references public.crm_users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists social_posts_status_idx
  on public.social_posts (status);

create index if not exists social_posts_planned_for_idx
  on public.social_posts (planned_for);

create index if not exists social_posts_created_at_idx
  on public.social_posts (created_at desc);
