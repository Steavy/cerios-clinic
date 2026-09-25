# AI-ontwikkeling in Cerios Clinic

Overzicht van hoe AI-ondersteunde ontwikkeling in dit repo is ingericht:
modelkeuze, waar promptversies en fix-contracten onder versiebeheer leven,
en hoe AI-gegenereerde wijzigingen traceerbaar blijven. Dit is de uitwerking
van de sectie **"AI-gewijzigde code (review-plicht en acceptatiecriteria)"**
in [`AGENTS.md`](../AGENTS.md) — lees die eerste voor de geldende regels.

## Modelkeuze

AI-werk op de Techlab-box (OpenCode-sessies die wijzigingen aan dit repo
maken) draait op het model `opencode/big-pickle`, bereikt via de **lokale**
OmniRoute-gateway:

| Toepassing | Model | Via |
|---|---|---|
| OpenCode-sessies op de box (incl. wijzigingen in dit repo) | `opencode/big-pickle` | OmniRoute `http://127.0.0.1:20128/v1` (systemd `omniroute.service`) |
| OpenClaw (orchestratie, A2A) | `omniroute/auto/best-coding` (primary) | OmniRoute; fallbacks `openrouter/nvidia/nemotron-3-ultra-550b-a55b:free` → `opencode-go/minimax-m2.7` |

### Overwegingen

- **Data blijft op de box.** OmniRoute is een lokale
  OpenAI-compatibele gateway (`127.0.0.1`); prompts en code verlaten de
  server niet via een externe provider-configuratie. Dit past bij de
  AVG-afspraken in dit repo (geen echte persoonsgegevens in seed/test;
  synthetische testdata).
- **Eén endpoint, geen losse API-keys per tool.** Alle AI-tools praten
  tegen `/v1` op de gateway; de upstream-provider is achter de gateway
  afgeschermd. Het `/oc`-tijdperk gebruikte een directe
  `OPENROUTER_API_KEY` in de workflow — dat pad is per 2026-09-25
  beëindigd (zie `AGENTS.md`).
- **Taakbewuste routing + auto-fallback.** OmniRoute biedt `auto/*`-aliassen
  (bijv. `auto/best-coding`) die per taak routeren en bij een providerstoring
  automatisch overgaan op een fallback — beschikbaarheid zonder
  app-config-wijziging.
- **Gecentraliseerde kosten en usage.** Usage-analytics en call-logs
  centraal in `/root/.omniroute/` — kostenbewaking op één plek i.p.v. per
  tool.
- **Provider-abstractie / weinig lock-in.** Model of provider wisselen is
  een gateway-config-wijziging, geen code-wijziging in dit repo.

### Model wisselen

- Lokaal model voor OpenCode-sessies: config in
  `/root/.config/opencode/opencode.json` (provider `omniroute`) — buiten
  dit repo, wijzigen op de box en opnieuw laden.
- De wekelijkse AI-readiness-scan rapporteert o.a. of de modelkeuze
  gedocumenteerd blijft (domein *Modelontwikkeling & Experimentatie*);
  houd dit document dus bij als de config verandert.

## Promptversies en fix-contracten (versiebeheer)

AI-briefings en prompt-versies leven **buiten dit repo** in eigen
git-repo's; dit repo verwijst ernaar in plaats van server-state te
dupliceren:

| Code | Locatie | Inhoud |
|---|---|---|
| Scan-briefing + prompts | `github.com/Steavy/playwright-sparta` → `ai-readiness/` | `AGENTS.md` (briefing), `prompts/<datum>.md` per scan-run (gecommit) |
| Fix-contracten (self-healing CI) | `/root/opencode-fix` — remote `github.com/Steavy/opencode-fix` | `AGENTS.md` + `CONVENTIONS.md` (briefing), `prompts/<run-id>.md` + `state/<run-id>.json` per fix-run (gecommit); backup lokaal `/root/backups/opencode-fix.git` |
| gh-workflow-fix chains | MCP-server op de box | chain-status + `ci-fix:` issues als audittrail |

Relevante workflows in dit repo dragen het `self-heal: true`-commentaar
(zie `README.md` → AI-Assisted Development).

## Traceerbaarheid van AI-commits

AI-gegenereerde of AI-ondersteunde commits zijn herkenbaar in `git log`:

- **Verplichte trailer** op het commit-bericht:
  `Co-authored-by: Steavy <Steavy@users.noreply.github.com>`
  (of een expliciete verwijzing naar het issue/PR, bijv. `Ref: PR #n`).
- **Controle:**
  ```bash
  git log --format='%h %an %s' --grep='Co-authored-by'
  git log --format='%B' -1 <sha> | grep -E 'Co-authored-by|Ref:'
  ```
- Voorbeeld in de historie: `a96a33e` en de werkwijze-commits rond
  PR #43 (`3fcd957`, `c875672`).

De regel komt uit `AGENTS.md` (sectie "AI-gewijzigde code") en wordt
meegetoetst bij review van AI-PRs.

---
*Onderhouden als onderdeel van de AI Readiness Scan recommendations
(Cerios Clinic, 2026-09-25 — Modelontwikkeling & Experimentatie).*