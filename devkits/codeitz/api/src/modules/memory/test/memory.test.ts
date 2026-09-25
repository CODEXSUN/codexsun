import assert from "node:assert/strict";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { CodeitzMemoryProvider } from "../provider.js";
import { MemoryBankService } from "../service/memory-bank.service.js";

test("CodeitzMemoryProvider declares manifest and event contracts", () => {
  const provider = new CodeitzMemoryProvider();
  assert.equal(provider.manifest.id, "codeitz.memory");
  assert.equal(provider.manifest.owner, "devkits/codeitz/api/modules/memory");
  assert.ok(provider.manifest.events.published.includes("codeitz.memory.section_updated"));
  assert.ok(provider.manifest.events.published.includes("codeitz.memory.entry_stored"));
});

test("MemoryBankService initializes tri-format state (Markdown, SQLite, JSON)", () => {
  const testDir = resolve("storage/runtime/test-memory-bank");
  const testJson = resolve("storage/runtime/test-memory-bank.json");
  const service = new MemoryBankService({
    baseDir: testDir,
    jsonPath: testJson,
    inMemorySqlite: true,
  });

  const state = service.getMemoryBank("global");
  assert.equal(state.projectId, "global");
  assert.ok(state.productContext.includes("Why Codeitz Exists"));
  assert.ok(state.activeContext.includes("Current Work Focus"));
  assert.ok(state.systemPatterns.includes("System Architecture"));
  assert.ok(state.techContext.includes("Tech Stack"));
  assert.ok(state.progress.includes("What Works"));
  assert.ok(state.entries.length >= 3);
  assert.equal(state.stats.sectionsCount, 5);

  // Verify Markdown file was written to disk
  const productFile = resolve(testDir, "productContext.md");
  assert.ok(existsSync(productFile));
  assert.ok(readFileSync(productFile, "utf8").includes("Why Codeitz Exists"));

  // Verify JSON snapshot was created
  assert.ok(existsSync(testJson));
  const parsedJson = JSON.parse(readFileSync(testJson, "utf8"));
  assert.equal(parsedJson.projectId, "global");

  // Cleanup
  service.close();
  rmSync(testDir, { recursive: true, force: true });
  rmSync(testJson, { force: true });
});

test("MemoryBankService updates section and syncs across Markdown, SQLite, and JSON", () => {
  const testDir = resolve("storage/runtime/test-memory-bank-update");
  const testJson = resolve("storage/runtime/test-memory-bank-update.json");
  const service = new MemoryBankService({
    baseDir: testDir,
    jsonPath: testJson,
    inMemorySqlite: true,
  });

  const updatedContent = "# Active Context\n\n## Current Work Focus\nEngineering extreme performance SWE agent.";
  const doc = service.updateSection("activeContext", updatedContent, "global");

  assert.equal(doc.section, "activeContext");
  assert.equal(doc.markdown, updatedContent);

  // Read back
  const readBack = service.readSection("activeContext", "global");
  assert.equal(readBack, updatedContent);

  // Verify JSON export reflects update
  const jsonContent = JSON.parse(readFileSync(testJson, "utf8"));
  assert.equal(jsonContent.activeContext, updatedContent);

  service.close();
  rmSync(testDir, { recursive: true, force: true });
  rmSync(testJson, { force: true });
});

test("MemoryBankService stores, queries, and deletes structured SQLite memories", () => {
  const testDir = resolve("storage/runtime/test-memory-bank-entries");
  const testJson = resolve("storage/runtime/test-memory-bank-entries.json");
  const service = new MemoryBankService({
    baseDir: testDir,
    jsonPath: testJson,
    inMemorySqlite: true,
  });

  const entry = service.createEntry({
    projectId: "proj-123",
    category: "pattern",
    key: "auth_token_rotation",
    content: "Refresh token rotation must invalidate prior refresh tokens upon issuance.",
    tags: ["security", "auth", "tokens"],
    importance: 9,
    source: "agent",
  });

  assert.equal(entry.key, "auth_token_rotation");
  assert.equal(entry.importance, 9);

  // Query by tag
  const byTag = service.queryEntries({ projectId: "proj-123", tag: "security" });
  assert.equal(byTag.length, 1);
  assert.equal(byTag[0].key, "auth_token_rotation");

  // Query by search keyword
  const bySearch = service.queryEntries({ search: "invalidate" });
  assert.equal(bySearch.length, 1);

  // Delete
  const deleted = service.deleteEntry(entry.id);
  assert.equal(deleted, true);
  const afterDelete = service.queryEntries({ projectId: "proj-123", search: "invalidate" });
  assert.equal(afterDelete.length, 0);

  service.close();
  rmSync(testDir, { recursive: true, force: true });
  rmSync(testJson, { force: true });
});

test("MemoryBankService synthesizes grounded context for agent prompts", () => {
  const testDir = resolve("storage/runtime/test-memory-bank-syn");
  const testJson = resolve("storage/runtime/test-memory-bank-syn.json");
  const service = new MemoryBankService({
    baseDir: testDir,
    jsonPath: testJson,
    inMemorySqlite: true,
  });

  service.createEntry({
    projectId: "global",
    category: "pattern",
    key: "git_mutex_rule",
    content: "All Git write operations must be locked with withGitLock.",
    tags: ["git", "concurrency"],
    importance: 9,
  });

  const synthesis = service.synthesizeContext({
    prompt: "Implement safe git commit and mutex locking",
    projectId: "global",
  });

  assert.ok(synthesis.groundedContext.includes("=== CODEITZ MEMORY BANK GROUNDING ==="));
  assert.ok(synthesis.groundedContext.includes("[ACTIVECONTEXT]"));
  assert.ok(synthesis.activeSectionsUsed.includes("activeContext"));
  assert.ok(synthesis.matchedMemoryKeys.includes("git_mutex_rule"));

  service.close();
  rmSync(testDir, { recursive: true, force: true });
  rmSync(testJson, { force: true });
});
