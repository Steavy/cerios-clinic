![cerios clinic](./cerios-clinic.png)

# Clinic Monorepo

This is a full-stack clinic management application. This guide gets you up and running with **Docker only** — no Node.js or other tools required.

> **Developers**: see [DEVELOPMENT.md](DEVELOPMENT.md) for the local development setup with hot-reload.

---

## What Is This Project?

| Service              | URL                       | Description                                                                         |
| -------------------- | ------------------------- | ----------------------------------------------------------------------------------- |
| **Patient Portal**   | http://localhost:5173     | React app — patients view/book appointments                                         |
| **Doctor Portal**    | http://localhost:5174     | React app — doctors manage their schedule                                           |
| **Assistant Portal** | http://localhost:5175     | React app — reception staff manage appointments                                     |
| **Admin Portal**     | http://localhost:5176     | React app — system administration                                                   |
| **Patient API**      | http://localhost:3001/api | NestJS backend for the Patient Portal ([Swagger](http://localhost:3001/api/docs))   |
| **Doctor API**       | http://localhost:3002/api | NestJS backend for the Doctor Portal ([Swagger](http://localhost:3002/api/docs))    |
| **Assistant API**    | http://localhost:3003/api | NestJS backend for the Assistant Portal ([Swagger](http://localhost:3003/api/docs)) |
| **Admin API**        | http://localhost:3004/api | NestJS backend for the Admin Portal ([Swagger](http://localhost:3004/api/docs))     |
| **Keycloak**         | http://localhost:8180     | Authentication & user management                                                    |
| **PostgreSQL**       | localhost:5432            | Database                                                                            |
| **Mailpit**          | http://localhost:8025     | Local email catcher (dev only)                                                      |

---

## Prerequisites

You only need **Docker Desktop** installed:

- **Docker Desktop** — https://www.docker.com/products/docker-desktop/
  - After installation, **restart your computer**.
  - Open Docker Desktop and wait until it shows **"Docker Desktop is running"**.
  - Windows Home users: Docker Desktop requires WSL 2. The installer will prompt you to enable it.

Verify it is working:

```bash
docker --version
docker compose version
```

---

## Quick Start (pre-built images — no clone needed)

**PowerShell (Windows):**

```powershell
New-Item -ItemType Directory -Force -Path C:\cerios-clinic | Set-Location
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/CeriosTesting/cerios-clinic/main/infra/docker-compose.prebuilt.yml" -OutFile "docker-compose.yml"
docker compose --profile apps up -d --pull always
```

**Bash (macOS / Linux):**

```bash
mkdir -p ~/cerios-clinic && cd ~/cerios-clinic
curl -o docker-compose.yml https://raw.githubusercontent.com/CeriosTesting/cerios-clinic/main/infra/docker-compose.prebuilt.yml
docker compose --profile apps up -d --pull always
```

### Updating an existing installation (faster)

If you already ran setup before, use these commands instead of repeating first-time setup.

**PowerShell (Windows):**

```powershell
Set-Location C:\cerios-clinic
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/CeriosTesting/cerios-clinic/main/infra/docker-compose.prebuilt.yml" -OutFile "docker-compose.yml"
docker compose --profile apps up -d --pull always --remove-orphans
```

**Bash (macOS / Linux):**

```bash
cd ~/cerios-clinic
curl -o docker-compose.yml https://raw.githubusercontent.com/CeriosTesting/cerios-clinic/main/infra/docker-compose.prebuilt.yml
docker compose --profile apps up -d --pull always --remove-orphans
```

The first run downloads all images (may take a few minutes). Subsequent runs start in about 10 seconds.

