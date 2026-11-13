# AGENTS.md — Techlab box (workspace root `/`)

This workspace is the root filesystem of the Cerios Techlab server, not a single git repo. Headless OpenCode sessions are started here and see the whole box. Facts below are the non-obvious ones.

## ⚠️ SESSION START CHECKLIST (MANDATORY — DO THIS FIRST)

**Before ANY other action in a new session, run these THREE calls in parallel:**

```bash
# 1. Mem0 — shared memory with OpenClaw
mem0_search_memories(query="<session topic>", userId="steven")

# 2. Hindsight default bank — cross-session agent memory
hindsight_recall(query="<session topic>", bank_id="default")

# 3. Hindsight gateway-docs bank — project documentation
hindsight_recall(query="<session topic>", bank_id="gateway-docs")
```

**Only after collecting results** → proceed with the actual task.

> This is not optional. Skipping this loses context, repeats work, and breaks continuity.

## OpenCode install & servers
- Binary: `/root/.opencode/bin/opencode` (v1.18.31). Not on default `PATH` — use the full path.
- Global config: `/root/.config/opencode/opencode.json` (hoofdconfig) en `opencode.jsonc` (bevat `"plugin": ["oh-my-openagent@latest"]`). Let op: `opencode.json` heeft `"plugin": []` — de actieve plugin komt uit het `.jsonc`-bestand.
- Headless servers als systemd-services:
  - `opencode-serve-4096.service` — `opencode serve --hostname 0.0.0.0 --port 4096 --print-logs`, cwd `/root`
  - `opencode-web-4098.service` — web-UI (`opencode web --hostname 0.0.0.0 --port 4098 --print-logs`), cwd `/root`; deelt dezelfde sessie-DB als 4096
  - Manage: `systemctl restart|status opencode-serve-4096 opencode-web-4098`; logs: `journalctl -u opencode-serve-4096 -f`
  - (Ooit bestond er ook een `opencode-serve-4097` op cwd `/geert-opencode` — die unit bestaat niet meer, geverifieerd 2026-08-22.)
- Server access + credentials: `/geert-opencode/gateway/README.md` (committed ops doc — the canonical reference).

## Config-kenmerken van deze box
- Model: `opencode/big-pickle`. Provider: `omniroute` — lokale LLM-gateway op `http://127.0.0.1:20128/v1` (systemd-service `omniroute.service`).
- LSP volledig uit: `lsp.enabled.disabled = true` en `lsp.command.disabled = true`.
- Agents `explore` en `general` zijn gedisabled in de config.
- MCP-servers (in `opencode.json`): `github` (lokaal, `/root/opencode-mcp/github-mcp.sh`), `playwright` (lokaal, npx), `context7` (lokaal, npx), `exa` (remote, `https://mcp.exa.ai/mcp`), `firecrawl` (remote, `https://mcp.firecrawl.dev/v2/mcp`), `gh-workflow-fix` (lokaal, `/root/opencode-mcp/gh-workflow-fix-mcp.sh`), `testassist` (lokaal, `/root/testassist-mcp/`), `mem0` (lokaal, `/root/opencode-mcp/openmemory-mcp.sh`).

## Plugin: oh-my-openagent (géén superpowers)
- Enige actieve plugin: **`oh-my-openagent@latest`** (v4.19.4) — de opvolger van `oh-my-opencode-slim`. Geïnstalleerd in `/root/.cache/opencode/packages/oh-my-openagent@latest/`.
- **Superpowers is NIET (meer) geïnstalleerd als actieve plugin.** De cache-map `superpowers@git+https:` is een lege rest (`github.com/` zonder package.json of skills, laatste wijziging 2026-08-09). Er zijn geen superpowers-skills (geen `brainstorming`/`writing-plans`/`systematic-debugging`, geen `/brainstorm`); de oude AGENTS-openclaw.md-secties daarover zijn verouderd.
- Skills laden via OpenCode's native `skill`-tool, **niet** slash-commands.
- De plugin registreert skills bij **process start**. Als skills missen na een plugin-install/update: `systemctl restart opencode-serve-4096 opencode-web-4098`.

