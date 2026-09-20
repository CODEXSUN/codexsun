# Orship Docker Samples

`mariadb.json` is based on the MariaDB definition in `apps/temp/cxapp/.container/database/mariadb/docker-compose.yml` and its sample deployment values.

The sample uses MariaDB 11.8, the external `codexsun-network`, persistent data and backup volumes, and loopback host port `3308`. The container is named `orship-mariadb-sample` so it can run beside CXApp's `cxapp-mariadb` on host port `3307`.

The password is for local testing only. Set `ORSHIP_MARIADB_SAMPLE_ROOT_PASSWORD` before hosted use.
