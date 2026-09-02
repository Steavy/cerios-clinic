// k6/stress.js — Stress test: ramp to 150 users, hold 5 min, find breaking point
import http from 'k6/http';
import { check, sleep, fail } from 'k6';

export const options = {
  stages: [
    { duration: '5m', target: 150 },  // ramp up to 150 users
    { duration: '5m', target: 150 },  // hold at stress level
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE = 'http://demo-sparta.mooo.com';
const KEYCLOAK = `${BASE}:8180/realms/clinic/protocol/openid-connect/token`;
const PORTAL = `${BASE}:5173`;
const API = `${BASE}:3001/api`;

const PORTALS = [
  { name: 'patient', url: `${BASE}:5173`, client: 'patient-portal' },
  { name: 'doctor', url: `${BASE}:5174`, client: 'doctor-portal' },
  { name: 'assistant', url: `${BASE}:5175`, client: 'assistant-portal' },
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

  const appts = http.get(`${API}/appointments`, { headers: { Authorization: `Bearer ${token}` }});
  check(appts, { 'appointments ok': r => r.status === 200 });

  sleep(Math.random() * 4 + 1);
}
