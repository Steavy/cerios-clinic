# AI Readiness Scan: Cerios Clinic
**Datum:** 2026-10-22
**Framework:** AI Readiness Scan MVP1
**Overall Score:** 53.3%

## Domain Scores
| Domain | Score | Level |
|---|---|---|
| Strategie & Governance | 58.3% | Gedefinieerd |
| Data & Infrastructuur | 66.7% | Beheerst |
| Modelontwikkeling & Experimentatie | 50.0% | Gedefinieerd |
| Evaluatie & Kwaliteit | 25.0% | Ontwikkelend |
| Monitoring & Rapportage | 66.7% | Beheerst |

*Verschil t.o.v. 2026-10-15 (53.3% overall): **0.0pp**; alle vijf domeinscores
zijn identiek. Dat klopt met de repo-inhoud: sinds de vorige scan zijn er precies
**twee commits** bijgekomen — `3b6031f` + merge `404fbd6` (PR #54) — die in
`infra/deploy-demo.sh` en `infra/k8s/minikube-start.sh` de demo-API-server van
hostpoort **6443 → 6445** verplaatsen (2 files, +7/−5). Geen AI-docs, workflows,
modellen of evaluatieprocedures gewijzigd. Alle 60 vragen zijn opnieuw
gecontroleerd tegen de actuele bestanden (de vier AI-docs, `AGENTS.md`,
`data-retention.md`, de `self-heal: true`-markers en de `opencode-fix`-repo) en
kloppen nog. Externe signalen deze run: pipeline-gezondheid **100.0%** over 30
runs (Ø **96,2s**, was 93,1s), defect-trend **54 issues / 7 open** (was 52/6,
alle `medium`), en de scan-PR's [#51](https://github.com/Steavy/cerios-clinic/pull/51),
[#52](https://github.com/Steavy/cerios-clinic/pull/52) en
[#53](https://github.com/Steavy/cerios-clinic/pull/53) staan nog **OPEN** met
lege `reviewDecision`.*

## Sterke punten
- **AI-visie, eigenaarschap, gedragscode en risicoclassificatie (S&G 7/12):**
  `docs/ai-vision.md` legt visie, doelstellingen en **AI-owner: Steavy** vast
  (§Eigenaarschap, inclusief verantwoordingslijn: PR-review, wekelijkse scan,
  issues/PR-audittrail); de gedragscode schrijft de `Co-authored-by`-marker, de
  prompt-injectieregel, synthetische testdata en transparantie voor; de EU AI
  Act-classificatie staat er als **laag risico / developer-tooling** met jaarlijkse
  herziening.
- **AI-rollen, review-plicht en blijvende compliance (S&G +6,+11):** rollen en
  escalation zijn toegewezen; `AGENTS.md` §"AI-gewijzigde code" dwingt publicatie
  via PR met groene CI én menselijke review af en blokkeert directe pushes
  (branch protection met 2 verplichte checks); de AI Act/AVG-lijn is
  gedocumenteerd in `docs/ai-vision.md` en `docs/data-retention.md`.
- **Periodieke bijsturing (S&G +10):** de wekelijkse AI-readiness-scan
  (donderdag 09:00 UTC, systemd-timer) plus de zichtbare incident-leerlus in
  git-history en `ci-fix:`-issues; dit is de zesde scan in de reeks.
- **Datainventarisatie, data-eigenaren en retentie (D&I 8/12):**
  `docs/data-retention.md` inventariseert AI-gerelateerde data (GHCR-images,
  Actions-artifacts, demo-dumps, scan-rapporten, fix-artefacten), benoemt
  **data-eigenaar Steavy** en legt bewaartermijnen vast — waaronder
  `KEEP_NEWEST=14` voor clinic-db dumps en `KEEP_DAYS=7` voor Actions-artifacts
  (`actions-storage-cleanup.yml`, dagelijks 03:35).
- **Privacy-veilige testdata, pipeline en gescheiden omgevingen (D&I
  +4,+6,+7,+8):** synthetische seed-data (geen echte patiëntgegevens,
  `packages/database/src/seed.ts`), een geautomatiseerde data-pipeline
  (db-init-migraties + seed, docker-buildketen, Allure-history-keten), compute
  via self-hosted runners + lokale minikube, en gescheiden dev/CI/demo-omgevingen
  inclusief nachtelijke teardown (`undeploy-demo.yml`).
- **Modelkeuze met afweging en kostenmodel (M&E +4,+10):** `docs/ai-development.md`
  documenteert de keuze voor `opencode/big-pickle` via de lokale
  OmniRoute-gateway (AVG: prompts verlaten de box niet, geen losse API-keys,
  gecentraliseerde kosten/usage in `/root/.omniroute/`), inclusief
  alternatieven-afweging, taakbewuste routing/fallback en provider-abstractie.
- **Prompt-versies en fix-contracten onder versiebeheer (M&E +2):**
  `docs/ai-development.md` §Promptversies wijst naar
  `Steavy/playwright-sparta/ai-readiness/` (briefing) en `Steavy/opencode-fix`
  (`AGENTS.md`, `CONVENTIONS.md`, `prompts/<run-id>.md` per fix-run) — beide
  hergeverifieerd als getrackte git-inhoud (16 prompts, laatste push
  2026-09-25); modelversies zijn vastgepind in de workflows.
- **Prompt engineering als discipline (M&E +5):** fix-contract, review-plicht en
  promptversie-conventie zijn gedocumenteerd; de `# self-heal: true`-markering op
  **9 van de 16 workflows** (`ci`, `unit-ci`, `dast`, `sast`, `docker-publish`,
  `stryker-pages`, `allure-pages`, `mobile-build-publish`,
  `mobile-build-publish-emulator`) maakt het AI-gebruik per workflow zichtbaar
  en intentioneel.
- **Acceptatiecriteria, expertbeoordeling en injectietest (E&K 3/12):**
  `AGENTS.md` §acceptatiecriteria + §AI-evaluatie; `docs/ai-evaluation.md` bevat
  de herhaalbare procedure voor prompt-injectie (vector A fix-keten, vector B
  directe-PR-tak) met het geslaagde testbewijs van 2026-09-25 (issue #41, run
  36105309206; `/oc` sindsdien disabled) en de menselijke review-steekproef
  (elke 5e AI-PR, 5 vaste punten, registratie op de PR).
- **Rollbackprocedure (M&R +6):** `docs/ai-rollback.md` definieert trigger,
  beslispad, revert-PR-stappen, registratieplicht en verboden acties, gekoppeld
  aan de monitoring en de evaluatiecyclus.
- **Dashboard, kostenbewaking, audittrail, RCA en transparantie (M&R 8/12):**
  het wekelijkse AI-dashboard (`opencode-fix/bin/ai-dashboard.sh`) rapporteert
  keten-status, time-to-fix en tokenverbruik/kosten per model; AI-uitkomsten
  zijn gelogd (PR/issue-audittrail), incidenten krijgen een root-cause-analyse
  (`ci-fix:`-issues + `gh-workflow-fix`-ketens), de prestaties gaan terug naar
  de teams en de rapportage naar management/toezicht is publiek (Allure Pages,
  Stryker/SAST/DAST-reports, scan-rapporten).
- **Gezonde basis, stabiel op hoog niveau:** pipeline-gezondheid **100.0%** over
  de laatste 30 runs (Ø 96,2s), volwassen kwaliteitsinfrastructuur
  (CodeQL/Semgrep/Gitleaks, DAST, mutation testing, BDD, performance) en
  dependabot-updates.

## Aandachtspunten
- **Evaluatie & Kwaliteit (25.0%, 3/12):** laagst scorend domein, ongewijzigd.
  Er is een procedure (injectietest, review-steekproef, acceptatiecriteria),
  maar 9 van de 12 vragen blijven "nee": **geen heldere kwaliteitsmetrieken en
  geen systematische beoordeling van LLM-output** (relevantie, coherentie,
  hallucinaties), geen evaluatiedataset los van trainingsdata, geen
  bias-/eerlijkheidstest, geen systematisch randgevallenonderzoek, geen meting
  van hallucinaties/calibratie, **geen geautomatiseerde evaluatie-pipeline met
  eval-sets in CI**, geen hertest na (her)training en geen kwantitatieve én
  kwalitatieve livegangdrempel. De review-steekproef (elke 5e AI-PR) is gedefinieerd
  maar nog niet als terugkerende praktijk geëvidenceerd: de registratietabel in
  `docs/ai-evaluation.md` is nog leeg ("nog geen — eerste steekproef bij 5e
  AI-PR"), en de vector-A-rij van de injectietest is nog niet ingevuld.
- **Modelontwikkeling & Experimentatie (50.0%, 6/12):** nog "nee":
  herkomst van datasets, reproduceerbaarheid met vaste seeds en omgeving,
  modelregistratie/catalogus, vergelijking met een baseline, korte iteraties met
  gebruikersfeedback en validatie van AI-experimenten door domeinexperts.
- **Strategie & Governance (58.3%, 7/12):** visie, ethiek, rollen en
  risicoclassificatie staan, maar `docs/ai-vision.md` erkent zélf dat er **geen
  formeel governance-board** is; use-cases worden niet geïnventariseerd/
  geprioriteerd, AI-initiatieven worden niet op businesscase en maatschappelijke
  impact beoordeeld, er is geen formeel impact-assessment vóór livegang en geen
  structurele AI-skilling.
- **Data & Infrastructuur (66.7%, 8/12):** gaten: datakwaliteit (compleetheid,
  juistheid, actualiteit) wordt niet gemeten, datasets zijn niet versiebeheerd
  voor reproduceerbaarheid, geen bias-/representativiteitsmonitoring en geen
  centrale feature-engineering. Kostenbewaking is operationeel via het dashboard
  maar niet gekoppeld aan een datainfrastructuurbudget. Daarnaast is de
  `KEEP_NEWEST=14`-cleanup voor clinic-db dumps nog een **afspraak zonder
  geïnstalleerde timer** (`docs/data-retention.md` §Uitvoering).
- **Monitoring & Rapportage (66.7%, 8/12):** gaten: geen drift-/conceptdrift-detectie,
  geen terugkerende feedbackloop op gebruikersfeedback, de businesswaarde van de
  AI-inzet is niet gekwantificeerd (uren bespaard per week) en er is geen
  geautomatiseerde retraining.
- **Governance-zwakke plek onveranderd (S&G, CRITICAL van vorige scans, niet
  opgevolgd):** branch protection op `main` heeft 2 verplichte checks
  (`Type-check, Lint & Format`, `Unit Tests`, strict) en
  `required_conversation_resolution = true`, maar er is **geen
  `required_pull_request_reviews`-blok** (`enforce_admins = false`,
  hergecontroleerd op 2026-10-22). Er is dus **geen verplichte menselijke
  approve** — dat staat op gespannen voet met de review-plicht uit `AGENTS.md`
  ("menselijke review/approve"): de gedocumenteerde intentie wordt niet door
  GitHub afgedwongen.
- **Publicatiestatus vorige scans:** PR [#51](https://github.com/Steavy/cerios-clinic/pull/51)
  (scan 2026-10-01), [#52](https://github.com/Steavy/cerios-clinic/pull/52)
  (scan 2026-10-08) en [#53](https://github.com/Steavy/cerios-clinic/pull/53)
  (scan 2026-10-15) staan nog **OPEN** — `reviewDecision` is leeg, dus ze wachten
  op een menselijke approve die de branch protection formeel niet afdwingt. Dit
  is een groeiende stapel: drie onbeoordeelde scan-PR's naast elkaar.

## Recommendations
- [CRITICAL] Evaluatie & Kwaliteit: maak van de gedefinieerde procedure een
  **terugkerende praktijk** — kwantificeer LLM-outputkwaliteit (steekproef van
  AI-PR's op relevantie, coherentie en hallucinaties), vul de review-steekproef-
  registratie daadwerkelijk (de teller staat nog op "geen"), voer de vector-A
  injectietest uit en leg het resultaat vast, voeg een lichte geautomatiseerde
  evaluatie toe (CI-gate/checklist voor AI-gewijzigde PR's) en leg
  kwantitatieve livegangdrempels vast. Zonder dit blijven 9 van de 12
  E&K-vragen "nee".
- [CRITICAL] Strategie & Governance: zet `required_approving_review_count >= 1`
  op `main` (en overweeg `enforce_admins`), zodat de review-plicht uit
  `AGENTS.md` daadwerkelijk wordt afgedwongen en een AI-fix niet zonder menselijke
  goedkeuring kan landen. Handig neveneffect: de openstaande scan-PR's #51/#52/#53
  worden dan ook daadwerkelijk gereviewd in plaats van te blijven hangen.
- [HIGH] Strategie & Governance: formaliseer een licht AI-governance-overleg
  (bijv. maandelijks, dashboard als input), inventariseer AI-use cases met
  prioritering op businesswaarde en gebruik de classificatie uit `ai-vision.md`
  als impact-assessment-checklist vóór nieuwe AI-toepassingen.
- [HIGH] Modelontwikkeling & Experimentatie: registreer elke AI-fixrun als
  experiment met vaste config/seeds (reproduceerbaarheid) en voeg een
  baselinevergelijking toe (handmatige fix-tijd vs. self-heal-tijd).
- [MEDIUM] Data & Infrastructuur: definieer datakwaliteitsindicatoren voor
  demo-/testdata, installeer de geplande `KEEP_NEWEST=14`-cleanup-timer voor
  clinic-db dumps en koppel de dashboard-kosten aan een budgetdrempel met een
  geautomatiseerde alert.
- [MEDIUM] Monitoring & Rapportage: kwantificeer de businesswaarde (tijd
  bespaard versus handmatig fixen; aantal geslaagde self-heals per week) en
  overweeg drift-detectie op de fix-keten (succesratio per workflow als KPI).

## Bronnen & geanalyseerd
- Docs: `docs/ai-vision.md` (visie, eigenaarschap, gedragscode,
  risicoclassificatie, "geen formeel governance-board"), `docs/ai-development.md`
  (modelkeuze + §Promptversies), `docs/ai-evaluation.md` (injectieprocedure +
  review-steekproef; testrun 36105309206; registratietabellen nog leeg),
  `docs/ai-rollback.md`, `docs/data-retention.md` (KEEP_NEWEST=14, uitvoering
  volgt), `docs/superpowers/`, `AGENTS.md` (review-plicht,
  acceptatiecriteria, prompt-injectieregel, AI-evaluatie, data-retentie),
  `README.md` §AI-Assisted Development, `DEVELOPMENT.md`, `TEST-AUTOMATION.md`,
  `MOBILE.md`
- `.github/workflows/` — **16 workflows**, waarvan **9 met `# self-heal: true`**
  (`ci`, `unit-ci`, `dast`, `sast`, `docker-publish`, `stryker-pages`,
  `allure-pages`, `mobile-build-publish`, `mobile-build-publish-emulator`);
  overige o.a. `opencode.yml`, `trigger-smoke.yml`, `performance.yml`,
  `auto-rerun-qemu.yml`, `version-smoke-check.yml`, `renovate.yml`,
  `actions-storage-cleanup.yml`
- `git log origin/main`: laatste commits `404fbd6`/`3b6031f` (2026-10-15, PR #54,
  poort 6443→6445 in `infra/deploy-demo.sh` + `infra/k8s/minikube-start.sh`);
  sinds 2026-10-15 geen verdere wijzigingen; werk-copy bevat de scan-branches
  `docs/ai-readiness-scan-2026-10-01`, `-10-08`, `-10-15`
- Branch protection `main` (GitHub-API, 2026-10-22): 2 verplichte checks
  (`Type-check, Lint & Format`, `Unit Tests`, strict `true`),
  `required_conversation_resolution = true`, **geen
  `required_pull_request_reviews`-blok**, `enforce_admins = false`
- PR's: #53 (scan 2026-10-15), #52 (2026-10-08) en #51 (2026-10-01) OPEN met
  lege `reviewDecision`; #54 (poortfix) gemerged; geen nieuwe AI-PR's sinds
  2026-10-15
- Testopzet: `vitest.config.ts`, `stryker.config.mjs` (thresholds 80/60),
  `packages/`-tests; box-brede validatieketen (Allure, SAST, DAST)
- Extern geverifieerd: `github.com/Steavy/opencode-fix` (getrackt: `AGENTS.md`,
  `CONVENTIONS.md`, 16 `prompts/*.md`; laatste push 2026-09-25) — bewijs voor
  M&E-vraag 2
- MCP-tools (quality-coach): `ai_readiness_scan` (60 vragen, 5 domeinen;
  antwoorden ingediend via de MCP-server zelf); `pipeline_health` (100.0%,
  30 runs, Ø 96,2s); `defect_trend_analysis` (54 issues totaal, 7 open, alle
  `medium`); `quality_gate_check` pull_request (Code Review/Tests/No Critical
  Issues niet aantoonbaar); `gh-workflow-fix_health` (8 ketens afgerond,
  1 uitgeput; laatste event 2026-10-22 06:25 UTC)

---
*Generated by Quality Transformation Coach MCP Server*
