// k6/smoke.js — Baseline smoke test (1 user, happy path)
import http from 'k6/http';
import { check, sleep, fail } from 'k6';

export const options = {
  vus: 1,
  duration: '2m',
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

  sleep(Math.random() * 4 + 1);
}