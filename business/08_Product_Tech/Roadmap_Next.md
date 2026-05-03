# Fitterverse — Next Build Phase

## Status (as of May 4, 2026)
- Diet tracker live at fitterverse-app--fitterverse.us-central1.hosted.app
- Firebase Auth (email + Google) working
- fitterverse.in domain connected, SSL pending propagation
- Monorepo: business/ + product/ on GitHub (fitterverse/Fitterverse)

---

## Phase 2 — To build next

### 1. UI/UX Overhaul (diet tracker)
- Better mobile-first design
- More gamified feel (animations, celebrations on streak milestones)
- Cleaner dashboard layout
- Better onboarding flow visuals

### 2. Home / Marketing Page (fitterverse.in)
- Hero section — hook, CTA
- How it works
- Features / benefits
- Social proof / testimonials
- Blog section (nutrition, fitness articles — SEO)
- Footer with links

### 3. Blog
- `/blog` route inside product/
- MDX or CMS-backed articles
- SEO optimised (meta, OG tags)
- Categories: nutrition, fitness, mindset, recipes

### 4. CRM — crm.fitterverse.in
- Separate subdomain for nutritionist / admin
- **Auth:** separate login (not consumer Firebase auth)
- **Views:**
  - User list with streak status, last active
  - Per-user: full meal log history, daily scores, badges earned
  - Progress charts per user
- **Folder:** product/crm/ (new Next.js app or route group)
- **Deploy:** new Firebase App Hosting backend pointed at product/crm/

---

## Folder plan (product/)
```
product/
├── src/app/              ← consumer app (diet tracker today)
│   ├── dashboard/
│   ├── onboarding/
│   ├── badges/
│   ├── history/
│   ├── progress/
│   ├── blog/             ← Phase 2
│   └── (marketing)/      ← Phase 2 (home page, route group)
│
└── crm/                  ← Phase 2 (CRM sub-app)
    ├── package.json
    └── src/
```
