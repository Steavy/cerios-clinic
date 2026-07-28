# Troubleshooting — Cerios Clinic on HTTP (non-secure context)

This document captures every issue encountered while deploying the Cerios Clinic stack on a server accessible only via HTTP (no HTTPS). The root cause of all problems is that **Keycloak JS v26** and modern browser APIs assume a secure context (`https://` or `localhost`), but the target deployment runs on plain HTTP.

---

## 1. `crypto.randomUUID()` is unavailable on HTTP

**Symptom:**  
Keycloak JS v26 throws `"Web Crypto API is not available"` when calling `keycloak.login()`. The error originates from `createLoginUrl()` which calls `crypto.randomUUID()` to generate OIDC state and nonce parameters.

**Root cause:**  
`crypto.randomUUID()` is only available in secure contexts (HTTPS or localhost). On HTTP it throws a `DOMException`.

**Fix — Polyfill in `index.html`:**  
Inject an inline `<script>` **before** the module script that polyfills `crypto.randomUUID()` using `crypto.getRandomValues()` (which IS available on HTTP):

```html
<script>
  if (!crypto.randomUUID) {
    crypto.randomUUID = () => {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
      return hex.slice(0, 8) + "-" + hex.slice(8, 12) + "-" + hex.slice(12, 16) + "-" + hex.slice(16, 20) + "-" + hex.slice(20);
    };
  }
</script>
```

**Files affected:** `apps/*/index.html` (all portals)

---

## 2. `crypto.subtle.digest()` is unavailable on HTTP (PKCE S256)

**Symptom:**  
Keycloak JS fails PKCE verification. Keycloak server logs `pkce_verification_failed` at `CODE_TO_TOKEN_ERROR`. The auth request is sent with `code_challenge_method=S256` and a `code_challenge`, but the token exchange fails because the `code_verifier` doesn't match.

**Root cause:**  
Keycloak 24 **requires PKCE S256 for public clients**. PKCE S256 uses `crypto.subtle.digest("SHA-256", ...)` which is unavailable on HTTP in headless browsers. In real browsers (Chrome, Firefox) `crypto.subtle` IS available on HTTP, but **Playwright headless Chromium** lacks it. Also, Playwright's `crypto.getRandomValues()` works but `crypto.subtle` does not.

**Fix — Polyfill `crypto.subtle.digest` with pure JS SHA-256:**  
Add a SHA-256 polyfill alongside the `crypto.randomUUID` polyfill:

```html
<script>
  // ... randomUUID polyfill above ...

  if (!crypto.subtle) {
    crypto.subtle = {
      digest: function(algorithm, data) {
        if (algorithm === "SHA-256") {
          return Promise.resolve(sha256(data));
        }
        return Promise.reject(new Error("Unsupported algorithm: " + algorithm));
      }
    };
    function sha256(msg) {
      // Pure JavaScript SHA-256 (FIPS 180-4 compliant)
      var h = [1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225];
      var k = [1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298];
      function r(x, n) { return (x >>> n) | (x << (32 - n)); }
      var bytes = typeof msg === "string" ? new TextEncoder().encode(msg) : new Uint8Array(msg);
      var ml = bytes.length * 8, off = bytes.length;
      var len = ((off + 9 + 63) >>> 6) * 64;
      var b = new Uint8Array(len); b.set(bytes); b[off] = 128;
      var dv = new DataView(b.buffer);
      dv.setUint32(len - 4, ml >>> 0, false);
      dv.setUint32(len - 8, Math.floor(ml / 4294967296), false);
      for (var block = 0; block < len; block += 64) {
        var w = new Uint32Array(64);
        for (var i = 0; i < 16; i++) w[i] = dv.getUint32(block + i * 4, false);
        for (var i = 16; i < 64; i++) {
          var s0 = r(w[i-15],7) ^ r(w[i-15],18) ^ (w[i-15] >>> 3);
          var s1 = r(w[i-2],17) ^ r(w[i-2],19) ^ (w[i-2] >>> 10);
          w[i] = (w[i-16] + s0 + w[i-7] + s1) >>> 0;
        }
        var a = h[0], bb = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
        for (var i = 0; i < 64; i++) {
          var S1 = r(e,6) ^ r(e,11) ^ r(e,25);
          var ch = (e & f) ^ ((~e) & g);
          var t1 = (hh + S1 + ch + k[i] + w[i]) >>> 0;
          var S0 = r(a,2) ^ r(a,13) ^ r(a,22);
          var maj = (a & bb) ^ (a & c) ^ (bb & c);
          var t2 = (S0 + maj) >>> 0;
          hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = bb; bb = a; a = (t1 + t2) >>> 0;
        }
        h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + bb) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
        h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
      }
      var rv = new DataView(new ArrayBuffer(32));
      for (var i = 0; i < 8; i++) rv.setUint32(i * 4, h[i], false);
      return rv.buffer;
    }
  }
</script>
```

**IMPORTANT:** Verify SHA-256 correctness with test vectors (`SHA-256("abc") = ba7816bf...`) — an incorrect implementation silently produces wrong `code_challenge` values, causing PKCE verification to fail on the server.

**Files affected:** `apps/*/index.html` (all portals)

---

## 3. `onLoad: "check-sso"` causes redirect loop on HTTP

**Symptom:**  
Page shows "Service Unavailable" immediately. Keycloak server logs `invalid_request` with `error=login_required`.

**Root cause:**  
`onLoad: "check-sso"` performs a silent check by redirecting to Keycloak in an iframe. On HTTP, the iframe check fails, and Keycloak v26 treats this as a fatal error, rejecting the `keycloak.init()` promise. The `.catch()` handler then renders `<AuthServiceUnavailableScreen />`.