> ⚠️ **This does NOT re-import the Keycloak realm.** `--pull always` updates the application images, but Keycloak only imports `clinic-realm.json` when the realm does **not yet exist** in Postgres. Because Postgres data persists in a Docker volume, any realm changes in a new release (new clients, roles, flags like `verifyEmail`, SMTP settings, etc.) are **not** applied by a plain update.
>
> If release notes mention Keycloak/realm changes — or you hit authentication or registration issues after updating — do a full reset instead:
>
> **PowerShell (Windows):**
>
> ```powershell
> Set-Location C:\cerios-clinic
> docker compose --profile apps down -v
> docker compose --profile apps up -d --pull always
> ```
>
> **Bash (macOS / Linux):**
>
> ```bash
> cd ~/cerios-clinic
> docker compose --profile apps down -v
> docker compose --profile apps up -d --pull always
> ```
>
> `down -v` deletes the Postgres volume, so any users/appointments you created ad-hoc are lost — the seeded test accounts are recreated automatically by `db-init`.

### What happens automatically

1. PostgreSQL, Keycloak, and Mailpit start first.
2. Once they are healthy, the **db-init** container runs database migrations and seeds test data (then exits).
3. The four API servers start after db-init completes.
4. The four frontend portals start after the APIs are healthy.

### Check the status

```bash
docker ps
```

All containers should show `Up` or `healthy`. The `clinic-db-init` container will show `Exited (0)` — that is normal (it runs once and stops).

### Open the application

- **Patient Portal** → http://localhost:5173
- **Doctor Portal** → http://localhost:5174
- **Assistant Portal** → http://localhost:5175

---

## Test Accounts

### Doctors — log in at http://localhost:5174

| Email                      | Name             | Specialty        |
| -------------------------- | ---------------- | ---------------- |
| `dr.smith@clinic.local`    | James Smith      | General Practice |
| `dr.johnson@clinic.local`  | Sarah Johnson    | Cardiology       |
| `dr.williams@clinic.local` | Michael Williams | Neurology        |

> Staff accounts use password `Clinic1234!` (from `SEED_STAFF_PASSWORD`).

### Assistants — log in at http://localhost:5175

| Email                           | Name         | Department      |
| ------------------------------- | ------------ | --------------- |
| `assistant.brown@clinic.local`  | Emily Brown  | Reception       |
| `assistant.davis@clinic.local`  | Robert Davis | Cardiology Wing |
| `assistant.miller@clinic.local` | Lisa Miller  | Neurology Wing  |

### Admin — log in at http://localhost:5176

| Email                | Name         | Role    |
| -------------------- | ------------ | ------- |
| `admin@clinic.local` | System Admin | `admin` |

> The admin account uses password `Admin1234!` (from `KEYCLOAK_REALM_ADMIN_PASSWORD`).

### Patients — log in at http://localhost:5173

| Email                          | Name           |
| ------------------------------ | -------------- |
| `patient.wilson@example.com`   | Alice Wilson   |
| `patient.moore@example.com`    | Bob Moore      |
| `patient.taylor@example.com`   | Carol Taylor   |
| `patient.anderson@example.com` | David Anderson |
| `patient.thomas@example.com`   | Eva Thomas     |

> Patient accounts use password `Patient1234!` (from `SEED_PATIENT_PASSWORD`).

---

## Swagger / API Documentation

| API           | Swagger URL                    |
| ------------- | ------------------------------ |
| Patient API   | http://localhost:3001/api/docs |
| Doctor API    | http://localhost:3002/api/docs |
| Assistant API | http://localhost:3003/api/docs |
| Admin API     | http://localhost:3004/api/docs |

---

## Keycloak Admin Console

1. Open http://localhost:8180
2. Click **Administration Console**
3. Log in with username `admin` / password `admin_secret`
4. Select the **clinic** realm from the dropdown in the top-left corner.

---

## Mailpit (Email Catcher)

All emails sent by the application are captured locally by Mailpit. No real emails are sent.

Open http://localhost:8025 to view the inbox.

---

## Docker Commands

| Command                                                              | Description                                     |
| -------------------------------------------------------------------- | ----------------------------------------------- |
| `docker compose --profile apps up -d --pull always`                  | Pull latest images and start everything         |
| `docker compose --profile apps up -d --pull always --remove-orphans` | Update existing installation (recommended)      |
| `docker compose --profile apps up -d`                                | Start everything (no image pull)                |
| `docker compose --profile apps down`                                 | Stop and remove all containers                  |
| `docker compose --profile apps down -v`                              | Stop, remove containers **and delete all data** |
| `docker compose --profile apps logs -f`                              | Stream logs from all services                   |
| `docker logs clinic-api-patient -f`                                  | Stream logs from a specific container           |

