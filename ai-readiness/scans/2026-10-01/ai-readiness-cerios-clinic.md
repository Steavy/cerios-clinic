# AI Readiness Scan: Cerios Clinic
**Datum:** 2026-10-01
**Framework:** AI Readiness Scan MVP1
**Overall Score:** 51.7%

## Domain Scores
| Domain | Score | Level |
|---|---|---|
| Strategie & Governance | 58.3% | Gedefinieerd |
| Data & Infrastructuur | 66.7% | Beheerst |
| Modelontwikkeling & Experimentatie | 41.7% | Gedefinieerd |
| Evaluatie & Kwaliteit | 25.0% | Ontwikkelend |
| Monitoring & Rapportage | 66.7% | Beheerst |

*Verschil t.o.v. 2026-09-25 (50.0% overall): **+1.7pp**. De stijging komt volledig uit
Modelontwikkeling & Experimentatie (33.3% → 41.7%, +8.4pp): de promptengineering- en
techniekeuzevragen zijn nu expliciet vastgelegd en de self-heal-markering (`# self-heal: true`,
commit `0c02d83`) maakt de fixerketen tot een regelgebaseerde, reproduceerbare lus in plaats
van een impliciet proces. De vier andere domeinen zijn identiek aan 2026-09-25 — sinds die
scan is er in dit repo geen inhoudelijke AI-governance- of evaluatieverandering geweest, alleen
CI-infrastructuur (`0c02d83`, PR #50) en de publicatie van het vorige scanrapport (`6b8287c`,
PR #49).*

## Sterke punten
- **AI-visie, eigenaarschap, gedragscode en risicoclassificatie (S&G 7/12):**
  `docs/ai-vision.md` (PR #45, commit `072f7cd`) legt de AI-visie vast (kwaliteitspoort
  centraal, AI als assistent), belegt eigenaarschap (AI-owner: Steavy) en bevat een korte
  gedragscode (review-plicht, geen blind vertrouwen, transparantie). De AI-toepassing is
  ingedeeld onder EU AI Act als **laag risico / niet-hoog-risico** (geen biometrie, geen
  besluitvorming over persoonsgegevens).
- **AI-rollen en blijvende compliance (S&G +6,+11):** rollen zijn toegewezen en er is een
  vastgelegde lijn naar AI Act/AVG; de review-plicht in `AGENTS.md` (commit `3fcd957`) maakt
  menselijke controle afdwingbaar.
- **Periodieke bijsturing (S&G +10):** de wekelijkse AI-readiness-scan (donderdag 09:00 UTC
  via systemd-timer) plus de zichtbare incident-leerlus in git-history/issues — dit rapport is
  de derde scan in de reeks en de scores zijn trendmatig vergelijkbaar gemaakt.
- **Datainventarisatie, data-eigenaren en retentie (D&I 8/12):** `docs/data-retention.md`
  (PR #46, commit `318ba18`) inventariseert alle AI-gerelateerde data (GHCR-images,
  Actions-artifacts, demo-dumps, scan-rapporten, loansleutels), benoemt data-eigenaren en legt
  bewaartermijnen + automatische verwijdering vast (`actions-storage-cleanup.yml`, KEEP_DAYS=7).
- **Privacy-veilige testdata en gescheiden omgevingen (D&I +4,+6,+7,+8):** synthetische
  testdata (geen echte patiëntengegevens), pseudonimisering, een geautomatiseerde
  data-pipeline, voldoende compute (self-hosted runners + lokale minikube) en gescheiden
  dev/CI/demo-omgevingen inclusief nachtelijke teardown van de demo.
- **Modelkeuze met afweging en kostenmodel (M&E +4,+10):** `docs/ai-development.md`
  (PR #44, commit `09fe727`) documenteert de keuze voor `opencode/big-pickle` via de
  OmniRoute-gateway (kosten-plafondbewuste routering, prompt-caching, lokale gateway), inclusief
  alternatieven-afweging en een expliciet token-plafond (~175k tokens/dag). De keuze wordt
  bovendien per repo gestuurd vanuit de workflows, niet vrij per prompt.
- **Prompt engineering als discipline (M&E +5):** het fix-contract, de review-plicht en de
  promptversie-conventie zijn expliciet gedocumenteerd; de self-heal-markering in de workflows
  maakt het AI-gebruik per workflow zichtbaar en intentioneel in plaats van impliciet.
- **Acceptatiecriteria, expertbeoordeling en injectietest (E&K 3/12):** `docs/ai-evaluation.md`
  (PR #47, commit `d608863`) formaliseert de prompt-injectietest als herhaalbare procedure
  (met de live test van 2026-09-25 als geregistreerd bewijs, run 36105309206) en definieert een
  menselijke review-steekproef; domeinexperts zijn betrokken bij de kwaliteitsbeoordeling en
  acceptatiecriteria staan in `AGENTS.md`.
- **Rollbackprocedure (M&R +6):** `docs/ai-rollback.md` (PR #48, commit `4308ba7`) definieert
  trigger, beslispad, stappen en communicatie, gekoppeld aan de monitoring.
- **Dashboard, kostenbewaking, audittrail en RCA (M&R 8/12):** het opencode-fix
  AI-dashboard (wekelijks dinsdag 00:35) rapporteert keten-status en tokenverbruik/kosten per
  model en provider; AI-uitkomsten zijn gelogd, incidenten hebben een root-cause-analyse, de
  prestaties worden teruggekoppeld aan de teams en de rapportage naar management/toezicht is
  transparant (gepubliceerde Allure-, Stryker-, DAST- en SAST-rapportage via GitHub Pages).
- **Gezonde basis ongewijzigd sterk:** pipeline-gezondheid **96.7%** over de laatste 30 runs
  (Ø 108,9s) en volwassen applicatie-kwaliteitsinfrastructuur (mutation testing, SAST, DAST,
  performance, BDD).

## Aandachtspunten
- **Evaluatie & Kwaliteit (25.0%, 3/12):** laagst scorende domein en ongewijzigd. Er is een
  procedure (evaluatie, injectietest, review-steekproef), maar 9 van de 12 vragen zijn nog
  "nee": **geen heldere kwaliteitsmetrieken en geen systematische beoordeling van LLM-output**
  (relevantie, coherentie, hallucinaties), geen evaluatiedataset die losstaat van
  trainingsdata, geen bias-/eerlijkheidstest, geen systematisch onderzoek van uitzonderingen
  en randgevallen, geen meting van hallucinaties/calibratie, **geen geautomatiseerde
  evaluatie-pipeline met eval-sets in CI**, geen hertest na (her)training en geen
  kwantitatieve én kwalitatieve livegangdrempel. De review-steekproef is gedefinieerd maar
  nog niet als terugkerende praktijk geëvidenceerd.
- **Modelontwikkeling & Experimentatie (41.7%, 5/12):** probleem-/succesdefinitie,
  experimenttracking, modelkeuze en prompt engineering staan, maar er ontbreken nog:
  versiebeheer van prompts/modellen binnen dit repo (promptversies van de fix-keten leven in
  `/root/opencode-fix`, een losse repo waar dit repo niet naar verwijst), herkomst van
  datasets, reproduceerbaarheid met vaste seeds en omgeving, een modelregistratie/catalogus,
  vergelijking met een baseline, korte iteraties met gebruikersfeedback en validatie van
  AI-experimenten door domeinexperts.
- **Strategie & Governance (58.3%, 7/12):** visie, ethiek, rollen en risicoclassificatie
  staan, maar er is nog geen AI-governance-board/-stuurgroep, use cases worden niet
  geïnventariseerd en op businesswaarde geprioriteerd, AI-initiatieven worden niet op businesscase
  en maatschappelijke impact beoordeeld, er is geen formele AI-impact-assessment als
  standaard-check vóór livegang en geen structurele AI-skilling van het team.
- **Data & Infrastructuur (66.7%, 8/12):** sterkste domein naast Monitoring. Gaten:
  datakwaliteit (compleetheid, juistheid, actualiteit) wordt niet gemeten, datasets zijn niet
  versiebeheerd voor reproduceerbaarheid, er is geen bias-/representativiteitsmonitoring en geen
  centrale feature-engineering. Kostenbewaking is operationeel via het dashboard maar niet
  gekoppeld aan een datainfrastructuurbudget.
- **Monitoring & Rapportage (66.7%, 8/12):** gaten: geen datadrift-/conceptdrift-detectie, geen
  terugkerende feedbackloop op gebruikersfeedback voor modelverbetering, de businesswaarde van
  de AI-inzet is niet gekwantificeerd (uren bespaard per week) en er is geen geautomatiseerde
  retraining.
- **Governance-zwakke plek nieuw zichtbaar (S&G/PR-afhankelijk):** de branch protection op
  `main` heeft verplichte checks maar **geen verplichte menselijke review**
  (`required_approving_review_count = 0`) en admins kunnen bypassen. Dat staat op gespannen
  voet met de review-plicht uit `AGENTS.md` en de Aandachtspunten hierboven: een AI-fix die
  rechtstreeks naar `main` kan, is een governance-hygiëneprobleem ongeacht de gedocumenteerde
  intentie.

## Recommendations
- [CRITICAL] Evaluatie & Kwaliteit: maak van de gedefinieerde procedure een **terugkerende
  praktijk** — kwantificeer LLM-outputkwaliteit (steekproef van AI-PR's op relevantie, coherentie
  en hallucinaties) en registreer de review-steekproef zodat deze evidencieerbaar is. Voeg een
  lichte geautomatiseerde evaluatie toe (een checklist- of CI-gate voor AI-gewijzigde PR's in
  plaats van alleen handmatige review) en leg kwantitatieve livegangdrempels vast. Zonder dit
  blijven 9 van de 12 E&K-vragen "nee".
- [CRITICAL] Strategie & Governance: zet `required_approving_review_count >= 1` op `main` en
  `enforce_admins` aan, zodat de review-plicht uit `AGENTS.md` daadwerkelijk wordt afgedwongen
  en een AI-fix niet zonder menselijke goedkeuring kan landen.
- [HIGH] Modelontwikkeling & Experimentatie: registreer elke AI-fixrun/opencode-sessie als
  experiment (run-id, model, config, tokens, uitkomst) en verwijs vanuit dit repo naar de data
  die al in opencode-fix bestaat (`state/` + `reports/`); breng de prompts en fix-contracten
  onder versiebeheer in dit repo.
- [HIGH] Strategie & Governance: formaliseer een licht AI-governance-overleg (bijv. maandelijks
  met het dashboard als input) en gebruik de classificatie uit `ai-vision.md` als uitgangspunt
  voor een impact-assessment-checklist vóór nieuwe AI-toepassingen.
- [MEDIUM] Data & Infrastructuur: definieer datakwaliteitsindicatoren voor de demo- en testdata
  en koppel de dashboard-kosten aan een budgetdrempel met een geautomatiseerde alert (nu is de
  drempel gedocumenteerd, de alert nog niet).
- [MEDIUM] Monitoring & Rapportage: kwantificeer de businesswaarde (tijd bespaard versus
  handmatig fixen; aantal geslaagde self-heals per week) en overweeg drift-detectie op de
  fix-keten (bijvoorbeeld succesratio per workflow als KPI).

## Bronnen & geanalyseerd
- Docs (sinds 2026-09-25 ongewijzigd): `docs/ai-vision.md` (PR #45, `072f7cd`),
  `docs/ai-development.md` (PR #44, `09fe727`), `docs/ai-evaluation.md` (PR #47, `d608863`),
  `docs/ai-rollback.md` (PR #48, `4308ba7`), `docs/data-retention.md` (PR #46, `318ba18`)
- Docs (bestaand): `README.md` (AI-ondersteund CI/CD), `AGENTS.md` (review-plicht +
  acceptatiecriteria, commit `3fcd957`), `DEVELOPMENT.md`, `TEST-AUTOMATION.md`, `MOBILE.md`
- `.github/workflows/` — 16 workflows, waaronder `ci.yml`, `unit-ci.yml`, `sast.yml`,
  `dast.yml`, `docker-publish.yml`, `mobile-build-publish{,emulator}.yml`,
  `stryker-pages.yml`, `allure-pages.yml`; **9 workflows dragen `# self-heal: true`**
  (commit `0c02d83`, PR #50) en de oude opencode-fix-brug is verwijderd
- `git log` sinds 2026-09-25: `0c02d83`/`df1809f` (PR #50, self-heal-markers + brug-opruiming),
  `6b8287c`/`47bbd02` (PR #49, publicatie scanrapport 2026-09-25)
- Branch protection `main`: verplichte checks aanwezig, `required_approving_review_count = 0`,
  `enforce_admins = false`
- Testopzet: `vitest.config.ts` dekt 7 testbestanden in `packages/portal-common` en
  `packages/shared-types`; `stryker.config.mjs` muteert alleen die twee packages (thresholds
  80/60, break-punt niet actief)
- MCP-tools (quality-coach): `ai_readiness_scan` (60 vragen, 5 domeinen);
  `analyze_code_quality` (10 files, gemiddelde complexiteit 7.0, één high-complexity smell in
  `.github/scripts/sarif-to-html.py`); `analyze_test_coverage` (33.3%, 1 van 3 modules);
  `pipeline_health` (96.7%, 30 runs, Ø 108,9s); `gh-workflow-fix_health` (database
  `/var/lib/gh-workflow-fix/state.db`; 7 ketens afgerond, 1 uitgeput — issue
  [#40](https://github.com/Steavy/cerios-clinic/issues/40), fout `opencode timeout`).
  **Toolbeperking:** `quality_hotspot_detection` leverde URLs als bestandsnamen op en is daarom
  **niet** als bewijs gebruikt.

---
*Generated by Quality Transformation Coach MCP Server*