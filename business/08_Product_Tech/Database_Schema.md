# Database Schema — v0

Postgres (Supabase) schema. Drizzle-style annotations for clarity.

---

## Tables overview

| Table | Purpose |
|---|---|
| `users` | All registered users |
| `assessments` | One row per user, their onboarding answers |
| `cohorts` | One row per cohort (cohort 1, 2, 3, ...) |
| `cohort_members` | Join table: which user is in which cohort |
| `daily_checkins` | One row per user per day |
| `progress_records` | Weight / waist / photos per user per week |
| `whatsapp_messages` | Every WA message in/out, logged |
| `coach_notes` | Free-text notes per user, per coach |
| `champion_submissions` | One row per user at end of cohort |
| `champion_results` | Judging outcomes (Gold/Silver/Bronze + bonus categories) |
| `payments` | Razorpay transactions |
| `refunds` | Refund requests + status |
| `audit_log` | Every admin action |

---

## Detailed schema

### users

```sql
id              uuid primary key default gen_random_uuid()
created_at      timestamptz default now()
phone           varchar(20) unique not null
email           varchar(255) unique
full_name       varchar(120) not null
city            varchar(80)
date_of_birth   date
gender          enum('male','female','other','prefer_not_to_say')
role            enum('user','coach','founder','admin') default 'user'
is_active       boolean default true
last_login_at   timestamptz
```

### assessments

```sql
id                      uuid primary key
user_id                 uuid references users(id) on delete cascade
created_at              timestamptz default now()
height_cm               numeric(5,1)
starting_weight_kg      numeric(5,1)
target_weight_kg        numeric(5,1)
goal                    varchar(50)
work_setup              varchar(20)
work_hours              integer
commute_minutes         integer
avg_steps_bucket        varchar(20)
workout_freq            varchar(20)
past_attempts           text[] (array)
diet                    varchar(20)
typical_breakfast       text
typical_lunch           text
typical_dinner          text
snacks                  text[]
chai_coffee_per_day     integer
eat_out_freq            varchar(20)
alcohol                 text[]
sugar_cravings          smallint (1-5)
cooking_control         varchar(20)
gym_access              boolean
home_equipment          varchar(50)
injuries                text[]
medical_conditions      text[]
medications             text
daily_time_minutes      integer
coaching_style          varchar(50)
will_check_in_daily     varchar(20)
notes                   text
flagged_for_review      boolean default false
flag_reason             text
```

### cohorts

```sql
id              uuid primary key
created_at      timestamptz default now()
name            varchar(80) (e.g. "Cohort 3 — May 2026")
cohort_number   integer (1, 2, 3, ...)
start_date      date
end_date        date (start_date + 21)
seat_cap        integer
status          enum('draft','enrolling','active','completed')
default_coach_id uuid references users(id)
```

### cohort_members

```sql
id              uuid primary key
cohort_id       uuid references cohorts(id)
user_id         uuid references users(id)
coach_id        uuid references users(id)
joined_at       timestamptz default now()
is_completed    boolean default false (set on Day 22)
final_status    enum('active','dropped','completed','disqualified','refunded')
final_habit_score   numeric(5,2)
unique (cohort_id, user_id)
```

### daily_checkins

```sql
id                  uuid primary key
cohort_member_id    uuid references cohort_members(id) on delete cascade
date                date not null
day_number          smallint (1-21)
workout_done        varchar(10) ('yes','no','partial')
workout_type        varchar(30)
steps               integer
water_l             numeric(3,1)
protein_meals       smallint
plate_method        varchar(10)
sleep_hours         numeric(3,1)
bed_time            time
mood                smallint (1-5)
energy              smallint (1-5)
note                text
habit_score         numeric(5,2) (computed)
created_at          timestamptz default now()
unique (cohort_member_id, date)
```

### progress_records

```sql
id                  uuid primary key
cohort_member_id    uuid references cohort_members(id) on delete cascade
recorded_on         date not null
day_number          smallint (1, 7, 14, 21)
weight_kg           numeric(5,1)
waist_cm            numeric(5,1)
photo_front_url     text (Supabase Storage signed URL ref)
photo_side_url      text
photo_back_url      text
photo_consent_public boolean default false
verification_video_url text (for Day 1 weight/tape video)
```

### whatsapp_messages

