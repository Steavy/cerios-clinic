# AGENTS.md — Cerios Clinic monorepo

Concrete aanwijzingen voor agents die in dit repo werken. Uitgebreide context staat in `DEVELOPMENT.md`, `TEST-AUTOMATION.md` en `MOBILE.md` — lees die eerst voor infra, tests en mobile-workflows.

## Verificatie & kwaliteitspoort

Vertrouw **niet** op LSP-diagnostics (onbetrouwbaar in OpenCode: harde 3s-timeout, eerste batch wordt overgeslagen). Bewijs werk met de CLI-commando's hieronder.

| Check | Commando | Opmerking |
|---|---|---|
| Typecheck | `pnpm run typecheck` | build packages + typecheck apps (`DEVELOPMENT.md` tabel) |
| Lint | `pnpm run lint` | `oxlint --type-aware` (config: `.oxlintrc.json`); `lint:fix` voor autocorrect |
| Format | `pnpm run format:check` | `oxfmt --check` |
| Unit-tests | `pnpm test` | `vitest run`; watch: `pnpm test:watch`; mutation: `pnpm test:stryker` |
| Infra/db | zie `DEVELOPMENT.md` tabel | o.a. `infra:up`, `db:migrate:deploy`, `db:seed`; `db:reset` wist ALLES |
| Mobile (Android) | `MOBILE.md` | o.a. `mobile:release`, `mobile:test:emulator` |

Regels:
- Na een wijziging: start met de smalste relevante check (bijv. typecheck van het gewijzigde pakket/app), verbreed alleen als de scope dat rechtvaardigt. Claim "groen" uitsluitend met daadwerkelijke CLI-output.
- Gebruik altijd `pnpm` (gepind `pnpm@11.18.0` via corepack) — geen `npm` in dit repo.
- Playwright/E2E-acceptance draait vanuit het aparte `playwright-sparta`-repo; de workflow staat beschreven in `TEST-AUTOMATION.md`.
