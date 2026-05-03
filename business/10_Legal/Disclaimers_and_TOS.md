# Disclaimers, Terms, and Refund Policy — v1 outline

This is a working outline, not legal advice. Get a lawyer to review before going live.

---

## Critical disclaimers (shown at signup + in onboarding output + on site footer)

### Health disclaimer

> Fitterverse is a habit-based fitness and nutrition coaching program. We are not a medical service. We do not diagnose, treat, cure, or prevent any disease.
>
> Before starting any fitness program, consult your doctor — especially if you have:
> - Heart disease, hypertension, or any cardiovascular condition
> - Diabetes (Type 1 or Type 2)
> - Thyroid conditions
> - PCOS or other hormonal conditions
> - Pregnancy or recent childbirth
> - Eating disorder history (active or in remission)
> - Any injury or musculoskeletal condition
> - You are taking medication for any condition
>
> The information in Fitterverse is for general wellness only.

### No medical claims

> Fitterverse does not promise specific weight loss, body fat reduction, or treatment of any condition. Results vary. We do not guarantee outcomes.

### Coach scope

> Fitterverse coaches are habit and fitness coaches, not licensed medical professionals or registered dietitians. They cannot give medical nutrition therapy or medical diagnosis.

---

## Terms of Service — sections to draft

1. **Acceptance** — by paying, you accept these terms
2. **Eligibility** — must be 18+, India-based, not in disqualified medical category
3. **Cohort participation** — what we provide, what we don't
4. **User obligations** — honest assessment data, daily check-ins, photo submission, group conduct
5. **Champion Program rules** — eligibility, judging, prize disbursement, anti-cheat
6. **Refund policy** — 100% till Day 3, 50% Day 4–7, none after Day 7 (subject to compelling-case review)
7. **Data and privacy** — see Privacy section
8. **Intellectual property** — Fitterverse content remains ours; users grant us license to use anonymized testimonials and (with explicit opt-in) named case studies
9. **Liability cap** — limited to amount paid (₹999)
10. **Indemnification** — standard language
11. **Governing law** — India, jurisdiction Bengaluru/your registered city
12. **Termination** — we can remove a user from cohort for rule violation; user can opt out anytime per refund policy

---

## Privacy Policy — sections to draft

1. **What we collect:**
   - Identity: name, email, phone, age, gender, city
   - Health: weight, height, medical conditions disclosed, food data
   - Behavior: WhatsApp messages, tracker data, photos
   - Payment: handled by Razorpay; we don't store card details

2. **Why we collect it:**
   - To deliver the program
   - To personalize the plan
   - To compute Champion eligibility
   - To improve the product (anonymized aggregate analysis)

3. **How we store it:**
   - Encrypted at rest in Supabase / Postgres
   - Photos in private S3 bucket with signed URLs only
   - Coach access scoped to assigned users only

4. **What we share:**
   - Nothing identifiable to advertisers, ever
   - Aggregated anonymous data may be shared in marketing ("Cohort 5 averaged 3.2L water/day")
   - With user opt-in: name, photos, story for marketing

5. **User rights:**
   - Request data export
   - Request data deletion (within 30 days, except where required by tax/legal)
   - Withdraw marketing opt-in anytime

6. **Compliance:**
   - DPDP Act (India)
   - Razorpay PCI compliance for payments
   - WhatsApp Business policy compliance for messaging

---

## Champion Program — additional terms

- Prize is paid only after submission verification (Day 23–25)
- Prize TDS / tax: ₹10K Gold prize is below TDS threshold (₹10K limit on prize income for some categories — confirm current FY 2026 rules with CA before payout)
- Winner consents to story publication; if winner withdraws consent post-prize, prize remains paid but story is removed
- Disqualification = no prize, no public note (per Anti-Cheat Rules)

---

## Refund Policy — published verbatim

> **Day 1–3:** 100% refund, no questions. Reply REFUND to your coach.
> **Day 4–7:** 50% refund. Onboarding has been delivered.
> **Day 8 onwards:** No refund. Contact founder for compelling cases (medical emergency, etc.).
>
> Refunds processed within 7 working days to original payment method.

---

## Things to absolutely include in content (FYI for content team)

- "Not medical advice" footer on all blog posts
- "Results vary" disclaimer on all transformation case studies
- "Consult your doctor before starting" on landing page below CTA
- Champion Program rules visible on /champions page

---

## Action items before Cohort 1 goes live

- [ ] Hire a startup lawyer for 1 hr to review TOS + Privacy + Refund + Champion rules
- [ ] Register fitterverse.in legal entity (LLP or Pvt Ltd) — required for Razorpay business account
- [ ] Get GST registration if revenue projected > ₹20L/year
- [ ] Confirm prize-money tax handling with CA
- [ ] Add cookie banner to fitterverse.in (DPDP Act compliance)
