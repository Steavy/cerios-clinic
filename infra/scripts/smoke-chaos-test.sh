#!/usr/bin/env bash
set -euo pipefail

# Chaos Mesh smoke check for the clinic demo stack (runs on the demo server).
#
# Kills one pod at a time (PodChaos, mode: one) across the app deployments
# while a watcher polls every public endpoint and asserts ZERO DOWNTIME: with
# 2 replicas per app, one pod kill must never make an endpoint unreachable.
# After the window the deployments must recover and every endpoint must be
# healthy again. Any downtime event fails the script (and with it the Deploy
# Demo workflow).
#
# Note: keycloak is deliberately excluded from the kill selector (it stays in
# the watcher below). Its JVM takes ~3 min to become Ready, far longer than the
# 15s kill cadence, so two keycloak kills inside one window would take both
# replicas down at once and fail the gate spuriously (~19% per run). Like
# postgres (1 replica, also not killed), slow-starting stateful services are
# watched but not chaos-killed.
#
# Env:
#   NS              namespace to test             (default clinic)
#   CHAOS_DURATION  seconds the chaos window runs (default 120)
#   CHAOS_INTERVAL  seconds between kills         (default 15)
#   MAX_WAIT        per-endpoint recovery wait    (default 300)

NS="${NS:-clinic}"
CHAOS_DURATION="${CHAOS_DURATION:-120}"
CHAOS_INTERVAL="${CHAOS_INTERVAL:-15}"
MAX_WAIT="${MAX_WAIT:-300}"

# Fail-early guard: Chaos Mesh must be installed (CRDs + controller).
if ! kubectl get crd podchaos.chaos-mesh.org >/dev/null 2>&1; then
  echo "FAIL: Chaos Mesh CRD podchaos.chaos-mesh.org not found (install Chaos Mesh first)"
  exit 1
fi

RUN_TAG="chaos-smoke-$(date +%s)"
WATCHER_LOG="$(mktemp)"
WATCHER_PID=""
SCHED_FILE="$(mktemp)"
DOWNTIME_COUNT=0

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
  "mailpit|http://localhost:8025/"
)

# The zero-downtime gate checks Service endpoint availability (not latency):
# a shared host can be saturated by other tenants' workloads (load 80+), which
# would make any latency-based gate fail even though the services never drop.
k8s_svcs=(
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

check_endpoints() {
  local failed=() entry svc url deadline ok
  for entry in "${endpoints[@]}"; do
    svc="${entry%%|*}"
    url="${entry#*|}"
    deadline=$((SECONDS + MAX_WAIT))
    ok=0
    while [ "$SECONDS" -lt "$deadline" ]; do
      if curl -fsS -o /dev/null --max-time 5 "$url" 2>/dev/null; then
        ok=1
        break
      fi
      sleep 3
    done
    [ "$ok" -eq 0 ] && failed+=("$svc")
  done
  if [ "${#failed[@]}" -gt 0 ]; then
    echo "FAIL: unhealthy after recovery: ${failed[*]}"
    return 1
  fi
}

watch_zero_downtime() {
  local log="$1"
  local entry label k8ssvc addrs
  declare -A consec=()
  while :; do
    for entry in "${k8s_svcs[@]}"; do
      label="${entry%%|*}"
      k8ssvc="${entry#*|}"
      addrs="$(kubectl -n "$NS" get endpoints "$k8ssvc" -o jsonpath='{.subsets[*].addresses[*].ip}' 2>/dev/null || true)"
      if [ -n "$addrs" ]; then
        consec["$label"]=0
      else
        consec["$label"]=$((${consec["$label"]:-0} + 1))
        if [ "${consec["$label"]}" -ge 3 ]; then
          echo "[$(date -u +%H:%M:%S)] DOWNTIME $label (no ready endpoints for service $k8ssvc)" >> "$log"
          consec["$label"]=0
        fi
      fi
    done
    sleep 2
  done
}

cleanup() {
  [ -n "$WATCHER_PID" ] && kill "$WATCHER_PID" 2>/dev/null || true
  kubectl -n "$NS" delete schedule "$RUN_TAG" --ignore-not-found >/dev/null 2>&1 || true
  kubectl -n "$NS" delete podchaos -l "chaos-mesh.org/experiment=$RUN_TAG" --ignore-not-found >/dev/null 2>&1 || true
  rm -f "$SCHED_FILE" "$WATCHER_LOG"
}
trap cleanup EXIT

cat > "$SCHED_FILE" <<EOF
apiVersion: chaos-mesh.org/v1alpha1
kind: Schedule
metadata:
  name: $RUN_TAG
  namespace: $NS
spec:
  schedule: "@every ${CHAOS_INTERVAL}s"
  historyLimit: 5
  concurrencyPolicy: Allow
  type: PodChaos
  podChaos:
    action: pod-kill
    mode: one
    selector:
      namespaces:
        - $NS
      expressionSelectors:
        - key: app
          operator: In
          values:
            - api-patient
            - api-doctor
            - api-assistant
            - api-admin
            - patient-portal
            - doctor-portal
            - assistant-portal
            - admin-portal
            - mailpit
            # keycloak intentionally absent: slow JVM readiness (~3 min) vs
            # 15s cadence makes double-kills take both replicas down at once.
            # It remains watched by watch_zero_downtime (k8s_svcs below).
EOF

echo "Starting Chaos Mesh smoke check (duration=${CHAOS_DURATION}s, every=${CHAOS_INTERVAL}s)"
watch_zero_downtime "$WATCHER_LOG" &
WATCHER_PID=$!

kills_before="$(kubectl -n "$NS" get podchaos -o name 2>/dev/null | wc -l)"
kubectl apply -f "$SCHED_FILE"
sleep "$CHAOS_DURATION"
kubectl delete schedule "$RUN_TAG" --ignore-not-found >/dev/null 2>&1 || true
kills_after="$(kubectl -n "$NS" get podchaos -o name 2>/dev/null | wc -l)"
kills=$((kills_after - kills_before))

kill "$WATCHER_PID" 2>/dev/null || true
wait "$WATCHER_PID" 2>/dev/null || true
WATCHER_PID=""

DOWNTIME_COUNT="$(wc -l < "$WATCHER_LOG" | tr -d ' ')"
if [ "$DOWNTIME_COUNT" -gt 0 ]; then
  echo ""
  echo "## Chaos Mesh smoke check: FAILED (downtime observed)"
  echo ""
  echo "| Metric | Value |"
  echo "|--------|-------|"
  echo "| Duration | ${CHAOS_DURATION}s |"
  echo "| Pod kills triggered | ${kills} |"
  echo "| Downtime events | ${DOWNTIME_COUNT} |"
  echo ""
  echo "Downtime details:"
  cat "$WATCHER_LOG"
  exit 1
fi

echo "Waiting for full recovery (rollout status of all deployments)..."
for d in $(kubectl -n "$NS" get deploy -o name); do
  kubectl -n "$NS" rollout status "$d" --timeout=120s >/dev/null
done
check_endpoints

echo ""
echo "## Chaos Mesh smoke check: PASSED"
echo ""
echo "| Metric | Value |"
echo "|--------|-------|"
echo "| Duration | ${CHAOS_DURATION}s |"
echo "| Pod kills triggered | ${kills} |"
echo "| Downtime events | 0 |"
echo "| Endpoints after recovery | all OK |"
