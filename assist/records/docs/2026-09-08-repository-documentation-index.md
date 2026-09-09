# Repository Documentation Index

## Outcome

Docs now indexes every Markdown and MDX file in the current repository. The
landing page and sidebar use one ordered group model.

## References and ownership

- API owner: [Docs Library API](../../../apps/docs/api/src/modules/docs-library/README.md)
- Web owner: [Docs Library web](../../../apps/docs/web/src/modules/docs-library/README.md)
- Contract: existing `GET /api/docs/v1/documents` response from `@codexsun/docs-contracts`

## Binding

The Docs API discovers source files below the repository root. It excludes Git,
dependency, generated, coverage, and storage directories. The Docs web module
groups returned document paths for both navigation and the landing-page index.
The top-level Overview item is a direct navigation destination. It clears the
selected document state and returns to the repository index without an extra
Index child row.
The reader header follows the UI template page pattern. It shows the selected
document name and source path, with icon actions for opening the editor,
sharing the document link, and copying the path. Native sharing falls back to
copying the link when unavailable.
The Edit action opens a Docs-owned drill-down upsert page. It presents a
TipTap write surface and a Markdown source mode, saves through a versioned PUT
contract, preserves the existing source ownership and front matter, and rejects
stale source hashes with a conflict response.
The reader ends with shared previous and next controls. They use the same ordered
repository groups as the index and sidebar.
The library groups all `assist` files under Assists. It groups application notes
by application and labels module notes with their API or Web owner.
The shared MDI sidebar renders these groups as a nested tree: Assists → area →
file and application/package → surface or folder → file. A module note remains
the final selectable leaf, so no documentation becomes hidden behind a header.
The global search palette recursively indexes only selectable document leaves.
Each top-level navigation group uses a semantic icon for its documentation owner.
The Index and Ideas views use a centered 80-percent content lane. The reader
uses the full workspace width, with a flexible central article and a sticky
right-edge outline. The outline is hidden below the desktop breakpoint.

## Decision

Keep documents in their owning folders. The Docs library stores metadata and
links to source paths instead of copying or moving documentation.

## Verification

- Passed Docs API and web type checks.
- Passed Docs API and web production builds.
- Restarted the managed Docs stack successfully.
- Confirmed `GET /health` and `GET /api/docs/v1/documents` return successfully;
  the document index contained 114 sources, including repository guidance and
  application documentation.
- Confirmed the Docs browser renders the ordered repository index and grouped
  sidebar navigation.
- Confirmed the Docs browser opens the Assists → Skills child header for the
  active deep-linked Framework Development document and exposes its leaf links.
- Passed the shared UI and Docs web type checks, Docs web production build, and
  `git diff --check` after the nested-sidebar change.
- Restarted the Docs stack and verified the full-width reader: the article fills
  the centre lane and the sticky outline sits at the top-right edge.
