#!/usr/bin/env bash
set -euo pipefail

# Deploys the demo stack to the minikube cluster on the demo host (91.99.134.58).
# Triggered by the deploy-demo workflow in playwright-sparta after smoke tests
# pass. Uses published ghcr.io/steavy/cerios-clinic images (portals: `demo`,
# rest: `latest`). Rollback: `docker compose -f docker-compose.demo.yml
# up -d --pull always`.

TARGET="${1:-main}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/root/backups}"
MINIKUBE_PROFILE="${MINIKUBE_PROFILE:-clinic}"
CLUSTER_KUBE_NAME="$MINIKUBE_PROFILE"
NS="${NS:-clinic}"
PUBLIC_APISERVER="https://91.99.134.58:6443"
K8S_DIR="$REPO_DIR/infra/k8s"
MAX_WAIT="${MAX_WAIT:-300}"

mkdir -p "$BACKUP_DIR"
ts="$(date +%Y%m%d-%H%M%S)"
compose_yml="$REPO_DIR/docker-compose.demo.yml"

dump_compose_pg() {
  if docker inspect clinic-postgres >/dev/null 2>&1; then
    if docker exec clinic-postgres pg_dump -U clinic -d clinic_db -F c > "$BACKUP_DIR/clinic-db-$ts.dump"; then
      echo "DB backup (compose): $BACKUP_DIR/clinic-db-$ts.dump"
    else
      echo "WARN: compose DB backup failed, continuing anyway"
    fi
  else
    echo "No running clinic-postgres container, skipping compose DB backup"
  fi
}

db_has_data() {
  local count
  count="$(kubectl -n "$NS" exec deploy/postgres -- psql -U clinic -d clinic_db -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'" 2>/dev/null | tr -d '[:space:]')"
  [ -n "$count" ] && [ "$count" != "0" ]
}

dump_k8s_pg() {
  if kubectl -n "$NS" get deploy/postgres >/dev/null 2>&1 && db_has_data; then
    if kubectl -n "$NS" exec deploy/postgres -- pg_dump -U clinic -d clinic_db -F c > "$BACKUP_DIR/clinic-db-$ts.dump"; then
      echo "DB backup (k8s): $BACKUP_DIR/clinic-db-$ts.dump"
    else
      echo "WARN: k8s DB backup failed, continuing anyway"
    fi
  fi
}

wait_deploy() {
  kubectl -n "$NS" rollout status "deploy/$1" --timeout="${2:-300}s"
}

wait_job() {
  local name="$1" timeout="${2:-900}"
  local deadline=$((SECONDS + timeout))
  while [ "$SECONDS" -lt "$deadline" ]; do
    local state
    state="$(kubectl -n "$NS" get job "$name" -o jsonpath='{.status.conditions[?(@.type=="Complete")].status}' 2>/dev/null || true)"
    if [ "$state" = "True" ]; then
      echo "Job $name completed"
      return 0
    fi
    state="$(kubectl -n "$NS" get job "$name" -o jsonpath='{.status.conditions[?(@.type=="Failed")].status}' 2>/dev/null || true)"
    if [ "$state" = "True" ]; then
      echo "Job $name FAILED"
      kubectl -n "$NS" logs "job/$name" --tail=50 2>/dev/null || true
      return 1
    fi
    sleep 5
  done
  echo "Job $name timed out after ${timeout}s"
  kubectl -n "$NS" logs "job/$name" --tail=50 2>/dev/null || true
  return 1
}

restore_backup() {
  local dump="$1"
  echo "Restoring $dump into k8s postgres"
  # Drop the empty keycloak schema created by init.sql so the restore is clean.
  kubectl -n "$NS" exec deploy/postgres -- psql -U clinic -d clinic_db -c \
    "DROP SCHEMA IF EXISTS keycloak CASCADE;" >/dev/null
  if ! kubectl -n "$NS" exec -i deploy/postgres -- pg_restore -U clinic -d clinic_db < "$dump"; then
    echo "FAIL: pg_restore failed"
    return 1
  fi
  local users
  users="$(kubectl -n "$NS" exec deploy/postgres -- psql -U clinic -d clinic_db -tAc "SELECT count(*) FROM users" 2>/dev/null | tr -d '[:space:]')"
  if [ -z "$users" ] || [ "$users" = "0" ]; then
    echo "FAIL: restore did not populate the users table"
    return 1
  fi
  echo "Restore verified (users=$users)"
}

