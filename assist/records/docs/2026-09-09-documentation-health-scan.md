# Documentation Health Scan

Date: 2026-09-09

## Outcome

Docs now discovers repository Markdown, MDX, and text sources dynamically. The
Docs Settings page scans documentation health without changing repository files.

## Contract and ownership

- `GET /api/docs/v1/scan` returns missing README folders and unorganized source files.
- The Docs API owns discovery and the read-only scan.
- The Docs web module owns the Settings screen and the Unorganized files sidebar group.
- Plain-text files render as read-only text articles. Markdown and MDX keep the Docs editor.

## Scan rules

- Applications, packages, and API or web module folders need a `README.md`.
- Markdown, MDX, and text files outside `assist`, `apps`, `packages`, `.container`,
  root `AGENTS.md`, or root `README.md` are reported as unorganized.
- The scan never moves, creates, edits, or deletes source files.

## Verification

- Docs contracts, API, and web type checks passed.
- Local `GET /api/docs/v1/scan` returned a valid report.
- Browser verification confirmed the Settings scan and its empty-state results.
