// k6/spike.js — Spike test: sudden burst 10 → 200 users in 30s
import http from 'k6/http';
import { check, sleep, fail } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 10 },    // baseline
    { duration: '30s', target: 200 },   // spike up
    { duration: '1m', target: 200 },    // hold spike
    { duration: '30s', target: 10 },    // spike down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE = 'http://demo-sparta.mooo.com';
const KEYCLOAK = `${BASE}:8180/realms/clinic/protocol/openid-connect/token`;
const PORTALS = [
  { name: 'patient', url: `${BASE}:5173`, client: 'patient-portal' },
  { name: 'doctor', url: `${BASE}:5174`, client: 'doctor-portal' },
];

export default function() {
  const p = PORTALS[Math.floor(Math.random() * PORTALS.length)];

  const login = http.post(KEYCLOAK, {
    grant_type: 'password',
    username: 'demo@example.com',
    password: 'test123',
    client_id: p.client,
  }, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

  check(login, { 'login ok': r => r.status === 200 }) || fail('login failed');
  const token = login.json('access_token');
  if (!token) return;

  const portal = http.get(p.url, { headers: { Authorization: `Bearer ${token}` }});
  check(portal, { 'portal loads': r => r.status === 200 && r.body.length > 100 });

  sleep(Math.random() * 3 + 0.5);
}
