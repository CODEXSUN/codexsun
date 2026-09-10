# Docs Library Web Module

## Purpose

Displays the Docs API library in a responsive, keyboard-operable MDI workspace.

## Identity and version

- Module ID: `docs.library.web`
- Version: `0.1.2`
- Scope: `docs`
- Status: `active`

## Ownership

- Routes and UI paths: the Docs web root.
- User flows: start from the ordered repository index, search titles/tags/aliases/paths, open a hash-deep-linked document, follow linked notes, inspect backlinks and tag-related notes, use a document outline, and open the Ideas development-plan tab.
- Index grouping: Overview is a direct, clickable entry that clears any document selection and opens the repository index. Assists groups guidance by area, and each application or package groups documents by its owned surface and folder path. A module file is always a selectable leaf. Runtime and Repository contain the remaining owned documents. The sidebar and landing page use this one shared ordering model.
- Sidebar tree: shared MDI navigation supports nested, keyboard-operable child headers. Opening a deep-linked document expands every ancestor; the global search palette indexes selectable leaves only.
- Sidebar identity: every top-level documentation group uses a semantic icon for its owned area instead of the shared fallback grid icon.
- Reader header: the header strip shows the selected document name and repository path. Tooltip-backed icon actions open the editor, share the document link with a clipboard fallback, and copy the source path.
- Ideas header: each code-owned Idea shows its source path and supports sharing or copying that path. It does not expose a document editor because Ideas are not vault documents.
- Editor: the header Edit action opens a Docs-owned drill-down upsert page. It uses the DevKit TipTap write pattern with an authoritative Markdown mode, explicit Save and Back controls, and a stale-source conflict message.
- Reader navigation: the shared UI template navigation block provides previous and next document links at the bottom of each document.
- Page tone: the Index and Ideas views use a centered 80-percent content lane. The reader uses the full available workspace: a flexible article column and a fixed, sticky outline column at the right edge. The narrow-screen layout hides the outline and retains one readable column.
- Ownership map: package and application cards share the centered icon-over-title card treatment. The application row keeps every current app, including Orship, on one wide-screen row and wraps progressively on narrower screens.
- Client behavior: the web module preserves a rendered-document cache during navigation and aborts stale requests to prevent reader flicker.
- Reader styling: GitHub-Flavored Markdown tables use a scrollable table surface. Inline snippets use compact muted pills. Fenced code samples use highlighted, copyable, high-contrast surfaces. Mermaid flowchart fences render as safe Docs-owned SVG diagrams.
- Article assets: Markdown image paths resolve through the Docs API. Store repository-owned images below an `assets` folder near their articles. See [article assets](../../../../../../assist/assets/README.md).
- Settings: `VITE_DOCS_API_URL` overrides the local Docs API; development defaults to `http://127.0.0.1:6030`. The shared Settings entry opens the read-only Documentation health scan. It reports missing README files and unorganized Markdown, MDX, and text sources without moving or changing them.

## Public contracts and verification

- API: consumes `@codexsun/docs-contracts` only through the Docs HTTP API.
- Dependencies: shared `@codexsun/ui` layout, Table primitive, and versioned Docs API routes.
- Browser verification needs both Docs runtimes running locally.

## Interface topology

The module owns the Library, reader, overview, unavailable, and Ideas topology.
Ideas navigation includes Development plan, Architecture standards, and Shared packages and apps.
The registry includes reader connections, overview metrics, delivery, architecture, shared UI,
application ownership, and monorepo child items.

## Development records

- [Documentation Workspace layout](../../../../../../assist/records/docs/2026-09-09-documentation-workspace-layout.md)

Future changes must be recorded in the [Docs development records](../../../../../../assist/records/docs/README.md).

- [2026-09-08 Cross-app interface topology](../../../../../../assist/records/platform/2026-09-08-cross-app-interface-topology.md)
