# Orship Standalone Docker Control Boundary

Date: 2026-09-09

## Outcome

Orship now has an independent Compose setup under `.container/orship`. It can observe and control specifically labelled local Docker containers through its API and web console.

## Boundary

- Only the Orship API container mounts the host Docker socket.
- The browser calls only the Orship loopback API; it never receives Docker socket access.
- Only containers labelled `codexsun.orship.manage=true` are listed.
- The initial action set is list, start, stop, and restart.
- No arbitrary Docker endpoint, `docker exec`, filesystem crawl, remote daemon, shell session, or external Docker socket is exposed.

## Persistence

`storage/app/private/orship/docker/memory.sqlite` stores local action memory. `storage/app/private/orship/docker/actions.jsonl` retains append-only action output. The standalone Compose file mounts this storage through the `orship-storage` named volume.

## Installation flow

`setup.sh` installs Ubuntu Docker packages when they are missing and configures the Docker group. `build.sh` checks Compose syntax and builds the images. `setup.sh` builds and starts the Compose unit. `verify.sh` checks the API readiness endpoint and workload list API.

`update.sh` is the root operator entry point. It never pulls source. After an operator has updated and reviewed the checkout, it checks the worktree and Compose ownership, rebuilds only the Orship services, preserves `orship-storage`, waits for readiness, and verifies the local APIs. A failed replacement retags and restarts the images used by the previous containers.

## Version

The orchestration module is `1.3.0`; the new `orship.docker` public contract is `1.0.0`.

## Follow-up

Identity must own actor attribution and authorization before non-loopback use, remote targets, or expanded Docker capabilities are considered.

## Usage documentation

The Orship application README documents dashboard use, deployment evidence, standalone Compose setup, Docker workload labels, persistence, and local API endpoints.
