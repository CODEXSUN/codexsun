#!/usr/bin/env sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$ROOT"

blue='\033[1;34m'
green='\033[1;32m'
red='\033[1;31m'
reset='\033[0m'

info() { printf "${blue}[orship]${reset} %s\n" "$*"; }
ok() { printf "${green}[passed]${reset} %s\n" "$*"; }
fail() { printf "${red}[failed]${reset} %s\n" "$*" >&2; exit 1; }

if ! command -v curl >/dev/null 2>&1; then
  fail "curl is required for verification."
fi

info "Checking Orship containers"
docker compose -f .container/orship/compose.yaml ps
info "Checking Orship API readiness"
curl --fail --silent --show-error http://127.0.0.1:6090/health/ready
info "Checking the Docker workload API"
curl --fail --silent --show-error http://127.0.0.1:6090/api/orship/v1/docker/containers
ok "Verification passed. Add codexsun.orship.manage=true to a container to expose it in Orship."
