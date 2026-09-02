// k6/load.js — Load test: ramp to 50 users, steady for 10 min
import http from 'k6/http';
import { check, sleep, fail } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // ramp up to 50 users
    { duration: '8m', target: 50 },   // steady load
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
  const login = http.post(KEYCLOAK, {
    grant_type: 'password',
    username: 'patient@example.com',
    password: 'test123',
    client_id: 'patient-portal',
  }, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

  check(login, { 'login ok': r => r.status === 200 }) || fail('login failed');
  const token = login.json('access_token');
  if (!token) return;

  const portal = http.get(PORTAL, { headers: { Authorization: `Bearer ${token}` }});
  check(portal, { 'portal loads': r => r.status === 200 && r.body.length > 100 });

  const appts = http.get(`${API}/appointments`, { headers: { Authorization: `Bearer ${token}` }});
  check(appts, { 'appointments ok': r => r.status === 200 });

  sleep(Math.random() * 4 + 1);
}
