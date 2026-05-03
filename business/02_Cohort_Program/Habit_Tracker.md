# Habit Tracker — Daily Format

Every cohort user has a tracker (web app v1, Google Sheet/Notion v0) with these fields per day.

## Daily fields (filled by user)

| Field | Type | Example |
|---|---|---|
| Date | Date | 2026-05-04 |
| Workout done? | Yes / No / Partial | Yes |
| Workout type | Dropdown | Strength / Cardio / Mobility / Walk / Rest |
| Steps | Number | 8,200 |
| Water (L) | Decimal | 2.8 |
| Protein meals (count) | 0–4 | 3 |
| Plate method used? | Yes / No / Partial | Yes |
| Sleep (hours) | Decimal | 7.0 |
| Bed time | Time | 23:15 |
| Mood (1–5) | Slider | 4 |
| Energy (1–5) | Slider | 4 |
| One-line note | Text | "Skipped morning workout, did evening walk instead" |

## Weekly fields (Day 7, 14, 21)

| Field | Notes |
|---|---|
| Weight (kg) | Same time of day, ideally morning |
| Waist (cm) | At navel level |
| Progress photo | Front + side + back, same lighting/clothes |
| Week reflection | 3 sentences |

## Habit score (computed, shown to user)

Daily score (0–100):
- Workout done: 30 pts
- Steps target hit (week-specific): 20 pts
- Water target hit: 15 pts
- Protein meals ≥ target: 15 pts
- Sleep ≥ 7 hr: 10 pts
- Checked in: 10 pts

Weekly score = average of 7 days.
Cohort score = average of 21 days.

This score is public to the user only. Coach sees the same plus comments. Cohort group sees only "completed" / "not completed" badge per day.

## Streaks

- Daily check-in streak (longest streak shown on user dashboard)
- Workout streak
- Plate method streak

We celebrate streak milestones at 3, 7, 14, 21 days.

## Privacy

- Weight and photos are visible only to the user and the assigned coach
- The cohort group never sees individual weight or photos unless the user explicitly posts them
- Champion submissions opt-in to public sharing (see `03_Champion_Program/`)
