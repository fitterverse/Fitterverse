# Fitterverse

This repository contains the Fitterverse product surfaces and business docs.

## Repo Layout

- `product/` consumer app for `fitterverse.in`
- `crm/` internal CRM for `crm.fitterverse.in`
- `business/` operating docs, strategy, program, and marketing material
- `ARCHITECTURE.md` codebase and system guide

## Working Locally

Run the consumer app:

```bash
cd product
pnpm install
pnpm dev
```

Run the CRM:

```bash
cd crm
pnpm install
pnpm dev
```

Both apps have their own `package.json`, `tsconfig.json`, `next.config.ts`, lockfile, and Firebase hosting config.

## Notes

- The repo root is no longer an app.
- Treat `product/` as the only consumer-app source of truth.
- Deployment-sensitive config stays inside `product/` and `crm/`.
