# Project status — Tovv

Last updated: 2026-10-22 (frontend stage session). Verified facts only.

## Released / merged

- `main`, `staging`: specification package 2.1 only (bootstrap commit `7b21bc6`, pushed because the remote was empty).
- `frontend`: mobile frontend stage — see `git log` on that branch and the PR to `staging`.

## Frontend stage (mobile/)

- Expo SDK 57 (`expo` ~57.0.31, expo-doctor 21/21), RN 0.86.3, React 19.2.3, Expo Router 57, TanStack Query 5, TypeScript strict. npm + `package-lock.json`.
- Typed demo adapter (`mobile/src/data/api/demo-api.ts`) over deterministic fixture F-09; simulated server policy, daily-action projection, ledger and analytics M-01–M-12 computed from rows.
- Screens for owner, admin (dispatcher/finance), driver, customer (personal/B2B); GPS camera with durable copy + overlay derivative + local outbox; tracking via labelled F-06 replay and route schematic.
- Tests: 62 Jest tests (domain oracle, adapter flows, role DTOs, scope actions, next steps, tokens, icons, components). Typecheck and lint clean.
- Device QA: Android emulator (API 36) dev build, small phone, tablet and font scale 1.3 — see `docs/qa/qa-report.md`.

## Not done (still PROTO scope)

Backend (Laravel/MySQL/Redis/Reverb), server authorization and atomic transactions, device login (TEN-04), background tracking + realtime, push, server PDF, media upload to private storage, Solveit Admin, backup/restore, observability, release performance measurement, fleet/rate-card CRUD, dark mode.

## Device evidence

See `docs/qa/qa-report.md`. Physical Android: not connected this session. iPhone via Expo Go SDK 57: pending the user scanning the QR. iOS development build: BLOCKED (no macOS/Xcode).

## Repository facts

- Remote `solveit-id/tovv` is public; no branch protection or CI workflow exists yet, so local checks are the merge gate.
- `npm audit`: 17 transitive findings inside the Expo toolchain; the only automated fix downgrades Expo, so it is not applied.

## Open decisions / next steps

1. Backend branch `backend`: scaffold Laravel 13 per ARCHITECTURE, then replace `createDemoApi` with an HTTP adapter of the same `TovvApi` type.
2. Official Tovv logo to replace the temporary wordmark/icons (`mobile/src/components/brand/wordmark.tsx`, `mobile/scripts/generate-brand-assets.mjs`).
3. Map provider decision (DEC-08) before replacing `RouteSchematic`.