**Fix:**  
Remove `onLoad: "check-sso"` from the `keycloak.init()` call. Let the app render the login page first; the user clicks "Sign in" to trigger the OIDC flow.

```typescript
keycloak.init({
  pkceMethod: "S256",
  checkLoginIframe: false,   // keep this disabled
});
```

**Files affected:** `apps/*/src/main.tsx` (all portals)

---

## 4. Keycloak realm `sslRequired` must be `"none"`

**Symptom:**  
Keycloak returns `error="ssl_required"` when the login page is accessed via HTTP.

**Root cause:**  
The `clinic` realm was imported with `sslRequired: "external"` (the Keycloak default). This requires HTTPS for all non-localhost requests.

**Fix:**  
Either set it during initial import in `clinic-realm.json`:
```json
{
  "realm": "clinic",
  "sslRequired": "none",
  ...
}
```
Or update at runtime via the Admin API:
```bash
TOKEN=$(curl -s -X POST "http://localhost:8180/realms/master/protocol/openid-connect/token" \
  -d "client_id=admin-cli" \
  -d "username=admin" \
  -d "password=admin_secret" \
  -d "grant_type=password" | jq -r '.access_token')

curl -s -X PUT -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "http://localhost:8180/admin/realms/clinic" \
  -d '{"sslRequired": "none"}'
```

**Note:** If the Keycloak database already exists, the realm import is skipped (`"already exists"`), so updating `clinic-realm.json` alone is insufficient — you must also update via the Admin API or wipe the volume.

**Files affected:** `infra/keycloak/clinic-realm.json`

---

## 5. Keycloak client `redirectUris` don't include the actual hostname

**Symptom:**  
After clicking "Sign in", Keycloak shows `"Invalid parameter: redirect_uri"`.

**Root cause:**  
The Keycloak client configuration only had `localhost` redirect URIs. When accessing the portal via `demo-sparta.mooo.com:5173`, the redirect URI `http://demo-sparta.mooo.com:5173/` doesn't match any registered URI.

**Fix:**  
Add all deployment hostnames to each portal client's `redirectUris` and `webOrigins`:

```bash
curl -s -X PUT -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "http://localhost:8180/admin/realms/clinic/clients/<CLIENT_ID>" \
  -d '{
    "redirectUris": [
      "http://localhost:5173/*",
      "http://techlab5.mooo.com:5173/*",
      "http://demo-sparta.mooo.com:5173/*"
    ],
    "webOrigins": [
      "http://localhost:5173",
      "http://techlab5.mooo.com:5173",
      "http://demo-sparta.mooo.com:5173",
      "+"
    ]
  }'
```

Also update `infra/keycloak/clinic-realm.json` so fresh imports include all hosts.

**Files affected:** `infra/keycloak/clinic-realm.json`

---

## 6. CORS origins must be comma-separated

**Symptom:**  
Login succeeds, but the profile page shows an infinite loading spinner. Browser dev tools reveal CORS errors.

**Root cause:**  
The CORS origin parser in `packages/api-common/src/env.ts` splits on **commas** (`,`), not spaces. The docker-compose file had space-separated origins, which were parsed as a single invalid origin.

**Fix:**  
Use commas in `API_*_CORS_ORIGINS`:

```yaml
API_PATIENT_CORS_ORIGINS: "http://localhost:5173,http://techlab5.mooo.com:5173,http://demo-sparta.mooo.com:5173"
```

**Files affected:** `docker-compose.yml` (per-deployment file, not in repo)

---

## 7. API ports are remapped externally

**Symptom:**  
The API is unreachable at the expected port. For example, `api-patient` listens on `3001` inside the container but is mapped to `13001` on the host.

**Root cause:**  
The docker-compose file remaps ports to avoid conflicts with other services on the same host:
```yaml
ports:
  - "13001:3001"   # host:13001 → container:3001
```

**Fix:**  
Set `VITE_PATIENT_API_BASE_URL` to the **external** port during the frontend Docker build:

```bash
docker build \
  --build-arg VITE_PATIENT_API_BASE_URL=http://demo-sparta.mooo.com:13001/api \
  ...
```

The port mapping differs per host. The build-time environment variables (`VITE_*`) are baked into the JavaScript bundle by Vite and cannot be changed at runtime.

**Files affected:** Frontend Docker build command

---

## 8. Auth callback fails: Keycloak token endpoint `400 Bad Request`

**Symptom:**  
Successful login at Keycloak, redirect back to the portal, then the portal shows "Service Unavailable". Keycloak logs show `invalid_request` with `Missing parameter: code_challenge_method`.

**Root cause:**  
Keycloak 24+ requires PKCE for public clients. If the client attribute `pkce.code.challenge.method` is absent or empty, the server rejects the auth request.

**Fix:**  
Set the client attribute to `S256`:
```
pkce.code.challenge.method: "S256"
```

This is set in `clinic-realm.json`:
```json
"attributes": {
  "pkce.code.challenge.method": "S256",
  ...
}
```

---

## Summary of all changed files

| File | Change |
|---|---|
| `apps/*/index.html` | Added `crypto.randomUUID()` + `crypto.subtle.digest()` polyfill |
| `apps/*/src/main.tsx` | Removed `onLoad: "check-sso"`, kept `pkceMethod: "S256"` |
| `infra/keycloak/clinic-realm.json` | `sslRequired: "none"`, updated redirectUris/webOrigins for all portal clients |
| `docker-compose.yml` (local) | CORS origins comma-separated, KEYCLOAK_PUBLIC_URL, API port mappings |
