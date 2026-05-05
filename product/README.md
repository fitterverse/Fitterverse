# Fitterverse Product

Next.js 16 consumer surface for `fitterverse.in`.

## What lives here

- Public website and SEO pages under `src/app/(website)`
- Public auth flows under `src/app/(public)`
- Logged-in consumer app under `src/app/(app)`
- Shared website copy, blog loader, and branding helpers under `src/features/website`

## Product direction

Fitterverse is positioned as an accountability partner for healthier eating and more consistent workouts.

The product depth starts with nutrition accountability today and expands toward a broader diet + workout consistency system over time.

## Working locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

The build currently runs with `next build --webpack`.
