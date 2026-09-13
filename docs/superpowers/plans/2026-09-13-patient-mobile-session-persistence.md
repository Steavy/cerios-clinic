# Patient Mobile Session Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the patient-mobile demo app keep the user logged in across app restarts for up to 6 months by requesting an offline refresh token (`offline_access`) from Keycloak and granting that client a long-lived offline session.

**Architecture:** Two minimal, isolated changes: (1) the app asks for the `offline_access` scope at the token endpoint in `apps/patient-mobile/src/auth/keycloak.ts`; (2) the Keycloak realm `infra/keycloak/clinic-realm.json` defines the `offline_access` client scope and configures `patient-mobile-client` with `optionalClientScopes: ["offline_access"]` plus long per-client offline-session lifetimes (6 months) and a 5-minute access token. No web-portal or realm-wide lifetime changes. Existing `AuthContext` restore/refresh/`EncryptedStorage` logic is reused unchanged; the demo image is deployed to the demo server via the normal merge-to-main → Deploy Demo (full reset) flow before manual APK verification.

**Tech Stack:** React Native (TypeScript, `react-native-encrypted-storage`), Keycloak realm import JSON, pnpm, oxlint/oxfmt, `tsc --noEmit`.

## Global Constraints

- Only `patient-mobile-client` changes; web portals (`patient/admin/doctor/assistant-portal-client`) stay untouched.
- No realm-wide token/session-lifetime presets (`ssoSessionIdleTimeout` etc. must NOT be added).
- Offline-session lifetimes: `client.offline.session.idle.timeout` and `client.offline.session.max.lifespan` both `"15552000"` (seconds = 180 days); `access.token.lifespan` `"300"` (5 min).
- `SCOPES` becomes exactly `"openid profile email roles offline_access"`.
- JSON file uses tab indentation (vertical-tab style) — keep tabs, not spaces.
- Verification gates: `pnpm --filter patient-mobile typecheck` (repo AGENTS.md), `pnpm run lint`, JSON validity via `python3 -m json.tool`, and structural grep assertions. There is NO unit-test harness for `apps/patient-mobile` (vitest covers only `packages/*`), so "tests" here are the CLI gates above; the behavioral verification is the manual APK test from the design doc.
- Commits are small and per-task.
- No `v1.0.0` git tag is created in this plan (tag happens later, after acceptance).

---

### Task 1: Request `offline_access` scope in the mobile app

**Files:**
- Modify: `apps/patient-mobile/src/auth/keycloak.ts:12` (the `SCOPES` constant)

**Interfaces:**
- Consumes: nothing (the constant is passed by existing `signInWithPassword` at line 89 as `scope`)
- Produces: token request will now include `scope=openid profile email roles offline_access`

- [ ] **Step 1: Change the scope constant**

Replace line 12:

```ts
const SCOPES = "openid profile email roles";
```

with:

```ts
const SCOPES = "openid profile email roles offline_access";
```

- [ ] **Step 2: Verify the change is in place**

Run: `grep -n "const SCOPES" apps/patient-mobile/src/auth/keycloak.ts`
Expected: `12:const SCOPES = "openid profile email roles offline_access";`

- [ ] **Step 3: Run typecheck**

Run: `pnpm --filter patient-mobile typecheck`
Expected: exit 0, no type errors (the constant is only used as a request-body string).

- [ ] **Step 4: Run lint (repo-wide type-aware lint)**

Run: `pnpm run lint`
Expected: exit 0, no findings.

- [ ] **Step 5: Commit**

```bash
git add apps/patient-mobile/src/auth/keycloak.ts
git commit -m "feat(mobile): request offline_access scope for persistent sessions"
```

---

### Task 2: Add the `offline_access` client scope to the realm

**Files:**
- Modify: `infra/keycloak/clinic-realm.json` (add top-level `clientScopes` block)

**Interfaces:**
- Produces: realm-level `offline_access` client scope that later tasks attach to `patient-mobile-client` via `optionalClientScopes`.

