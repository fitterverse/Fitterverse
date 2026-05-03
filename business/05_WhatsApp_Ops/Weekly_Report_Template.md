# Weekly Progress Report

Sent every Sunday at 7 PM via WhatsApp + email. Auto-generated from the user's tracker.

---

## Format (single WhatsApp message)

```
[First name], your Week [N] Reset

Habit Score: [82] / 100
Streak: [6] days

What you did
✓ [4] / 7 workouts
✓ [49,200] steps total ([7,028] avg/day)
✓ [3] / 7 plate-method dinners
✓ [18.5] L water this week
✓ Avg sleep [6h 45m]

Body
Weight: [73.2 kg] ([-0.6 kg] from last week)
Waist: [89 cm] ([-1 cm])

What stood out
[Coach picks 1 specific thing — e.g., "You hit your steps every day except Friday — biggest improvement of week 1"]

What we'll work on next week
[Coach picks 1 — e.g., "Two more plate-method dinners. That's the leverage point."]

Reply with:
1. Did this week feel hard, doable, or easy?
2. One sentence on what worked.
```

---

## Email version (HTML, slightly richer)

Same content but with:
- Embedded chart of daily habit score over 7 days (sparkline)
- Embedded chart of weight + waist trend
- Coach photo + signature
- One CTA at bottom: "See your full dashboard" → web app link

---

## Generation logic (for the dev building this)

```
Inputs needed from DB:
- habit_score per day for last 7 days
- workouts_completed (count)
- steps_total, steps_avg
- plate_method_count
- water_total
- sleep_avg (hours)
- weight delta vs last week
- waist delta vs last week
- coach_note (free text, written by coach in dashboard before send)

Triggered: every Sunday 6:55 PM, queued for 7:00 PM send.
Fallback: if coach_note is empty, use a templated note based on biggest delta or biggest gap.
```

---

## Coach action before report sends (every Sunday afternoon)

Coach reviews each user's week in dashboard, writes 2 lines:
1. What stood out (positive)
2. What to work on next week (one specific thing)

This takes ~1 min per user. Coach managing 100 users = ~90 min on Sunday afternoon. This is built into the coach SOP.

---

## End-of-cohort report (sent on Day 21, after final submission)

Same format but covers the full 21 days, plus:
- Total habit score average
- Best day, worst day
- Biggest behavior change observed
- Photo collage (Day 1, Day 11, Day 21)
- "Your forward plan" — pre-filled from their Champion submission Q4
- CTA: "Continue with Plus plan" or "Join next cohort with COHORTNGRAD code"
