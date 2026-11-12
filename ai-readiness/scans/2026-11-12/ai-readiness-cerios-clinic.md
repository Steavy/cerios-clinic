# AI Readiness Scan: Cerios Clinic
**Datum:** 2026-11-12
**Framework:** AI Readiness Scan MVP1
**Overall Score:** 51.7%

## Domain Scores
| Domain | Score | Level |
|---|---|---|
| Strategie & Governance | 58.3% | Gedefinieerd |
| Data & Infrastructuur | 66.7% | Beheerst |
| Modelontwikkeling & Experimentatie | 50.0% | Gedefinieerd |
| Evaluatie & Kwaliteit | 16.7% | Ontwikkelend |
| Monitoring & Rapportage | 66.7% | Beheerst |

*Verschil t.o.v. 2026-10-22 (53.3% overall): **−1.7pp**. Vier van de vijf
domeinen zijn identiek; de daling zit volledig in **Evaluatie & Kwaliteit
(25.0% → 16.7%)** en is een **correctie van de vorige boeking, geen nieuwe
regressie in de repo**. Vorige scans beantwoordden vraag E&K‑6 ("Worden menselijke
domeinexperts betrokken bij kwaliteitsbeoordeling van output?") met "ja" op basis
van de *gedefinieerde* review-steekproef in `docs/ai-evaluation.md`; deze run is
die aanname tegen de werkelijke PR-data gelegd. Resultaat: PR's
[#44–#49](https://github.com/Steavy/cerios-clinic/pull/44),
[#50](https://github.com/Steavy/cerios-clinic/pull/50), #54 en de nieuwe
#74/#75/#76 hebben **0 reviews en 0 comments**; de enige geregistreerde review in
de repo-geschiedenis is
[#43](https://github.com/Steavy/cerios-clinic/pull/43) door de **auteur zelf**
(state `COMMENTED`, geen approve). De registratietabel in `docs/ai-evaluation.md`
staat nog steeds op "nog geen". De definitie is dus niet nageleefd → antwoord
"nee", en daarmee E&K 2/12. Dat is de eerlijke stand; de daling is in de trend
hieronder als correctie gemarkeerd zodat 51.7% niet als "verslechtering" wordt
gelezen. Repo-inhoud sinds 2026-10-22: **6 commits / 3 PR's** (#74, #75, #76 —
2026-10-23, 9 files +96/−10) die mailpit naar een eigen image + GHCR-publish
verplaatsen (`infra/docker/Dockerfile.mailpit`, `infra/k8s/mailpit.yaml`,
`docker-compose.demo.yml`, `infra/docker-compose.prebuilt.yml`,
`.github/workflows/docker-publish.yml`), de Keycloak-hostname publiek maken
(`infra/k8s/keycloak.yaml`), de chaos-smoke uitbreiden
(`infra/scripts/smoke-chaos-test.sh`) en `README.md`/`DEVELOPMENT.md` bijwerken.
Geen AI-docs, geen `self-heal`-markers en geen evaluatieprocedures gewijzigd.
Externe signalen deze run: pipeline-gezondheid **100.0%** over 30 runs
(Ø **96,1s**, was 96,2s), defect-trend **33 issues / 11 open** (alle `medium`;
de tool hanteert een ander queryvenster dan vorige run, dus niet als
verslechtering lezen), en de scan-PR's
[#51](https://github.com/Steavy/cerios-clinic/pull/51),
[#52](https://github.com/Steavy/cerios-clinic/pull/52),
[#53](https://github.com/Steavy/cerios-clinic/pull/53) en
[#55](https://github.com/Steavy/cerios-clinic/pull/55) staan nog **OPEN** met
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
  escalation zijn toegewezen; `AGENTS.md` §"AI-gewijzigde code" schrijft
  publicatie via PR met groene CI én menselijke review voor; de AI Act/AVG-lijn is
  gedocumenteerd in `docs/ai-vision.md` en `docs/data-retention.md`. Branch
  protection op `main` dwingt de **CI**-kant daarvan ook echt af (2 verplichte
  checks, `strict: true`, `required_conversation_resolution: true`) — de
  review-kant niet (zie aandachtspunten).
- **Periodieke bijsturing (S&G +10):** de wekelijkse AI-readiness-scan
  (donderdag 09:00 UTC, systemd-timer) plus de zichtbare incident-leerlus in
  git-history en `ci-fix:`-issues; dit is de zevende scan in de reeks. De
  fix-keten is deze week aantoonbaar actief geweest
  (`gh-workflow-fix`-laatste event **2026-11-12 02:42 UTC**).
- **Datainventarisatie, data-eigenaren en retentie (D&I 8/12):**
  `docs/data-retention.md` inventariseert AI-gerelateerde data (GHCR-images,
  Actions-artifacts, demo-dumps, scan-rapporten, fix-artefacten), benoemt
  **data-eigenaar Steavy** en legt bewaartermijnen vast — waaronder
  `KEEP_NEWEST=14` voor clinic-db dumps en `KEEP_DAYS=7` voor Actions-artifacts
  (`actions-storage-cleanup.yml`, dagelijks 03:35). De nieuwe GHCR-publish van
  het mailpit-image valt onder dezelfde bewaarafspraak.
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
  2026-09-25); modelversies zijn vastgepind in de workflows, en de OpenCode-actie
  is hier netjes gepind (`anomalyco/opencode/github@v1.18.32`, in tegenstelling
  tot `@latest` in playwright-sparta).
- **Prompt engineering als discipline (M&E +5):** fix-contract, review-plicht en
  promptversie-conventie zijn gedocumenteerd; de `# self-heal: true`-markering op
  **9 van de 16 workflows** (`ci`, `unit-ci`, `dast`, `sast`, `docker-publish`,
  `stryker-pages`, `allure-pages`, `mobile-build-publish`,
  `mobile-build-publish-emulator`) maakt het AI-gebruik per workflow zichtbaar
  en intentioneel.
- **Prompt-injectietest uitgevoerd en geregistreerd (E&K +7):**
  `docs/ai-evaluation.md` bevat de herhaalbare procedure (vector A fix-keten,
  vector B directe-PR-tak) met het geslaagde testbewijs van 2026-09-25
  (issue #41, run 36105309206); de `/oc`-trigger is daarna beperkt tot een
  allowlist (`Steavy`) — een aantoonbaar sluitende lus tussen test, maatregel en
  documentatie.
- **Acceptatiecriteria vóór merge (E&K +2):** `AGENTS.md`
  §acceptatiecriteria + §AI-evaluatie koppelen livegang aan groene CI; de
  verplichte status checks (`Type-check, Lint & Format`, `Unit Tests`) worden
  door branch protection afgedwongen, niet alleen beschreven.
- **Rollbackprocedure (M&R +6):** `docs/ai-rollback.md` definieert trigger,
  beslispad, revert-PR-stappen, registratieplicht en verboden acties, gekoppeld
  aan de monitoring en de evaluatiecyclus.
- **Dashboard, kostenbewaking, audittrail, RCA en transparantie (M&R 8/12):**
  het wekelijkse AI-dashboard (`opencode-fix/bin/ai-dashboard.sh`) rapporteert
  keten-status, time-to-fix en tokenverbruik/kosten per model; AI-uitkomsten
  zijn gelogd (PR/issue-audittrail), incidenten krijgen een root-cause-analyse
  (`ci-fix:`-issues + `gh-workflow-fix`-ketens: 8 afgerond, 1 uitgeput), de
  prestaties gaan terug naar de teams en de rapportage naar management/toezicht
  is publiek (Allure Pages, Stryker/SAST/DAST-reports, scan-rapporten).
- **Traceerbaarheid van de nieuwe AI-PR's:** de drie commits achter #74/#75/#76
  zijn authored door `openhands <openhands@all-hands.dev>` met
  `Co-authored-by: Steavy <Steavy@users.noreply.github.com>`, dus ook deze
  agentische wijzigingen zijn in `git log` herleidbaar tot een agent + een
  mens. Dat is precies wat de gedragscode in `docs/ai-vision.md` vraagt.
- **Gezonde basis, stabiel op hoog niveau:** pipeline-gezondheid **100.0%** over
  de laatste 30 runs (Ø 96,1s), volwassen kwaliteitsinfrastructuur
  (CodeQL/Semgrep/Gitleaks, DAST, mutation testing, BDD, performance) en
  dependabot-updates.

## Aandachtspunten
- **Evaluatie & Kwaliteit (16.7%, 2/12):** laagst scorend domein en nu ook het
  enige domein met een daling. Van de 12 vragen zijn er 10 "nee": geen heldere
  kwaliteitsmetrieken (accuracy/precision/recall/F1), geen systematische
  beoordeling van LLM-output (relevantie, coherentie, hallucinaties), geen
  evaluatiedataset los van trainingsdata, geen bias-/eerlijkheidstest, geen
  systematisch randgevallenonderzoek, **geen aantoonbare menselijke
  domeinexpert-beoordeling** (0 reviews op alle AI-PR's; enige review is een
  self-comment op #43), geen meting van hallucinaties/calibratie, geen
  geautomatiseerde evaluatie-pipeline met eval-sets in CI, geen hertest na
  (her)training en geen kwantitatieve én kwalitatieve livegangdrempel. De
  review-steekproef (elke 5e AI-PR) is nog steeds niet als praktijk
  geëvidenceerd: de registratietabel in `docs/ai-evaluation.md` is leeg en de
  teller is inmiddels ruim voorbij de 5e AI-PR (≥10 AI-PR's). Ook de
  vector-A-rij van de injectietest is nog niet ingevuld.
- **De review-plicht wordt niet nageleefd (kern van de E&K-correctie):** van de
  tien gecontroleerde AI-PR's (#44–#50, #54, #74–#76) heeft er **geen enkele**
  een approve; #43 kreeg één `COMMENTED`-review van de auteur zelf. De nieuwe
  #74/#75/#76 zijn dezelfde dag gemerged, met 0 reviews en 0 comments. Dat is
  een procesgat, niet een ontbrekend document: `AGENTS.md` schrijft review voor,
  branch protection dwingt het niet af.
- **Modelontwikkeling & Experimentatie (50.0%, 6/12):** nog "nee":
  herkomst van datasets, reproduceerbaarheid met vaste seeds en omgeving,
  modelregistratie/catalogus, vergelijking met een baseline, korte iteraties met
  gebruikersfeedback en validatie van AI-experimenten door domeinexperts.
  Aanvullend: de nieuwe agentische PR's kwamen van **openhands**, niet via de
  gedocumenteerde `opencode/big-pickle`-route — de tool- en modelkeuze is dus
  breder dan `docs/ai-development.md` beschrijft (documentatie loopt achter op de
  praktijk).
- **Strategie & Governance (58.3%, 7/12):** visie, ethiek, rollen en
  risicoclassificatie staan, maar `docs/ai-vision.md` erkent zélf dat er **geen
  formeel governance-board** is; use-cases worden niet geïnventariseerd/
  geprioriteerd, AI-initiatieven worden niet op businesscase en maatschappelijke
  impact beoordeeld, er is geen formeel impact-assessment vóór livegang en geen
  structurele AI-skilling.
- **Governance-zwakke plek onveranderd (S&G, CRITICAL van vorige scans, niet
  opgevolgd):** branch protection op `main` heeft 2 verplichte checks
  (`Type-check, Lint & Format`, `Unit Tests`, strict `true`) en
  `required_conversation_resolution = true`, maar er is **geen
  `required_pull_request_reviews`-blok** (`enforce_admins = false`,
  hergecontroleerd op 2026-11-12). Er is dus **geen verplichte menselijke
  approve** — de gedocumenteerde review-plicht wordt niet door GitHub
  afgedwongen, en de PR-data hierboven laat zien dat dat in de praktijk ook niet
  gebeurt.
- **Data & Infrastructuur (66.7%, 8/12):** gaten: datakwaliteit (compleetheid,
  juistheid, actualiteit) wordt niet gemeten, datasets zijn niet versiebeheerd
  voor reproduceerbaarheid, geen bias-/representativiteitsmonitoring en geen
  centrale feature-engineering. Kostenbewaking is operationeel via het dashboard
  maar niet gekoppeld aan een datainfrastructuurbudget. Daarnaast is de
  `KEEP_NEWEST=14`-cleanup voor clinic-db dumps nog steeds een **afspraak zonder
  geïnstalleerde timer** (`docs/data-retention.md` §Uitvoering) — dit staat nu
  voor de tweede scan op rij open.
- **Monitoring & Rapportage (66.7%, 8/12):** gaten: geen drift-/conceptdrift-detectie,
  geen terugkerende feedbackloop op gebruikersfeedback, de businesswaarde van de
  AI-inzet is niet gekwantificeerd (uren bespaard per week) en er is geen
  geautomatiseerde retraining.
- **Publicatiestatus vorige scans:** PR's
  [#51](https://github.com/Steavy/cerios-clinic/pull/51) (scan 2026-10-01),
  [#52](https://github.com/Steavy/cerios-clinic/pull/52) (2026-10-08),
  [#53](https://github.com/Steavy/cerios-clinic/pull/53) (2026-10-15) en
  [#55](https://github.com/Steavy/cerios-clinic/pull/55) (2026-10-22) staan nog
  **OPEN** — alle met lege `reviewDecision`. Vier onbeoordeelde scan-PR's naast
  elkaar, terwijl #55 wel 8 groene checks heeft. Zonder review-verplichting
  blijft deze stapel groeien.
- **Agentschap, twee weken:** er zijn in deze periode géén scan-runs uitgevoerd
  (2026-10-29 en 2026-11-05 ontbreken), terwijl de branche wél doorontwikkelde
  (#74–#76). De eerstvolgende scan na 2026-10-22 is deze.

## Recommendations
- [CRITICAL] Evaluatie & Kwaliteit: maak van de review-steekproef een
  **terugkerende praktijk met bewijs** — review elke AI-PR (of minimaal elke 5e)
  op de 5 vaste punten uit `docs/ai-evaluation.md`, registreer dat in de
  steekproeftabel en kwantificeer LLM-outputkwaliteit (relevantie, coherentie,
  hallucinaties). Vul de vector-A-rij van de injectietest in. Zonder dit blijven
  10 van de 12 E&K-vragen "nee" — de score is nu een correcte weergave van de
  praktijk, niet van de documentatie.
- [CRITICAL] Strategie & Governance: zet `required_approving_review_count >= 1`
  op `main` (en overweeg `enforce_admins`), zodat de review-plicht uit
  `AGENTS.md` daadwerkelijk wordt afgedwongen en een AI-fix niet zonder menselijke
  goedkeuring kan landen. Dit is dezelfde aanbeveling als vorige scan, twee weken
  onopgevolgd — en de nieuwe #74–#76 laten zien waarom het telt.
- [HIGH] Strategie & Governance: breng `docs/ai-development.md` in lijn met de
  praktijk (openhands als tweede agent-route, met eigen model-/toolafweging) en
  formaliseer een licht AI-governance-overleg (bijv. maandelijks, dashboard als
  input) met use-case-inventarisatie en prioritering.
- [HIGH] Modelontwikkeling & Experimentatie: registreer elke AI-fixrun als
  experiment met vaste config/seeds (reproduceerbaarheid) en voeg een
  baselinevergelijking toe (handmatige fix-tijd vs. self-heal-tijd).
- [MEDIUM] Data & Infrastructuur: definieer datakwaliteitsindicatoren voor
  demo-/testdata, installeer eindelijk de geplande `KEEP_NEWEST=14`-cleanup-timer
  voor clinic-db dumps en koppel de dashboard-kosten aan een budgetdrempel met
  een geautomatiseerde alert.
- [MEDIUM] Monitoring & Rapportage: kwantificeer de businesswaarde (tijd
  bespaard versus handmatig fixen; aantal geslaagde self-heals per week) en
  overweeg drift-detectie op de fix-keten (succesratio per workflow als KPI).
- [MEDIUM] Operatie: merge of sluit de openstaande scan-PR's (#51, #52, #53,
  #55) — vier onbeoordeelde publicaties ondermijnen het "wekelijks
  gerapporteerd"-verhaal meer dan de rapporten zelf opleveren.

## Bronnen & geanalyseerd
- Docs: `docs/ai-vision.md` (visie, eigenaarschap, gedragscode,
  risicoclassificatie, "geen formeel governance-board"), `docs/ai-development.md`
  (modelkeuze + §Promptversies), `docs/ai-evaluation.md` (injectieprocedure +
  review-steekproef; testrun 36105309206; registratietabellen nog leeg),
  `docs/ai-rollback.md`, `docs/data-retention.md` (KEEP_NEWEST=14, uitvoering
  volgt), `docs/superpowers/`, `AGENTS.md` (review-plicht,
  acceptatiecriteria, prompt-injectieregel, AI-evaluatie, data-retentie),
  `README.md` §AI-Assisted Development (gewijzigd in #76), `DEVELOPMENT.md`
  (728 regels, gewijzigd in #74–#76), `TEST-AUTOMATION.md`, `MOBILE.md`
- `.github/workflows/` — **16 workflows**, waarvan **9 met `# self-heal: true`**
  (`ci`, `unit-ci`, `dast`, `sast`, `docker-publish`, `stryker-pages`,
  `allure-pages`, `mobile-build-publish`, `mobile-build-publish-emulator`);
  overige o.a. `opencode.yml` (allowlist `Steavy`, actie
  `anomalyco/opencode/github@v1.18.32`), `trigger-smoke.yml`,
  `performance.yml`, `auto-rerun-qemu.yml`, `version-smoke-check.yml`,
  `renovate.yml`, `actions-storage-cleanup.yml`
- `git log`/`git diff` sinds `404fbd6`: 6 commits, 3 PR's (#74, #75, #76 —
  2026-10-23, authored door `openhands <openhands@all-hands.dev>`,
  `Co-authored-by: Steavy`), 9 files **+96/−10**:
  `.github/workflows/docker-publish.yml`, `DEVELOPMENT.md`, `README.md`,
  `docker-compose.demo.yml`, `infra/docker-compose.prebuilt.yml`,
  `infra/docker/Dockerfile.mailpit`, `infra/k8s/keycloak.yaml`,
  `infra/k8s/mailpit.yaml`, `infra/scripts/smoke-chaos-test.sh`; geen wijziging
  in `docs/ai-*.md`
- Branch protection `main` (GitHub-API, 2026-11-12): 2 verplichte checks
  (`Type-check, Lint & Format`, `Unit Tests`, strict `true`),
  `required_conversation_resolution = true`, **geen
  `required_pull_request_reviews`-blok**, `enforce_admins = false`
- PR's: #74/#75/#76 gemerged 2026-10-23 met **0 reviews / 0 comments**; #55
  (scan 2026-10-22, 8 groene checks), #53, #52, #51 OPEN met lege
  `reviewDecision`; #43 enige PR met een review (auteur, `COMMENTED`); #44–#50
  en #54: 0 reviews / 0 comments
- Testopzet: `vitest.config.ts`, `stryker.config.mjs` (thresholds 80/60),
  `packages/`-tests; box-brede validatieketen (Allure, SAST, DAST)
- Extern geverifieerd: `github.com/Steavy/opencode-fix` (getrackt: `AGENTS.md`,
  `CONVENTIONS.md`, 16 `prompts/*.md`; laatste push 2026-09-25) — bewijs voor
  M&E-vraag 2
- MCP-tools (quality-coach): `ai_readiness_scan` (60 vragen, 5 domeinen;
  antwoorden ingediend via de MCP-server zelf); `pipeline_health` (100.0%,
  30 runs, Ø 96,1s); `defect_trend_analysis` (33 issues totaal, 11 open, alle
  `medium`; queryvenster wijkt af van vorige run); `quality_gate_check`
  pull_request (Code Review/Tests/No Critical Issues niet aantoonbaar,
  `all_required_passed: false`); `quality_hotspot_detection` (output niet
  bruikbaar: parseert URL-fragmenten als bestandsnamen — niet als bewijs
  gebruikt); `analyze_flaky_tests` (geen CI-run-data); `gh-workflow-fix_health`
  (8 ketens afgerond, 1 uitgeput; laatste event 2026-11-12 02:42 UTC)

---
*Generated by Quality Transformation Coach MCP Server*
