# Shared prerequisites

This Compose unit starts the local services required before an application install.

| Service      | Local address           | Persistent volume                    |
| ------------ | ----------------------- | ------------------------------------ |
| MariaDB      | `127.0.0.1:3307`        | `mariadb-data`                       |
| Redis        | `127.0.0.1:6379`        | `redis-data`                         |
| File Browser | `http://127.0.0.1:7090` | `filebrowser-data`, `filebrowser-db` |

Run this command from Git Bash, WSL, or Ubuntu:

```sh
bash ./.container/prerequisites/setup-prerequisites.sh
```

The script creates missing prerequisite values in the ignored root `.env` file. It preserves existing values. It starts the Compose unit and waits for all three health checks.

The containers publish only to loopback. Do not expose MariaDB or Redis on a public interface.

Use the **Prerequisites** page in Orship to change ports and credentials. Password fields are write-only. After changing a value, run the setup script again to apply it to containers.

The services share the `PREREQUISITE_NETWORK_NAME` Docker network. Future installed applications join this network and use `mariadb` or `redis` as internal host names.

The page can edit only this stack's `compose.yaml`, `Dockerfile`, and File Browser startup script. The setup script builds the File Browser image after a Dockerfile change. It does not provide arbitrary repository file access. Save changes first. Then run the verified command below to validate and apply the stack:

```sh
bash ./.container/prerequisites/setup-prerequisites.sh
```
