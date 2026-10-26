# Medra

Multi-vendor delivery and healthcare marketplace — frontend prototype (mock data only, no backend yet).

- `src/` — React JSX sources: customer, seller, rider, admin, support, super admin, landing, combined preview
- `dist/` — self-contained bundled HTML for each app (open directly in a browser)
- `docs/` — permission matrix (blueprint for future Supabase RLS) and onboarding checklists

## Build & test

```
npm install
npm run build   # bundles src/*.jsx -> dist/*.html
npm test        # smoke-renders all 8 apps
```
