# Skill Router

Use this page before you inspect or edit source. Select every skill that matches
the requested change. A cross-boundary change needs each matching skill.

| If the change includes                                                                                         | Read this skill                                   | Also read when needed                                                                  |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| A business module, module review, manifest, event, migration, or module dependency                             | [Modular Monolith](modular-monolith.md)           | [Framework Development](framework-development.md) for framework contracts              |
| A Fastify route, request contract, validation, persistence, queue, or API module                               | [API](api.md)                                     | [Server Runtime](server-runtime.md) when startup, health, logging, or shutdown changes |
| A React workspace, view, navigation item, browser state, loading state, or shared UI use                       | [Web UI](web-ui.md)                               | [UI Template Pages](ui-template-pages.md) for package UI documentation                 |
| A shared component, block, form, table, layout, or UI gallery page                                             | [UI Template Pages](ui-template-pages.md)         | [Web UI](web-ui.md) for the consuming application                                      |
| `packages/framework`, `packages/platform-core`, lifecycle, public runtime contracts, or versioned capabilities | [Framework Development](framework-development.md) | [Modular Monolith](modular-monolith.md) for a business-module consumer                 |
| Local ports, preflight, health, process ownership, shutdown, logs, or telemetry                                | [Server Runtime](server-runtime.md)               | [API](api.md) for an API runtime                                                       |
| `.container`, runtime holder, selected builds, profiles, add-ons, Docker, or deployment                        | [Deployment Assembly](deployment-assembly.md)     | [Server Runtime](server-runtime.md) for local process changes                          |

## Required context after skill selection

1. Read the target application README.
2. Read the target module README and [module catalog](../modules/README.md).
3. Read the latest record under `assist/records/<app>`.
4. Read the matching architecture standard from [the Assist index](../README.md).
5. Preserve unrelated changes in the current worktree.

## Skill ownership

| Skill                                             | Applies to                                                             |
| ------------------------------------------------- | ---------------------------------------------------------------------- |
| [API](api.md)                                     | Every API application and public API contract                          |
| [Deployment Assembly](deployment-assembly.md)     | `.container`, `packages/runtime`, deployable applications, and add-ons |
| [Framework Development](framework-development.md) | `packages/framework` and `packages/platform-core`                      |
| [Modular Monolith](modular-monolith.md)           | Every business module and module composition root                      |
| [Server Runtime](server-runtime.md)               | Local API and web process lifecycle                                    |
| [UI Template Pages](ui-template-pages.md)         | `packages/ui` component, block, and layout documentation               |
| [Web UI](web-ui.md)                               | Every web application and shared UI composition                        |
