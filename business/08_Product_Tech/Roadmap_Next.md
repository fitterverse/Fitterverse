# Fitterverse — Next Build Phase

## Status (as of May 5, 2026)
- Consumer accountability app live at fitterverse-app--fitterverse.us-central1.hosted.app
- Firebase Auth (email + Google) working
- fitterverse.in domain connected, SSL pending propagation
- Monorepo: business/ + product/ on GitHub (fitterverse/Fitterverse)

---

## Phase 2 — To build next

### 1. UI/UX Overhaul (consumer accountability app)
- Better mobile-first design
- More gamified feel (animations, celebrations on streak milestones)
- Cleaner dashboard layout
- Better onboarding flow visuals
- Messaging shift from "meal tracker" to "diet + workout accountability"

### 2. Workout accountability layer
- Workout planning / commitment check-ins
- Workout completion logging
- Weekly consistency score that combines diet + workout adherence
- CRM visibility into workout compliance, not just food logs

### 3. Home / Marketing Page (fitterverse.in)
- Position Fitterverse as the accountability partner for diet + workouts
- Clarify current capability vs. next capability honestly
- Keep strong problem-solution-trust framing
- Expand blog section for nutrition, workouts, recovery, mindset, and consistency
- Footer with legal and brand links

### 4. Blog
- `/blog` route inside product/
- Markdown/MDX or CMS-backed articles
- SEO optimised (meta, OG tags)
- Categories: nutrition, workouts, recovery, mindset, recipes

### 5. CRM — crm.fitterverse.in
- Separate subdomain for nutritionist / admin
- **Auth:** separate login (not consumer Firebase auth)
- **Views:**
  - User list with streak status, last active
  - Per-user: food logs, workout adherence, daily scores, badges earned
  - Progress charts per user across diet + workout consistency
- **Folder:** product/crm/ (new Next.js app or route group)
- **Deploy:** new Firebase App Hosting backend pointed at product/crm/

---

## Folder plan (product/)
```
product/
├── src/app/              ← consumer accountability app
│   ├── dashboard/
│   ├── onboarding/
│   ├── badges/
│   ├── history/
│   ├── progress/
│   ├── blog/
│   └── (website)/        ← public website + marketing pages
│
└── crm/                  ← Phase 2 (CRM sub-app)
    ├── package.json
    └── src/
```
