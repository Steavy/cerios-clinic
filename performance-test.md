# Performance Test Plan — Cerios Clinic Demo Stack

**Target**: Cerios Clinic demo running on minikube (`clinic` namespace) with 2 replicas per deployment.
**Endpoints**: Patient portal (5173), Doctor portal (5174), Assistant portal (5175), Admin portal (5176), APIs (3001–3004), Keycloak (8180), Mailpit (8025).

---

## 1. Test Dimensions (Boundary Value Analysis)

| Variable | Min | Max | Boundary Values |
|----------|-----|-----|-----------------|
| Concurrent users | 1 | 200 | 1, 2, 50, 100, 150, 200, 201 |
| RPS per endpoint | 10 | 500 | 10, 50, 100, 250, 500, 510 |
| Payload size | 1 KB | 500 KB | 1, 50, 100, 250, 500, 501 |
| Think time | 100 ms | 5000 ms | 100, 500, 1000, 3000, 5000 |

---

## 2. Test Scenarios (Pairwise-optimised)

| Scenario | Type | Target | Duration | Ramp |
|----------|------|--------|----------|------|
| **Smoke/baseline** | Baseline | All 3 portals + APIs | 2 min | — |
| **Load test** | Load | Patient portal (primary) | 10 min | 2 min to 50 users |
| **Stress test** | Stress | All portals + APIs | 15 min | 5 min to 150 users, hold 5 min |
| **Spike test** | Spike | Patient + Doctor portals | 3 min | 10 → 200 in 30s, hold 1 min |
| **Soak test** | Soak | Full stack | 60 min | Steady 80 users |
| **Keycloak stress** | Stress | Keycloak (8180) | 10 min | Login storm, token refresh |
| **DB bottleneck** | Stress | api-patient/doctor + postgres | 10 min | Large queries, pool exhaustion |

---

## 3. Key Metrics & SLIs (Oracle: Performance + Reliability)

| Metric | Target (P95) | Critical Threshold |
|--------|--------------|-------------------|
| Portal page load (TTI) | < 2s | > 5s |
| API `/health` | < 50ms | > 200ms |
| API `/appointments` (read) | < 300ms | > 1s |
| API `/appointments` (write) | < 500ms | > 2s |
| Keycloak token grant | < 400ms | > 1.5s |
| Error rate | < 0.1% | > 1% |
| CPU/pod | < 70% | > 90% |
| Memory/pod | < 80% | > 90% |
| DB connections | < 70% pool | > 90% |

---

## 4. Tooling & Execution

**Recommended**: **k6** (Go-based, scriptable, CI-friendly).

```javascript
// k6/patient-portal-flow.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // ramp up
    { duration: '5m', target: 50 },   // steady load
    { duration: '2m', target: 100 },  // stress spike
    { duration: '5m', target: 100 },  // hold stress
    { duration: '2m', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE = 'http://demo-sparta.mooo.com';
const KEYCLOAK = `${BASE}:8180/realms/clinic/protocol/openid-connect/token`;
const PORTAL = `${BASE}:5173`;
const API = `${BASE}:3001/api`;

export default function() {
  // 1. Keycloak login (patient)
  const login = http.post(KEYCLOAK, {
    grant_type: 'password',
    username: 'patient@example.com',
    password: 'test123',
    client_id: 'patient-portal',
  }, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  
  check(login, { 'login ok': r => r.status === 200 }) || fail('login failed');
  const token = login.json('access_token');
  if (!token) return;

  // 2. Patient portal page load
  const portal = http.get(PORTAL, { headers: { Authorization: `Bearer ${token}` }});
  check(portal, { 'portal loads': r => r.status === 200 && r.body.length > 100 });

  // 3. API calls
  const appts = http.get(`${API}/appointments`, { headers: { Authorization: `Bearer ${token}` }});
  check(appts, { 'appointments ok': r => r.status === 200 });

  sleep(Math.random() * 4 + 1); // 1–5s think time
}
```

Run locally:
```bash
docker run --rm -i grafana/k6 run - <k6/patient-portal-flow.js
```

---

## 5. CI Integration (GitHub Actions)

```yaml
# .github/workflows/performance.yml
name: Performance Test
on:
  workflow_dispatch:
    inputs:
      scenario:
        description: 'Test scenario to run'
        required: true
        type: choice
        options: [smoke, load, stress, spike, soak, keycloak, db]
      duration:
        description: 'Override duration (e.g. 10m)'
        required: false
        type: string

jobs:
  perf:
    runs-on: [self-hosted, linux, x64, srt]
    timeout-minutes: 90
    steps:
      - uses: actions/checkout@v4
      - name: Run k6 performance test
        env:
          SCENARIO: ${{ github.event.inputs.scenario }}
          DURATION: ${{ github.event.inputs.duration }}
        run: |
          docker run --rm -i grafana/k6 run - <k6/${SCENARIO}.js
```

---

## 6. Risk Areas (RCRCRC + Bug Heuristics)

| Area | Heuristic | Test Focus |
|------|-----------|------------|
| Keycloak | **Concurrency**, **Chronic** | Login storm, token refresh loop, realm import |
| DB connection pool | **Boundary**, **Resource exhaustion** | Max connections, slow queries, pool starvation |
| 2-replica HA | **Concurrency**, **Repeat** | Pod kill during load (combine with chaos-mesh), zero-downtime gate |
| Portal bundle size | **Performance**, **Empty/Null** | Empty state renders, large dataset renders |
| WebSocket / long-poll | **Time**, **Repeat** | Idle timeout, reconnection storm |

---

## 7. Execution Checklist

- [ ] Write k6 scripts for each scenario (`k6/smoke.js`, `k6/load.js`, `k6/stress.js`, `k6/spike.js`, `k6/soak.js`, `k6/keycloak.js`, `k6/db.js`)
- [ ] Run baseline (1 user) against current demo to establish current P95
- [ ] Run load test (50 users) → if P95 < 2s, proceed to stress
- [ ] Combine stress test with chaos-mesh for "performance under failure" validation
- [ ] Add GitHub Actions workflow for scheduled runs (e.g. weekly)
- [ ] Document results in a `performance-results/` folder with timestamps

---

## 8. References

- Heuristics used: **SFDPOT** (product survey), **Quality Criteria Catalog** (Performance, Reliability), **Bug Heuristics** (Concurrency, Boundary, Empty, Repeat, Zero), **RCRCRC** (regression focus), **FEW HICCUPPS** (oracles)
- Techniques: **Boundary Value Analysis** (test dimensions), **Pairwise Testing** (scenario reduction), **Equivalence Partitioning** (user types: patient/doctor/assistant/admin)

---

*Generated using testassist-mcp-server heuristics & techniques catalog.*