# UI Design System Agent Contract

This document points agents to the single shared UI contract and prevents UIUX from becoming an application feature owner.

## Where to start

Use `@codexsun/ui/design-system` for typed discovery. The package registries and `designSystemManifest` are the only source of truth for reusable components, blocks, pages, and templates. Use `npm run ui:mcp` when the agent is operating through MCP.

## MCP tools

The stdio server exposes four narrow operations:

| Tool                    | Purpose                                                              |
| ----------------------- | -------------------------------------------------------------------- |
| `ui.list_assets`        | Search package-owned assets by kind or query.                        |
| `ui.get_asset`          | Read the source path, description, ownership, default, and variants. |
| `ui.resolve_variant`    | Resolve a requested variant or the package default.                  |
| `ui.validate_selection` | Validate a complete selection before generating application code.    |

The `ui://manifest` resource is read-only and contains the same normalized contract.

## Composition rules

1. Discover the asset and resolve its variant before writing UI code.
2. Import the resolved asset from its public `@codexsun/ui/...` path.
3. Keep business data, field rules, routes, permissions, persistence, and workflows in the application module.
4. Pass typed data and callbacks into the shared UI block.
5. Do not import UIUX source, add application APIs to UIUX, or create an app-local copy of a shared block.

## UIUX role

UIUX is a gallery. It provides browser previews, examples, and visual comparisons only. It does not own feature behavior or durable state. A registered package asset should have a reachable UIUX route; a generic contract preview is acceptable until a bespoke specimen is added.

## Variant migration

Templates are included in `DesignSystemSelection`, so an application can move from master-list v1 to v3 by changing the template variant while retaining its application-owned data and callbacks. The migration must not fork business flow or duplicate package UI.

## Verification

Run the package tests and `node tools/check-root-layout.mjs`. Treat package typecheck failures caused by unrelated legacy dependency declarations separately from manifest and MCP validation. A valid design-system change must pass `validateDesignSystemManifest()` and the focused design-system tests.
