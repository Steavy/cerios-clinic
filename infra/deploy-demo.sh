#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-main}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/root/backups}"
OLD_COMPOSE=/root/cerios-clinic/docker-compose.yml
MAX_WAIT="${MAX_WAIT:-300}"

mkdir -p "$BACKUP_DIR"
ts="$(date +%Y%m%d-%H%M%S)"

if docker inspect clinic-postgres >/dev/null 2>&1; then
  if docker exec clinic-postgres pg_dump -U clinic -d clinic_db -F c > "$BACKUP_DIR/clinic-db-$ts.dump"; then
    echo "DB backup: $BACKUP_DIR/clinic-db-$ts.dump"
  else
    echo "WARN: DB backup failed, continuing anyway"
  fi
else
  echo "No running clinic-postgres container, skipping DB backup"
fi

git -C "$REPO_DIR" fetch --all --prune
START_SHA="$(git -C "$REPO_DIR" rev-parse HEAD)"
git -C "$REPO_DIR" reset --hard "origin/$TARGET"
echo "Deployed commit: $(git -C "$REPO_DIR" rev-parse --short HEAD)"
if [ "$(git -C "$REPO_DIR" rev-parse HEAD)" != "$START_SHA" ]; then
  echo "Deploy script changed on disk, re-executing new version"
  exec bash "$0" "$@"
fi

if [ -f "$OLD_COMPOSE" ]; then
  echo "Tearing down old stack ($OLD_COMPOSE)"
  docker compose -f "$OLD_COMPOSE" --profile apps down --remove-orphans
else
  echo "No old stack compose found, skipping teardown"
fi
docker rm -f $(docker ps -aq --filter name=clinic-) 2>/dev/null || true

echo "Starting demo stack (pulling published images)"
docker compose -f "$REPO_DIR/docker-compose.demo.yml" up -d --pull always

echo "Waiting for services to become healthy (max ${MAX_WAIT}s)"
endpoints=(
  "keycloak|http://localhost:8180/realms/clinic"
  "api-patient|http://localhost:3001/api/health"
  "api-doctor|http://localhost:3002/api/health"
  "api-assistant|http://localhost:3003/api/health"
  "api-admin|http://localhost:3004/api/health"
  "patient-portal|http://localhost:5173/"
  "doctor-portal|http://localhost:5174/"
  "assistant-portal|http://localhost:5175/"
  "admin-portal|http://localhost:5176/"
)

failed=()
for entry in "${endpoints[@]}"; do
  svc="${entry%%|*}"
  url="${entry#*|}"
  deadline=$((SECONDS + MAX_WAIT))
  ok=0
  while [ "$SECONDS" -lt "$deadline" ]; do
    if curl -fsS -o /dev/null "$url" 2>/dev/null; then
      echo "OK  $svc ($url)"
      ok=1
      break
    fi
    sleep 5
  done
  if [ "$ok" -eq 0 ]; then
    echo "FAIL $svc ($url)"
    failed+=("$svc")
  fi
done

docker compose -f "$REPO_DIR/docker-compose.demo.yml" ps

if [ "${#failed[@]}" -gt 0 ]; then
  echo "Unhealthy services: ${failed[*]}"
  exit 1
fi

echo "Fixing Keycloak realms (sslRequired=none so HTTP works on the demo host)"
for i in $(seq 1 30); do
  TOKEN=$(curl -sf -X POST "http://localhost:8180/realms/master/protocol/openid-connect/token" \
    -d "client_id=admin-cli" \
    -d "username=admin" \
    -d "password=admin_secret" \
    -d "grant_type=password" 2>/dev/null | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
  [ -n "$TOKEN" ] && break
  echo "Attempt $i/30 - waiting 5s..."
  sleep 5
done
if [ -z "$TOKEN" ]; then
  echo "FAIL Could not obtain Keycloak admin token"
  exit 1
fi
echo "Keycloak admin token acquired"

for realm in master clinic; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -X PUT -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    "http://localhost:8180/admin/realms/$realm" \
    -d '{"sslRequired": "none"}')
  echo "Realm $realm sslRequired -> none (HTTP:$code)"
done

echo "Demo stack is healthy"
