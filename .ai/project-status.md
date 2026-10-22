# Project status — Tovv

Last updated: 2026-10-22 (frontend redesign session). Verified facts only. Rules: `../AGENTS.md`; product facts: `../docs/spec/PRD.md`, `../docs/PRODUCT.md`.

## Workflow

1. Read `AGENTS.md`, then this file. Check `git status`, branch (`frontend` for mobile work), and `git fetch`.
2. Set up: `cd mobile && npm ci`. Android build needs `JAVA_HOME` (Android Studio JBR) and `ANDROID_HOME`.
3. Change: screens use the typed adapter (`mobile/src/data/api`); business rules stay in `mobile/src/domain` with tests; colours only through `useColors()` / `makeStyles()`.
4. Verify before claiming done: `npm run typecheck`, `npm run lint`, `npm test`, `npx expo-doctor`; for UI, capture emulator/device screenshots into `.impeccable/review/` and summarise in `docs/qa-report.md` (device, OS, build type, mode, theme).
5. Release: commit `(jenis) deskripsi` (Indonesian, no co-author/AI attribution) → push `frontend` → PR to `staging` → PR `staging` → `main`. No force-push or protection bypass.

## Released / merged

- PR #1 `frontend` → `staging` and PR #2 `staging` → `main` (2026-10-22): first frontend stage ("Nota Rangkap" visual direction).
- Redesign round (this session): super-app/fintech visual language, light + dark themes, motion, plain-language copy, docs reorganised. See `git log` and the PRs that follow it.

## Frontend stage (mobile/)

- Expo SDK 57 (`expo` ~57.0.31), RN 0.86.3, React 19.2.3, Expo Router 57, TanStack Query 5, Reanimated 4.5, TypeScript strict. npm + `package-lock.json`.
- Design: `docs/DESIGN.md`. Two palettes (`core/design/tokens.ts`), `ThemeProvider` (system / light / dark, stored per device), gradient hero headers with parallax, summary card overlapping the header, shortcut grid, card lists with 3D press, staggered entrance, count-up figures, skeleton loading.
- Typed demo adapter (`mobile/src/data/api/demo-api.ts`) over deterministic fixture F-09; simulated server policy, daily-action projection, ledger and analytics computed from rows.
- Tests: 85 Jest tests (domain oracle, adapter flows, role DTOs, contrast of both palettes, components). Typecheck and lint clean.
- Device QA: Android emulator API 36 dev build, light and dark — see `docs/qa-report.md`. iPhone and physical Android run via Expo Go (`npm run start:go`, needs `npx expo login` on the computer and the same account in Expo Go).

## Not done (still PROTO scope)

Backend (Laravel/MySQL/Redis/Reverb), server authorization and atomic transactions, device login (TEN-04), background tracking + realtime, push, server PDF, media upload to private storage, Solveit Admin, backup/restore, observability, release performance measurement, fleet/rate-card CRUD. iOS development build: blocked (no macOS/Xcode).

## Repository facts

- Remote `solveit-id/tovv` is public; no branch protection or CI workflow, so local checks are the merge gate.
- `npm audit`: 17 transitive findings inside the Expo toolchain; the only automated fix downgrades Expo, so it is not applied.

## Open decisions / next steps

1. Backend branch `backend`: scaffold Laravel 13 per ARCHITECTURE, then replace `createDemoApi` with an HTTP adapter of the same `TovvApi` type.
2. Official Tovv logo to replace the temporary wordmark/icons (`mobile/src/components/brand/wordmark.tsx`, `mobile/scripts/generate-brand-assets.mjs`).
3. Map provider decision (DEC-08) before replacing `RouteSchematic`.
