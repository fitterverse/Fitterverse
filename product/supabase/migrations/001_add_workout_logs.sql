-- Migration: add workout_logs table
-- Run this in Supabase SQL Editor

create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,             -- Firebase UID
  date date not null,
  workout_type text not null check (workout_type in (
    'running','walking','cycling','swimming','strength','yoga','hiit','dance','sports','stretching','other'
  )),
  intensity text not null check (intensity in ('low','moderate','high')),
  duration_minutes integer not null check (duration_minutes > 0),
  calories_burned integer,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.workout_logs enable row level security;

create index if not exists workout_logs_user_date on public.workout_logs(user_id, date);
