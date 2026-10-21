# Workflow

1. Read `AGENTS.md`, then `project-status.md`. Check `git status`, current branch (`frontend` for mobile work), and `git fetch`.
2. Set up: `cd mobile && npm ci`. Android build needs `JAVA_HOME` (Android Studio JBR) and `ANDROID_HOME`.
3. Change: keep screens on the typed adapter (`mobile/src/data/api`); keep business rules in `mobile/src/domain` with tests.
4. Verify before claiming done: `npm run typecheck`, `npm run lint`, `npm test`, `npx expo-doctor`; for UI, capture emulator/device screenshots into `.impeccable/review/` and summarise in `docs/qa/qa-report.md` (state device, OS, build type, mode).
5. Release: commit `(jenis) deskripsi` (Indonesian, no AI attribution) → push `frontend` → PR to `staging` → verify → PR `staging` → `main`. No force-push or protection bypass.
6. Update `project-status.md` with verified facts only at the end of each task.
