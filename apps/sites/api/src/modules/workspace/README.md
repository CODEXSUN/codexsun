# Sites Workspace Module

This module owns client workspaces, isolated environment metadata, deployment records, and handoff delivery data for Sites Studio.

The module centralizes operational control without centralizing client runtime data. Each client environment keeps its own runtime, database, storage, source reference, release tag, and deployment history.

The provider supports a safe `record-only` mode and a local `docker` mode. Docker mode generates a client/environment-specific Compose project with separate image tags, database path, project name, network, and volume. It runs the client migration preparation before starting the API and web services.

Set `SITES_DEPLOYMENT_PROVIDER=docker` only on a host where Docker Compose is available. The control plane remains separate from the generated client runtime database.

## Client handoff delivery data

The delivery store adds a repeat-safe `sites.workspace.002` migration for developer profiles, client work-plan items, action reports, and handoff notes. Every record is keyed by client slug, so a developer can update one client brief, design lane, review queue, or launch checklist without changing another client's concept.

Sites Studio exposes this data through protected delivery, work-plan, action-report, and handoff routes. The web workspace is the working handoff surface; it does not replace the client source repository or runtime database.
