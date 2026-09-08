# Docs Library Web Module

## Purpose

Displays the Docs API library in a responsive, keyboard-operable MDI workspace.

## Identity and version

- Module ID: `docs.library.web`
- Version: `0.1.0`
- Scope: `docs`
- Status: `active`

## Ownership

- Routes and UI paths: the Docs web root.
- User flows: start from the library overview, search titles/tags/aliases/paths, open a hash-deep-linked document, follow linked notes, inspect backlinks and tag-related notes, use a document outline, and open the Ideas development-plan tab.
- Client behavior: the web module preserves a rendered-document cache during navigation and aborts stale requests to prevent reader flicker.
- Reader styling: inline snippets use compact muted pills; fenced code samples use a separate high-contrast, scrollable code surface.
- Settings: `VITE_DOCS_API_URL` overrides the local Docs API; development defaults to `http://127.0.0.1:6030`.

## Public contracts and verification

- API: consumes `@codexsun/docs-contracts` only through the Docs HTTP API.
- Dependencies: shared `@codexsun/ui` sidebar block and versioned Docs API routes.
- Browser verification needs both Docs runtimes running locally.

## Interface topology

The module owns the Library, reader, overview, unavailable, and Ideas topology.
The registry includes outlines, connections, metrics, flow, ownership, delivery,
and guardrail child items.

## Development records

Future changes must be recorded in the [Docs development records](../../../../../../assist/records/docs/README.md).

- [2026-09-08 Cross-app interface topology](../../../../../../assist/records/platform/2026-09-08-cross-app-interface-topology.md)