## Skills op deze box
- User skills (`/root/.config/opencode/skills/`): `clonedeps`, `codemap`, `deepwork`, `exploratory-testing-coach`, `github-projects`, `golden-path-coach`, `linting`, `mem0-usage`, `mermaid-render`, `playwright-cli`, `reflect`, `risk-storming-facilitator`, `simplify`, `socratische-testontwerp-coach`, `verification-planning`, `worktrees`.
- Plugin shared skills (via oh-my-openagent): `ast-grep`, `coding-agent-sessions`, `data-scientist`, `debugging`, `frontend`, `git-master`, `init-deep`, `lsp-setup`, `programming`, `refactor`, `remove-ai-slops`, `review-work`, `start-work`, `ultimate-browsing`, `ulw-plan`, `ulw-research`, `visual-qa`.
- Cache skills (`/root/.cache/opencode/skills/`): `security-research`, `security-review`.
- OMO tuning: er is **geen** `/root/.config/opencode/oh-my-opencode-slim.json` tuning-bestand op deze box (verwijderd 2026-09-19; de plugin leest de config uit `opencode.jsonc`).

## GitHub Projects (skill `github-projects`)
- `gh project ...` is op deze box stuk (`unknown owner type`, ook met expliciete `--owner`). **Workaround: gebruik `ghp.sh`** — helper script die `gh api graphql` direct aanroept en werkt.
  - Script: `/root/.config/opencode/skills/github-projects/scripts/ghp.sh`
  - Voor comfort: `alias ghp='/root/.config/opencode/skills/github-projects/scripts/ghp.sh'` en `export GH_TOKEN=$(sed -n 's/^GH_TOKEN=//p' /root/backups/.env | head -n1 | sed 's/^"//;s/"$//')` in `~/.bashrc`
  - Gebruik: `ghp projects --owner Steavy`, `ghp items --project 2 --owner Steavy`, `ghp add-draft --project 2 --title "New task"`, `ghp set --project 2 --item <ID> --field Status --value "In Progress"`
