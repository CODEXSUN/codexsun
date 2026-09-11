# Orship Shared Prerequisites

Date: 2026-09-11

Orship now prepares the shared local services before an application install.

## Decision

MariaDB, Redis, and File Browser are one persistent Compose unit at `.container/prerequisites`.

Each service binds only to `127.0.0.1`. Application installation must wait until all three Docker health checks report healthy.

The root ignored `.env` file stores prerequisite ports and credentials. The browser never receives stored passwords. It can only submit replacement values through a loopback-only API route.

The stack uses one named Docker network. MariaDB and Redis have service-owned application users. The browser may edit image names and versions.

The browser may edit only the prerequisite `compose.yaml`, `Dockerfile`, and File Browser startup script. It does not execute a browser-triggered build. Operators run the verified setup script after a source change.

## Ownership

| Owner                      | Responsibility                                             |
| -------------------------- | ---------------------------------------------------------- |
| `.container/prerequisites` | Compose services, volumes, health checks, and setup script |
| Orship API                 | Docker health observation and local settings updates       |
| Orship web                 | Prerequisite health and write-only settings page           |
| App Installer              | Blocks a plan until prerequisites are healthy              |

## Verification

- `setup-prerequisites.sh` created missing local configuration and reported all services healthy.
- MariaDB and Redis health checks passed.
- File Browser served its local HTTP application and Docker health check passed.
- Orship contracts, API, and web builds passed.
