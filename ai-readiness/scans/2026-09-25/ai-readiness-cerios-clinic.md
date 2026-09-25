# AI Readiness Scan: Cerios Clinic
**Datum:** 2026-09-25 (her-scan, na implementatie verbeterpunten 1–5)
**Framework:** AI Readiness Scan MVP1
**Overall Score:** 50.0%

## Domain Scores
| Domain | Score | Level |
|---|---|---|
| Strategie & Governance | 58.3% | Gedefinieerd |
| Data & Infrastructuur | 66.7% | Beheerst |
| Modelontwikkeling & Experimentatie | 33.3% | Ontwikkelend |
| Evaluatie & Kwaliteit | 25.0% | Ontwikkelend |
| Monitoring & Rapportage | 66.7% | Beheerst |

*Verschil t.o.v. beginscan 2026-09-25 (16.7% overall, commit `7237dac`): **+33.3pp** —
implementatie van de 5 verbeterpunten (AI-visie, evaluatie, dataretentie, modelkeuze,
rollback) heeft Strategie & Governance en Data & Infrastructuur elk met +50pp laten
stijgen. Monitoring & Rapportage +33.4pp (dashboard + kostenbewaking in opencode-fix).*

## Sterke punten
- **AI-visie, eigenaarschap en gedragscode (S&G = 7/12):** `docs/ai-vision.md` (PR #45,
  commit `90033bc`) legt de AI-visie vast (kwaliteitspoort centraal, AI als assistent),
  belegt expliciet eigenaarschap (AI-owner: Steavy) en bevat een korte gedragscode
  (review-plicht, geen blind vertrouwen, transparantie). Risicoclassificatie is toegepast:
  de AI-toepassing is ingedeeld onder EU AI Act als **laag risico / niet-hoog-risico**
  (geen biometrie, geen toegang tot persoonsgegevens-besluitvorming) — vastgelegd in
  `ai-vision.md` § Risicoclassificatie.
