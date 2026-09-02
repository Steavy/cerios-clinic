// k6/keycloak.js — Keycloak stress test: login storm + token refresh
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '10m',
  thresholds: {
    http_req_duration: ['p(95)<400'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE = 'http://demo-sparta.mooo.com';
const KEYCLOAK = `${BASE}:8180/realms/clinic/protocol/openid-connect/token`;
const REALM = `${BASE}:8180/realms/clinic`;

export default function() {
  // Token grant (login)
  const login = http.post(KEYCLOAK, {
    grant_type: 'password',
    username: 'patient@example.com',
    password: 'test123',
    client_id: 'patient-portal',
  }, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

  check(login, { 'token grant ok': r => r.status === 200 });
  const token = login.json('access_token');
  const refresh = login.json('refresh_token');

  // Token refresh
  if (refresh) {
    const refreshReq = http.post(KEYCLOAK, {
      grant_type: 'refresh_token',
      refresh_token: refresh,
      client_id: 'patient-portal',
    }, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    check(refreshReq, { 'refresh ok': r => r.status === 200 });
  }

  // Realm metadata fetch
  const realm = http.get(REALM);
  check(realm, { 'realm ok': r => r.status === 200 });

  sleep(Math.random() * 2 + 0.5);
}
