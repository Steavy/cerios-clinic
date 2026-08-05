#!/usr/bin/env bash
set -euo pipefail

# Creates/starts the minikube demo cluster on the demo host.
# Invoked by deploy-demo.sh (ensure_cluster) when the cluster is missing or its
# demo port mappings are gone. All flags were validated on this host with the
# clinic-test profile before the kind -> minikube cutover.
#
# Naming: with the docker driver, minikube names the control-plane node after
# the profile (e.g. `clinic`), NOT `<profile>-minikube`. The docker container
# and the kubeconfig context/cluster also use the profile name.
#
# Port mapping model (minikube docker driver): `--ports=<host>:<container>`
# maps a host port to a container port. The k8s NodePort services listen on the
# container node ports (30001-30010); the host ports are the public endpoints:
#
#   host port -> container node port (service nodePort)
#   6443       -> 8443  (apiserver; --apiserver-port must stay 8443 so the
#                        external mapping works, and --apiserver-ips adds the
#                        public IP as a cert SAN)
#   3001-3004  -> 30001-30004  (APIs)
#   5173-5176  -> 30005-30008  (portals)
#   8180       -> 30009        (keycloak)
#   8025       -> 30010        (mailpit)

PROFILE="${MINIKUBE_PROFILE:-clinic}"

# The demo host IP (used as apiserver cert SAN via --apiserver-ips) is not
# committed to this public repo: $CERIOS_DEMO_HOST_IP (injected by CI from the
# private DEMO_HOST_IP secret) or the root-only file /root/.cerios-demo-host-ip.
DEMO_HOST_IP="${CERIOS_DEMO_HOST_IP:-}"
if [ -z "$DEMO_HOST_IP" ] && [ -s /root/.cerios-demo-host-ip ]; then
  DEMO_HOST_IP="$(tr -d '[:space:]' < /root/.cerios-demo-host-ip)"
fi
if [ -z "$DEMO_HOST_IP" ]; then
  echo "ERROR: demo host IP unknown. Set CERIOS_DEMO_HOST_IP or create /root/.cerios-demo-host-ip." >&2
  exit 1
fi

minikube start \
  --profile "$PROFILE" \
  --driver=docker \
  --force \
  --kubernetes-version=v1.29.2 \
  --memory=4096 \
  --cpus=4 \
  --listen-address=0.0.0.0 \
  --apiserver-ips="$DEMO_HOST_IP" \
  --apiserver-port=8443 \
  --ports=6443:8443 \
  --ports=3001:30001 \
  --ports=3002:30002 \
  --ports=3003:30003 \
  --ports=3004:30004 \
  --ports=5173:30005 \
  --ports=5174:30006 \
  --ports=5175:30007 \
  --ports=5176:30008 \
  --ports=8180:30009 \
  --ports=8025:30010