- Token = `GH_TOKEN` uit `/root/backups/.env` (user `Steavy`), scopes `project` (project-lezen **en** -schrijven), `repo`, `workflow`, `write:packages`; **geen** `read:org`.
- Org-boards zijn leesbaar via `repositoryOwner(login:)` → `ghp ... --owner <org>`; org-*enumeratie* (`viewer.organizations`, `organization(login:)`) faalt met `INSUFFICIENT_SCOPES`. Geef een org-naam dus altijd expliciet mee i.p.v. te zoeken.
- Draft-items komen **nooit** voor in `ProjectV2.items` (ook niet met `query:"is:draft"`), en API-aangemaakte boards kunnen `totalCount: 0` blijven houden. Verifieer een ticket via `ghp item --item ID` of `Issue.projectItems`.
- Bordnummers lopen door na verwijderen (wegwerp-borden kregen #3..#16), dus nooit op een eerder genoteerd nummer vertrouwen.

## Mem0-geheugen (userId "steven" — bij elke nieuwe sessie eerst checken)
- **Bij elke nieuwe sessie**: roep eerst `mem0_search_memories` aan (`userId: "steven"`) met de vraag/context van de sessie, vóórdat je aan het werk gaat. Zo haal je eerdere beslissingen, configs en afspraken op i.p.v. ze opnieuw te ontdekken of kwijt te raken. Dit is een harde gewoonte, geen optie.
- **`userId` is altijd `"steven"`** — gedeelde sleutel tussen OpenClaw en de OpenCode-wrapper (skill-conventie `mem0-usage`). Met eender welke andere userId (bv. `default`) geeft de API 400 of lege resultaten (geconstateerd 2026-10-02).
- MCP-server: `mem0` (lokaal, `/root/opencode-mcp/openmemory-mcp.sh`, verbindt met lokale Mem0 REST op `localhost:8888`). Tools: `mem0_search_memories`, `mem0_add_memory`, `mem0_get_memories`.
- **Schrijven terug naar Mem0**: alleen bij een GitHub-push (push = add, geen push = geen add), via de `mem0-usage` skill. Content: feitelijk, duratief, ISO-datum (2026-10-02), volledige zinnen, geen opinies. Gebruik imperatief ("User confirmed...").
- **Bekende Mem0-inhoud (opgeslagen 2026-10-02)** — waar nieuwe sessies op kunnen rekenen:
  - Credential-bestanden MOETEN blijven staan op deze box: `GH_TOKEN` in `/root/backups/.env`, `/root/.git-credentials`, `/tmp/git_askpass.sh` — niet verwijderen/roteren.
  - SSH naar worker: alias `worker` → `91.99.134.115` (root); deploy `Live-DISC-analyse-tool` via `git pull` (SSH-URL, identity Steavy) + `docker compose up -d --build` in `/steven-worker/Live-DISC-analyse-tool`; frontend op `http://91.99.134.115:8081`.
  - Live-DISC-analyse-tool deployed state: commit `f9b4a61`, 10-container stack, lokale faster-whisper (small/NL/CPU), nginx op 8081 (8080 = searxng op master), heuristische DISC-fallback tot `OPENCODE_API_KEY` in `.env` staat.

## Hindsight (Agent Memory — MCP server `hindsight` — seit 2026-11-13)
- **MCP endpoint**: `http://127.0.0.1:8888/mcp` (Docker container `hindsight`, poort 8888). Type `remote` in `opencode.json`.
- **Tools beschikbaar** (32): `retain`, `sync_retain`, `recall`, `reflect`, `list_banks`, `create_bank`, `list_mental_models`, `get_mental_model`, `create_mental_model`, `update_mental_model`, `delete_mental_model`, `refresh_mental_model`, `clear_mental_model`, `list_directives`, `create_directive`, `delete_directive`, `list_memories`, `get_memory`, `update_memory`, `invalidate_memory`, `list_documents`, `get_document`, `delete_document`, `list_operations`, `get_operation`, `cancel_operation`, `list_tags`, `get_bank`, `get_bank_stats`, `update_bank`.
- **Standaard bank**: `default` (wordt aangemaakt als niet bestaat). Alle sessies delen deze bank.
- **Project banks**: `gateway-docs` — bevat alle gateway documentatie (README, functionaliteiten-overzicht, Hindsight setup, A2A bridge specs/plans, Mem0 skill, coaching skills, OpenMausBot setup). Toegankelijk via `bank_id="gateway-docs"` of Control Plane: http://techlab5.mooo.com:9999/banks/gateway-docs
- **LLM**: via OmniRoute (`http://172.17.0.1:20128/v1`, model `openrouter/nvidia/nemotron-3-ultra-550b-a55b:free`). Embeddings & reranker lokaal (BGE-small + MiniLM).
- **Database**: Embedded pg0 (PostgreSQL + pgvector) in Docker volume `hindsight-data` — persistent over container herstarts.
- **Control Plane (Web UI)**: `http://localhost:9999` (geen auth).

### Hoe agents (Sisyphus/ultraworker, etc.) Hindsight gebruiken

| Actie | Tool | Voorbeeld gebruik |
|-------|------|-------------------|
| **Feit/beslissing opslaan** | `retain` / `sync_retain` | `retain(content="Beslissing: Gebruik Hindsight voor cross-sessie geheugen", context="architectuur", bank_id="default")` |
| **Geheugen zoeken** | `recall` | `recall(query="Hoe verbindt OpenCode met Hindsight?", max_tokens=2000, bank_id="default")` |
| **AI-reflectie (op basis van geheugen)** | `reflect` | `reflect(query="Wat is de huidige architectuur voor agent memory?", bank_id="default", budget="mid")` |
| **Mental model aanmaken/vernieuwen** | `create_mental_model` / `refresh_mental_model` | `create_mental_model(name="Project Conventies", source_query="Wat zijn de codeerconventies voor dit project?", bank_id="default")` |
| **Bank beheren** | `list_banks`, `create_bank`, `get_bank_stats` | `create_bank(bank_id="project-x", name="Project X geheugen")` |
| **Directives (regels voor reflect/recall)** | `create_directive` | `create_directive(name="Prefer Dutch", content="Antwoorden in het Nederlands tenzij anders gevraagd", bank_id="default")` |
| **Gateway docs raadplegen** | `recall` / `reflect` | `recall(query="Hoe staat dit in de readme of andere documentatie van de gateway?", bank_id="gateway-docs")` |
| **Tooling overzicht (reflect)** | `reflect` | `reflect(query="Wat is de lijst met tooling op de master en worker server aan de hand van de readme van de gateway?", bank_id="gateway-docs")` |

### Werkwijze voor cross-sessie geheugen

1. **Aan sessie start**: `recall(query="Wat is de status van [onderwerp]?", bank_id="default")` — haal relevante context op.
2. **Tijdens werk**: `retain(...)` voor beslissingen, configs, ontdekkingen, fouten, lessen.
3. **Periodiek / na milestones**: `reflect(query="Samenvatting van wat we tot nu toe hebben gedaan en besloten", bank_id="default")` — laat Hindsight een synthese maken.
4. **Mental models** voor herbruikbare kennis: `create_mental_model(name="Deployment Runbook", source_query="Hoe deploy ik deze applicatie?")` — blijft up-to-date via auto-refresh.
5. **Directives** voor consistent gedrag: `create_directive(...)` stuur hoe `reflect`/`recall` werken.

### Verschil met mem0

| Aspect | mem0 | Hindsight |
|--------|------|-----------|
| **Backend** | Cloud API (mem0.ai v3) | Lokaal (Docker, pg0) |
| **Data soevereiniteit** | Cloud | Volledig lokaal |
| **Structuur** | Platte memories | Feiten + entiteiten + graaf + mentale modellen |
| **Reflectie** | Geen (alleen search) | `reflect` tool met LLM-synthese |
| **Mental models** | Nee | Ja (auto-refresh, versioned) |
| **Cross-sessie** | Ja (userId="steven") | Ja (bank_id="default") |
| **Push-trigger** | Alleen bij Git push | Direct via `retain` tool |

> **Belangrijk**: Dit werkt **cross-sessie** — wat je in de ene sessie `retain`t, is in de volgende sessie via `recall`/`reflect` beschikbaar (mits dezelfde `bank_id`, default = `default`).

### Beheer commando's

```bash
cd /opt/hindsight
docker compose up -d --pull always      # starten
docker compose down                      # stoppen
docker compose up -d --force-recreate   # herstarten na config
docker logs -f hindsight --tail 50       # logs
curl -s http://localhost:8888/health     # health check
```

### Valkuilen

- **Bank ID consistentie**: Gebruik altijd `bank_id="default"` (of een vaste naam) voor cross-sessie deelbaarheid.
- **Geen auto-push**: In tegenstelling tot mem0 (push = add), moet je expliciet `retain` aanroepen.
- **LLM beschikbaarheid**: Afhankelijk van OmniRoute service — check `curl http://localhost:8888/v1/default/banks/default/health/llm`.
- **Eerste run**: Embeddings/reranker downloaden van Hugging Face (~2 minuten).

## Git-conventies (push)
- HTTPS-push faalt op deze box (`could not read Username for 'https://github.com'`) — er zijn geen git-credentials geconfigureerd. Push daarom **altijd** met de SSH-URL:
  - Gateway: `git push git@github.com:Cerios-TechLab/gateway.git main` (in `/geert-opencode/gateway/`)
  - Cerios-clinic: `git push git@github.com:Steavy/cerios-clinic.git main` (in `/srv/cerios-clinic/`)
- SSH pusht als GitHub-identiteit **Steavy**. Repo `Cerios-TechLab/gateway` is privaat; anonieme GitHub-API geeft 404.

## Verificatie & kwaliteitspoort (LSP ≠ poort)
- LSP-diagnostics zijn hier volledig uitgeschakeld (zie Config-kenmerken) — de project-CLI is de primaire kwaliteitspoort, nooit LSP.
- Agenten bewijzen werk met de project-CLI, niet met LSP. Per repo: lees de lokale `AGENTS.md`/`DEVELOPMENT.md` voor de exacte commando's.
  - cerios-clinic: `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm test` (details: `/srv/cerios-clinic/AGENTS.md`).
  - Shell-scripts: `bash -n` / `shellcheck` (v0.10.0, geïnstalleerd via dnf/EPEL). Dockerfiles: `docker build --check`.
  - GitHub Actions workflows (`/geert-opencode/gateway/.github/workflows/*.yml`): `actionlint` (v1.7.12, `/usr/local/bin/actionlint`) met ingebouwde shellcheck-integratie voor `run:`-stappen. Draai vóór elke workflow-wijziging `actionlint .github/workflows/*.yml` en laat exit-code 0 zijn.
- Proces-laag blijft de `verification-before-completion`-skill (plus `verification-planning`); CLI-verificatie is de uitvoer daarvan. "Groen" claimen = daadwerkelijke CLI-output tonen.

## Repos on this box
| Path | What |
|---|---|
| `/geert-opencode/gateway/` | Cerios-TechLab/gateway — ops docs: server access, services, opencode/superpowers install guide. |
| `/srv/cerios-clinic/` | Cerios Clinic monorepo (pnpm workspace: `apps/`, `packages/`, `infra/`). Read `DEVELOPMENT.md`, `TEST-AUTOMATION.md`, `MOBILE.md` first. |
| `/home/git/cerios-clinic/`, `/home/git/playwright-sparta/`, `/home/git/GitOps_files/` | Git mirrors / work copies |
| `/tmp/cerios-clinic/`, `/tmp/playwright-sparta-workflow/`, `/tmp/opencode/` | Disposable worktrees/copies — don't rely on them |
| `/opt/openclaw-repo/` | OpenClaw orchestration framework source |
| `/opt/clawshop/` | ClawShop webshop (SUT voor test-automatisering) — niet meer gedeployed (Dokploy-deployment verwijderd 2026-10-09; dir blijft) |
| `/opt/actions-runner*` | GitHub Actions runners |
| `/home/hermes-user/hermes-webui/`, `/home/gp/hermes-poc/`, `/home/test/stock-advisor-auto-trader/` | Other users' projects (touch only when asked) |

## Services (ports per gateway README)
- OpenCode: 4096 (headless API, systemd) · 4098 (web-UI, systemd)
- Planka :3005 · OpenClaw :18790 — via techlab5.mooo.com

## A2A naar OpenClaw (goed doen, elke keer)
- Endpoint: `POST http://127.0.0.1:18800/a2a/jsonrpc`, JSON-RPC `message/send`. Header `Authorization: Bearer opencode-a2a-secret`.
- **Sessie-pinning verplicht**: zet `"contextId": "agent:main:main"` in **`params.message.contextId`** (sibling van `messageId`). NOOIT in `params.contextId` — de SDK negeert dat en genereert per bericht een nieuwe uuid → nieuwe sessie `agent:main:a2a:<hex>`.
- Zonder juiste contextId ontstaat er telkens een losse sessie en gaat de conversatiegeschiedenis verloren; dit is eerder fout gegaan (2026-08-24). Conventie + werkend voorbeeld: gateway README §OpenClaw/A2A Bridge en `docs/a2a-gebruikershandleiding.md` Voorbeeld 2.
- Model-config OpenClaw: primary `openrouter/nvidia/nemotron-3-super-120b-a12b:free`; bij `FailoverError: Unknown model` helpt `docker restart openclaw-sandbox-openclaw`.

## opencode-fix workflow (automatic CI fixer)
- Folder: `/root/opencode-fix` (een eigen git-repo, sync naar `/root/backups/opencode-fix.git` en `github.com/Steavy/opencode-fix`).
- Briefing voor de fix-agent: `/root/opencode-fix/AGENTS.md` — kernregel "echt groen, niet lijkt groen", verificatie-discipline, valkuilen op deze box.
- Folder README: `/root/opencode-fix/README.md` — folder-structuur, hoe een fix wordt getriggerd, recovery-stappen.
- Hoofdscripts: `opencode-fix-workflow.sh` (entry point, ontvangt base64-args), `launcher-fix.sh` (voert `opencode run --auto` uit), `bin/sync-backup.sh`, `bin/cleanup-old-files.sh`, `actions-storage-cleanup.sh`.
- systemd-timers: `opencode-fix-backup.timer` (dagelijks, sync), `opencode-fix-cleanup.timer` (wekelijks, retentie).
- Per-run artifacts: `state/<run-id>.json` (klein, gestructureerd), `prompts/<run-id>.md` (gegenereerde prompt), `reports/<run-id>.md` (eindrapport), `logs/notify-<run-id>.log` (run-log).