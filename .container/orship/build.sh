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

if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  fail "Docker Engine and Docker Compose v2 are required."
fi

info "Checking Orship Compose configuration"
docker compose -f .container/orship/compose.yaml config --quiet
info "Building Orship API and web images"
docker compose -f .container/orship/compose.yaml build
ok "Images were built"
