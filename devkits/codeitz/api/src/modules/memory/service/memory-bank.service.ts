import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { findWorkspaceRoot } from "../../engineering/service/workspace-root.js";
import type {
  CreateMemoryEntryInput,
  MemoryBankDocument,
  MemoryBankSection,
  MemoryBankState,
  MemoryEntry,
  QueryMemoriesInput,
  SynthesizeContextInput,
  SynthesizedContextResult,
} from "../contracts/memory-contracts.js";
import { MemorySqliteRepository } from "../repository/memory-sqlite.repository.js";

const DEFAULT_SECTIONS: Record<MemoryBankSection, { title: string; defaultMd: string }> = {
  productContext: {
    title: "Product Context",
    defaultMd: `# Product Context

## Why Codeitz Exists
Codeitz is an autonomous, real-time software engineering studio designed for autonomous coding, architectural refactoring, verification gates, and continuous project delivery.

## Core Problems Solved
- Eliminates brittle LLM hallucinations with AST-grounded patching and multi-level verification.
- Enforces strict workspace confinement without foreign checkout leaks.
- Coordinates multi-modal SWE capabilities (AST patcher, Git worktrees, terminal runners, vision inspection, audio/voice directives).

## User Experience Goals
- 1-click autonomous task execution with live SSE stream feedback.
- Interactive safety checkpoints with zero data loss and automated rollbacks on test failure.
- Complete parity across Markdown, SQLite, and JSON memories.
`,
  },
  activeContext: {
    title: "Active Context",
    defaultMd: `# Active Context

## Current Work Focus
Hardening Codeitz into an autonomous engineering machine equipped with Memory Bank, Skill Reader, and Skill Organiser.

## Recent Changes
- Autonomous CodePatcherService with targeted replacements and diff previews.
- Cyclical LangGraph-style state machine with verification self-healing retry cycles.
- Real-time Server-Sent Events (SSE) streaming runner pipeline.
- Concurrency-safe GitOps with FIFO mutex locks and isolated worktree merging.
- Tri-format Memory Bank (Markdown, SQLite, JSON) and Skill Organiser engine.

## Active Invariants
- Confine all file reads and mutations strictly to repository root.
- All verification test suites must pass 100% before committing changes.
- Never write credentials, tokens, or private secrets to repository files.
`,
  },
  systemPatterns: {
    title: "System Patterns",
    defaultMd: `# System Patterns

## System Architecture
Codeitz adopts a modular, contract-driven architecture:
- Foundation Provider: Core identity, config, and system bootstrapping.
- Engineering Provider: SWE Task Runner, GitOps, Worktrees, Code Patcher, and State Graph.
- Capabilities Provider: Sandboxed terminal, vision analysis, speech transcription, multi-model LLM router.
- Memory Provider: Tri-format persistent Memory Bank (Markdown, SQLite, JSON).
- Skills Provider: Skill Reader, Skill Organiser, and Skill Distiller.
- Learning Provider: Empirical self-learning and heuristic synthesis.

## Key Design Patterns
- Tri-Format Parity: Always keep Markdown documents, SQLite relational tables, and JSON snapshots synchronized.
- FIFO Git Mutex: Serialize repository status, stage, and commit operations with withGitLock to prevent index collision.
- LangGraph Cyclical Loop: Allow failed verification to loop back to execution with remaining retry decrements.
`,
  },
  techContext: {
    title: "Tech Context",
    defaultMd: `# Tech Context

## Tech Stack & Runtime
- Runtime: Node.js v22+ (native node:sqlite DatabaseSync enabled).
- Backend: Fastify v5 with fastify-type-provider-zod and strict contract validation.
- Frontend: React 19, TypeScript, TailwindCSS v4, Vite v7, Lucide Icons.
- Tooling: tsx test runner, tsc strict checking, Turborepo monorepo orchestration.

## Constraints & Requirements
- Windows OS path compatibility (handling backslashes and drive prefixes).
- Zero third-party SQLite bloat: rely entirely on native node:sqlite.
- Non-blocking async execution for long-running runners and streaming SSE feeds.
`,
  },
  progress: {
    title: "Progress",
    defaultMd: `# Progress

## What Works
- 100% passing test suites across API and Web packages.
- Phased SWE state machine (Intake -> Grounding -> Planning -> Execution -> Verification -> Review -> Complete).
- Continuous parallel task runner with configurable concurrency.
- Autonomous patch engine with rollback on syntax/assertion failures.
- Native SQLite memory persistence, JSON exports, and Markdown synchronization.

## Milestones
- Phase 1: Core Foundation & SWE Orchestration [DONE]
- Phase 2: Live Capabilities & Multi-Model Reasoner [DONE]
- Phase 3: AST Patch Engine & LangGraph State Machine [DONE]
- Phase 4: Tri-Format Memory Bank & Skill Organiser [CURRENT]
`,
  },
};

