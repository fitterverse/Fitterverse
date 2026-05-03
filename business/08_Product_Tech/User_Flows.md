# User Flows — End-to-End

Five flows, drawn as plain text. These are what the dev implements.

---

## Flow 1: Discovery → Payment

```
1. User clicks ad / organic / referral
   ↓
2. Lands on fitterverse.in/reset
   ↓
3. Scrolls, reads, clicks "Reserve my seat — ₹999"
   ↓
4. Razorpay checkout opens
   - Pre-filled: email/phone (if cookie), amount ₹999, item "21-Day Reset Cohort N"
   ↓
5. User pays via UPI / card / wallet
   ↓
6. Razorpay webhook to /api/payments/webhook
   - Verify signature
   - Create user (if new) or update (if existing)
   - Create payment record
   - Create cohort_member record (status=enrolled)
   - Trigger:
     a. Welcome WhatsApp template
     b. Welcome email
     c. SMS with assessment link
   ↓
7. Redirect user to /assessment
```

## Flow 2: Assessment → Plan delivery

```
1. User on /assessment (post-payment)
   ↓
2. Multi-step form (6 sections, ~5 min)
   - Auto-save per step
   - Phone OTP if not signed in (Supabase Auth)
   ↓
3. Submit → /api/assessment/submit
   - Validate
   - Save assessment row
   - Compute personalization (BMI, protein target, 3 starting habits)
   - Run disqualification check
     - If flagged: email founder, show "we'll be in touch" page, hold cohort_member
     - Else: proceed
   ↓
4. Redirect to /assessment/output
   - Show personalized output (numbers, habits, coach intro)
   ↓
5. Background:
   - Send WhatsApp message with output summary
   - Send email with output PDF
   - Send WhatsApp template "save this number" + cohort group invite link (when sent)
```

## Flow 3: Daily cohort day (Day N during cohort)

```
[Auto, 7:00 AM]
  Inngest job runs at 7:00 AM IST every day during active cohorts
   ↓
  For each active cohort_member: send Day-N morning template via AiSensy
   ↓
[User opens WhatsApp, taps the workout link]
   - Workout link goes to /today on web app (auth required)
   - User watches video, marks "done"
   ↓
[User submits check-in via /tracker]
   - Form: workout, steps, water, protein, plate, sleep, mood, energy, note
   - POST /api/checkin → save daily_checkins row
   - Compute habit_score
   - Update streak
   ↓
[Auto, 1:00 PM]
   Lunch nudge sent
   ↓
[Coach reviews dashboard]
   - Sees today's check-ins, who hasn't yet, plate photos
   - Sends personal DMs (logged to whatsapp_messages)
   ↓
[Auto, 7:00 PM and 9:30 PM]
   Evening + wind-down templates sent
   ↓
[Coach end-of-day review]
   Updates risk tier for tomorrow's priority
```

## Flow 4: Recovery (user missed a day)

```
[Cron, every morning at 7:30 AM]
  Find cohort_members where last check-in date < today - 1
   ↓
  For each:
    - 1 day missed → send "soft nudge" template (auto)
    - 2 days missed → flag for coach in dashboard with "ESC1" tag
    - 3+ days missed → flag with "ESC2" + coach voice-note prompt
    - 7+ days missed AND day_number >= 7 → flag founder for personal message
   ↓
  Coach sees flag in dashboard, sends DM via dashboard interface
   ↓
  All sent messages logged to whatsapp_messages with sender=coach/founder
```

## Flow 5: Champion submission → judging → announcement

```
[Day 21, evening]
  /champion/submit unlocked for the user
   ↓
  User fills submission form (Q1-Q5, photos, UPI ID, consent)
  → /api/champion/submit → create champion_submissions row
   ↓
[Day 22, end of day]
  Submissions close
   ↓
[Day 23]
  Founder runs scoring job:
   - Auto-compute consistency, physical, habit scores from data
   - Generate blinded view of submissions for 3 judges
   - 3 judges score story (15 pts) + photo (12 pts) blind
   - Combined score → champion_results table
   - Top 3 ranked, plus 3 bonus categories
   ↓
[Day 24, 7:30 PM]
  - Instagram Live (manual, founder)
  - Auto-send WhatsApp announcement to cohort group
  - Auto-send winner emails (with prize + free-seat code)
  - Generate case study templates (pre-filled from submission)
   ↓
[Day 25-26]
  Content team produces reels + carousels + blog post per Champion
   ↓
[Day 28]
  Cohort N+1 enrolment opens with Champions featured in ads
```

---

## Failure modes to handle in code

| What can fail | Handling |
|---|---|
| Razorpay webhook lost | Reconcile job runs every 30 min: pull recent payments via Razorpay API, sync to DB |
| WhatsApp template send fails | Retry 3x with exponential backoff; alert ops on persistent fail |
| User submits check-in for a date in the future | Reject server-side; show "you can only check in for today or yesterday" |
| User pays but assessment never completes | Cron flag every 24 hours, founder DMs personally |
| Photo upload exceeds 10MB | Compress client-side; reject server-side if still too large |
| User in different timezone | All cohort schedules in IST; user's tracker dates are IST. Show clear "All times in IST" everywhere |
| Coach assigned no users | Default coach = founder, until first hire |

---

## "Just enough" features for v0 cohort 1

If you're behind schedule, ship in this priority order:

1. ✅ Landing + payment + assessment + output (cannot launch without)
2. ✅ Daily check-in tracker on web
3. ✅ WhatsApp daily auto-messages
4. ✅ Coach dashboard (Retool is OK if Next.js admin isn't ready)
5. ⚠️ Recovery sequences (manual coach in v0 if needed)
6. ⚠️ Weekly reports (do them in email manually for cohort 1, automate by cohort 2)
7. ❌ Champion submission web form (use Typeform for cohort 1, build custom for cohort 2)

The acceptable v0 is: pay → assessment → daily WhatsApp → web tracker → coach reviews via dashboard. Everything else can be manual for the first 30 users.
