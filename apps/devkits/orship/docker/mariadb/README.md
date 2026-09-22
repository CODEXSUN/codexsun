# MariaDB operations module

This module is independent of the Orship API. It provides a custom MariaDB image, a configuration template, a manual shell command surface, and a Go wrapper for repeatable local or hosted operations.

## Setup

```bash
cd apps/devkits/orship/docker/mariadb
cp mariadb.env.example mariadb.env
docker network inspect codexsun-network >/dev/null 2>&1 || docker network create codexsun-network
./scripts/mariadb-setup.sh build mariadb.env
./scripts/mariadb-setup.sh install mariadb.env
```

Use a real secret outside the repository. Set `MARIADB_BIND_ADDRESS=0.0.0.0` only when remote clients are required, then restrict access with a firewall or private network. The container is not a security boundary.

## Commands

```bash
./scripts/mariadb-setup.sh status mariadb.env
./scripts/mariadb-setup.sh start mariadb.env
./scripts/mariadb-setup.sh stop mariadb.env
./scripts/mariadb-setup.sh restart mariadb.env
./scripts/mariadb-setup.sh backup mariadb.env
./scripts/mariadb-setup.sh restore mariadb.env backups/file.sql.gz
./scripts/mariadb-setup.sh backup-loop mariadb.env
./scripts/mariadb-setup.sh drop mariadb.env
./scripts/mariadb-setup.sh purge mariadb.env
./scripts/mariadb-setup.sh reinstall mariadb.env
```

`drop` removes the container and data volume but preserves backups. `purge` also removes the backup volume. `reinstall` is destructive and creates a fresh database while preserving the backup volume. Backups use `mariadb-dump --all-databases --single-transaction --routines --events --triggers` and are compressed with gzip.

## Go wrapper

```bash
go run ./cmd/orship-mariadb --config ./mariadb.env install
go run ./cmd/orship-mariadb --config ./mariadb.env backup
go run ./cmd/orship-mariadb --configs ./mariadb.instances.example.json install-all
```

The Go command delegates to the same checked-in POSIX shell implementation, so manual and automated operations have one behavior. It requires Docker and a POSIX shell. On Windows, run it from Git Bash or WSL.
