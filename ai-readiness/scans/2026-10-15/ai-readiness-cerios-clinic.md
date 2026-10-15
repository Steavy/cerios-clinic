# AI Readiness Scan: Cerios Clinic
**Datum:** 2026-10-15
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

*Verschil t.o.v. 2026-10-08 (53.3% overall): **0.0pp**. De vijf domeinscores
zijn identiek aan de vorige scan. Dat klopt: `git log origin/main` stopt bij
`df1809f` (2026-09-25) en `--since=2026-09-26` levert **0 nieuwe commits**; de
repo is sinds de vorige scan inhoudelijk niet gewijzigd. Alle 60 vragen zijn
opnieuw beantwoord op basis van verse inspectie van de bestanden — de
`self-heal: true`-markers op 9 workflows, de vier AI-docs
(`ai-vision`/`ai-development`/`ai-evaluation`/`ai-rollback`), `data-retention`,
`AGENTS.md` en de `opencode-fix`-repo zijn één voor één hergecontroleerd en
kloppen nog. Wel extern verbeterd: de pipeline-gezondheid blijft **100.0%**
(30 runs, Ø 93,1s; was Ø 125,7s) en de vorige scan-kopieën wachten nog op
menselijke approve (PR [#51](https://github.com/Steavy/cerios-clinic/pull/51),
[#52](https://github.com/Steavy/cerios-clinic/pull/52) — beide OPEN, alle checks
groen, `reviewDecision` leeg).*

## Sterke punten
- **AI-visie, eigenaarschap, gedragscode en risicoclassificatie (S&G 7/12):**
  `docs/ai-vision.md` legt visie, doelstellingen en **AI-owner: Steavy**
  vast (regel 39, inclusief verantwoordingslijn: PR-review, wekelijkse scan,
  issues/PR-audittrail); de gedragscode (regels 48–61) schrijft de
  `Co-authored-by`-marker, de prompt-injectieregel, synthetische testdata en
  transparantie voor; de EU AI Act-classificatie staat er als **laag risico /
  developer-tooling** (regel 66).
- **AI-rollen, review-plicht en blijvende compliance (S&G +6,+11):** rollen en
  escalation zijn toegewezen; `AGENTS.md` §"AI-gewijzigde code" (regel 23)
  dwingt publicatie via PR met groene CI én menselijke review af en blokkeert
  directe pushes (branch protection met 2 verplichte checks); de
  AI Act/AVG-lijn is gedocumenteerd (`docs/ai-vision.md`, `docs/data-retention.md`).
- **Periodieke bijsturing (S&G +10):** de wekelijkse AI-readiness-scan
  (donderdag 09:00 UTC, systemd-timer) plus de zichtbare incident-leerlus in
  git-history en `ci-fix:`-issues; dit is de vijfde scan in de reeks.
- **Datainventarisatie, data-eigenaren en retentie (D&I 8/12):**
  `docs/data-retention.md` inventariseert AI-gerelateerde data (GHCR-images,
  Actions-artifacts, demo-dumps, scan-rapporten), benoemt **data-eigenaar
  Steavy** en legt bewaartermijnen + automatische verwijdering vast
  (`actions-storage-cleanup.yml`, KEEP_DAYS=7, dagelijks 03:35).
- **Privacy-veilige testdata, pipeline en gescheiden omgevingen (D&I
  +4,+6,+7,+8):** synthetische testdata (geen echte patiëntengegevens,
  `docs/ai-development.md` regel 25), een geautomatiseerde
  data-pipeline (db-init-migraties + seed, docker-buildketen, Allure-history-keten),
  compute via self-hosted runners + lokale minikube, en gescheiden
  dev/CI/demo-omgevingen inclusief nachtelijke teardown.
- **Modelkeuze met afweging en kostenmodel (M&E +4,+10):** `docs/ai-development.md`
  documenteert de keuze voor `opencode/big-pickle` via de lokale
  OmniRoute-gateway (AVG: prompts verlaten de box niet, geen losse API-keys,
  gecentraliseerde kosten/usage in `/root/.omniroute/`), inclusief
  alternatieven-afweging en provider-abstractie.
- **Prompt-versies en fix-contracten onder versiebeheer (M&E +2):**
  `docs/ai-development.md` tabel (regels 53–60) wijst naar
  `Steavy/playwright-sparta/ai-readiness/` (briefing) en `Steavy/opencode-fix`
  (`AGENTS.md`, `CONVENTIONS.md`, `prompts/<run-id>.md` per fix-run) — beide
  hergeverifieerd als getrackte git-inhoud; modelversies zijn vastgepind in de
  workflows.
- **Prompt engineering als discipline (M&E +5):** fix-contract,
  review-plicht en promptversie-conventie zijn gedocumenteerd; de
  `# self-heal: true`-markering op **9 workflows** (`ci`, `unit-ci`, `dast`,
  `sast`, `docker-publish`, `stryker-pages`, `allure-pages`,
  `mobile-build-publish{,emulator}`) maakt het AI-gebruik per workflow
  zichtbaar en intentioneel.
- **Acceptatiecriteria, expertbeoordeling en injectietest (E&K 3/12):**
  `AGENTS.md` §acceptatiecriteria + §AI-evaluatie (regel 57: herhaalbare
  injectietest én review-steekproef elke 5e AI-PR);
  `docs/ai-evaluation.md` bevat de procedure met het geslaagde testbewijs
  (2026-09-25, run 36105309206; `/oc` sindsdien disabled).
- **Rollbackprocedure (M&R +6):** `docs/ai-rollback.md` definieert trigger,
  beslispad, stappen en communicatie, gekoppeld aan de monitoring.
- **Dashboard, kostenbewaking, audittrail, RCA en transparantie (M&R 8/12):**
  het wekelijkse AI-dashboard (`opencode-fix/bin/ai-dashboard.sh`) rapporteert
  keten-status, time-to-fix en tokenverbruik/kosten per model; AI-uitkomsten
  zijn gelogd (PR/issue-audittrail), incidenten krijgen een root-cause-analyse
  (`ci-fix:`-issues + `gh-workflow-fix`-ketens), de prestaties gaan terug naar
  de teams en de rapportage naar management/toezicht is publiek (Allure Pages,
  Stryker/SAST/DAST-reports, scan-rapporten).
- **Gezonde basis, stabiel op hoog niveau:** pipeline-gezondheid **100.0%** over
  de laatste 30 runs (Ø 93,1s), volwassen kwaliteitsinfrastructuur
  (CodeQL/Semgrep/Gitleaks, DAST, mutation testing, BDD, performance) en
  `dependabot`-updates.

## Aandachtspunten
- **Evaluatie & Kwaliteit (25.0%, 3/12):** laagst scorend domein, ongewijzigd.
  Er is een procedure (injectietest, review-steekproef, acceptatiecriteria),
  maar 9 van de 12 vragen blijven "nee": **geen heldere kwaliteitsmetrieken en
  geen systematische beoordeling van LLM-output** (relevantie, coherentie,
  hallucinaties), geen evaluatiedataset los van trainingsdata, geen
  bias-/eerlijkheidstest, geen systematisch randgevallenonderzoek, geen meting
  van hallucinaties/calibratie, **geen geautomatiseerde evaluatie-pipeline met
  eval-sets in CI**, geen hertest na (her)training en geen kwantitatieve én
  kwalitatieve livegangdrempel. De review-steekproef (elke 5e AI-PR) is
  gedefinieerd maar nog niet als terugkerende praktijk geëvidenceerd
  (`docs/ai-evaluation.md` regel 96: "nog geen — eerste steekproef bij 5e AI-PR").
- **Modelontwikkeling & Experimentatie (50.0%, 6/12):** op gelijke hoogte met het
  gemiddelde van de vorige run. Nog "nee": herkomst van datasets,
  reproduceerbaarheid met vaste seeds en omgeving, modelregistratie/catalogus,
  vergelijking met een baseline, korte iteraties met gebruikersfeedback en
  validatie van AI-experimenten door domeinexperts.
- **Strategie & Governance (58.3%, 7/12):** visie, ethiek, rollen en
  risicoclassificatie staan, maar `docs/ai-vision.md` regel 43 zélf erkent
  dat er **geen formeel governance-board** is; use-cases worden niet
  geïnventariseerd/geprioriteerd, AI-initiatieven worden niet op businesscase
  en maatschappelijke impact beoordeeld, er is geen formeel
  impact-assessment vóór livegang en geen structurele AI-skilling.
- **Data & Infrastructuur (66.7%, 8/12):** gaten: datakwaliteit (compleetheid,
  juistheid, actualiteit) wordt niet gemeten, datasets zijn niet versiebeheerd
  voor reproduceerbaarheid, geen bias-/representativiteitsmonitoring en geen
  centrale feature-engineering. Kostenbewaking is operationeel via het
  dashboard maar niet gekoppeld aan een datainfrastructuurbudget.
- **Monitoring & Rapportage (66.7%, 8/12):** gaten: geen drift-/conceptdrift-detectie,
  geen terugkerende feedbackloop op gebruikersfeedback, de businesswaarde van
  de AI-inzet is niet gekwantificeerd (uren bespaard per week) en er is geen
  geautomatiseerde retraining.
- **Governance-zwakke plek onveranderd (S&G, CRITICAL van vorige scans, niet
  opgevolgd):** branch protection op `main` heeft 2 verplichte checks
  (`Type-check, Lint & Format`, `Unit Tests`, strict) en
  `required_conversation_resolution = true`, maar er is **geen
  `required_pull_request_reviews`-blok** (`enforce_admins = false`, hergecontroleerd
  op 2026-10-15). Er is dus **geen verplichte menselijke approve** — dat staat op
  gespannen voet met de review-plicht uit `AGENTS.md` regel 27 ("menselijke
  review/approve"): de gedocumenteerde intentie wordt niet door GitHub
  afgedwongen.
- **Publicatiestatus vorige scans:** PR [#51](https://github.com/Steavy/cerios-clinic/pull/51)
  (scan 2026-10-01) en PR [#52](https://github.com/Steavy/cerios-clinic/pull/52)
  (scan 2026-10-08) staan nog **OPEN** — alle checks groen, maar `reviewDecision`
  is leeg, dus ze wachten op een menselijke approve die de branch protection
  formeel niet afdwingt.

## Recommendations
- [CRITICAL] Evaluatie & Kwaliteit: maak van de gedefinieerde procedure een
  **terugkerende praktijk** — kwantificeer LLM-outputkwaliteit (steekproef van
  AI-PR's op relevantie, coherentie en hallucinaties), registreer de
  review-steekproef zodat deze evidencieerbaar is, voeg een lichte
  geautomatiseerde evaluatie toe (CI-gate/checklist voor AI-gewijzigde PR's)
  en leg kwantitatieve livegangdrempels vast. Zonder dit blijven 9 van de 12
  E&K-vragen "nee".
- [CRITICAL] Strategie & Governance: zet `required_approving_review_count >= 1`
  op `main` (en overweeg `enforce_admins`), zodat de review-plicht uit
  `AGENTS.md` daadwerkelijk wordt afgedwongen en een AI-fix niet zonder menselijke
  goedkeuring kan landen. Handig neveneffect: de openstaande scan-PR's #51/#52
  worden dan ook daadwerkelijk gereviewd in plaats van te blijven hangen.
- [HIGH] Strategie & Governance: formaliseer een licht AI-governance-overleg
  (bijv. maandelijks, dashboard als input), inventariseer AI-use cases met
  prioritering op businesswaarde en gebruik de classificatie uit `ai-vision.md`
  als impact-assessment-checklist vóór nieuwe AI-toepassingen.
- [HIGH] Modelontwikkeling & Experimentatie: registreer elke AI-fixrun als
  experiment met vaste config/seeds (reproduceerbaarheid) en voeg een
  baselinevergelijking toe (handmatige fix-tijd vs. self-heal-tijd).
- [MEDIUM] Data & Infrastructuur: definieer datakwaliteitsindicatoren voor
  demo-/testdata en koppel de dashboard-kosten aan een budgetdrempel met een
  geautomatiseerde alert.
- [MEDIUM] Monitoring & Rapportage: kwantificeer de businesswaarde (tijd
  bespaard versus handmatig fixen; aantal geslaagde self-heals per week) en
  overweeg drift-detectie op de fix-keten (succesratio per workflow als KPI).

## Bronnen & geanalyseerd
- Docs: `docs/ai-vision.md` (regels 37–66: eigenaarschap, gedragscode,
  risicoclassificatie; "geen formeel governance-board" regel 43),
  `docs/ai-development.md` (modelkeuze + §Promptversies regels 51–60),
  `docs/ai-evaluation.md` (injectietest + review-steekproef elke 5e AI-PR,
  testrun 36105309206; steekproeftabel nog leeg regel 96), `docs/ai-rollback.md`,
  `docs/data-retention.md`, `docs/superpowers/`, `AGENTS.md` (regels 23–29
  review-plicht/acceptatiecriteria/prompt-injectieregel, regel 57–63
  AI-evaluatie), `README.md` §AI-Assisted Development (regels 537–548),
  `DEVELOPMENT.md`, `TEST-AUTOMATION.md`, `MOBILE.md`
- `.github/workflows/` — **9 met `# self-heal: true`**
  (`ci`, `unit-ci`, `dast`, `sast`, `docker-publish`, `stryker-pages`,
  `allure-pages`, `mobile-build-publish`, `mobile-build-publish-emulator`)
- `git log origin/main`: laatste commits `df1809f`/`0c02d83` (2026-09-25,
  PR #50); **0 commits sinds 2026-09-26**; werk-copy heeft de branches
  `docs/ai-readiness-scan-2026-10-01` en `docs/ai-readiness-scan-2026-10-08`
- Branch protection `main` (GitHub-API, 2026-10-15): 2 verplichte checks
  (`Type-check, Lint & Format`, `Unit Tests`, strict `true`),
  `required_conversation_resolution = true`, **geen
  `required_pull_request_reviews`-blok**, `enforce_admins = false`
- PR's: #52 (scan 2026-10-08) OPEN, #51 (scan 2026-10-01) OPEN — beide alle
  checks SUCCESS, `reviewDecision` leeg; #44–#50 (AI-docs + self-heal-markers)
  gemerged; geen nieuwe PR's sinds 2026-10-08
- Testopzet: `vitest.config.ts`, `stryker.config.mjs` (thresholds 80/60),
  `packages/`-tests; box-brede validatieketen (Allure, SAST, DAST)
- Extern geverifieerd: `github.com/Steavy/opencode-fix` (getrackt: `AGENTS.md`,
  `CONVENTIONS.md`, 16 `prompts/*.md`; laatste push 2026-09-25) — bewijs voor
  M&E-vraag 2
- MCP-tools (quality-coach): `ai_readiness_scan` (60 vragen, 5 domeinen;
  antwoorden ingediend via de MCP-server zelf); `pipeline_health` (100.0%,
  30 runs, Ø 93,1s); `defect_trend_analysis` (52 issues totaal, 6 open, alle
  `medium`); `gh-workflow-fix_health` (7 ketens afgerond, 1 uitgeput; laatste
  event 2026-10-15 06:14 UTC)

---
*Generated by Quality Transformation Coach MCP Server*
