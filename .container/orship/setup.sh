#!/usr/bin/env sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$ROOT"

blue='\033[1;34m'
green='\033[1;32m'
yellow='\033[1;33m'
red='\033[1;31m'
reset='\033[0m'

info() { printf "${blue}[orship]${reset} %s\n" "$*"; }
ok() { printf "${green}[passed]${reset} %s\n" "$*"; }
warn() { printf "${yellow}[notice]${reset} %s\n" "$*"; }
fail() { printf "${red}[failed]${reset} %s\n" "$*" >&2; exit 1; }

require_docker() {
  command -v docker >/dev/null 2>&1 || fail "Docker Engine is required."
  if ! docker compose version >/dev/null 2>&1; then
    fail "Docker Compose v2 is required."
  fi
  if ! docker info >/dev/null 2>&1; then
    fail "Docker is installed but unavailable. Run sudo usermod -aG docker \"$USER\", then sign in again."
  fi
}

install_ubuntu_docker() {
  [ -f /etc/os-release ] && grep -qi '^ID=ubuntu' /etc/os-release || return 1
  command -v sudo >/dev/null 2>&1 || fail "sudo is required to install Docker on Ubuntu."

  info "Installing Docker Engine and Docker Compose on Ubuntu"
  sudo apt-get update
  if ! sudo apt-get install -y docker.io docker-compose-v2; then
    sudo apt-get install -y docker.io docker-compose-plugin
  fi
  sudo systemctl enable --now docker
  sudo usermod -aG docker "$USER"
  warn "Docker was installed. Sign out and sign in, then run this command again."
  exit 0
}

if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  install_ubuntu_docker || fail "Install Docker Engine and Docker Compose v2, then run this command again."
fi

info "Checking Docker Engine"
require_docker
ok "Docker Engine and Compose are ready"
info "Checking Orship Compose configuration"
docker compose -f .container/orship/compose.yaml config --quiet
ok "Compose configuration is valid"
info "Building Orship API and web images"
docker compose -f .container/orship/compose.yaml build
ok "Images were built"
info "Starting Orship containers"
docker compose -f .container/orship/compose.yaml up -d
docker compose -f .container/orship/compose.yaml ps
ok "Orship is available at http://127.0.0.1:6091"
