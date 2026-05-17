-- ============================================================
-- Notification System — Migration 002
-- Two tables: notification_preferences (settings per user)
--             notification_tokens (FCM tokens, multi-device)
-- ============================================================

-- Per-user notification preferences
create table if not exists public.notification_preferences (
  user_id          text primary key references public.profiles(id) on delete cascade,
  enabled          boolean   default false,
  intensity        text      default 'standard'
                             check (intensity in ('light', 'standard', 'active')),
  meal_reminders   boolean   default true,
  workout_reminders boolean  default true,
  motivation_quotes boolean  default true,
  streak_alerts    boolean   default true,
  quiet_start      time      default '22:00',  -- local time (Asia/Kolkata)
  quiet_end        time      default '07:00',
  timezone         text      default 'Asia/Kolkata',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- FCM device tokens — one user can have multiple devices
create table if not exists public.notification_tokens (
  id           uuid      primary key default gen_random_uuid(),
  user_id      text      not null references public.profiles(id) on delete cascade,
  token        text      not null,
  device_hint  text,           -- browser/UA snippet for debugging
  last_seen    timestamptz default now(),
  created_at   timestamptz default now(),
  unique(token)               -- FCM tokens are globally unique
);

alter table public.notification_preferences enable row level security;
alter table public.notification_tokens      enable row level security;

create index if not exists notification_tokens_user_id
  on public.notification_tokens(user_id);
