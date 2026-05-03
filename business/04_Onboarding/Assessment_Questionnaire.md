# Onboarding Assessment Questionnaire

User completes this immediately after payment. Goal: 4–6 minutes to fill, generates a personalized output, qualifies/disqualifies for cohort.

---

## Section 1 — Basics (1 min)

| Field | Type | Required |
|---|---|---|
| Full name | Text | Y |
| Email | Email | Y |
| Phone (WhatsApp) | Phone | Y |
| Age | Number 16–75 | Y |
| Gender | Male / Female / Prefer not to say | Y |
| City | Dropdown (India top 50) + Other | Y |
| Height (cm) | Number | Y |
| Current weight (kg) | Number | Y |
| Target weight (kg) | Number | Optional |

## Section 2 — Goal (30 sec)

**Q. What is your #1 goal in the next 21 days?**
- Build a routine that I can sustain
- Lose 2–4 kg
- Lose more than 4 kg
- Get stronger
- Improve energy / reduce fatigue
- Improve sleep
- Restart fitness after a long break
- Other (text)

**Q. Why now?**
*(Open text, 1 line)*

## Section 3 — Lifestyle (1 min)

| Question | Type |
|---|---|
| Wake-up time | Time |
| Bed time | Time |
| Work setup | WFH / Office / Hybrid / Self-employed |
| Average work hours/day | Number |
| One-way commute | None / <30 min / 30–60 min / >60 min |
| Avg daily steps now | <3K / 3–5K / 5–8K / >8K / Don't know |
| Current workout frequency | None / 1x/wk / 2–3x/wk / 4+/wk |
| Past fitness attempts (multi-select) | Gym, Home workouts, Diet plan, Personal coach, Fitness app, Yoga, Sports, Other, None |
| What ended your last attempt? | Open text |

## Section 4 — Food (1 min)

| Question | Type |
|---|---|
| Diet | Veg / Non-veg / Eggitarian / Vegan / Jain |
| Typical breakfast (1 line) | Text |
| Typical lunch (1 line) | Text |
| Typical dinner (1 line) | Text |
| Snacking | Multi-select: chai-snack, namkeen, biscuits, fruit, nuts, chocolate, ice cream, other |
| Tea/coffee/day | Number |
| Eat outside (Swiggy/Zomato/restaurant) | Daily / 3–5x week / 1–2x week / Rarely |
| Alcohol | Multi-select: Daily, Weekend, Social only, Never |
| Sugar cravings strength (1–5) | Slider |
| Cooking control | I cook / Family cooks / Mostly outside food / Mix |

## Section 5 — Constraints (30 sec)

| Question | Type |
|---|---|
| Gym access | Yes / No / Sometimes |
| Home equipment | None / Mat / Resistance band / Dumbbells / Full setup |
| Injuries (multi-select) | Knee / Lower back / Shoulder / Wrist / None / Other (text) |
| Medical conditions (multi-select) | Diabetes / PCOS / Thyroid / Hypertension / Heart / Pregnancy / Eating disorder history / None / Other (text) |
| On any medication for weight, blood sugar, or thyroid? | Yes (text) / No |
| Daily time you can give | <15 min / 15–30 min / 30–60 min / 60+ min |

## Section 6 — Coaching style (30 sec)

**Q. What kind of coaching do you respond to best?**
- Strict and structured
- Supportive and gentle
- Flexible — adapt to my week
- Data-driven — show me numbers
- Mix

**Q. Will you commit to one daily WhatsApp check-in for 21 days?**
- Yes
- I'll try
- No

**Q. Anything else you want your coach to know?**
*(Open text, optional)*

---

## Disqualification logic (auto-flag, manual review)

If any of the following, route to manual review with founder before cohort entry:
- Pregnant / breastfeeding (offer postpartum-friendly future cohort)
- Active eating disorder history
- Uncontrolled diabetes / hypertension / heart condition (require doctor clearance)
- BMI < 18.5 (we don't run weight-loss programs for underweight users)
- Age < 18

For these cases, default action = full refund + recommend they consult their doctor + add to waitlist for future specialised programs.

---

## After submission — what user sees

User sees the personalized output (see `Output_Template.md`) immediately on screen, plus a copy on WhatsApp + email.

---

## Data we keep (for cohort + analytics)

All assessment data goes to:
- User record in `users` table
- Cohort enrolment in `cohort_members` table
- Coach dashboard (filtered to their assigned users only)

Sensitive fields (medical, weight, photos) are encrypted at rest. See `10_Legal/Disclaimers_and_TOS.md` for full data handling.
