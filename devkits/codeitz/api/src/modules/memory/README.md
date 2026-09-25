# Codeitz Memory Bank Module

The Codeitz Memory Bank module provides persistent, tri-format memory storage and contextual grounding for autonomous software-engineering tasks.

## Purpose

This module maintains unified state and historical project memory across Markdown documents, native Node.js SQLite relational tables, and JSON snapshots. It synthesizes active architectural invariants, product context, and relevant episodic memories to ground autonomous agent prompts and task runner execution loops.

## Tri-Format Architecture

The Memory Bank enforces continuous synchronization across three complementary persistence mediums:

1. **Markdown Documents (`storage/runtime/codeitz/memory-bank/`)**:
   - `productContext.md`: Project purpose, problems solved, and user experience goals.
   - `activeContext.md`: Current sprint focus, recent modifications, and active invariants.
   - `systemPatterns.md`: System architecture, module boundaries, and design patterns.
   - `techContext.md`: Tech stack, runtime constraints, and dependency rules.
   - `progress.md`: Completed features, test milestones, and active work items.
2. **Relational SQLite Index (`storage/runtime/codeitz/memory.sqlite`)**:
   - Implemented using native Node.js `node:sqlite` (`DatabaseSync`) with WAL mode (`PRAGMA journal_mode = WAL;`) and busy timeout locks.
   - Manages structured memories across categories: `product`, `active`, `pattern`, `tech`, `progress`, and `task_fact`.
   - Supports search indexing, importance scoring, and keyword matching.
3. **JSON Snapshots (`storage/runtime/codeitz/memory-bank.json`)**:
   - Human-readable and machine-exportable state snapshots for fast hydration and tooling diagnostics.

## Contracts & Routes

All endpoints conform to Zod schemas declared in `contracts/memory-contracts.ts` and are mounted under `/api/v1/codeitz/memory`:

- `GET /api/v1/codeitz/memory`: Returns the complete Memory Bank state including all 5 sections and structured entries.
- `GET /api/v1/codeitz/memory/sections/:section`: Reads a specific Markdown section.
- `POST /api/v1/codeitz/memory/sections`: Updates a Markdown section and syncs across SQLite and JSON snapshot.
- `GET /api/v1/codeitz/memory/entries`: Queries structured memories by category, search terms, or importance.
- `POST /api/v1/codeitz/memory/entries`: Creates a new structured memory entry.
- `DELETE /api/v1/codeitz/memory/entries/:id`: Removes an entry and updates snapshots.
- `POST /api/v1/codeitz/memory/synthesize`: Synthesizes grounded prompt context from active sections and matched memories.
- `POST /api/v1/codeitz/memory/sync`: Forces a full synchronization between disk Markdown, SQLite, and JSON.