ensure_cluster() {
  if docker inspect "$MINIKUBE_PROFILE" >/dev/null 2>&1 && docker port "$MINIKUBE_PROFILE" 2>/dev/null | grep -q "0.0.0.0:3001"; then
    echo "minikube cluster $MINIKUBE_PROFILE present with demo port mappings"
    return 0
  fi
  echo "minikube cluster $MINIKUBE_PROFILE missing or without demo port mappings; recreating"
  minikube delete --profile "$MINIKUBE_PROFILE" 2>/dev/null || true
  bash "$K8S_DIR/minikube-start.sh"
  kubectl config set-cluster "$CLUSTER_KUBE_NAME" --server="$PUBLIC_APISERVER"
  kubectl config use-context "$CLUSTER_KUBE_NAME"
}

healthcheck_endpoints() {
  local endpoints=(
    "keycloak|http://localhost:8180/realms/clinic"
    "api-patient|http://localhost:3001/api/health"
    "api-doctor|http://localhost:3002/api/health"
    "api-assistant|http://localhost:3003/api/health"
    "api-admin|http://localhost:3004/api/health"
    "patient-portal|http://localhost:5173/"
    "doctor-portal|http://localhost:5174/"
    "assistant-portal|http://localhost:5175/"
    "admin-portal|http://localhost:5176/"
    "mailpit|http://localhost:8025/"
  )
  local failed=() entry svc url ok deadline
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
  if [ "${#failed[@]}" -gt 0 ]; then
    echo "Unhealthy services: ${failed[*]}"
    return 1
  fi
}

# Zero-downtime gate: polls every public endpoint; logs a DOWNTIME line when an
# endpoint is unreachable for >= 3 consecutive polls (~6s, a small retry
# tolerance for single blips). The deploy fails if any downtime event occurred.
watch_zero_downtime() {
  local log="$1"
  local endpoints=(
    "keycloak|http://localhost:8180/realms/clinic"
    "api-patient|http://localhost:3001/api/health"
    "api-doctor|http://localhost:3002/api/health"
    "api-assistant|http://localhost:3003/api/health"
    "api-admin|http://localhost:3004/api/health"
    "patient-portal|http://localhost:5173/"
    "doctor-portal|http://localhost:5174/"
    "assistant-portal|http://localhost:5175/"
    "admin-portal|http://localhost:5176/"
    "mailpit|http://localhost:8025/"
  )
  local entry svc url
  declare -A consec=()
  while :; do
    for entry in "${endpoints[@]}"; do
      svc="${entry%%|*}"
      url="${entry#*|}"
      if curl -fsS -o /dev/null --max-time 4 "$url" 2>/dev/null; then
        consec["$svc"]=0
      else
        consec["$svc"]=$((${consec["$svc"]:-0} + 1))
        if [ "${consec["$svc"]}" -ge 3 ]; then
          echo "DOWNTIME $svc (${consec["$svc"]} consecutive fails: $url)" >> "$log"
          consec["$svc"]=0
        fi
      fi
    done
    sleep 2
  done
}

# 1. DB backups (compose stack first, then k8s state)
dump_compose_pg
dump_k8s_pg
fresh_backup="$BACKUP_DIR/clinic-db-$ts.dump"

# 2. Update repo to target branch (re-exec if the script changed on disk)
git -C "$REPO_DIR" fetch --all --prune
START_SHA="$(git -C "$REPO_DIR" rev-parse HEAD)"
git -C "$REPO_DIR" reset --hard "origin/$TARGET"
echo "Deployed commit: $(git -C "$REPO_DIR" rev-parse --short HEAD)"
if [ "$(git -C "$REPO_DIR" rev-parse HEAD)" != "$START_SHA" ]; then
  echo "Deploy script changed on disk, re-executing new version"
  exec bash "$0" "$@"
fi

# 3. Tear down the old docker-compose stack (frees the host ports for minikube)
if [ -f /root/cerios-clinic/docker-compose.yml ]; then
  echo "Tearing down legacy stack (/root/cerios-clinic/docker-compose.yml)"
  docker compose -f /root/cerios-clinic/docker-compose.yml --profile apps down --remove-orphans || true
