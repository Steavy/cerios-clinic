# Data & retentie-afspraken

Retentie-/verwijderafspraken voor de AI- en demo-data rond Cerios Clinic:
wat wordt waar bewaard, hoe lang, wie is eigenaar en wat gebeurt er na de
termijn. Ingrijpen op grond van de AI Readiness Scan recommendations
(Cerios Clinic, 2026-09-25 — Data & Infrastructuur).

## Uitgangspunt

- **Synthetische data:** alle test- en seed-data in dit repo is fictief
  (`packages/database/src/seed.ts`: `dr.smith@clinic.local`,
  `patient.wilson@example.com`). Er worden geen echte persoonsgegevens
  verwerkt of bewaard; daarmee geldt voor álle data hieronder de laagste
  risicoklasse.
- **Data-eigenaar:** **Steavy** is data-eigenaar van de seeded testdata
  én AI-owner (zie [`ai-vision.md`](ai-vision.md)). Bij twijfel over
  verwijdering: niet zelf opruimen, om beoordeling vragen.

## Retentie-overzicht

| Data / artefact | Locatie | Bewaarregel | Verwijdering na termijn | Automatisch? |
|---|---|---|---|---|
| Seed-testdata (code) | `packages/database/src/seed.ts` + Prisma-schema/migraties | Versiebeheerd in git | n.v.t. (code, geen data) | — |
| AI-readiness scan-rapporten | `Steavy/playwright-sparta` → `ai-readiness/scans/` | Versiebeheerd in git | n.v.t. (git-historie) | — |
| opencode-fix prompts + state | `/root/opencode-fix/prompts/`, `state/` | Versiebeheerd in git (dagelijks gesynced: lokaal bare-repo + GitHub off-site) | n.v.t. (git-historie) | dagelijkse backup |
| opencode-fix logs + reports | `/root/opencode-fix/logs/`, `reports/` | **`KEEP_NEWEST=10`** nieuwste per map | oudere worden verwijderd | wekelijks (`opencode-fix-cleanup.timer`, ma 00:00) |
| GitHub Actions artifacts | `Steavy/cerios-clinic` en `Steavy/playwright-sparta` | **`KEEP_DAYS=7`** (nieuwer dan 7 dagen) | oudere worden verwijderd | dagelijks (`actions-storage-cleanup` workflow 03:35 Europe/Amsterdam + lokaal script) |
| **clinic-db demo-dumps** | `/root/backups/clinic-db-*.dump` (per demo-undeploy aangemaakt door `undeploy-demo.yml`) | **`KEEP_NEWEST=14`** nieuwste dumps | **oudere worden verwijderd — afspraak, uitvoering volgt (zie onder)** | nog niet — te automatiseren |
| Overige backups | `/root/backups/` (`.env`, bare-repo's, caches) | Beperkt tot bestaande sync-regels | handmatig, alleen door data-eigenaar | dagelijkse/wekelijkse timers |

## Nieuw: clinic-db demo-dumps (bewaarregel 14)

Demo-dumps van de clinic-database (aangemaakt bij elke demo-undeploy,
`undeploy-demo.yml`) worden bewaard op **de 14 nieuwste** exemplaren in
`/root/backups/clinic-db-*.dump`; oudere exemplaren worden verwijderd om
onbeperkte groei te voorkomen (per 2026-09-25: 165 stuks, ~168MB, sinds
31 juli 2026, zonder beleid).

- Regel analoog aan de bestaande `cleanup-old-files.sh` (`KEEP_NEWEST`
  default 10) zodat alle retentie op de box hetzelfde patroon volgt.
- **Uitvoering:** de automatische cleanup-timer voor deze map moet nog
  worden geïnstalleerd (vervolgstap op deze afspraak). Tot die tijd wordt
  naleving handmatig gecontroleerd (zie controle hieronder) en wordt er
  **niets verwijderd** zonder expliciete opdracht van de data-eigenaar.
- Herstart van de demo gebruikt altijd de nieuwste dump; oudere dumps
  hebben geen operationele functie meer.

## Controle (naleving)

```bash
# opencode-fix logs/reports: max 10 per map
ls /root/opencode-fix/logs /root/opencode-fix/reports | wc -l        # ≤ 20 totaal
# Actions artifacts: alleen jonger dan 7 dagen (via API/één run-lookup)
# clinic-db dumps: max 14
ls /root/backups/clinic-db-*.dump | wc -l                           # ≤ 14 als uitvoering klaar is
```

## Verantwoordelijkheden

- **Data-eigenaar (Steavy):** seed-testdata, demo-dumps,
  retentie-naleving; beslist over verwijdering buiten de regels hierboven.
- **Agents (OpenCode/opencode-fix):** volgen deze regels; voeren **geen**
  verwijdering van dumps/backups uit zonder expliciete opdracht (zie
  "geen destructieve acties" in `AGENTS.md`).

---
*Opgesteld op basis van de AI Readiness Scan recommendations (Cerios
Clinic, 2026-09-25 — Data & Infrastructuur).*