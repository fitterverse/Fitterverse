# WhatsApp Integration Spec — AiSensy

How we use AiSensy (or any BSP) for cohort messaging.

---

## What AiSensy gives us

- Verified Business WhatsApp number (DP, name, description)
- Template message API (pre-approved templates by Meta)
- Conversational message API (when user has messaged in last 24 hours)
- Inbox view + agent assignment (we use this for coach DMs)
- Webhook for inbound messages

---

## Templates we need to register with Meta

Meta requires every outbound message (outside the 24-hour conversation window) to use a pre-approved template. Submit these in Sprint 1:

| Template name | Category | Purpose |
|---|---|---|
| `cohort_welcome_v1` | Marketing | Post-payment welcome + assessment link |
| `assessment_output_v1` | Utility | Personalized plan delivery |
| `cohort_day_morning_v1` | Utility | Daily 7 AM message (variables: day, workout link) |
| `cohort_day_lunch_v1` | Utility | 1 PM lunch nudge |
| `cohort_day_evening_v1` | Utility | 7 PM evening prompt |
| `cohort_day_winddown_v1` | Utility | 9:30 PM sleep cue |
| `recovery_softnudge_v1` | Utility | Day-1-missed soft nudge |
| `weekly_report_v1` | Utility | Sunday weekly report |
| `champion_submission_v1` | Marketing | Day 22 submission link |
| `champion_announcement_v1` | Marketing | Day 24 winner announcement |
| `cohort_completion_v1` | Marketing | Day 25 completion + next cohort offer |

Meta approval typically takes 24-48 hours per template. Submit all on Day 1 of build.

## Template structure example

`cohort_day_morning_v1`:

```
Header: image (cohort logo)
Body:
"Good morning, {{1}}. Day {{2}}.

Today: {{3}}.
Workout: {{4}}

Reply when done."
Footer: "Fitterverse · 21-Day Reset"
Buttons: [URL: View today's plan]
```

Variables:
- `{{1}}` = first_name
- `{{2}}` = day_number (1-21)
- `{{3}}` = day theme (e.g. "20-min strength + 2.5L water")
- `{{4}}` = today's workout video URL

---

## Outbound send architecture

```
Trigger (cron / event)
   ↓
Job queue (Inngest)
   ↓
For each user to message:
   1. Build template variables from user data
   2. Call AiSensy API: POST /v1/messages
   3. Save to whatsapp_messages table (status='sent')
   4. AiSensy webhook will update status to 'delivered' / 'read' / 'failed' later
```

## Inbound message handling

```
User sends message → AiSensy → webhook to /api/whatsapp/incoming
   ↓
1. Identify user by phone number
2. Save message to whatsapp_messages (direction='in')
3. Open 24-hour conversation window
4. Route to coach inbox (via assigned coach_id)
5. If keyword match (REFUND, STOP, HELP), trigger automated reply + tag in dashboard
```

## Special keywords

| Keyword | Action |
|---|---|
| STOP / UNSUBSCRIBE | Mark user as opted out, stop all auto-messages |
| REFUND | Auto-reply with refund policy, escalate to founder |
| HELP | Auto-reply with help links, ping coach |
| RESET | (in marketing context) Auto-reply with cohort signup link |
| START | Auto-reply with sign-in link if user is opted out |

## Conversation window rules

- Inside 24-hour window of inbound user message: any free-form message OK
- Outside window: must use pre-approved template
- Coaches sending DMs can use free-form within window, fall back to template otherwise

## Rate limits and cost

- AiSensy ~₹0.50/conversational message (within 24h window)
- ~₹0.85/template message (outside window, "utility" category)
- ~₹2.50/marketing template (post-cohort offers etc.)
- Plan budget: 100 users × 50 messages/cohort × ₹0.50 = ₹2,500 per cohort

## Compliance must-haves

1. **Explicit opt-in at signup** — checkbox: "Send me cohort communications on WhatsApp"
2. **Clear opt-out** — every marketing template footer includes "Reply STOP to opt out"
3. **No promotional content during active cohort utility messages** — keep promo separate
4. **Preserve user's right to be forgotten** — when user requests data deletion, also remove from WhatsApp database

## Logging schema (review)

See `Database_Schema.md` → `whatsapp_messages` table.

Every inbound and outbound is logged with:
- direction, sender, body, sent_at, status, external_id, template_name (if template)

---

## Backup BSP

If AiSensy goes down or pricing changes:
- Interakt is the leading alternative in India
- WATI is older but has more enterprise features
- Direct WhatsApp Business API via Meta is also possible but operationally heavier

We architect the WhatsApp module as a single interface (`packages/whatsapp/index.ts` exposes `sendTemplate`, `sendFreeForm`, `markOptedOut` etc.) so swapping BSPs takes 1-2 days.
