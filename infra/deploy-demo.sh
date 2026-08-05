#!/usr/bin/env bash
set -euo pipefail

# Deploys the demo stack to the minikube cluster on the demo host.
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
K8S_DIR="$REPO_DIR/infra/k8s"
MAX_WAIT="${MAX_WAIT:-300}"
MARKER_FILE="${MARKER_FILE:-/var/tmp/cerios-clinic-last-deployed.sha}"
LOCK_FILE="${LOCK_FILE:-/var/tmp/cerios-clinic-deploy.lock}"

# The demo host IP is deliberately not committed to this public repo: it is
# supplied via $CERIOS_DEMO_HOST_IP (the Deploy Demo workflow injects it from
# the private DEMO_HOST_IP secret) or, for manual runs on the host, read from
# the root-only file /root/.cerios-demo-host-ip.
DEMO_HOST_IP="${CERIOS_DEMO_HOST_IP:-}"
if [ -z "$DEMO_HOST_IP" ] && [ -s /root/.cerios-demo-host-ip ]; then
  DEMO_HOST_IP="$(tr -d '[:space:]' < /root/.cerios-demo-host-ip)"
fi
if [ -z "$DEMO_HOST_IP" ]; then
  echo "ERROR: demo host IP unknown. Set CERIOS_DEMO_HOST_IP or create /root/.cerios-demo-host-ip." >&2
  exit 1
fi
PUBLIC_APISERVER="https://$DEMO_HOST_IP:6443"

mkdir -p "$BACKUP_DIR"
ts="$(date +%Y%m%d-%H%M%S)"
compose_yml="$REPO_DIR/docker-compose.demo.yml"

# Only one deploy may run at a time: manual runs and CI runs share this host,
# and two concurrent deploy-demo.sh invocations churn the same cluster and
# trip each other's zero-downtime gate. The lock fd survives the re-exec below.
exec 9>"$LOCK_FILE"
# Wait for a concurrent deploy/undeploy to finish instead of deferring silently:
# a silent no-op makes the calling workflow's endpoint verification run against
# a stack that is mid-deploy (or down) and fail with an unhelpful curl timeout.
LOCK_WAIT="${LOCK_WAIT:-600}"
if ! flock -w "$LOCK_WAIT" 9; then
  echo "Another deploy/undeploy run holds the deploy lock and did not release it within ${LOCK_WAIT}s; aborting"
  exit 1
fi

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
  if docker inspect "$MINIKUBE_PROFILE" >/dev/null 2>&1 \
     && docker port "$MINIKUBE_PROFILE" 2>/dev/null | grep -q "0.0.0.0:3001" \
     && curl -sk --max-time 10 -o /dev/null -w '%{http_code}' "https://127.0.0.1:6443/healthz" 2>/dev/null | grep -q '^200$'; then
    echo "minikube cluster $MINIKUBE_PROFILE present with demo port mappings"
    return 0
  fi
  echo "minikube cluster $MINIKUBE_PROFILE missing, unreachable, or without demo port mappings; recreating"
  minikube delete --profile "$MINIKUBE_PROFILE" 2>/dev/null || true
  CERIOS_DEMO_HOST_IP="$DEMO_HOST_IP" bash "$K8S_DIR/minikube-start.sh"
  kubectl config set-cluster "$CLUSTER_KUBE_NAME" --server="$PUBLIC_APISERVER"
  kubectl config use-context "$CLUSTER_KUBE_NAME"
}