- **Leerlus + periodieke bijsturing (S&G periodiek bijsturen = ja):** wekelijkse
  AI-readiness-scan (donderdag 09:00 UTC via systemd-timer), incident-leerlus zichtbaar in
  git-history/issues (403-incident 2026-09-25 → werkwijze omgebouwd naar directe PR's met
  review-plicht, issues #40/#42/#43).
- **Datainventarisatie, data-eigenaren en retentie (D&I = 8/12):** `docs/data-retention.md`
  (PR #46, commit `318ba18`) inventariseert alle AI-gerelateerde data (GHCR-images,
  Actions-artifacts, demo-dumps, scan-rapporten, loansleutels), benoemt data-eigenaren en
  legt bewaartermijnen + automatische verwijdering vast (`actions-storage-cleanup.yml`,
  KEEP_DAYS=7). Hiermee is de eerdere CRITICAL-gap (retentie/verwijdering) gedicht.
- **Modelkeuze met overwegingen + kostenmodel (M&E modelkeuze = ja):**
  `docs/ai-development.md` (PR #44, commit `0713ed7`) documenteert de modelkeuze
  (`opencode/big-pickle` via OmniRoute-gateway: kosten-plafondbewuste routering,
  prompt-caching, lokale gateway) met alternatieven-afweging en een expliciet
  kostenmodel/token-drempel (circa 175k tokens/dag) boven de OpenRouter-plafonds.
- **Herhaalbare AI-evaluatieprocedure (E&K = 3/12):** `docs/ai-evaluation.md` (PR #47,
  commit `20a5119`) formaliseert de prompt-injectietest als herhaalbare procedure (met de
  live test van 2026-09-25 als geregistreerd bewijs, run 36105309206) en definieert een
  menselijke review-steekproef op AI-gewijzigde code. Acceptatiecriteria staan in
  `AGENTS.md` (review-plicht, volledige kwaliteitspoort: typecheck, lint, format,
  unit-tests, PR-gate).
- **Rollbackprocedure (M&R rollback = ja):** `docs/ai-rollback.md` (PR #48, commit
  `67f355a`) definieert trigger, beslispad, stappen en communicatie voor rollback van
  AI-wijzigingen; gekoppeld aan de monitoring (dashboard).
- **Dashboard + kostenbewaking (M&R = 8/12):** opencode-fix levert nu een wekelijks
  AI-dashboard (`/root/opencode-fix/reports/ai-dashboard.md`, commit `22cad6b`) met
  fix-keten-status, directe opencode-runs en **tokenverbruik/kosten per model en provider**
  (pdf: alle OpenAI-compatible providers via OmniRoute, incl. `:free`-modellen) — beantwoordt
  de eerdere M&R-gap (geen kostenbewaking). Systemd-timer wekelijks dinsdag 00:35.
- **Bestaande basis ongewijzigd sterk:** gezonde pipeline (30 runs, ~100% success, Ø111s),
  synthetische testdata (AVG-veilig), gescheiden omgevingen (dev/CI/demo), volwassen
  applicatie-kwaliteitsinfrastructuur (mutation testing, SAST, DAST, performance, BDD),
  transparante publieke rapportage (Allure/Stryker/DAST/SAST via GitHub Pages).

## Aandachtspunten
- **Evaluatie & Kwaliteit (25.0%):** laagst scorende domein. Er is nu een procedure (evaluatie /
  injectietest / review-steekproef) maar nog geen **systematische kwaliteitsmeting van
  LLM-output** (relevantie, coherentie, hallucinaties) en geen geautomatiseerde eval-set in
  CI die AI-output kwantitatief beoordeelt. De menselijke review-steekproef is gedefinieerd
  maar nog niet als terugkerende praktijk geëvidenceerd.
- **Modelontwikkeling & Experimentatie (33.3%):** probleem/succesdefinitie en modelkeuze zijn
  nu vastgelegd, maar er is nog geen **experiment tracking** van AI-sessies (run-id +
  config + uitkomst), geen modelregistratie/catalogus, geen baseline-vergelijking en geen
  domeinexpert-steekproef op de fix-uitkomsten. Promptversies van de fix-keten leven nog in
  `/root/opencode-fix` (losse repo) — cerios-clinic verwijst er niet naar vanuit dit repo.
- **Strategie & Governance (58.3%):** visie/ethiek/rollen staan, maar er is nog geen
  AI-governance-board/-stuurgroep, geen formele AI-impact-assessment als standaard-check
  vóór nieuwe AI-toepassingen, en geen structurele AI-skilling van het team. Businesscase/
  maatschappelijke impact van de AI-inzet is niet gekwantificeerd.
- **Data & Infrastructuur (66.7%):** retentie/governance zijn nu op orde; gaten: geen
  meting van datakwaliteit (compleetheid, juistheid, actualiteit), geen geautomatiseerde
  data-pipeline (deels buiten scope — geen trainingsdata), geen datadrift-/bias-monitoring.
  Kostenbewaking is operationeel via het dashboard maar niet gekoppeld aan een
  data-infrastructuurbudget.
- **Monitoring & Rapportage (66.7%):** audittrail, dashboard, kosten en rollback staan; gaten:
  geen datadrift-/conceptdrift-detectie, geen feedbackloop voor modelverbetering op basis van
  gebruik, geen businesswaarde-meting van de self-healing/AI-inzet (tijdswinst o.i.d.
  gekwantificeerd).

## Recommendations
- [CRITICAL] Evaluatie & Kwaliteit: bouw van de gedefinieerde procedure een **terugkerende
  praktijk** — kwantificeer LLM-outputkwaliteit (steekproef van AI-PR's op relevantie/
  coherentie/hallucinaties) en registreer de review-steekproef zodat deze evidencieerbaar is.
  Voeg een lichte geautomatiseerde evaluatie toe (bijv. een checklist/CI-gate voor
  AI-gewijzigde PR's i.p.v. alleen handmatige review).
- [HIGH] Modelontwikkeling & Experimentatie: registreer elke AI-fixrun/opencode-sessie als
  experiment (run-id, model, config, tokens, uitkomst) — de data ligt al in opencode-fix
  (state/ + reports/); verwijs er vanuit dit repo naar (of breng de prompts/fix-contracten
  hier onder versiebeheer).
- [HIGH] Strategies & Governance: formaliseer een licht AI-governance-overleg (bijv.
  maandelijks met dashboard als input) en gebruik `ai-vision.md`-classificatie als
  uitgangspunt voor een impact-assessment-checklist vóór nieuwe AI-toepassingen.
- [MEDIUM] Data & Infrastructuur: definieer datakwaliteitsindicatoren voor de demo/testdata
  en koppel dashboard-kosten aan een budgetdrempel met alert (nu: drempel gedocumenteerd,
  alert nog niet geautomatiseerd).
- [MEDIUM] Monitoring & Rapportage: kwantificeer de businesswaarde (tijd bespaard vs.
  handmatig fixen; aantal geslaagde self-heals per week) en overweeg drift-detectie op de
  fix-keten (bijv. succesratio per workflow als KPI).

## Bronnen & geanalyseerd
- Docs (nieuw 2026-09-25): `docs/ai-vision.md` (PR #45), `docs/ai-development.md` (PR #44),
  `docs/ai-evaluation.md` (PR #47), `docs/ai-rollback.md` (PR #48),
  `docs/data-retention.md` (PR #46) — alle gemerged op `main`
- Docs (bestaand): `README.md` (AI-ondersteund CI/CD), `AGENTS.md` (review-plicht +
  acceptatiecriteria, commit `3fcd957`), `DEVELOPMENT.md`, `TEST-AUTOMATION.md`, `MOBILE.md`
- `git log` — 275 commits; de 5 punten zijn terug te vinden in PR's #44–#48 (commits
  `0713ed7`, `90033bc`, `318ba18`, `20a5119`, `67f355a`)
- `.github/workflows/` — 16 workflows; branch protection op `main` (PR-gate, checks strict)
- Gebruikte MCP-tools: `quality-coach` (`ai_readiness_scan`, 60 vragen, 5 domeinen);
  GitHub-metrics (via `gh` CLI): recente runs hoofdzakelijk success, open issues beperkt
  (#40 ghwf-fix docker-publish, #3 Dependency Dashboard)
- Fix-keten/dashboard: `/root/opencode-fix/` (chains, prompts, reports), AI-dashboard
  commit `22cad6b` (wekelijks dinsdag 00:35 via systemd-timer)

---
*Generated by Quality Transformation Coach MCP Server*