> These commands assume you renamed the file to `docker-compose.yml`. If you kept the original name, add `-f docker-compose.prebuilt.yml` to each command.

### Resetting everything

To wipe all data (database, Keycloak users) and start fresh — also required when a new release changes the Keycloak realm, since Keycloak only imports `clinic-realm.json` when the realm does not yet exist in the database:

```bash
docker compose --profile apps down -v
docker compose --profile apps up -d --pull always
```

---

## Kubernetes Deployment (Demo)

The project also runs as a **live public demo** on a Kubernetes cluster:

**Demo:** http://demo-sparta.mooo.com

The demo stack runs entirely in the `clinic` namespace and is declared as plain Kubernetes manifests in [`infra/k8s/`](infra/k8s/), applied by [`infra/deploy-demo.sh`](infra/deploy-demo.sh).

### Kubernetes manifests

| Manifest            | What it deploys                                                                  |
| ------------------- | -------------------------------------------------------------------------------- |
| `namespace.yaml`    | The `clinic` namespace                                                            |
| `postgres.yaml`     | PostgreSQL (StatefulSet + PersistentVolumeClaim)                                  |
| `db-init.yaml`      | One-shot `db-init` Job: runs migrations and seeds test data                       |
| `keycloak.yaml`     | Keycloak (authentication / user management)                                       |
| `keycloak-fix.yaml` | Idempotent Job that sets `sslRequired=none` so HTTP works on the demo             |
| `mailpit.yaml`      | Mailpit (email catcher)                                                           |
| `apis.yaml`         | The four NestJS API Deployments (2 replicas each)                                 |
| `portals.yaml`      | The four React portal Deployments (2 replicas each)                               |
| `minikube-start.sh` | Creates/starts the local cluster the demo runs on                                |

### Public URLs

| Service              | URL                                                            |
| -------------------- | -------------------------------------------------------------- |
| Patient Portal       | http://demo-sparta.mooo.com:5173                                |
| Doctor Portal        | http://demo-sparta.mooo.com:5174                                |
| Assistant Portal     | http://demo-sparta.mooo.com:5175                                |
| Admin Portal         | http://demo-sparta.mooo.com:5176                                |
| Patient API (health) | http://demo-sparta.mooo.com:3001/api/health                     |
| Keycloak             | http://demo-sparta.mooo.com:8180                                |
| Mailpit              | http://demo-sparta.mooo.com:8025                                |

### Deployment