```sql
id                  uuid primary key
cohort_member_id    uuid references cohort_members(id) on delete set null
user_id             uuid references users(id) on delete cascade
direction           enum('in','out')
sender              enum('user','auto','coach','founder','system')
sender_id           uuid references users(id) (for coach/founder, null for auto)
template_name       varchar(80) (if template message)
body                text
media_urls          text[]
sent_at             timestamptz default now()
status              enum('sent','delivered','read','failed')
external_id         varchar(120) (AiSensy message ID)
```

### coach_notes

```sql
id                  uuid primary key
cohort_member_id    uuid references cohort_members(id) on delete cascade
coach_id            uuid references users(id)
note                text
created_at          timestamptz default now()
```

### champion_submissions

```sql
id                      uuid primary key
cohort_member_id        uuid references cohort_members(id) unique
submitted_at            timestamptz
upi_id                  varchar(80)
consent_public          enum('yes','yes_anon','no')
final_weight_kg         numeric(5,1)
final_waist_cm          numeric(5,1)
day21_photo_front_url   text
day21_photo_side_url    text
day21_photo_back_url    text
q1_day1_state           text
q2_hardest_day          text
q3_behavior_change      text
q4_forward_plan         text
q5_advice_to_next       text
extra_note              text
peer_nomination_user_id uuid references users(id)
```

### champion_results

```sql
id                      uuid primary key
cohort_id               uuid references cohorts(id)
cohort_member_id        uuid references cohort_members(id)
rank                    enum('gold','silver','bronze','most_consistent','biggest_comeback','group_mvp')
total_score             numeric(5,2)
score_consistency       numeric(5,2)
score_physical          numeric(5,2)
score_habit             numeric(5,2)
score_story             numeric(5,2)
prize_amount_paid       numeric(8,2)
prize_paid_on           date
free_seat_code          varchar(40)
case_study_url          text
created_at              timestamptz default now()
```

### payments

```sql
id                  uuid primary key
user_id             uuid references users(id)
cohort_id           uuid references cohorts(id)
amount              numeric(10,2)
currency            varchar(3) default 'INR'
razorpay_order_id   varchar(80)
razorpay_payment_id varchar(80)
status              enum('created','paid','failed','refunded','partial_refund')
paid_at             timestamptz
created_at          timestamptz default now()
```

### refunds

```sql
id                  uuid primary key
payment_id          uuid references payments(id)
amount              numeric(10,2)
reason              text
status              enum('requested','approved','denied','processed')
processed_at        timestamptz
razorpay_refund_id  varchar(80)
processed_by        uuid references users(id)
```

### audit_log

```sql
id              uuid primary key
actor_id        uuid references users(id)
action          varchar(80)
target_type     varchar(40)
target_id       uuid
metadata        jsonb
created_at      timestamptz default now()
```

---

## RLS (Row Level Security) — critical policies

### `daily_checkins`
- Users can SELECT/INSERT/UPDATE only their own rows
- Coaches can SELECT only rows where the cohort_member's coach_id matches their user.id
- Founder/admin can SELECT all

### `progress_records` (especially photos)
- Same as `daily_checkins`
- Photos URL is a signed Supabase Storage URL with 1-hour expiry; URL is regenerated on every read

### `whatsapp_messages`
- Users see only their own messages
- Coach sees only assigned users' messages
- Founder sees all

### `champion_submissions`
- User SELECT/INSERT only their own
- Coaches see only assigned users' submissions
- Judges (during judging period) get a read-only "blind" view via a separate `judging_view` materialized view that strips PII

---

## Indexes (the critical ones)

```sql
create index on cohort_members (cohort_id, user_id);
create index on cohort_members (coach_id) where final_status = 'active';
create index on daily_checkins (cohort_member_id, date desc);
create index on whatsapp_messages (cohort_member_id, sent_at desc);
create index on whatsapp_messages (user_id, direction, sent_at desc);
create index on champion_submissions (cohort_member_id);
create index on payments (user_id, status);
```

---

## Computed views (or materialized views)

### `cohort_kpis`
Per cohort: enrolled, dropped, completed, completion_rate, avg_habit_score, avg_weight_delta_kg, refund_rate, nps.

### `user_today`
Single source for `/today` page: today's day_number, workout, prescribed habits, last check-in.

### `judging_view`
For Champion judging: blinded user data with submission text, score inputs.

---

## Migrations workflow

- Drizzle migrations in `packages/db/migrations`
- Run via `drizzle-kit push:pg` for dev, `drizzle-kit migrate` for prod
- Every migration committed to git, reviewed on PR
- Test seed data: `seeds/cohort_test.ts` creates 1 cohort + 30 mock users + 21 days of fake check-ins so dev can see real-feeling data