export class MemoryBankService {
  private readonly sqliteRepo: MemorySqliteRepository;
  private readonly baseDir: string;
  private readonly jsonPath: string;

  constructor(
    options: {
      baseDir?: string;
      sqlitePath?: string;
      jsonPath?: string;
      inMemorySqlite?: boolean;
    } = {},
  ) {
    const root = findWorkspaceRoot();
    this.baseDir = options.baseDir ?? resolve(root, "storage/runtime/codeitz/memory-bank");
    const dbPath = options.inMemorySqlite
      ? ":memory:"
      : (options.sqlitePath ?? resolve(root, "storage/runtime/codeitz/memory.sqlite"));
    this.jsonPath = options.jsonPath ?? resolve(root, "storage/runtime/codeitz/memory-bank.json");

    if (!existsSync(this.baseDir)) {
      mkdirSync(this.baseDir, { recursive: true });
    }
    const jsonDir = dirname(this.jsonPath);
    if (!existsSync(jsonDir)) {
      mkdirSync(jsonDir, { recursive: true });
    }

    this.sqliteRepo = new MemorySqliteRepository(dbPath);
    this.initializeDefaults("global");
  }

  private getSectionFilePath(section: MemoryBankSection, projectId: string = "global"): string {
    const projectDir = projectId === "global" ? this.baseDir : resolve(this.baseDir, projectId);
    if (!existsSync(projectDir)) {
      mkdirSync(projectDir, { recursive: true });
    }
    return resolve(projectDir, `${section}.md`);
  }

  private initializeDefaults(projectId: string): void {
    const sections: MemoryBankSection[] = [
      "productContext",
      "activeContext",
      "systemPatterns",
      "techContext",
      "progress",
    ];

    for (const sec of sections) {
      const filePath = this.getSectionFilePath(sec, projectId);
      let content = "";
      if (existsSync(filePath)) {
        content = readFileSync(filePath, "utf8");
      } else {
        content = DEFAULT_SECTIONS[sec].defaultMd;
        writeFileSync(filePath, content, "utf8");
      }
      this.sqliteRepo.saveSection(projectId, sec, content);
    }

    // Seed initial structured memory entries if database is empty
    if (this.sqliteRepo.countMemories(projectId) === 0) {
      const defaultEntries: Array<Omit<MemoryEntry, "id" | "createdAt" | "updatedAt">> = [
        {
          projectId,
          category: "product",
          key: "product_mission",
          content: "Deliver reliable autonomous SWE execution through strict verification and memory grounding.",
          tags: ["mission", "reliability", "swe"],
          importance: 10,
          source: "system",
        },
        {
          projectId,
          category: "pattern",
          key: "tri_format_memory",
          content: "Maintain parity across Markdown files, SQLite database, and JSON snapshots.",
          tags: ["memory", "architecture", "sqlite"],
          importance: 9,
          source: "system",
        },
        {
          projectId,
          category: "active",
          key: "current_target",
          content: "Empower Codeitz with tri-format Memory Bank and Skill Organiser with recommendation engine.",
          tags: ["active_goal", "skills", "memory_bank"],
          importance: 8,
          source: "system",
        },
      ];

      for (const entry of defaultEntries) {
        this.createEntry(entry);
      }
    }

    this.exportJsonSnapshot(projectId);
  }

  getMemoryBank(projectId: string = "global"): MemoryBankState {
    const sections: MemoryBankSection[] = [
      "productContext",
      "activeContext",
      "systemPatterns",
      "techContext",
      "progress",
    ];

    const contents: Record<MemoryBankSection, string> = {
      productContext: "",
      activeContext: "",
      systemPatterns: "",
      techContext: "",
      progress: "",
    };

    for (const sec of sections) {
      contents[sec] = this.readSection(sec, projectId);
    }

    const entries = this.sqliteRepo.queryMemories({ projectId, limit: 100 });

    return {
      projectId,
      productContext: contents.productContext,
      activeContext: contents.activeContext,
      systemPatterns: contents.systemPatterns,
      techContext: contents.techContext,
      progress: contents.progress,
      entries,
      stats: {
        totalEntries: this.sqliteRepo.countMemories(projectId),
        sectionsCount: 5,
        sqliteConnected: true,
      },
      lastSyncAt: new Date().toISOString(),
    };
  }

