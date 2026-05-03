# Unit Economics

## Per-cohort math (steady state, post-Cohort 3)

Assume cohort of 100 paid users at ₹999.

### Revenue
- 100 × ₹999 = **₹99,900 gross**
- Razorpay fee (~2%): -₹2,000
- **Net revenue per cohort: ~₹97,900**

### Variable cost per cohort
| Item | Cost |
|---|---|
| WhatsApp BSP messages (avg 50 msgs × 100 users × ₹0.50) | ₹2,500 |
| Coach time (1 coach manages 100 users for 21 days, 4 hrs/day @ ₹400/hr) | ₹33,600 |
| Champion prize pool | ₹15,000 |
| Payment + tooling | ₹2,500 |
| **Variable cost** | **₹53,600** |

### Contribution margin
- ₹97,900 − ₹53,600 = **₹44,300 per cohort (~45% margin)**

### Acquisition (CAC)
- Target CAC: ₹250–₹400 per paid user
- 100 users × ₹350 = ₹35,000 CAC
- **Net per cohort after CAC: ~₹9,300**

That's break-even-ish on a single cohort. The unit economics work because of the next two paragraphs.

## Where the money actually comes from

### 1. Cohort → Subscription upsell (post-cohort 3)
- 30% of cohort completers convert to ₹1,499/month Plus plan
- Average tenure: 4 months → ₹6,000 LTV
- 100 users × 60% completion × 30% conversion × ₹6,000 = **₹1.08L upsell revenue per cohort**

### 2. Referral compounding
- Each completer brings 0.4 new users (target)
- 60 completers → 24 new users for next cohort at ~₹0 CAC
- Effective CAC drops over time as referral % grows

### 3. Corporate deal unlock
- After 3 cohorts and 25 case studies, one corporate deal of ₹3L–₹10L for a 21-day employee program funds the next 3 cohorts

## LTV / CAC targets

| Metric | Target by Cohort 6 |
|---|---|
| CAC | ₹300 |
| Cohort revenue per user | ₹999 |
| Subscription conversion | 30% |
| Avg subscription tenure | 4 months @ ₹1,499 |
| LTV (cohort + sub) | ₹999 + (0.3 × ₹6,000) = **₹2,799** |
| LTV/CAC | **9.3** |
| Payback period | < 1 month |

## Sensitivity — what kills the model

| Scenario | Impact |
|---|---|
| Completion drops below 40% | Referrals collapse, case studies thin, model breaks |
| CAC rises above ₹600 | Cohort barely breaks even, must rely on subscription conversion |
| Coach can't handle 100 users | Need a 2nd coach earlier; margin drops to ~25% |
| Refund rate > 10% | Unit economics break; tighten onboarding criteria |

## What to track every cohort

1. Completion rate (target ≥ 60%)
2. Cost per paid user (target ≤ ₹400)
3. Subscription conversion (target ≥ 25% post-Cohort 3)
4. Referral coefficient (target ≥ 0.3)
5. Refund rate (target ≤ 5%)

If any two of these break their targets in two consecutive cohorts, stop scaling and fix.