The **Deploy Demo** workflow in [playwright-sparta](https://github.com/Steavy/playwright-sparta) deploys the demo automatically after every successful smoke-test run on `main`, or manually via **Actions → Deploy Demo → Run workflow** (with an optional `CLINIC_BRANCH` input to deploy a branch other than `main`). It runs `deploy-demo.sh`, which:

1. Takes a deploy lock (only one deploy at a time) and backs up the database.
2. Ensures the cluster exists, recreating it if needed.
3. Installs Chaos Mesh (see below) if its CRDs are missing.
4. Applies the manifests with **published images** from `ghcr.io/steavy/cerios-clinic` (portals: `demo` tag, everything else: `latest`).
5. Rolls out updates with `maxUnavailable: 0` (zero downtime) and verifies all public endpoints.

Rollback: `docker compose -f docker-compose.demo.yml up -d --pull always` redeploys the Docker Compose demo.

### Chaos Mesh smoke test

After a deploy, the workflow runs a **chaos smoke test** ([`infra/scripts/smoke-chaos-test.sh`](infra/scripts/smoke-chaos-test.sh)) that verifies the stack survives pod failures:

- Chaos Mesh is installed via Helm (chart `2.8.3`, slim profile: 1 controller replica, dashboard and DNS server disabled).
- Over a 120-second window one pod is killed every 15 seconds across the 10 app Deployments (2 replicas each).
- A watcher polls every public endpoint and asserts **zero downtime**; any outage fails the workflow.

---

## Troubleshooting

### "Cannot connect to Docker daemon"

Docker Desktop is not running. Open Docker Desktop from the Start Menu and wait for it to fully start before retrying.

### Keycloak never becomes healthy / stays "starting"

- Run `docker logs clinic-keycloak --tail 50` to see what is wrong.
- The most common cause is a timing issue. Run the `down` command and then `up` again and wait 2 minutes.

### A container keeps restarting

Check its logs:

```bash
docker logs <container-name> --tail 50
```

### Port already in use

Another application is using one of the required ports (3001–3004, 5173–5176, 5432, 8025, 8180). Close that application or stop the service using the port.

### Rebuilding after code changes

If you are using the pre-built images, pull the latest versions:

```bash
docker compose --profile apps down
docker compose --profile apps up -d --pull always
```

The `--pull always` flag ensures Docker downloads the newest images.

---

## Project Structure

```
clinic-monorepo/
├── apps/
│   ├── api-patient/      # NestJS — Patient API  (port 3001)
│   ├── api-doctor/       # NestJS — Doctor API   (port 3002)
│   ├── api-assistant/    # NestJS — Assistant API (port 3003)
│   ├── patient-portal/   # React/Vite — Patient UI  (port 5173)
│   ├── doctor-portal/    # React/Vite — Doctor UI   (port 5174)
│   ├── assistant-portal/ # React/Vite — Assistant UI (port 5175)
│   └── patient-mobile/   # React Native — Android patient app
├── packages/
│   ├── database/         # Prisma schema, migrations, seed script
│   ├── api-common/       # Shared NestJS utilities (auth, mail, etc.)
│   ├── portal-common/    # Shared React components, utils, API layer
│   │   └── src/
│   │       └── __tests__/ # Unit tests (Vitest)
│   │           ├── api.test.ts
│   │           ├── config.test.ts
│   │           ├── date-only.test.ts
│   │           ├── keycloak.test.ts
│   │           ├── portal-footer.test.tsx
│   │           └── role-mismatch-screen.test.tsx
│   └── shared-types/     # TypeScript types shared across apps
│       └── src/
│           └── __tests__/
│               └── transitions.test.ts
├── infra/
│   ├── docker-compose.yml
│   ├── docker-compose.prebuilt.yml
│   ├── docker-compose.demo.yml
│   ├── deploy-demo.sh        # Kubernetes demo deploy
│   ├── docker/               # Dockerfiles for containerised deployment
│   ├── k8s/                  # Kubernetes manifests for the demo stack
│   │   ├── namespace.yaml
│   │   ├── postgres.yaml
│   │   ├── db-init.yaml
│   │   ├── keycloak.yaml
│   │   ├── keycloak-fix.yaml
│   │   ├── mailpit.yaml
│   │   ├── apis.yaml
│   │   ├── portals.yaml
│   │   └── minikube-start.sh
│   ├── keycloak/
│   │   └── clinic-realm.json
│   ├── postgres/
│   │   └── init.sql
│   └── scripts/
│       └── smoke-chaos-test.sh  # Chaos Mesh zero-downtime check
├── .github/
│   └── workflows/
│       ├── unit-ci.yml       # CI workflow for unit tests
│       ├── stryker-pages.yml # Stryker mutation tests + publish to report/stryker
│       ├── allure-pages.yml  # Combined Allure + Stryker deploy to GitHub Pages
│       └── mobile-build.yml  # Build & publish patient-mobile APK/image
├── .env                  # Environment variables
├── .env.example
├── vitest.config.ts      # Vitest configuration
├── vitest.setup.ts       # Vitest setup (jest-dom matchers)
├── stryker.config.mjs    # Stryker mutation testing config
└── package.json          # Root scripts
```

---

## Testing

### Unit Tests (Vitest)

| Script            | Description                  |
| ----------------- | ---------------------------- |
| `pnpm test`       | Run all unit tests once      |
| `pnpm test:watch` | Run unit tests in watch mode |

### Mutation Testing (Stryker)

Mutation testing checks how well your tests detect code changes by automatically introducing small faults ("mutants") and seeing if any test fails.

| Script                   | Description                                                       |
| ------------------------ | ----------------------------------------------------------------- |
| `pnpm test:stryker`      | Run mutation testing and save the HTML report                     |
| `pnpm test:stryker:open` | Run mutation testing and open the report directly in your browser |

The HTML report is saved to `reports/mutation/mutation.html`. You can also open it manually:

```bash
# macOS
open reports/mutation/mutation.html
# Linux
xdg-open reports/mutation/mutation.html
# Windows
start reports/mutation/mutation.html
```

### Mutation Report in CI (GitHub Pages)

The **Stryker Mutation Report** workflow (`.github/workflows/stryker-pages.yml`) runs the same `pnpm test:stryker` command in CI and publishes the HTML report to the `report/stryker` branch of this repository. A combined GitHub Pages deploy then serves it at:

**Public report:** https://steavy.github.io/cerios-clinic/strykerreport/

The workflow is triggered by:

| Trigger                                      | Description                                                         |
| -------------------------------------------- | ------------------------------------------------------------------- |
| `workflow_dispatch`                          | Manual — **Actions → Stryker Mutation Report → Run workflow**       |
| `repository_dispatch` (`stryker-report`)     | Programmatic (e.g. from another workflow or a webhook)              |
| `schedule` (`0 2 * * 0`)                     | Weekly, every Sunday at 02:00 UTC                                   |

The `mutation` job runs the mutation tests (mutating `packages/portal-common` and `packages/shared-types`), the `publish` job force-pushes `reports/mutation/mutation.html` as `index.html` to `report/stryker` and then triggers the GitHub Pages deploy.

---

## Patient Mobile App (Android)

For building and running the React Native Android app, see **[MOBILE.md](MOBILE.md)**.

---

## Developer Guide

For local development with hot-reload, IDE support, mobile app testing, API debugging, and more, see **[DEVELOPMENT.md](DEVELOPMENT.md)**.

---

## Test Automation

For obtaining API tokens and testing protected endpoints from scripts, Postman, or curl, see **[TEST-AUTOMATION.md](TEST-AUTOMATION.md)**.

---

## Allure Test Report

Playwright smoke tests for this application run in [playwright-sparta](https://github.com/Steavy/playwright-sparta). After every smoke run — success **or** failure — the Allure report is published automatically to GitHub Pages. A nightly **Full Regression Suite** (all web Playwright projects) publishes its report through the same chain, so the History tab and Trend chart keep growing day after day. **Mobile App Tests** runs publish their own report under `/mobile/` (web and mobile reports live side by side, so one never overwrites the other):

1. **Publish** — the `Publish Allure Report` workflow in `playwright-sparta` downloads the report artifact and force-pushes it as a single commit to the `report/allure` branch (web smoke/regression) or the `report/allure-mobile` branch (mobile app tests) of this repository (using a fine-grained PAT with Contents: read & write, stored as the `CLINIC_REPORT_TOKEN` secret in `playwright-sparta`).
2. **Deploy** — the `Deploy Reports to Pages` workflow (`allure-pages.yml`) in this repository listens for a `repository_dispatch` event (`allure-report`) and deploys a combined site to GitHub Pages: the `report/allure` branch at the site root, the `report/stryker` branch (the Stryker mutation report, see above) under `/strykerreport/`, and the `report/allure-mobile` branch under `/mobile/`. All reports live in a single GitHub Pages deployment.

Each run carries the previous report's `history/` forward, so the published report shows the **History** tab and a growing **Trend** chart (data for the last 20 runs).

**Public reports:**
- Allure web (test results): https://steavy.github.io/cerios-clinic/
- Allure mobile (patient app tests): https://steavy.github.io/cerios-clinic/mobile/
- Stryker (mutation testing): https://steavy.github.io/cerios-clinic/strykerreport/

> Manually re-deploy the current reports any time via **Actions → Deploy Reports to Pages → Run workflow**. GitHub Pages must be enabled for this repository with source **GitHub Actions**.
