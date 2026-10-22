@AGENTS.md

## Claude Code notes

- Design work uses the Impeccable skill; the app surface contract is `.impeccable/surfaces/mobile-src-app.md`. Product context for the skill: `docs/PRODUCT.md`.
- Native screenshots come from the Android emulator/device via `adb exec-out screencap -p`, not from a browser. Store raw captures in `.impeccable/review/` (git-ignored) and summarise them in `docs/qa-report.md`.
- Playwright MCP was not available in the session that built the frontend stage; no browser evidence is claimed.