- [ ] **Step 1: Add the top-level `clientScopes` block**

Insert a `"clientScopes": [...]` array at the top level of the realm JSON, between the `"roles"` block (ending line 30) and the `"clients"` block (starting line 31). The realm currently has NO `clientScopes` key, so this is a new top-level property:

```json
	"clientScopes": [
		{
			"name": "offline_access",
			"description": "OpenID Connect built-in scope: offline access",
			"protocol": "openid-connect",
			"attributes": {
				"consent.screen.text": "${offlineAccessScopeConsentText}",
				"display.on.consent.screen": "true",
				"include.in.token.scope": "true"
			},
			"protocolMappers": [
				{
					"name": "offline access",
					"protocol": "openid-connect",
					"protocolMapper": "oidc-offline-access-mapper",
					"consentRequired": false,
					"config": {
						"access.token.claim": "true",
						"id.token.claim": "false",
						"userinfo.token.claim": "false",
						"introspection.token.claim": "true",
						"include.in.token.scope": "true"
					}
				}
			]
		}
	],
```

Final top-level key order after this step: `realm, enabled, sslRequired, displayName, registrationAllowed, registrationEmailAsUsername, loginWithEmailAllowed, duplicateEmailsAllowed, resetPasswordAllowed, verifyEmail, editUsernameAllowed, bruteForceProtected, smtpServer, roles, clientScopes, clients, users`. Use tab indentation to match the file.

- [ ] **Step 2: Verify JSON validity**

Run: `python3 -m json.tool infra/keycloak/clinic-realm.json > /dev/null && echo VALID`
Expected: prints `VALID`.

- [ ] **Step 3: Verify the client-scope shape**

Run: `python3 -c "import json;r=json.load(open('infra/keycloak/clinic-realm.json'));s=next(x for x in r['clientScopes'] if x['name']=='offline_access');assert s['protocol']=='openid-connect';assert s['protocolMappers'][0]['protocolMapper']=='oidc-offline-access-mapper' and s['protocolMappers'][0]['config']['id.token.claim']=='false';print('scope-ok')"`
Expected: prints `scope-ok`.

- [ ] **Step 4: Run format check (oxfmt on the repo)**

Run: `pnpm run format:check`
Expected: exit 0 (JSON is not reformatted by oxfmt; this guards that the edit did not disturb TS/JS files).

- [ ] **Step 5: Commit**

```bash
git add infra/keycloak/clinic-realm.json
git commit -m "feat(keycloak): add offline_access client scope to clinic realm"
```

---

### Task 3: Grant `offline_access` + long offline session to `patient-mobile-client`

**Files:**
- Modify: `infra/keycloak/clinic-realm.json` — the `patient-mobile-client` block (starts at the line containing `"clientId": "patient-mobile-client",`): its `attributes` object (containing `"pkce.code.challenge.method": "S256"`) and the `defaultClientScopes` line that follows `webOrigins`

**Interfaces:**
- Consumes: the `offline_access` scope name from Task 2.
- Produces: `patient-mobile-client` accepts the `offline_access` scope (so the token request from Task 1 yields an offline refresh token) with a 6-month offline session and 5-minute access tokens.

- [ ] **Step 1: Extend the client `attributes`**

Within the `patient-mobile-client` block, extend the `attributes` object (currently only `"pkce.code.challenge.method": "S256"`, line 178) to:

```json
			"attributes": {
				"pkce.code.challenge.method": "S256",
				"client.offline.session.idle.timeout": "15552000",
				"client.offline.session.max.lifespan": "15552000",
				"access.token.lifespan": "300"
			},
```

- [ ] **Step 2: Add `optionalClientScopes` to the client**

Immediately after the `defaultClientScopes` line of `patient-mobile-client` (line 180), add:

```json
			"optionalClientScopes": ["offline_access"],
```

Verified target state of the client block header (lines 168-181):

