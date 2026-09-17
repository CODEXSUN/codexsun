# Docs Application Plan

## Goal

Build Docs as the global CODEXSUN documentation application.

Docs discovers repository Markdown and MDX files in place. It creates a
read-only SQLite index and shows connected documents, links, backlinks, and an
Obsidian-style graph.

## Scope

Docs owns document discovery, parsing, indexing, retrieval, rendering, tree
navigation, link resolution, backlinks, graph metadata, and diagnostics.

SQLite is connected and works at present. It stores a derived Docs index.
Source files remain the document authority.

## Exclusions

- Docs does not move, rename, rewrite, or delete repository documents.
- Docs does not execute arbitrary MDX code or imports.
- Docs does not expose secrets, ignored files, generated output, or private paths.
- Docs does not add full-text search, collaborative editing, desktop, mobile, Docker, or production deployment in this plan.

## Source Roots

The first index reads these paths in place:

```text
assist/**/*.md
apps/**/README.md
packages/**/README.md
deployment/**/*.md
README.md
apps/docs/content/**/*.md
apps/docs/content/**/*.mdx
```

The index excludes `.git`, `node_modules`, `dist`, `storage`, environment
files, binary files, and generated output.

## Delivery Phases

### Phase D-1200: Docs Foundations

Status: complete by user statement.

- [x] D-1201 Confirm Docs as the global documentation application.
- [x] D-1202 Confirm SQLite as the active, connected derived index.
- [x] D-1203 Define source-in-place and read-only authority rules.

Exit criteria:

- SQLite is available to Docs.
- Source files remain outside the Docs authoring database.

### Phase D-1210: Contracts And Configuration

Status: planned.

- [ ] D-1211 Create browser-safe Docs API schemas and response envelopes.
- [ ] D-1212 Add validated Docs API and web configuration.
- [ ] D-1213 Define Docs provider registration and module registry entries.
- [ ] D-1214 Document SQLite lifecycle, retention, and recovery limits.

Exit criteria:

- Docs has public versioned contracts.
- Docs configuration uses validated environment values.
- Docs has named module ownership and data records.

### Phase D-1220: Discovery And Indexing

Status: planned.

- [ ] D-1221 Build allowlisted Markdown and MDX source discovery.
- [ ] D-1222 Build source metadata and change detection.
- [ ] D-1223 Create Docs-owned SQLite index tables and migrations.
- [ ] D-1224 Add full index sync and stale-record removal.
- [ ] D-1225 Add path containment and excluded-path checks.

Exit criteria:

- Docs indexes each allowed source without copying it as authority.
- A full sync removes records for deleted sources.
- Discovery rejects paths outside the repository root.

### Phase D-1230: Parsing And Document Retrieval

Status: planned.

- [ ] D-1231 Parse Markdown front matter, headings, anchors, tags, and links.
- [ ] D-1232 Add restricted MDX parsing and safe rendering diagnostics.
- [ ] D-1233 Add document tree and nested document retrieval APIs.
- [ ] D-1234 Add overview and unavailable-document API responses.

Exit criteria:

- Docs returns a stable tree and document IDs.
- Docs reports parse problems without hiding valid documents.
- Docs does not execute document code.

### Phase D-1240: Connected Documentation Graph

Status: planned.

- [ ] D-1241 Resolve relative links and Markdown anchors.
- [ ] D-1242 Resolve Obsidian wikilinks and aliases.
- [ ] D-1243 Store graph edges and backlinks in SQLite.
- [ ] D-1244 Add unresolved and ambiguous link diagnostics.
- [ ] D-1245 Expose document backlinks and graph APIs.

Exit criteria:

- Each resolved link creates one graph edge.
- Each graph edge creates a visible backlink.
- Docs explains broken and ambiguous links.

### Phase D-1250: Web Workspace

Status: planned.

- [ ] D-1251 Build the Docs overview and tree navigation.
- [ ] D-1252 Build Markdown and restricted MDX document rendering.
- [ ] D-1253 Show backlinks, tags, diagnostics, and link targets.
- [ ] D-1254 Build the Obsidian-style graph view.
- [ ] D-1255 Show a useful offline and unavailable-document state.

Exit criteria:

- A user can navigate the source tree and open nested documents.
- A user can follow links and backlinks.
- A user can inspect the connected graph.

### Phase D-1260: Verification And Handoff

Status: planned.

- [ ] D-1261 Add parser, resolver, SQLite, and API tests.
- [ ] D-1262 Add browser tests for navigation, backlinks, graph, and fallbacks.
- [ ] D-1263 Run Docs-focused checks and repository boundary checks.
- [ ] D-1264 Record verification evidence and known limits.

Exit criteria:

- Static, module, integration, and browser checks pass.
- The final record distinguishes tested behavior from untested behavior.

## Implementation Order

Complete phases D-1210 through D-1260 in order. Do not start a phase until its
predecessor meets its exit criteria.
