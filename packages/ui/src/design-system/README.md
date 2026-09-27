# CODEXSUN UI Design System Contract

This document defines the package-owned design-system contract that agents and applications use to discover, select, and compose shared UI.

## Source of truth

`@codexsun/ui/design-system` is the source of truth. The block, component, page, and template registries define the available assets, their variants, and their public import paths. Do not copy registry entries into an application or into UIUX.

`designSystemManifest` is the normalized agent-facing view. It includes an asset kind, stable id, description, default variant, variant descriptions, source import, and ownership boundary. `validateDesignSystemManifest()` must remain green when a registry changes.

## Ownership boundary

The package owns visual structure, semantic styling, accessibility defaults, and typed UI callbacks. An application owns business data, field definitions and validation, routes and permissions, persistence, and workflows. A block is a reusable rendering contract; it is not a business feature or a data provider.

## MCP discovery

Run `npm run ui:mcp` to start the stdio MCP surface. The server exposes:

- `ui.list_assets` to search the normalized manifest.
- `ui.get_asset` to inspect one asset and its ownership contract.
- `ui.resolve_variant` to resolve a requested or default variant.
- `ui.validate_selection` to reject unknown assets and variants before code generation.
- `ui://manifest` as a read-only manifest resource.

Agents should discover an asset, resolve its variant, and then generate application composition around the public import. They must not infer business behavior from a visual specimen.

## Selection contract

`createDesignSystemSelection()` resolves blocks, components, pages, and templates together. A requested id or variant that is not in its registry is rejected. Templates are included so a page can change from v1 to v3 without changing its application-owned data flow.

## UIUX boundary

UIUX is a visual gallery only. It renders package assets and examples for inspection, documentation, and variant comparison. It must not become a feature owner, add durable data, or define an alternate design-system registry. If an asset is registered in the package, UIUX should provide a reachable visual route or a contract preview.

## Agent composition workflow

1. Discover the asset through MCP or `@codexsun/ui/design-system`.
2. Resolve the requested variant and inspect its public source path.
3. Keep business data, routes, permissions, persistence, and workflows in the consuming application.
4. Pass typed data and callbacks into the package-owned UI.
5. Verify the manifest and the consuming application build/typecheck.
