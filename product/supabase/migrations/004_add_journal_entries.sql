-- Unified AI-first journal model for the Android launch.
-- Food and workout logs are both stored as journal entries.

alter table public.daily_scores
  add column if not exists steps integer default 0;

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  entry_type text check (entry_type in ('food', 'workout')),
  source_type text check (source_type in ('text', 'camera', 'gallery', 'text_image')),
  status text not null default 'processing' check (status in ('processing', 'ready', 'failed', 'deleted')),
  logged_for_date date not null,
  logged_at timestamptz not null,
  display_title text,
  raw_input_text text,
  latest_analysis_id uuid,
  image_count integer not null default 0,
  is_edited boolean not null default false,
  edit_count integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.journal_entry_media (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.journal_entries(id) on delete cascade,
  user_id text not null,
  storage_path text not null,
  mime_type text,
  file_size_bytes integer,
  width integer,
  height integer,
  retention_expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.journal_entry_analyses (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.journal_entries(id) on delete cascade,
  user_id text not null,
  model_provider text not null default 'google',
  model_name text,
  analysis_kind text not null check (analysis_kind in ('create', 'edit', 'detail_refresh')),
  input_text text,
  parsed_json jsonb not null default '{}'::jsonb,
  display_title text,
  summary_text text,
  calories integer,
  carbs_g numeric(8,2),
  protein_g numeric(8,2),
  fat_g numeric(8,2),
  secondary_nutrients jsonb,
  confidence_score numeric(5,2),
  latency_ms integer,
  token_input integer,
  token_output integer,
  error_code text,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_nutrition_summaries (
  user_id text not null,
  date date not null,
  food_calories integer not null default 0,
  exercise_calories integer not null default 0,
  carbs_g numeric(10,2) not null default 0,
  protein_g numeric(10,2) not null default 0,
  fat_g numeric(10,2) not null default 0,
  entry_count integer not null default 0,
  food_entry_count integer not null default 0,
  workout_entry_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

create table if not exists public.ai_usage_daily (
  user_id text not null,
  date date not null,
  analysis_count integer not null default 0,
  image_analysis_count integer not null default 0,
  detail_analysis_count integer not null default 0,
  last_request_at timestamptz,
  primary key (user_id, date)
);

alter table public.journal_entries enable row level security;
alter table public.journal_entry_media enable row level security;
alter table public.journal_entry_analyses enable row level security;
alter table public.daily_nutrition_summaries enable row level security;
alter table public.ai_usage_daily enable row level security;

create index if not exists journal_entries_user_date_idx
  on public.journal_entries(user_id, logged_for_date, logged_at desc);

create index if not exists journal_entries_user_status_idx
  on public.journal_entries(user_id, status, logged_for_date);

create index if not exists journal_entry_media_entry_idx
  on public.journal_entry_media(entry_id, created_at desc);

create index if not exists journal_entry_media_retention_idx
  on public.journal_entry_media(retention_expires_at);

create index if not exists journal_entry_analyses_entry_idx
  on public.journal_entry_analyses(entry_id, created_at desc);

create index if not exists journal_entry_analyses_user_idx
  on public.journal_entry_analyses(user_id, created_at desc);

insert into storage.buckets (id, name, public)
values ('journal-media', 'journal-media', false)
on conflict (id) do nothing;

with legacy_meals as (
  select
    gen_random_uuid() as entry_id,
    gen_random_uuid() as analysis_id,
    ml.*
  from public.meal_logs ml
  where not exists (
    select 1
    from public.journal_entries je
    where je.user_id = ml.user_id
      and je.logged_for_date = ml.date
      and je.entry_type = 'food'
      and coalesce(je.raw_input_text, '') = coalesce(ml.note, '')
      and je.logged_at::date = ml.date
  )
),
insert_meal_entries as (
  insert into public.journal_entries (
    id,
    user_id,
    entry_type,
    source_type,
    status,
    logged_for_date,
    logged_at,
    display_title,
    raw_input_text,
    latest_analysis_id,
    image_count,
    is_edited,
    edit_count,
    created_at,
    updated_at
  )
  select
    entry_id,
    user_id,
    'food',
    'text',
    'ready',
    date,
    coalesce(updated_at, created_at, (date::text || ' 12:00:00+00')::timestamptz),
    case
      when note is not null and btrim(note) <> '' then left(note, 120)
      else initcap(meal_type) || ' log'
    end,
    note,
    analysis_id,
    0,
    false,
    0,
    coalesce(created_at, now()),
    coalesce(updated_at, now())
  from legacy_meals
  returning id
)
insert into public.journal_entry_analyses (
  id,
  entry_id,
  user_id,
  model_provider,
  model_name,
  analysis_kind,
  input_text,
  parsed_json,
  display_title,
  summary_text,
  calories,
  carbs_g,
  protein_g,
  fat_g,
  secondary_nutrients,
  confidence_score,
  latency_ms,
  created_at
)
select
  analysis_id,
  entry_id,
  user_id,
  'legacy',
  'legacy-meal-log',
  'create',
  note,
  jsonb_build_object(
    'legacy', true,
    'meal_type', meal_type,
    'rating', rating,
    'calories', calories,
    'note', note
  ),
  case
    when note is not null and btrim(note) <> '' then left(note, 120)
    else initcap(meal_type) || ' log'
  end,
  case
    when rating is not null then initcap(rating) || ' legacy meal log'
    else 'Legacy meal log'
  end,
  calories,
  null,
  null,
  null,
  null,
  null,
  null,
  coalesce(updated_at, created_at, now())
from legacy_meals;

with legacy_workouts as (
  select
    gen_random_uuid() as entry_id,
    gen_random_uuid() as analysis_id,
    wl.*
  from public.workout_logs wl
  where not exists (
    select 1
    from public.journal_entries je
    where je.user_id = wl.user_id
      and je.logged_for_date = wl.date
      and je.entry_type = 'workout'
      and coalesce(je.raw_input_text, '') = coalesce(wl.notes, '')
      and je.logged_at::date = wl.date
  )
),
insert_workout_entries as (
  insert into public.journal_entries (
    id,
    user_id,
    entry_type,
    source_type,
    status,
    logged_for_date,
    logged_at,
    display_title,
    raw_input_text,
    latest_analysis_id,
    image_count,
    is_edited,
    edit_count,
    created_at,
    updated_at
  )
  select
    entry_id,
    user_id,
    'workout',
    'text',
    'ready',
    date,
    coalesce(updated_at, created_at, (date::text || ' 18:00:00+00')::timestamptz),
    case
      when notes is not null and btrim(notes) <> '' then left(notes, 120)
      else initcap(workout_type) || ' workout'
    end,
    notes,
    analysis_id,
    0,
    false,
    0,
    coalesce(created_at, now()),
    coalesce(updated_at, now())
  from legacy_workouts
  returning id
)
insert into public.journal_entry_analyses (
  id,
  entry_id,
  user_id,
  model_provider,
  model_name,
  analysis_kind,
  input_text,
  parsed_json,
  display_title,
  summary_text,
  calories,
  carbs_g,
  protein_g,
  fat_g,
  secondary_nutrients,
  confidence_score,
  latency_ms,
  created_at
)
select
  analysis_id,
  entry_id,
  user_id,
  'legacy',
  'legacy-workout-log',
  'create',
  notes,
  jsonb_build_object(
    'legacy', true,
    'workout_type', workout_type,
    'intensity', intensity,
    'duration_minutes', duration_minutes,
    'notes', notes
  ),
  case
    when notes is not null and btrim(notes) <> '' then left(notes, 120)
    else initcap(workout_type) || ' workout'
  end,
  coalesce(notes, initcap(workout_type) || ' workout'),
  calories_burned,
  null,
  null,
  null,
  null,
  null,
  null,
  coalesce(updated_at, created_at, now())
from legacy_workouts;

insert into public.daily_nutrition_summaries (
  user_id,
  date,
  food_calories,
  exercise_calories,
  carbs_g,
  protein_g,
  fat_g,
  entry_count,
  food_entry_count,
  workout_entry_count,
  updated_at
)
select
  je.user_id,
  je.logged_for_date,
  coalesce(sum(case when je.entry_type = 'food' then coalesce(ja.calories, 0) else 0 end), 0),
  coalesce(sum(case when je.entry_type = 'workout' then coalesce(ja.calories, 0) else 0 end), 0),
  coalesce(sum(case when je.entry_type = 'food' then coalesce(ja.carbs_g, 0) else 0 end), 0),
  coalesce(sum(case when je.entry_type = 'food' then coalesce(ja.protein_g, 0) else 0 end), 0),
  coalesce(sum(case when je.entry_type = 'food' then coalesce(ja.fat_g, 0) else 0 end), 0),
  count(*),
  count(*) filter (where je.entry_type = 'food'),
  count(*) filter (where je.entry_type = 'workout'),
  now()
from public.journal_entries je
left join public.journal_entry_analyses ja on ja.id = je.latest_analysis_id
where je.status = 'ready'
  and je.deleted_at is null
group by je.user_id, je.logged_for_date
on conflict (user_id, date) do update
set
  food_calories = excluded.food_calories,
  exercise_calories = excluded.exercise_calories,
  carbs_g = excluded.carbs_g,
  protein_g = excluded.protein_g,
  fat_g = excluded.fat_g,
  entry_count = excluded.entry_count,
  food_entry_count = excluded.food_entry_count,
  workout_entry_count = excluded.workout_entry_count,
  updated_at = excluded.updated_at;

with per_day as (
  select
    user_id,
    date,
    food_entry_count,
    workout_entry_count,
    (
      case when food_entry_count >= 1 then 3 else 0 end +
      case when food_entry_count >= 2 then 2 else 0 end +
      case when workout_entry_count >= 1 then 3 else 0 end +
      case when food_entry_count >= 1 and workout_entry_count >= 1 then 1 else 0 end
    ) as total_points
  from public.daily_nutrition_summaries
)
insert into public.daily_scores (
  user_id,
  date,
  total_points,
  meals_logged,
  is_streak_day,
  updated_at
)
select
  user_id,
  date,
  total_points,
  food_entry_count,
  total_points >= 3,
  now()
from per_day
on conflict (user_id, date) do update
set
  total_points = excluded.total_points,
  meals_logged = excluded.meals_logged,
  is_streak_day = excluded.is_streak_day,
  updated_at = excluded.updated_at;
