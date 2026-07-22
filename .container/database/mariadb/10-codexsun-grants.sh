#!/usr/bin/env bash
set -euo pipefail

# CODEXSUN provisions one database per tenant. The deployment app user needs
# dynamic database lifecycle privileges and remains isolated inside this server.
# This file is both a first-initialization hook and a setup-time reconciliation.
apply_grants() {
  if declare -F docker_process_sql >/dev/null 2>&1; then
    docker_process_sql
  else
    mariadb --protocol=socket -uroot -p"${MARIADB_ROOT_PASSWORD}"
  fi
}

db_user=${CODEXSUN_DB_USER:-codexsun_app}
db_password=${CODEXSUN_DB_PASSWORD:-${MARIADB_ROOT_PASSWORD}}
if [[ "$db_user" == "root" ]]; then
  echo "CODEXSUN_DB_USER must be a dedicated non-root account." >&2
  exit 1
fi
escaped_user=$(printf '%s' "$db_user" | sed "s/'/''/g")
escaped_password=$(printf '%s' "$db_password" | sed "s/'/''/g")

apply_grants <<SQL
CREATE USER IF NOT EXISTS '${escaped_user}'@'%' IDENTIFIED BY '${escaped_password}';
ALTER USER '${escaped_user}'@'%' IDENTIFIED BY '${escaped_password}';
DROP USER IF EXISTS 'root'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX, REFERENCES,
  CREATE TEMPORARY TABLES, LOCK TABLES, EXECUTE, CREATE VIEW, SHOW VIEW,
  CREATE ROUTINE, ALTER ROUTINE, EVENT, TRIGGER
  ON *.* TO '${escaped_user}'@'%';
FLUSH PRIVILEGES;
SQL