# Chaos Mesh is a cluster addon the post-deploy smoke-chaos-test gate depends on
# (podchaos.chaos-mesh.org CRD). The CRDs live inside the cluster, so a cluster
# recreate wipes them and the gate fails fast until someone reinstalls Chaos
# Mesh by hand (see run 30979509221). Provisioning therefore reinstalls it
# idempotently whenever the CRD is missing. Helm is the only supported install
# path (chart 2.8.x; the old all-in-one manifest URLs are dead), so helm is
# bootstrapped on first use if absent. minikube v1.36 defaults to the docker
# runtime, which matches the chart defaults; containerd gets explicit flags.
#
# The smoke test only needs PodChaos, so the install is slimmed down to fit the
# constrained demo node (4 vCPU / 4 GB running the whole clinic stack): the
# chart defaults to 3 controller-manager replicas plus dashboard and dns-server
# pods (~1 GB total), which pushed the controller readiness wait past 420s on
# run 30981289349. One controller replica + no dashboard + no dns-server (the
# DNS mutating webhook is a known foot-gun on small clusters) is enough for the
# gate.
install_chaos_mesh() {
  if kubectl get crd podchaos.chaos-mesh.org >/dev/null 2>&1; then
    echo "Chaos Mesh already installed (CRD podchaos.chaos-mesh.org present)"
    return 0
  fi
  echo "Chaos Mesh CRD missing; installing via helm (chart 2.8.3, slim profile)"
  if ! command -v helm >/dev/null 2>&1; then
    echo "helm not found; bootstrapping helm 3.17.2"
    curl -fsSL "https://get.helm.sh/helm-v3.17.2-linux-amd64.tar.gz" -o /tmp/helm-v3.17.2-linux-amd64.tar.gz
    tar -xzf /tmp/helm-v3.17.2-linux-amd64.tar.gz -C /tmp
    mv /tmp/linux-amd64/helm /usr/local/bin/helm
    rm -rf /tmp/linux-amd64 /tmp/helm-v3.17.2-linux-amd64.tar.gz
  fi
  helm repo add chaos-mesh https://charts.chaos-mesh.org >/dev/null 2>&1 || true
  helm repo update chaos-mesh >/dev/null 2>&1 || true
  kubectl create namespace chaos-mesh --dry-run=client -o yaml | kubectl apply -f - >/dev/null
  local runtime extra=()
  runtime="$(kubectl get node -o jsonpath='{.status.nodeInfo.containerRuntimeVersion}')"
  case "$runtime" in
    containerd://*) extra=(--set chaosDaemon.runtime=containerd --set chaosDaemon.socketPath=/run/containerd/containerd.sock) ;;
  esac
  helm upgrade --install chaos-mesh chaos-mesh/chaos-mesh -n chaos-mesh --version 2.8.3 \
    --set controllerManager.replicaCount=1 \
    --set dashboard.create=false \
    --set dnsServer.create=false \
    "${extra[@]}"
  kubectl -n chaos-mesh rollout status deploy/chaos-controller-manager --timeout=600s >/dev/null
  kubectl -n chaos-mesh rollout status ds/chaos-daemon --timeout=300s >/dev/null
  echo "Chaos Mesh installed and chaos-controller-manager ready"
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

# Zero-downtime gate: watches the cluster Services backing every public
# endpoint. A service is "down" only when it has no Ready backend pod, which is
# the only reliable signal of real downtime during a deploy. A raw latency gate
# is unusable on this shared host: other tenants' workloads (e.g. a batch JVM
# burning 2-4 cores) can push load to 80+ and make even a healthy service slow
# past any curl timeout, which is not deploy downtime. The Service always has
# >=1 Ready endpoint during a clean RollingUpdate (maxUnavailable 0), so any
# DOWNTIME event is a genuine outage.
watch_zero_downtime() {
  local log="$1"
  local endpoints=(
    "keycloak|keycloak"
    "api-patient|api-patient"
    "api-doctor|api-doctor"
    "api-assistant|api-assistant"
    "api-admin|api-admin"
    "patient-portal|patient-portal"
    "doctor-portal|doctor-portal"
    "assistant-portal|assistant-portal"
    "admin-portal|admin-portal"
    "mailpit|mailpit"
  )
  local entry label k8ssvc
  declare -A consec=()
  while :; do
    for entry in "${endpoints[@]}"; do
      label="${entry%%|*}"
      k8ssvc="${entry#*|}"
      addrs="$(kubectl -n "$NS" get endpoints "$k8ssvc" -o jsonpath='{.subsets[*].addresses[*].ip}' 2>/dev/null || true)"
      if [ -n "$addrs" ]; then
        consec["$label"]=0
      else
        consec["$label"]=$((${consec["$label"]:-0} + 1))
        if [ "${consec["$label"]}" -ge 3 ]; then
          echo "[$(date -u +%H:%M:%S) load=$(awk '{print $1}' /proc/loadavg)] DOWNTIME $label (no ready endpoints for service $k8ssvc)" >> "$log"
          consec["$label"]=0
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

# 2b. Skip the rollout when cerios-clinic main has not changed since the last
#     successful deploy. Every forced restart of the full stack is churn, and
#     the smoke-test -> Deploy Demo cascade can fire a run every few minutes;
#     a no-op keeps the gate trivially green without touching running pods.
TARGET_SHA="$(git -C "$REPO_DIR" rev-parse HEAD)"
if [ -f "$MARKER_FILE" ] && [ "$(cat "$MARKER_FILE")" = "$TARGET_SHA" ]; then
  echo "No changes since last deploy ($(git -C "$REPO_DIR" rev-parse --short HEAD)); skipping rollout"
  healthcheck_endpoints
  kubectl -n "$NS" get pods -o wide
  echo "Demo stack is healthy on minikube cluster $MINIKUBE_PROFILE (no deploy needed)"
  exit 0
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

# 4b. Keep Chaos Mesh available for the post-deploy smoke-chaos-test gate:
#     a cluster recreate wipes the CRDs, so reinstall when missing.
install_chaos_mesh

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
  sleep 15
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
  echo "--- pod state at failure time (host load: $(awk '{print $1}' /proc/loadavg)):"
  kubectl -n "$NS" get pods -o custom-columns='NAME:.metadata.name,READY:.status.conditions[?(@.type=="Ready")].status,RESTARTS:.status.containerStatuses[0].restartCount,RS:.metadata.ownerReferences[0].name' 2>/dev/null | head -25
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

echo "$TARGET_SHA" > "$MARKER_FILE"
echo "Demo stack is healthy on minikube cluster $MINIKUBE_PROFILE"
echo "Rollback: docker compose -f $compose_yml up -d --pull always"
