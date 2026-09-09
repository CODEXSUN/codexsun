# Docs Library Web Module

## Purpose

Displays the Docs API library in a responsive, keyboard-operable MDI workspace.

## Identity and version

- Module ID: `docs.library.web`
- Version: `0.1.1`
- Scope: `docs`
- Status: `active`

## Ownership

- Routes and UI paths: the Docs web root.
- User flows: start from the ordered repository index, search titles/tags/aliases/paths, open a hash-deep-linked document, follow linked notes, inspect backlinks and tag-related notes, use a document outline, and open the Ideas development-plan tab.
- Index grouping: Overview is a direct, clickable entry that clears any document selection and opens the repository index. Assists groups guidance by area, and each application or package groups documents by its owned surface and folder path. A module file is always a selectable leaf. Runtime and Repository contain the remaining owned documents. The sidebar and landing page use this one shared ordering model.
- Sidebar tree: shared MDI navigation supports nested, keyboard-operable child headers. Opening a deep-linked document expands every ancestor; the global search palette indexes selectable leaves only.
- Sidebar identity: every top-level documentation group uses a semantic icon for its owned area instead of the shared fallback grid icon.
- Reader header: the header strip shows the selected document name and repository path. Tooltip-backed icon actions open the editor, share the document link with a clipboard fallback, and copy the source path.
- Editor: the header Edit action opens a Docs-owned drill-down upsert page. It uses the DevKit TipTap write pattern with an authoritative Markdown mode, explicit Save and Back controls, and a stale-source conflict message.
- Reader navigation: the shared UI template navigation block provides previous and next document links at the bottom of each document.
- Page tone: the Index and Ideas views use a centered 80-percent content lane. The reader uses the full available workspace: a flexible article column and a fixed, sticky outline column at the right edge. The narrow-screen layout hides the outline and retains one readable column.
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
