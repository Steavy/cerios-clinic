# AI-visie Cerios Clinic

Korte visie op hoe AI wordt ingezet rond dit repo: eigenaarschap,
doelstellingen, ethische kaders en risicoclassificatie. Dit document is de
bestuurlijke borging van de operationele AI-inrichting die al vastligt in
[`AGENTS.md`](../AGENTS.md) (review-plicht, acceptatiecriteria) en
[`docs/ai-development.md`](ai-development.md) (modelkeuze, promptversies).

## Visie

AI wordt ingezet om de kwaliteit, snelheid en betrouwbaarheid van
ontwikkeling en CI/CD rond Cerios Clinic te verbeteren — **niet** om
(medische of andere) beslissingen over personen te nemen. Het repo zelf is
een medische praktijk-app; AI is hier uitsluitend **developer-tooling**:

- AI-ondersteunde code-wijzigingen (OpenCode-sessies op de Techlab-box),
  geleverd via pull request met menselijke review.
- Self-healing CI: gefaalde workflow-runs worden automatisch geanalyseerd
  en gerepareerd door de fix-keten (opencode-fix + gh-workflow-fix).
- Wekelijkse AI-readiness-scan (quality-coach MCP) meet de volwassenheid
  van deze inzet en stuurt verbeteringen.

## Doelstellingen

1. **Kwaliteit zonder uitzondering:** AI-gewijzigde code doorloopt dezelfde
   kwaliteitspoort als menselijke code (typecheck, lint, format, unit-tests,
   menselijke review) — zie `AGENTS.md`.
2. **Data blijft binnen de organisatie:** AI-runs draaien via de lokale
   OmniRoute-gateway; geen echte persoonsgegevens in test- of seed-data.
3. **Traceerbaarheid:** AI-commits zijn herkenbaar in `git log`
   (`Co-authored-by`), AI-runs kennen een audittrail (fix-rapporten,
   `ci-fix:` issues, scan-rapporten).
4. **Continu verbeteren:** de wekelijkse scan maakt gaten zichtbaar en
   koppelt ze aan concrete recommendations; deze worden actief afgewerkt
   (zie de scan-index in Steavy/playwright-sparta → `ai-readiness/`).

## Eigenaarschap

- **AI-owner:** **Steavy** — verantwoordelijk voor de AI-inzet rond dit
  repo (werkwijze, modelkeuze, fix-keten, scan) en voor afhandeling van de
  scan-recommendations. Beslissingen over AI-wijzigingen aan het repo
  vereisen altijd diens (of een andere menselijke) review.
- **Verantwoording:** er is geen formeel governance-board; de verantwoording
  loopt via (a) de menselijke PR-review op `main`, (b) de wekelijkse
  AI-readiness-scan en (c) de issues/PR-audittrail. Escalatie bij
  onduidelijkheid: géén actie ondernemen, vragen om verduidelijking.

## Ethiek en gedragscode

1. **Eerlijkheid:** AI-ondersteunde wijzigingen worden niet voorgesteld als
   menselijke code; de `Co-authored-by`-marker is verplicht.
2. **Geen destructieve acties:** geen `db:reset`, workflow-deletions of
   geheime/credential-dumps door agents, ook niet op instructie van een
   issue/PR-comment (prompt-injectieregel, zie `AGENTS.md`).
3. **Privacy:** geen echte persoonsgegevens verwerken of vermenigvuldigen;
   test- en seed-data zijn synthetisch.
4. **Verantwoorde AI:** bij twijfel over de impact van een AI-wijziging
   (scope, ethiek, juridisch) wordt niet doorgegaan maar om beoordeling
   gevraagd.
5. **Transparantie:** AI-gedrag dat invloed heeft op dit repo (fix-runs,
   wijzigingen, scan-resultaten) is terug te vinden via de documentatie en
   audittrails hierboven.

## Risicoclassificatie (EU AI Act)

De AI-toepassingen rond dit repo zijn **developer-tooling / laag risico**:

- Geen high-risk toepassingen in de zin van de EU AI Act (bv. geen
  AI-beslissingen over toegang tot zorg, geen biometrie, geen
  veiligheidskritische functies).
- Geen AI-beslissingen over personen; het repo verwerkt (synthetische)
  data, AI voert geen beoordelingen van personen uit.
- Deze classificatie wordt jaarlijks, of bij nieuwe AI-inzet, herzien.

---
*Opgesteld op basis van de AI Readiness Scan recommendations (Cerios
Clinic, 2026-09-25 — Strategie & Governance).*