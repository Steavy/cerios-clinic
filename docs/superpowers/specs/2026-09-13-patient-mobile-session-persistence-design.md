# Design — Persistente sessie patient-mobile (offline_access)

Datum: 2026-09-13
Branch: `feature/session-persistence`
Scope: Keycloak-realm `clinic-realm.json` + patient-mobile app + handmatige APK-verificatie (v1.0.0-release-flow buiten scope van dit design, wordt later getagd na acceptatie).

## Doel

Na initieel inloggen in de patient-mobile demo-app (zonder uitloggen via het Profile-menu) blijft de gebruiker ingelogd wanneer de app wordt gesloten en weer gestart — tot de gebruiker zelf uitlogt.

## Achtergrond / oorzaak

- De app heeft reeds sessie-restore-logica: `AuthContext.tsx` leest tokens uit `EncryptedStorage` en handelt (pro)actieve refresh af; `signOut()` beëindigt de sessie server-side via keycloak `logout`/`revoke`.
- De Keycloak-realm `infra/keycloak/clinic-realm.json` is minimaal: **geen** `clientScopes`, **geen** `offline_access`, **geen** token/lifetime-instellingen.
- Daardoor gelden Keycloak-defaults: refresh token max levensduur 30 min, SSO session idle 30 min.
- Gevolg: sluit de app en start hem >30 min later opnieuw → refresh token verlopen, `AuthContext` restore faalt → login-scherm.

## Uitgangspunten / beslissingen

1. **Aanpak A gekozen**: `offline_access`-scope + lange per-client offline-sessie-lifetimes.
2. **Sessieduur**: niet verouderen tot uitloggen, praktisch begrensd op **6 maanden** — Keycloak kent geen oneindige offline-sessie (`client.offline.session.idle.timeout` en `client.offline.session.max.lifespan` beide 15552000 s = 180 dagen).
3. Per-client config op `patient-mobile-client` → **webportals blijven onaangetast**.
4. **Full reset demo** om de realm opnieuw te importeren.
5. **Verificatie handmatig op APK** (geen geautomatiseerde E2E in deze feature).

## Wijzigingen

### 1. App-code — `apps/patient-mobile/src/auth/keycloak.ts`

- `SCOPES` uitbreiden van `"openid profile email roles"` naar `"openid profile email roles offline_access"`.
- De app vraagt hiermee een offline refresh token aan bij Keycloak.
- Geen andere app-code wijzigingen: bestaande `AuthContext`-restore/refresh en `EncryptedStorage` blijven ongewijzigd.

### 2. Keycloak realm — `infra/keycloak/clinic-realm.json`

- **Top-level `clientScopes`** toevoegen:
  - `offline_access` (protocol `openid-connect`) met de standaard `oidc-offline-access-mapper` en `include.in.token.scope: true` (`access.token.claim: true`, `id.token.claim: false`, `userinfo.token.claim: false`).
- **Client `patient-mobile-client`** (huidig: `defaultClientScopes`: `basic, openid, profile, email, roles`; attributes: `pkce.code.challenge.method=S256`):
  - `optionalClientScopes`: `["offline_access"]` **toevoegen** — client heeft er nu geen; de scope wordt alleen actief wanneer de app hem aanvraagt. `defaultClientScopes` ongewijzigd.
  - `attributes` toevoegen naast de bestaande `pkce.code.challenge.method`:
    - `"client.offline.session.idle.timeout": "15552000"` (6 maand)
    - `"client.offline.session.max.lifespan": "15552000"` (6 maand)
    - `"access.token.lifespan": "300"` (5 min; korte access token, refresh gebeurt automatisch via bestaande logica)
- Realm-brede token/session-lifetimes: **niet** wijzigen.

### 3. Demo-implementatie

- Na merge op main + full reset van de demo (Keycloak-db weg → realm importeren). Bestaande testdata gaat verloren (neutraal: db-init seed herstelt testaccounts).
- De demo-deploy (Deploy Demo workflow in playwright-sparta) past de nieuwe realm automatisch toe bij een clean reset.

### 4. Verificatie

Handmatige APK-test (demo-APK uit `mobile-build-publish.yml`):

1. Installeer de demo-APK.
2. Log in als patient (testaccount).
3. Sluit de app.
4. Wacht langer dan de oude 30-min-grens (of versnelde controle: omdat `access.token.lifespan` 5 min is, is wachten ≥ ~7 min voldoende om een refresh-cyclus te bewijzen).
5. Start de app → gebruiker is nog ingelogd (geen login-scherm).
6. Controle dat uitloggen via Profile de sessie wél beëindigt en een herstart terugkeert naar het login-scherm.

## Acceptatiecriteria

- Na inloggen + app sluiten + herstart (>30 min later) is de gebruiker nog ingelogd zonder opnieuw in te loggen.
- Uitloggen via Profile-menu beëindigt de sessie (herstart → login-scherm).
- Webportals gedragen zich ongewijzigd (geen realm-brede lifetime-wijziging).

## Buiten scope

- `v1.0.0`-git-tag en release: pas na succesvolle acceptatie van deze feature.
- Geautomatiseerde mobile E2E-test voor sessie-persistentie: later, buiten deze feature.
- Realm-brede token-presets voor andere clients.