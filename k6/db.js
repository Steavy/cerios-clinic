// k6/db.js — DB bottleneck test: heavy API reads/writes, concurrent load
import http from 'k6/http';
import { check, sleep, fail } from 'k6';

export const options = {
  vus: 100,
  duration: '10m',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.02'],
  },
};

const BASE = 'http://demo-sparta.mooo.com';
const KEYCLOAK = `${BASE}:8180/realms/clinic/protocol/openid-connect/token`;
const API = `${BASE}:3001/api`;

export default function() {
  const login = http.post(KEYCLOAK, {
    grant_type: 'password',
    username: 'patient@example.com',
    password: 'test123',
    client_id: 'patient-portal',
  }, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

  check(login, { 'login ok': r => r.status === 200 }) || fail('login failed');
  const token = login.json('access_token');
  if (!token) return;

  const headers = { Authorization: `Bearer ${token}` };

  // Heavy read: appointments list
  const appts = http.get(`${API}/appointments`, { headers });
  check(appts, { 'appointments ok': r => r.status === 200 });

  // Heavy read: profile
  const profile = http.get(`${API}/profile`, { headers });
  check(profile, { 'profile ok': r => r.status === 200 });

  // Write: create appointment
  const create = http.post(`${API}/appointments`, JSON.stringify({
    doctorId: 'doc-1',
    date: '2026-12-01',
    time: '10:00',
  }), { headers: { ...headers, 'Content-Type': 'application/json' } });
  check(create, { 'create ok': r => r.status === 201 || r.status === 200 });

  sleep(Math.random() * 3 + 0.5);
}
