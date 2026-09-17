# Docs Agent Skills

## Purpose

Use this guide for all work in the Docs application.

Docs is the global CODEXSUN documentation application. It discovers Markdown
and MDX files in place. It gives users a connected repository view.

## Required Reading

Read these files before you change Docs:

1. `assist/README.md`
2. `assist/architecture/module-architecture.md`
3. `assist/architecture/contracts-and-events.md`
4. `assist/documentation/README.md`
5. `assist/documentation/standards.md`
6. `assist/execution/docs-planning.md`
7. `assist/execution/docs-task.md`
8. The README for each Docs module that you change.

## Scope And Ownership

Docs owns document discovery, parsing, indexing, retrieval, rendering,
navigation, backlinks, tags, and graph metadata.

Docs reads source files. Docs does not move, rename, rewrite, or delete source
documents unless a reviewed task explicitly permits that action.

Docs source authority stays with the file owner. SQLite stores a derived Docs
index. It is not an authoring store.

The Docs application owns these paths:

```text
apps/docs/api/
apps/docs/web/
apps/docs/agent/
storage/apps/private/docs/
storage/apps/public/docs/
```

## Source Discovery

Discover these document sources dynamically:

- `assist/**/*.md`
- `apps/**/README.md`
- `packages/**/README.md`
- `deployment/**/*.md`
- root `README.md`
- `apps/docs/content/**/*.md`
- `apps/docs/content/**/*.mdx`

Do not scan `node_modules`, `.git`, `dist`, `storage`, generated output,
environment files, or binary files.

Use paths relative to the repository root as stable document identities. Use
forward slashes in stored paths and API slugs.

Treat a missing, unreadable, or invalid document as an indexed error. Show the
error without stopping the rest of the index.

## Markdown And MDX

Parse standard Markdown headings, links, images, code blocks, tables, lists,
front matter, and anchors.

Support MDX files through a restricted rendering pipeline. Do not execute
arbitrary imports, JavaScript expressions, or server-side code from a document.
Record unsupported MDX syntax as a document diagnostic.

Use the first H1 heading as the title when front matter has no title. Build a
stable anchor slug for each heading. Keep duplicate heading anchors unique.

## Links And Graphs

Resolve these link types:

- Relative Markdown links such as `[Plan](../execution/docs-planning.md)`.
- Same-document anchors such as `#phase-one`.
- Cross-document anchors such as `planning.md#phase-one`.
- Obsidian wikilinks such as `[[Docs Planning]]`.
- Obsidian aliased links such as `[[docs-planning|Docs plan]]`.

Resolve relative links from the source document path. Resolve a wikilink by
exact normalized title first, then by a unique normalized slug.

Record an unresolved or ambiguous link as a diagnostic. Keep it visible in the
rendered document and graph result.

Create graph nodes for indexed documents. Create directed graph edges for
resolved cross-document links. Derive backlinks from incoming edges. Do not
infer links from plain text.

## SQLite Index

Use SQLite as a replaceable, derived index. A full sync can delete stale index
records and rebuild them from the current source tree.

Keep document content, source metadata, headings, tags, links, backlinks, and
diagnostics in Docs-owned tables. Use one transaction per index sync.

Enable foreign keys, WAL mode, and a five-second busy timeout. Validate every
stored repository path remains inside the repository root.

Never store secrets, ignored environment values, or source outside the allowed
discovery roots.

## Public API And Web Rules

Expose versioned Docs contracts. Validate API input with Zod before a
controller calls a Docs service.

Keep the API read-only except for an explicit index-sync action. Protect any
future write action with a reviewed authorization contract.

The web application loads document trees, documents, backlinks, diagnostics,
and graph data from public Docs APIs. It must show a useful overview when the
API or one document is unavailable.

Use `@codexsun/ui` public exports. Do not import private package files or UIUX.

## Verification

For each Docs change, run the checks named in the active Docs task. At minimum:

1. Run Docs API type checks and tests.
2. Run Docs web type checks and tests.
3. Test Markdown, MDX, anchors, wikilinks, backlinks, and broken links.
4. Test SQLite sync, stale-record removal, and path traversal rejection.
5. Verify the document tree, overview, document view, backlinks, and graph in a browser.
6. Run `npm.cmd run check:module-boundaries` and `git diff --check`.

Report static evidence, live evidence, and untested paths separately.
