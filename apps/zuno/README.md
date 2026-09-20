# Zuno

This application owns its product modules and composition.

Run dependency installation only from the repository root. The app never owns a node_modules, dist, or .turbo directory.

## GitHub pull requests

Set `ZUNO_GITHUB_TOKEN` on the Zuno API server. The token must have permission to create and merge pull requests.

Set `ZUNO_GITHUB_API_URL` only when you use GitHub Enterprise Server. The default value is `https://api.github.com`.

CXForge must publish the task branch before Zuno creates the pull request. Set `CXFORGE_GIT_TOKEN` in the CXForge deployment for HTTPS remotes.

## Local CXForge runtime

Zuno owns the local CXForge development runtime. Orship does not manage this runtime.

Open the CXForge server in Zuno. Select the **Runtime** tab to install, build, start, restart, or stop the local container.

Use **Rebuild & apply** to build the image and replace the running container. The named volumes keep task state and workspaces.

Zuno uses only this Compose project:

```text
Project: cxforgefresh
Compose file: apps/cxforge/.container/compose.yml
Container: cxforge
```

The runtime view shows Docker and Compose versions. It also shows the Go, Node.js, npm, Python, and Git versions in the container.

Zuno does not accept a command, file path, project name, or container name from the browser. The API uses fixed values for each Docker operation.

## Local Docker installation

The local Docker profile runs the Zuno API and web application. It joins the same `codexsun-network` as CXForge.

Stop the host Zuno development servers before you start this profile. The profile uses ports `6410` and `6411`.

```sh
sh apps/zuno/.container/zuno-setup.sh
```

Open `http://127.0.0.1:6411` after both containers become healthy.

`apps/zuno/VERSION` owns the development image version. Use the update script for regular development deployments. It rebuilds and recreates the containers without deleting application data.

```sh
sh apps/zuno/.container/zuno-update.sh
```

Use the drop script before a completely fresh installation. It stops the Zuno project and removes its containers, named volumes, and locally built images. It keeps the shared external Docker network.

```sh
sh apps/zuno/.container/zuno-drop.sh
sh apps/zuno/.container/zuno-setup.sh
```

The API stores identity and Zetro handoff data in the `zunolocal_zuno-data` volume. Updates keep this volume; dropping the installation deletes it.

The local API mounts the Docker socket and this repository as read-only. This lets its fixed runtime manager maintain the CXForge development container. Do not use this profile on a shared or production host.

For isolated local runs, override `ZUNO_COMPOSE_PROJECT`, `ZUNO_API_HOST_PORT`, `ZUNO_WEB_HOST_PORT`, `ZUNO_API_CONTAINER_NAME`, and `ZUNO_WEB_CONTAINER_NAME` before invoking a script.
