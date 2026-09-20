# CXForge Manual Maintenance

Run all commands from the repository root.

## Requirements

Install Docker with the Compose plugin before you run these scripts.

The scripts use the `cxforgefresh` Compose project. They connect CXForge to the shared `codexsun-network` network.

## Install CXForge

Run the setup script:

```sh
sh apps/cxforge/.container/cxforge-setup.sh
```

The setup script performs these actions:

1. Check Docker and Docker Compose.
2. Create `codexsun-network` when the network does not exist.
3. Read the release number from `apps/cxforge/VERSION`.
4. Build the CXForge image.
5. Start the CXForge container.
6. Wait until the container becomes healthy.
7. Show the version, container ID, API URL, and preview ports.

Use a clean build when old Docker layers must not affect the installation:

```sh
CXFORGE_NO_CACHE=true sh apps/cxforge/.container/cxforge-setup.sh
```

### Bootstrap the shared checkout

Set a repository URL and token file when the first setup must prepare a working repository:

```sh
CXFORGE_BOOTSTRAP_REPOSITORY=https://github.com/example/product.git \
CXFORGE_BOOTSTRAP_GIT_TOKEN_FILE=/secure/path/github-token \
CXFORGE_BOOTSTRAP_BRANCH=main \
sh apps/cxforge/.container/cxforge-setup.sh
```

The setup sends the token to the local CXForge API. CXForge encrypts the token before it saves the Git connection.

The setup clones directly into `/workspace/repo`. Later setup runs keep the existing repository registration and checkout. All tasks execute serially in this checkout. No mirror or workspace volume is required.

Use these optional values:

- `CXFORGE_BOOTSTRAP_NAME` sets the repository profile name.
- `CXFORGE_BOOTSTRAP_PROVIDER` sets the Git provider. The default is `github`.
- `CXFORGE_BOOTSTRAP_USERNAME` sets the HTTPS Git username.
- `CXFORGE_BOOTSTRAP_REPOSITORY_PATTERN` sets the repository allowlist pattern.
- `CXFORGE_BOOTSTRAP_PUSH=true` grants branch push permission.

Keep push disabled when CXForge only needs clone and pull access.

## Update CXForge

Run the update script during local development:

```sh
sh apps/cxforge/.container/cxforge-update.sh
```

The update script stops the container, backs up `/workspace`, recreates the container, and restores the backup before starting it. The printed backup path is retained for recovery and contains sensitive state. A normal Docker restart retains files; direct container removal does not. Old per-task checkouts require manual migration before use.

The image version contains these values:

- The release number from `apps/cxforge/VERSION`.
- The first 12 characters of the current Git commit SHA.
- The `-dirty` suffix when `apps/cxforge` has uncommitted changes.

An update version can look like this:

```text
1.0.0-a1b2c3d4e5f6-dirty
```

The update script rebuilds the image, recreates the container, and waits for a healthy result.

## Remove CXForge

Run the drop script:

```sh
sh apps/cxforge/.container/cxforge-drop.sh
```

The script asks you to type this confirmation:

```text
DROP CXFORGE
```

The drop script permanently removes these resources:

- The CXForge container.
- The `cxforgefresh` Compose project resources.
- CXForge task and repository volumes.
- Unused local images from the configured CXForge image repository.

The script does not remove `codexsun-network`. Other applications can continue to use this shared network.

For an unattended drop, set the confirmation variable:

```sh
CXFORGE_CONFIRM_DROP=yes sh apps/cxforge/.container/cxforge-drop.sh
```

## Purge the Docker build cache

Docker cannot identify build cache that belongs only to CXForge.

Use this option only when deleting the shared cache for every Docker project is acceptable:

```sh
CXFORGE_CONFIRM_DROP=yes \
CXFORGE_PURGE_GLOBAL_BUILD_CACHE=true \
sh apps/cxforge/.container/cxforge-drop.sh
```

For a fresh CXForge installation without deleting shared cache, run these commands:

```sh
CXFORGE_CONFIRM_DROP=yes sh apps/cxforge/.container/cxforge-drop.sh
CXFORGE_NO_CACHE=true sh apps/cxforge/.container/cxforge-setup.sh
```

## Service addresses

- API: `http://127.0.0.1:6400`
- Health: `http://127.0.0.1:6400/api/v1/cxforge/health`
- Preview ports: `http://127.0.0.1:7300` through `http://127.0.0.1:7303`

## Check the installation

Check the container:

```sh
docker ps --filter name=cxforge
```

Check the public health endpoint:

```sh
curl --fail http://127.0.0.1:6400/api/v1/cxforge/health
```

Check the container logs:

```sh
docker logs --tail 100 cxforge
```

Check the shared network:

```sh
docker network inspect codexsun-network
```

## Script files

- Setup: `apps/cxforge/.container/cxforge-setup.sh`
- Update: `apps/cxforge/.container/cxforge-update.sh`
- Drop: `apps/cxforge/.container/cxforge-drop.sh`
- Compose: `apps/cxforge/.container/compose.yml`
- Release number: `apps/cxforge/VERSION`
