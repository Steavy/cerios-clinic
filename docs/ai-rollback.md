# AI-rollback — terugdraaien van AI-wijzigingen

Wanneer een AI-gewijzigde PR op `main` een probleem blijkt te veroorzaken
(regressie, CI-breach, beveiligingsrisico), geldt deze rollbackprocedure.
Dit document is de AI-specifieke tegenhanger van de normale
fix-workflow: de **fix-keten** repareert voorwaarts, **rollback** draait
terug — en heeft voorrang als een voorwaartse fix te lang duurt of het
risico te groot is.

## Wanneer rollback toepassen

Terugdraaien **altijd** zodra een AI-wijziging op `main`:

1. **CI breekt** op `main` (of een downstream-workflow faalt) en een
   voorwaartse fix is niet binnen 30 minuten beschikbaar.
2. **Geheimen/credentials** zijn gelekt (iets dat niet op GitHub mag
   staan), ook als CI groen is.
3. **Destructieve actie** is uitgevoerd (bijv. `db:reset` in productie,
   workflow- of branch-deletion).
4. Een **afwijkende scope** blijkt (AI deed meer dan gevraagd) met
   materiële impact.

Voor (2) en (3) geldt: eerst terugdraaien, dan analyseren. De inhoud van
de gelekte/destructieve commit blijft in `git log` zichtbaar — dat is
bewust, voor audit; kwetsbare waarden moeten naast de revert ook elders
worden geroteerd (`/root/backups/.env` en eventuele andere secrets).

## Procedure

1. **Bevestigen** — een mens (AI-owner **Steavy**; bij onbeschikbaarheid
   de reviewers van de oorspronkelijke PR) stelt vast dat één van de
   bovenstaande punten geldt. Een agent **start zelf geen rollback** op
   vermoeden; alleen op expliciete opdracht of bij een door de gebruiker
   vooraf gemarkeerde categorie (1–3).
2. **Revert-PR maken** — nieuwe tak vanaf `main`, `git revert -m 1`
   van de merge-commit van de betreffende AI-PR. Eén revert per merge,
   geen verdere wijzigingen in dezelfde PR.
   ```
   git checkout main && git pull
   git checkout -b revert/ai-<issue-of-branch>
   git revert -m 1 <merge-commit-sha>
   ```
3. **Review + CI** — normale gang van zaken: PR openen, checks groen
   (`typecheck`, `lint`, `format`, `unit-tests`), menselijke review. Dit
   is de enige toegestane weg naar `main` (geen directe push; branch
   protection). In tijdsdruk (categorie 1) heeft de revert-PR prioriteit
   boven reguliere AI-PR's.
4. **Registreren** — na merge: issue/opmerking op de oorspronkelijke PR
   met verwijzing naar de revert-PR (SHA's van beide), en regelen dat de
   oorspronkelijke PR als "reverted" wordt gemarkeerd (label of closed).
   Zonder registratie is de gebeurtenis niet traceerbaar — de
   traceerbaarheidsregel uit `AGENTS.md` geldt ook hier.
5. **Navolging** — de root-cause van de mislukte wijziging hoort thuis
   in de evaluatie-cyclus (`docs/ai-evaluation.md`): als de wijziging via
   de fix-keten kwam, krijgt de betreffende chain een vervolgcontentpunt
   (meer pogingen/ander model/contract-fix); als het via een directe
   AI-PR kwam, wordt de afwijking geregistreerd in de review-steekproef.

## Wat NIET mag

- **Force-push/geschiedenis herschrijven** om een AI-commit "uit de
  geschiedenis te wissen" — verboden (AGENTS.md / basisregels). Revert is
  de enige weg; dit document en GitHub gelden als audit-tabel.
- **Dubbele revert** — dezelfde PR twee keer terugdraaien zonder
  verklaring in de registratie.
- **Rollback door de fix-keten** — de keten repareert code, maar draait
  geen `git revert` op `main`; dat is mensenwerk (punt 1–3).

## Verantwoordelijkheden

| Rol | Taak |
|---|---|
| AI-owner (Steavy) | bevestigt rollback-noodzaak, beoordeelt revert-PR, roteert evt. geheimen |
| Reviewer | groene check + merge van revert-PR |
| Agent | voert revert alleen uit op expliciete opdracht; registreert na afloop |

## Relatie tot monitoring

Het AI-dashboard (wekelijks gegenereerd op de Techlab-box, zie
opencode-fix `bin/ai-dashboard.sh`) toont fix-runs en hun uitkomst. Een
chain die na fix nog steeds faalt (of drie pogingen verbruikt) is een
signaal om scorched-earth te overwegen: niet nóg een fix-poging, maar
stoppen en de betreffende workflow handmatig beoordelen.