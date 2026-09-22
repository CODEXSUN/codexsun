#!/usr/bin/env sh
set -eu

script_dir="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
repository_root="$(CDPATH='' cd -- "$script_dir/../../.." && pwd)"
compose_file="$script_dir/docker-compose.yml"
project_name="${QCAFE_COMPOSE_PROJECT:-qcafe}"

compose() {
  docker compose \
    --project-name "$project_name" \
    --env-file "$repository_root/.env" \
    --env-file "$repository_root/apps/qcafe/api/.app.env" \
    --file "$compose_file" \
    "$@"
}

wait_for_service() {
  service="$1"
  attempts=0
  while [ "$attempts" -lt 45 ]; do
    container_id="$(compose ps -q "$service")"
    if [ -n "$container_id" ]; then
      health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id")"
      [ "$health" = "healthy" ] && return 0
    fi
    attempts=$((attempts + 1))
    sleep 2
  done
  compose logs --tail 80 "$service" >&2 || true
  printf 'Q Cafe service did not become healthy: %s\n' "$service" >&2
  return 1
}

database_counts() {
  compose exec -T api node -e '
    const { DatabaseSync } = require("node:sqlite");
    const app = new DatabaseSync(process.env.QCAFE_SQLITE_PATH, { readOnly: true });
    const identity = new DatabaseSync(process.env.QCAFE_IDENTITY_DATABASE_PATH, { readOnly: true });
    const lifecycle = app.prepare("SELECT COUNT(*) AS count FROM platform_lifecycle_state").get().count;
    const users = identity.prepare("SELECT COUNT(*) AS count FROM identity_users").get().count;
    app.close(); identity.close();
    process.stdout.write(`${lifecycle}:${users}`);
  '
}

command -v docker >/dev/null 2>&1 || {
  printf 'Docker is required to verify Q Cafe.\n' >&2
  exit 1
}
docker info >/dev/null
docker compose version >/dev/null

wait_for_service api
wait_for_service web
compose exec -T api node -e "fetch('http://127.0.0.1:6220/api/v1/qcafe/health').then(async response=>{const body=await response.json();if(!response.ok||body.status!=='ok')process.exit(1)}).catch(()=>process.exit(1))"
compose exec -T web wget -qO- http://127.0.0.1/api/v1/qcafe/health >/dev/null

before="$(database_counts)"
lifecycle="${before%%:*}"
users="${before##*:}"
[ "$lifecycle" -gt 0 ] || { printf 'No lifecycle records were found.\n' >&2; exit 1; }
[ "$users" -gt 0 ] || { printf 'No identity users were found.\n' >&2; exit 1; }

if [ "${1:-}" != "--no-restart" ]; then
  printf 'Restarting the API to verify SQLite persistence...\n'
  compose restart api >/dev/null
  wait_for_service api
  after="$(database_counts)"
  [ "$before" = "$after" ] || {
    printf 'Database counts changed across restart: before=%s after=%s\n' "$before" "$after" >&2
    exit 1
  }
fi

printf 'Q Cafe containers are healthy. SQLite lifecycle records=%s identity users=%s.\n' "$lifecycle" "$users"
printf 'Web: http://127.0.0.1:%s\n' "${QCAFE_WEB_PUBLISHED_PORT:-6221}"
printf 'API: http://127.0.0.1:%s/api/v1/qcafe/health\n' "${QCAFE_API_PUBLISHED_PORT:-6220}"
compose ps
