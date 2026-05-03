# KPI Dashboard

What we track, where, and how often.

---

## Tier 1 — North Star

**Active Cohort Completers per Month**

Defined: number of users who completed ≥ 18 of 21 check-ins in any cohort that ended in the month.

Why this is the north star:
- Combines acquisition (you must enrol them)
- Combines product (they must complete)
- Combines retention (high completion = high referrals + high subscription conversion)

---

## Tier 2 — Funnel KPIs (review weekly)

| Stage | Metric | Target |
|---|---|---|
| Acquisition | Cost per landing page view | ≤ ₹15 |
| Acquisition | Landing → assessment start | ≥ 25% |
| Conversion | Assessment start → assessment complete | ≥ 70% |
| Conversion | Assessment complete → payment | ≥ 35% |
| Conversion | Cost per paid user (CAC) | ≤ ₹400 |
| Activation | Payment → assessment within 48 hr | ≥ 90% |
| Activation | Day-1 photo submitted | ≥ 90% |
| Engagement | Day-1 check-in submitted | ≥ 95% |
| Engagement | Day-7 check-in (week 1 retention) | ≥ 85% |
| Engagement | Day-14 check-in | ≥ 75% |
| Engagement | Day-21 check-in | ≥ 60% |
| Outcome | Cohort completion rate (≥18 check-ins) | ≥ 60% |
| Outcome | Avg habit score | ≥ 70 |
| Outcome | Weight delta (median %) | ≥ -2% |
| Outcome | Self-reported energy improvement | ≥ 70% of completers |
| Satisfaction | NPS | ≥ 40 |
| Satisfaction | Refund rate | ≤ 5% |
| Loop | Champion submissions | ≥ 70% of completers |
| Loop | Referral coefficient | ≥ 0.3 |
| Loop | Cohort N+1 conversion (graduate) | ≥ 25% |

---

## Tier 3 — Cohort-level review (every cohort end)

Generated automatically as a cohort report at end of each cohort:

```
COHORT [N] REPORT — [date range]

ENROLMENT
Seats: X / Y
Paid users: X
Refunded before Day 3: X
Started Day 1: X

ENGAGEMENT
Daily check-in median: X / 21
Workout completion: X / 14
Plate method days median: X / 21
Avg habit score: X.X

OUTCOMES
Completion (≥18 check-ins): X / Y (X%)
Median weight delta: -X.Xkg (-X%)
Median waist delta: -X.Xcm
Median sleep delta: +X.X min

CHAMPION
Gold: [Name]
Silver: [Name]
Bronze: [Name]
Most Consistent: [Name]
Biggest Comeback: [Name]
Group MVP: [Name]

VOICE OF USER
Top 3 things users praised:
1. ...
Top 3 things to fix:
1. ...
NPS: X
NPS comments (top 5)

ACQUISITION
CAC: ₹X
Best ad: [variant]
Worst ad: [variant]

REVENUE
Gross: ₹X
Refunds: ₹X
Net: ₹X
Margin: X%

NEXT COHORT FIXES (founder writes)
1. ...
2. ...
3. ...
```

This report becomes a wiki page after every cohort. Build a library of them. Patterns emerge by cohort 4-5.

---

## Tier 4 — Tracking implementation

Where each metric comes from:

| Metric | Source | Tool |
|---|---|---|
| Funnel: ad → page → assessment → payment | Meta + Google ads + GA4 + DB | PostHog dashboard |
| Engagement (check-ins, habit scores) | DB (`daily_checkins`) | Internal admin dashboard + Metabase/Looker |
| WhatsApp delivery/read rate | AiSensy webhooks | Internal dashboard |
| NPS | Post-cohort Typeform survey | Email auto-trigger Day 22 |
| Champion + outcome metrics | DB (`progress_records`, `champion_submissions`) | Internal dashboard |
| Revenue, refunds | Razorpay + DB (`payments`, `refunds`) | Razorpay dashboard + monthly internal P&L |

## Recommended free/cheap stack for analytics

- **PostHog** — product analytics, free up to 1M events/month
- **Metabase** — connects to Supabase Postgres, build founder dashboard for free (self-hosted) or ₹0 cloud trial
- **GA4** — page views, ad attribution
- **Razorpay native** — revenue + refund views

Avoid building a custom analytics dashboard before cohort 5. Metabase + PostHog + spreadsheet is enough.

---

## Founder weekly review (15 min, every Monday)

Look at:
1. Last week's funnel numbers (acquisition + conversion)
2. Active cohort engagement (any user red-tier > 2 days?)
3. Refund queue
4. Open escalations
5. Cohort N+1 enrolment progress

That's it. Don't review more KPIs more often unless something breaks. Discipline to ignore is harder than discipline to track.

---

## Triggers (red flags that demand action)

| If this happens | Do this |
|---|---|
| CAC > ₹600 for 7 days | Pause worst-performing ad, brainstorm new creative |
| Day-1 check-in < 80% | Founder personally onboards every late user |
| Cohort completion < 50% | Stop scaling next cohort. Run completion postmortem. |
| Refund rate > 10% in any cohort | Stop new ads, talk to refunders, fix product |
| NPS < 30 | Pause growth spend. Cohort-by-cohort improvements. |
| Coach can't manage assigned users | Hire coach #2 |
