#!/usr/bin/env bash
set -euo pipefail

root_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
compose_file="$root_dir/.container/prerequisites/compose.yaml"
env_file="$root_dir/.env"

blue='\033[0;34m'
green='\033[0;32m'
yellow='\033[0;33m'
reset='\033[0m'

log() { printf "%b[prerequisites]%b %s\n" "$blue" "$reset" "$1"; }
ok() { printf "%b[ready]%b %s\n" "$green" "$reset" "$1"; }
warn() { printf "%b[wait]%b %s\n" "$yellow" "$reset" "$1"; }

command -v docker >/dev/null || { echo 'Docker is required.' >&2; exit 1; }
docker compose version >/dev/null || { echo 'Docker Compose v2 is required.' >&2; exit 1; }

log 'Preparing prerequisite settings in .env'
ROOT_DIR="$root_dir" node --input-type=module <<'NODE'
import { randomBytes } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const path = join(process.env.ROOT_DIR, '.env')
const source = await readFile(path, 'utf8').catch(() => '')
const defaults = {
  PREREQUISITE_FILEBROWSER_ADMIN_PASSWORD: randomBytes(24).toString('base64url'),
  PREREQUISITE_FILEBROWSER_ADMIN_USER: 'admin',
  PREREQUISITE_FILEBROWSER_IMAGE: 'filebrowser/filebrowser',
  PREREQUISITE_FILEBROWSER_PORT: '7090',
  PREREQUISITE_FILEBROWSER_TAG: 'v2.32.0',
  PREREQUISITE_MARIADB_IMAGE: 'mariadb',
  PREREQUISITE_MARIADB_PORT: '3307',
  PREREQUISITE_MARIADB_ROOT_PASSWORD: randomBytes(24).toString('base64url'),
  PREREQUISITE_MARIADB_TAG: '11.8',
  PREREQUISITE_MARIADB_USER: 'orship',
  PREREQUISITE_MARIADB_USER_PASSWORD: randomBytes(24).toString('base64url'),
  PREREQUISITE_NETWORK_NAME: 'codexsun-prerequisites',
  PREREQUISITE_REDIS_IMAGE: 'redis',
  PREREQUISITE_REDIS_PASSWORD: randomBytes(24).toString('base64url'),
  PREREQUISITE_REDIS_PORT: '6379',
  PREREQUISITE_REDIS_TAG: '8.2-alpine',
  PREREQUISITE_REDIS_USER: 'orship',
}
const pending = new Map(Object.entries(defaults))
const lines = source.split(/\r?\n/u).map((line) => {
  const key = line.match(/^([A-Z0-9_]+)=/u)?.[1]
  if (key) pending.delete(key)
  return line
})
if (pending.size) {
  if (lines.at(-1) !== '') lines.push('')
  lines.push('# === Shared prerequisites ===')
  for (const [key, value] of pending) lines.push(`${key}=${value}`)
}
await writeFile(path, `${lines.join('\n').replace(/\n+$/u, '')}\n`, 'utf8')
NODE

log 'Validating Compose configuration'
docker compose --env-file "$env_file" -f "$compose_file" config --quiet
log 'Building and starting MariaDB, Redis, and File Browser'
docker compose --env-file "$env_file" -f "$compose_file" up -d --build

for attempt in $(seq 1 24); do
  healthy=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' \
    orship-mariadb orship-redis orship-filebrowser 2>/dev/null | grep -cx healthy || true)
  if [ "$healthy" = '3' ]; then
    ok 'MariaDB, Redis, and File Browser are healthy'
    exit 0
  fi
  warn "Waiting for service health ($attempt/24)"
  sleep 5
done

docker compose --env-file "$env_file" -f "$compose_file" ps >&2
echo 'Prerequisites did not become healthy.' >&2
exit 1
