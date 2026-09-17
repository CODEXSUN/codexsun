# Docs Knowledge Workspace Planning

## Identity

Application: Docs

Task prefix: `D`

## Goal

Build Docs as the CODEXSUN source-in-place knowledge workspace for Markdown and restricted MDX. It indexes repository documentation as derived data and shows documents, links, backlinks, tags, diagnostics, and graph relationships.

Docs does not move, rewrite, or become the authority for repository documents. SQLite stores only a derived index.

## Architecture

```text
repository Markdown and MDX
  -> Docs discovery and parser modules
  -> derived SQLite index
  -> public Docs API contracts
  -> Docs web tree, reader, backlinks, and graph
```

## Safety Rules

- Allowlist source roots and reject path traversal.
- Do not execute MDX imports, arbitrary code, or embedded scripts.
- Exclude secrets, environment files, storage, generated output, ignored paths, and binaries.
- Keep source location, ownership, and Git revision visible in index evidence.

## Phases

### Phase D-1200: Foundation

- [x] D-1201 Docs hosts, contracts, configuration, and provider registration.
- [x] D-1202 Source discovery, SQLite index, change detection, and stale-record removal.

### Phase D-1210: Parse And Retrieve

- [ ] D-1211 Markdown front matter, headings, anchors, tags, and links.
- [ ] D-1212 Restricted MDX parser and safe rendering diagnostics.
- [ ] D-1213 Nested document tree, stable document identity, and retrieval API.
- [ ] D-1214 Overview, unavailable-document, and parse-error responses.

### Phase D-1220: Connected Knowledge

- [ ] D-1221 Relative link, anchor, alias, and wikilink resolution.
- [ ] D-1222 Backlink, graph-edge, unresolved-link, and ambiguity records.
- [ ] D-1223 Backlink, tag, diagnostics, and graph API contracts.

### Phase D-1230: Workspace Experience

- [ ] D-1231 Tree navigation, document reader, and source metadata view.
- [ ] D-1232 Backlinks, tags, diagnostics, graph exploration, and filter controls.
- [ ] D-1233 Offline, index-stale, and unavailable-document user states.

### Phase D-1240: Verification And Handoff

- [ ] D-1241 Parser, resolver, repository-boundary, and SQLite tests.
- [ ] D-1242 API and browser navigation, link, backlink, graph, and fallback checks.
- [ ] D-1243 Index performance, recovery, privacy, and operator evidence.

Exit: a user can safely browse repository knowledge, follow links, inspect backlinks, and understand index limits.
