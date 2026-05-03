# Onboarding Output — What the User Sees After Assessment

User sees this on screen + gets it on WhatsApp + email within 30 seconds of finishing the assessment.

---

## Layout (web view + WhatsApp text version)

### Top hero card

> **Hi [First name], your Fitterverse Reset starts [date].**
>
> You're not starting from zero. You're starting from where you are.

### Your numbers

| | |
|---|---|
| Starting weight | XX.X kg |
| Target weight (if set) | XX.X kg |
| BMI | XX.X (category: Normal / Overweight / Obese-I / Obese-II) |
| Daily protein target | XX g |
| Daily step target (Week 1) | 6,000 |
| Daily water target | 2.5 L |
| Suggested workout time | 20 min/day, 3x in Week 1 |
| Suggested bed time | XX:XX (1 hour earlier than current avg) |

### Your habit floor

> Your first goal is **not** perfection. Your first goal is **80% consistency for 14 days**. We'll worry about progress after that.

### Three habits to start with (Day 1–3)

Based on your assessment, these are the three highest-leverage starting points for *you*:

1. **Habit 1** (personalized — see logic below)
2. **Habit 2** (personalized)
3. **Habit 3** (personalized)

### Your coach

> Your coach for this cohort is **[Coach name]**.
> [Coach photo]
> "[One-line coach quote]"
>
> [Coach] will check in with you every day on WhatsApp.

### What's next

- ✅ Save this WhatsApp number: +91-XXXXX-XXXXX
- ✅ Add yourself to Day-1 calendar reminder
- ✅ Take your Day-1 photo + weight by 11:59 PM on Day 1 (we'll remind you)
- ✅ Join the cohort group on [date] — invite is on its way

### One last thing

> Your Day-1 photo is the most important photo in this program. Don't skip it. We're not judging it — we just need you to have a "before" so you can have an "after".

---

## Habit personalization logic

Based on assessment answers, the system picks the user's three starting habits from this priority list. Highest-priority unmet behavior first.

Priority order (top to bottom):

1. **No daily check-in commitment** → Habit: "Reply to one WhatsApp message a day. That's it for Day 1."
2. **Sleep < 6.5 hr or bed time > 12 AM** → Habit: "Bed at [their current bed time minus 30 min] for the next 5 nights."
3. **Steps < 5,000** → Habit: "6,000 steps. One walk after dinner."
4. **No protein at breakfast** → Habit: "Add protein to breakfast (eggs, paneer, curd, dal)."
5. **Eats out > 5x/week** → Habit: "Cook or carry one meal a day."
6. **Sugary drinks > 3/day** → Habit: "Cap chai/coffee at 2/day."
7. **No workout history** → Habit: "15-min Day-1 workout, even if you don't feel like it."
8. **Late-night snacking** → Habit: "Stop eating after 9 PM."

Pick the top 3 unmet for that user. Always end with "Drink 2.5L water" if it isn't already in the top 3.

---

## BMI categories (India-adjusted for cohort messaging)

| BMI | Label shown |
|---|---|
| < 18.5 | Underweight (manual review — see disqualification) |
| 18.5–22.9 | Normal |
| 23.0–24.9 | Overweight (Asian threshold) |
| 25.0–29.9 | Obese Class I |
| 30+ | Obese Class II — extra coach check-in cadence |

**Note:** We do not show "obese" as a label to the user. We show:
- BMI 23–24.9: "above ideal range"
- BMI 25+: "in a range where the Reset will likely show meaningful change"

The label is for our internal triaging, not for shaming the user.

---

## What goes to the coach

Coach dashboard for this user gets:
- Full assessment answers
- Auto-tagged risks (medical, injury, low time availability, food constraints)
- Coaching-style preference
- The three personalized starting habits
- Suggested first message script (auto-generated)

See `06_Coach_Ops/Coach_SOP.md` for what the coach does with this.
