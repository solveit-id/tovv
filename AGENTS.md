# AGENTS.md — Tovv

Shared instructions for every coding agent working in this repository. Claude Code loads this file through `CLAUDE.md`.

## Project

Tovv is a multi-tenant SaaS for towing/vehicle-transport operators: one Android + iOS app with four view groups (Owner, Admin, Operator/driver, User/customer). Owner, developer and publisher: **Solveit Indonesia**. Display name: **Tovv**.

Source of truth, in reading order: `PRD.md` → `ARCHITECTURE.md` → `INTEGRATION_PLAN.md` → `IMPLEMENTATION_PLAN.md` → `TEST_PLAN.md` → `VALIDATION_PLAN.md` (package 2.1, in `docs/spec/`). PRD wins on scope and business rules. Do not duplicate it into other documents; link to it.

Current status and handoff: `.ai/project-status.md`. Design system (super-app/fintech style, light + dark): `docs/DESIGN.md` (sidecar `.impeccable/design.json`). Screen coverage vs requirements: `docs/screen-inventory.md`. Docs map: `docs/README.md`.

## Repository layout

| Path | Purpose |
|---|---|
| `mobile/` | React Native + TypeScript strict + Expo SDK 57 + Expo Router app (frontend stage) |
| `docs/` | Product facts, design system, development, QA report; `docs/spec/` holds the specification package 2.1 |
| `.ai/` | Agent/session handoff |
| `.impeccable/surfaces/` | Impeccable design contract for the app surface |

`backend/`, `contracts/`, `tools/admin-harness/`, `infra/` (ARCHITECTURE §2) are not created yet; do not add empty folders.

## Current stage boundaries

- Frontend only. Data comes from the typed demo adapter `mobile/src/data/api/demo-api.ts` (deterministic fixture F-09). Screens never import fixtures or the demo store directly; they call the adapter through `useTovvQuery`/`useTovvMutation`.
- The label "DEMO — SIMULASI FRONTEND" must stay visible. The demo account picker is local demo mode only, never production auth.
- Never mark backend/server authorization/atomic transactions/realtime/integrations as done because a screen exists.
- No real money, gateway, QRIS live, real bank accounts (only `DEMO-NONPAYABLE-A/B`), store publishing, or paid services.
- NEXT/OUT requirements are not mandatory.

## Commands (run from `mobile/`)

```bash
npm ci
npm run typecheck      # tsc --noEmit
npm run lint           # expo lint
npm test               # jest (domain oracle F-09, adapter flows, tokens, icons)
npx expo-doctor        # dependency/config check
npx expo install <pkg> # always use for SDK packages
npm start              # dev server for a development build
npm run start:go       # dev server for Expo Go (SDK 57)
npm run android        # build + install Android development build (needs JDK 17+, Android SDK, NDK 27.1)
```

Run typecheck, lint and tests before declaring work done.

## Code rules

- TypeScript strict, `noUncheckedIndexedAccess`. Money is integer rupiah (`number` internally, `string` in DTOs); percentages in basis points; never floats for money.
- Use canonical status enums from PRD §5 (`mobile/src/domain/types.ts`). No single "paid" status.
- Missing cost is `null`, never `0`. Contribution is not net profit.
- Status presentation must carry text + icon + line form (solid/dashed/struck), not colour alone (`mobile/src/core/i18n/status.ts`).
- Design tokens live in `mobile/src/core/design/tokens.ts` (light and dark palettes with the same keys). Screens read colours through `useColors()` / `makeStyles()` from `core/design/theme.tsx`, never raw hex. One icon family: MaterialCommunityIcons.
- Routes in `mobile/src/app/` stay thin and re-export feature screens from `mobile/src/features/`.
- Native folders `mobile/android` and `mobile/ios` are generated (CNG); never edit or commit them.
- Animations: Reanimated/native only (no GSAP, Framer Motion, DOM smooth-scroll). Respect reduced motion.
- UI copy in Bahasa Indonesia.

## Git

- Branches: `main`, `staging`, and one per application (`frontend` for this stage, `backend` later). Promotion: `frontend` → `staging` → `main` through PRs.
- Commit format: `(type) deskripsi singkat` in Bahasa Indonesia, lowercase type (`feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `update`, `release`). No co-author or AI attribution lines in commits, PR titles/descriptions, or merge messages.
- Never force-push, bypass branch protection, or commit secrets, `.env`, build artifacts, native folders, or local agent settings.