  readSection(section: MemoryBankSection, projectId: string = "global"): string {
    const filePath = this.getSectionFilePath(section, projectId);
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, "utf8");
      // Keep SQLite synced
      this.sqliteRepo.saveSection(projectId, section, content);
      return content;
    }
    const sqliteContent = this.sqliteRepo.getSection(projectId, section);
    if (sqliteContent) {
      writeFileSync(filePath, sqliteContent, "utf8");
      return sqliteContent;
    }
    const fallback = DEFAULT_SECTIONS[section].defaultMd;
    writeFileSync(filePath, fallback, "utf8");
    this.sqliteRepo.saveSection(projectId, section, fallback);
    return fallback;
  }

  updateSection(
    section: MemoryBankSection,
    content: string,
    projectId: string = "global",
  ): MemoryBankDocument {
    const filePath = this.getSectionFilePath(section, projectId);
    writeFileSync(filePath, content, "utf8");
    this.sqliteRepo.saveSection(projectId, section, content);
    this.exportJsonSnapshot(projectId);

    return {
      section,
      title: DEFAULT_SECTIONS[section].title,
      markdown: content,
      filePath,
      updatedAt: new Date().toISOString(),
    };
  }

  createEntry(input: CreateMemoryEntryInput): MemoryEntry {
    const now = new Date().toISOString();
    const entry: MemoryEntry = {
      id: randomUUID(),
      projectId: input.projectId ?? "global",
      category: input.category,
      key: input.key,
      content: input.content,
      tags: input.tags ?? [],
      importance: input.importance ?? 5,
      source: input.source ?? "system",
      createdAt: now,
      updatedAt: now,
    };

    this.sqliteRepo.saveMemory(entry);
    this.exportJsonSnapshot(entry.projectId);
    return entry;
  }

  queryEntries(filter: QueryMemoriesInput): MemoryEntry[] {
    return this.sqliteRepo.queryMemories(filter);
  }

  deleteEntry(id: string): boolean {
    const memory = this.sqliteRepo.findMemoryById(id);
    const deleted = this.sqliteRepo.deleteMemory(id);
    if (deleted && memory) {
      this.exportJsonSnapshot(memory.projectId);
    }
    return deleted;
  }

  synthesizeContext(input: SynthesizeContextInput): SynthesizedContextResult {
    const projectId = input.projectId ?? "global";
    const sectionsToInclude = input.includeSections ?? ["activeContext", "systemPatterns"];
    const activeSectionsUsed: string[] = [];

    const sectionSnippets: string[] = [];
    for (const sec of sectionsToInclude) {
      const content = this.readSection(sec, projectId);
      // Grab top lines or key points
      const lines = content.split("\n").filter((l) => l.trim().length > 0).slice(0, 8);
      sectionSnippets.push(`[${sec.toUpperCase()}]:\n${lines.join("\n")}`);
      activeSectionsUsed.push(sec);
    }

    // Query relevant memories based on words in prompt
    const promptKeywords = input.prompt.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const matchedEntries: MemoryEntry[] = [];
    const matchedKeys: string[] = [];

    for (const word of promptKeywords.slice(0, 5)) {
      const results = this.sqliteRepo.queryMemories({
        projectId,
        search: word,
        minImportance: 4,
        limit: 3,
      });
      for (const res of results) {
        if (!matchedKeys.includes(res.key)) {
          matchedKeys.push(res.key);
          matchedEntries.push(res);
        }
      }
    }

    const memorySnippet = matchedEntries.length > 0
      ? `\n[RELEVANT MEMORIES]:\n` + matchedEntries.map((e) => `- (${e.category}:${e.key}) ${e.content}`).join("\n")
      : "";

    const groundedContext = [
      `=== CODEITZ MEMORY BANK GROUNDING ===`,
      ...sectionSnippets,
      memorySnippet,
      `=====================================`,
    ].join("\n\n");

    return {
      prompt: input.prompt,
      groundedContext,
      activeSectionsUsed,
      matchedMemoryKeys: matchedKeys,
    };
  }

  exportJsonSnapshot(projectId: string = "global"): string {
    const bank = this.getMemoryBank(projectId);
    const jsonStr = JSON.stringify(bank, null, 2);
    try {
      writeFileSync(this.jsonPath, jsonStr, "utf8");
    } catch {
      // In-memory or safe fallback
    }
    return jsonStr;
  }

  syncAll(projectId: string = "global"): MemoryBankState {
    // 1. Ensure all MD files exist on disk and read to SQLite
    const sections: MemoryBankSection[] = [
      "productContext",
      "activeContext",
      "systemPatterns",
      "techContext",
      "progress",
    ];

    for (const sec of sections) {
      const filePath = this.getSectionFilePath(sec, projectId);
      if (existsSync(filePath)) {
        const md = readFileSync(filePath, "utf8");
        this.sqliteRepo.saveSection(projectId, sec, md);
      }
    }

    // 2. Export updated JSON snapshot
    this.exportJsonSnapshot(projectId);

    return this.getMemoryBank(projectId);
  }

  close(): void {
    this.sqliteRepo.close();
  }
}
