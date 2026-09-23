# Orship Docker Manager

This Go service connects Orship to the local Docker Engine API through `/var/run/docker.sock`.

The service lists containers and supports start, stop, and restart. Its HTTP API listens on port `6302` inside the Orship compose network. The compose stack does not publish this port on the host; authenticated requests pass through the Orship API.

`ORSHIP_DOCKER_TOKEN` must match in the API and manager environments. The local compose file supplies a development value. Use a private value for any hosted environment.

The mounted Docker socket grants broad control of the host Docker daemon. Keep this manager on a private network and give Orship access only on hosts intended for Orship operations.

Reusable MariaDB operations live in the `mariadb` directory. That module can be run without the Orship API through `scripts/mariadb-setup.sh` or `go run ./cmd/orship-mariadb`. It supports custom image settings, multiple env-file installs, remote bind addresses, health checks, compressed full backups, restore, retention cleanup, and periodic backup loops.
