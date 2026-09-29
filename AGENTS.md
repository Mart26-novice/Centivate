# AGENTS.md

Instructions for AI coding agents (Claude Code, Codex, Cursor, etc.) working in this repository.

Centivate is a campus facility complaint and maintenance system for Central Philippine University SHS: students file facility complaints, anyone can track them by code, and admins triage, assign and resolve them. It is a capstone research project, so correctness, privacy and an honest UI matter more than feature count.

Read these before making non-trivial changes:

| Doc | Read it when |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | You need to know who the users are and what a feature is for |
| [`docs/Architecture.md`](docs/Architecture.md) | You touch the API, auth, Firestore, or deployment |
| [`docs/Design-System.md`](docs/Design-System.md) | You touch anything visual |
| [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md) | You call or change an `/api` endpoint |

## Commands

```bash
npm install          # install dependencies
npm run dev          # Express + Vite dev server on http://localhost:3000
npm run lint         # tsc --noEmit (type check; there is no ESLint)
npm test             # vitest run
npm run build        # vite build + esbuild bundle of server.ts into dist/
firebase deploy --only firestore:rules   # editing firestore.rules alone does NOT change production
```

Before calling a change done, run `npm run lint` and `npm test`. Both must pass.

## Where things live

- `api/app.ts`: every REST endpoint, auth middleware, rate limiting, Gemini call, validation. One Express app shared by local dev (`server.ts`) and Vercel (`api/index.ts`).
- `src/App.tsx`: app shell and global state. There is no router; `activeTab` (`home | student | admin | analytics | research`) selects the view.
- `src/components/`: one file per screen or modal. `AdminDashboard.tsx` and `StudentPortal.tsx` are the large ones.
- `src/lib/firestoreService.ts`: the client's only data layer (`apiFetch`, polling, admin realtime listeners).
- `src/types.ts`: the source of truth for statuses, priorities, categories and buildings. Docs or UI that disagree with it are wrong.
- `src/utils/complaintHelpers.ts`: tracking codes, filtering, stats, validation. Pure functions with tests.
- `src/db/` and `src/data/authData.ts` are unused leftovers. Don't build on them.

## Rules that must not be broken

These are security or research-integrity invariants. Changing any of them needs an explicit request from the maintainer.

1. **The client never writes to Firestore for complaints, staff, surveys or users.** All writes go through `api/app.ts` (Admin SDK). `firestore.rules` enforces `allow write: if false` on those collections. Don't loosen the rules to make a feature easier.
2. **Role assignment is server-only.** `users/{uid}` is written only by `POST /api/auth/profile` after checking an access code. Never add a client path that sets `role`.
3. **Admin endpoints use `requireAdmin`.** Every mutating complaint or staff route and `GET /api/surveys` must keep it. A valid token from a non-admin must still get `403`.
4. **Privacy scoping on `GET /api/complaints` and `GET /api/staff`.** Non-admins get aggregate-only data. Anonymous reports are never linked to an account. Add new fields to the scoped view only if they are non-identifying.
5. **Server-side validation stays authoritative.** Client checks are for UX. Keep length caps, enum checks and the base64 image rule (JPEG/PNG/WEBP, under 500 KB, no external URLs).
6. **Honest failures, no fake data.** When Firebase is configured, a failed write must surface as an error. Stats show "No data yet" instead of invented numbers. Seed data only loads locally or with `SEED_DEMO_DATA=true`.
7. **Secrets never enter the repo.** Service-account JSON, `.env*` files (except the examples) and API keys stay out of git. `ADMIN_DEV_BYPASS_TOKEN` is local-only.
8. **If you change a Firestore query or collection, update `firestore.rules` and say it needs deploying.**

## Conventions

- TypeScript, but `tsconfig.json` is not in `strict` mode, so a clean `npm run lint` doesn't prove null-safety. Import domain types from `src/types.ts` instead of redeclaring string unions.
- Tailwind v4 utility classes inline. There is no custom theme file (`src/index.css` is just `@import "tailwindcss"`). Follow `docs/Design-System.md` for colors, type, spacing and states.
- Icons come from `lucide-react`.
- Every form field has a label, every icon-only button has an accessible name, and every dialog closes on `Esc` via `src/lib/useEscapeKey.ts`.
- Commit messages: `feat: ...`, `fix: ...`, `docs: ...` (see `CONTRIBUTING.md`).
- Prefer the smallest change that fixes the root cause. Don't refactor unrelated code in the same change.

## Testing

- Tests live in `src/__tests__/` (Vitest, jsdom). `authAndApi.test.ts` starts the real Express app in its in-memory mode (no Firebase credentials, dev bypass token for admin) and covers privacy scoping, validation, audit logging, admin gating and staff email.
- New API behavior gets a test in `authAndApi.test.ts`. New pure logic gets a test next to the existing helper tests.
- UI changes: verify in a real browser. With the dev server running, use `playwright-cli` to open `http://localhost:3000`, walk the affected flow, and check widths 390, 820, 1024 and 1440 px for overflow and console errors.

## Gotchas

- `FIREBASE_SERVICE_ACCOUNT_KEY` holds the whole JSON key as one value. Without it, GET routes fall back to in-memory data and every write returns `503`. On Vercel, set it with `vercel env add ... < key.json`, not by pasting (see README).
- Rate limits are in-memory per server instance, so they reset on redeploy and aren't shared across Vercel instances.
- Photos are stored inline as base64 in the complaint document. Keep the 500 KB cap or Firestore's 1 MB document limit will break.
- Gemini is optional. Without `GEMINI_API_KEY` (or if the call fails), a new complaint is saved with no `aiAnalysis`, and `POST /api/ai/analyze-complaint` returns a simple keyword check instead. Never assume `aiAnalysis` is present. A detected hazard raises `Low`/`Medium` priority to `High`, not to `Urgent / Hazard`.
- `README.md` and `docs/API_REFERENCE.md` contain some older building and category names (e.g. `Main Building`, `HVAC & Aircon`). `src/types.ts` is correct.