```json
		{
			"clientId": "patient-mobile-client",
			"name": "Patient Mobile App",
			"enabled": true,
			"publicClient": true,
			"standardFlowEnabled": true,
			"directAccessGrantsEnabled": true,
			"redirectUris": ["com.cerios.patient://oauth2redirect"],
			"webOrigins": [],
			"attributes": {
				"pkce.code.challenge.method": "S256",
				"client.offline.session.idle.timeout": "15552000",
				"client.offline.session.max.lifespan": "15552000",
				"access.token.lifespan": "300"
			},
			"defaultClientScopes": ["basic", "openid", "profile", "email", "roles"],
			"optionalClientScopes": ["offline_access"],
```

- [ ] **Step 3: Verify JSON validity**

Run: `python3 -m json.tool infra/keycloak/clinic-realm.json > /dev/null && echo VALID`
Expected: prints `VALID`.

- [ ] **Step 4: Verify client config shape**

Run: `python3 -c "import json;r=json.load(open('infra/keycloak/clinic-realm.json'));c=next(x for x in r['clients'] if x['clientId']=='patient-mobile-client');assert c['optionalClientScopes']==['offline_access'];assert c['attributes']['client.offline.session.idle.timeout']=='15552000';assert c['attributes']['client.offline.session.max.lifespan']=='15552000';assert c['attributes']['access.token.lifespan']=='300';assert c['defaultClientScopes']==['basic','openid','profile','email','roles'];print('client-ok')"`
Expected: prints `client-ok`.

- [ ] **Step 5: Run format check and lint**

Run: `pnpm run format:check && pnpm run lint`
Expected: both exit 0.

- [ ] **Step 6: Commit**

```bash
git add infra/keycloak/clinic-realm.json
git commit -m "feat(keycloak): grant patient-mobile-client offline_access and 6-month offline session"
```

---

### Task 4: Integration gate + push

**Files:**
- (no code changes — verification only)

- [ ] **Step 1: Run the full repo quality gate**

Run (in `/srv/cerios-clinic`):
```bash
pnpm run typecheck && pnpm run lint && pnpm run format:check && pnpm test
```
Expected: all green (exit 0). Note: `pnpm test` covers only `packages/*`; the mobile app has no vitest scope and is covered by `typecheck` above.

- [ ] **Step 2: Run the full realm assertions script**

Run:
```bash
python3 -m json.tool infra/keycloak/clinic-realm.json > /dev/null &&
grep -n "offline_access" docs/superpowers/specs/2026-09-13-patient-mobile-session-persistence-design.md >/dev/null &&
echo "realm-spec-aligned"
```
Expected: prints `realm-spec-aligned`.

- [ ] **Step 3: Show the diff summary**

Run: `git --no-pager diff main...HEAD --stat`
Expected: lists `apps/patient-mobile/src/auth/keycloak.ts` and `infra/keycloak/clinic-realm.json` as modified, and no other files.

- [ ] **Step 4: Push the branch**

```bash
git push git@github.com:Steavy/cerios-clinic.git feature/session-persistence
```
(SSH push; HTTPS fails on this box. From `/srv/cerios-clinic`.)

---

### Post-Plan (manual, outside this implementation plan's code steps)

These are the design-doc §3 steps, executed manually/ops-side after the branch is merged and accepted:

1. Merge `feature/session-persistence` into `main` (content reachable for the demo build). Do NOT create the `v1.0.0` tag yet.
2. `docker-publish.yml` (on main push) rebuilds `keycloak:latest` including the new realm; the Deploy Demo workflow (playwright-sparta) full-resets the demo (drops the `keycloak` schema → fresh `--import-realm`).
3. Build the demo APK via `workflow_dispatch` on `mobile-build-publish.yml` (branch- or main-build; code-identical after merge).
4. Manual APK test per design-doc §4 (login → close app → wait ≥ ~7 min → reopen still logged in; profile logout ends session on restart).
5. After acceptance: tag `v1.0.0` and release.