fi
if docker compose -f "$compose_yml" ps -q >/dev/null 2>&1 && [ -n "$(docker compose -f "$compose_yml" ps -q 2>/dev/null)" ]; then
  echo "Tearing down docker-compose demo stack"
  docker compose -f "$compose_yml" --profile apps down --remove-orphans
fi
docker rm -f "$(docker ps -aq --filter name=clinic- 2>/dev/null)" 2>/dev/null || true

# 4. Ensure the minikube cluster exists with the demo port mappings
ensure_cluster

# 5. Apply postgres first and wait until ready (fresh PVC is empty)
kubectl apply -f "$K8S_DIR/namespace.yaml"
kubectl apply -f "$K8S_DIR/postgres.yaml"
wait_deploy postgres

# 6. Restore the clinic DB dump into an empty PVC
if db_has_data; then
  echo "Postgres already has data, skipping restore"
else
  newest="$(ls -t "$BACKUP_DIR"/clinic-db-*.dump 2>/dev/null | head -1 || true)"
  dump_to_use="$fresh_backup"
  [ -f "$dump_to_use" ] || dump_to_use="$newest"
  if [ -n "${dump_to_use:-}" ] && [ -f "$dump_to_use" ]; then
    restore_backup "$dump_to_use"
  else
    echo "No DB dump found; leaving postgres empty (db-init job will seed it)"
  fi
fi

# 7. Zero-downtime deploy of the app stack. Every app is a 2-replica
#    deployment with RollingUpdate maxUnavailable:0/maxSurge:1, so a rolling
#    restart never drops below one serving replica.
WATCHER_LOG="$(mktemp)"
watch_zero_downtime "$WATCHER_LOG" &
WATCHER_PID=$!
watcher_active=1
trap 'if [ "${watcher_active:-0}" -eq 1 ]; then kill "$WATCHER_PID" 2>/dev/null || true; wait "$WATCHER_PID" 2>/dev/null || true; fi' EXIT

# 7a. Apply manifests (idempotent).
kubectl apply -f "$K8S_DIR/keycloak.yaml"
kubectl apply -f "$K8S_DIR/mailpit.yaml"
kubectl apply -f "$K8S_DIR/apis.yaml"
kubectl apply -f "$K8S_DIR/portals.yaml"

# 7b. Rolling restart the app deployments one at a time (each rollout fully
#     completes before the next starts). Restarting all apps at once swamps
#     the small demo host (concurrent image pulls + Keycloak JVM startups
#     pushed load >30 and the endpoints started timing out). Postgres is
#     excluded: it is a single Recreate pod, restarting it would briefly take
#     the endpoints down. Its schema changes come from db-init below, which
#     runs against the live database.
for d in keycloak mailpit api-patient api-doctor api-assistant api-admin \
         patient-portal doctor-portal assistant-portal admin-portal; do
  kubectl -n "$NS" rollout restart "deploy/$d"
  wait_deploy "$d" 420
done

# 7c. Wait for postgres (never rolled, but confirm it is still up).
wait_deploy postgres 60

# 7d. Stop the watcher and fail the deploy if any downtime was observed.
kill "$WATCHER_PID" 2>/dev/null || true
wait "$WATCHER_PID" 2>/dev/null || true
watcher_active=0
if [ -s "$WATCHER_LOG" ]; then
  echo "FAIL: zero-downtime violated during deploy:"
  cat "$WATCHER_LOG"
  rm -f "$WATCHER_LOG"
  exit 1
fi
rm -f "$WATCHER_LOG"
echo "Zero-downtime gate: no downtime detected during deploy"

# 8. Run migrations + seed (idempotent), then the Keycloak realm fix
#    --wait=true so a concurrent run (e.g. manual + CI) never hits
#    "AlreadyExists" when re-applying the job.
kubectl -n "$NS" delete job db-init --ignore-not-found --wait=true
kubectl apply -f "$K8S_DIR/db-init.yaml"
wait_job db-init

kubectl -n "$NS" delete job keycloak-fix --ignore-not-found --wait=true
kubectl apply -f "$K8S_DIR/keycloak-fix.yaml"
wait_job keycloak-fix

# 9. Verify the public endpoints
healthcheck_endpoints

kubectl -n "$NS" get pods -o wide

echo "Demo stack is healthy on minikube cluster $MINIKUBE_PROFILE"
echo "Rollback: docker compose -f $compose_yml up -d --pull always"
