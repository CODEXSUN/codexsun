/**
 * Project Memory Management System
 *
 * Manages persistent AI context, execution history, and learned patterns.
 * Stores all AI interactions and decisions for continuity across sessions.
 */

import { promises as fs } from "fs";
import { join, dirname } from "path";

export interface ProjectMemory {
  projectId: string;
  projectName: string;
  createdAt: string;
  updatedAt: string;
  description: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface ExecutionRecord {
  id: string;
  timestamp: string;
  taskType: "plan" | "write" | "execute" | "fix" | "chat";
  instruction: string;
  status: "pending" | "completed" | "failed" | "interrupted";
  result?: unknown;
  error?: string;
  duration: number;
  files: string[];
  taskId?: string;
  session: string;
}

export interface PatternRecord {
  id: string;
  name: string;
  description: string;
  pattern: string;
  examples: string[];
  frequency: number;
  lastUsed: string;
}

export interface ContextEntry {
  key: string;
  value: unknown;
  timestamp: string;
  scope: "global" | "session" | "task";
  ttl?: number; // Time to live in seconds
}

export interface ProjectMetadata {
  projectId: string;
  projectPath: string;
  languages: string[];
  frameworks: string[];
  appsCount: number;
  totalFiles: number;
  learningStatus: "fresh" | "learning" | "learned" | "expert";
  confidence: number; // 0-100
}

/**
 * ProjectMemoryManager handles all persistent memory operations
 */
export class ProjectMemoryManager {
  private memoryPath: string;
  private projectId: string;
  private projectMemory: ProjectMemory | null = null;
  private metadata: ProjectMetadata | null = null;

  constructor(projectPath: string, projectId: string = "default") {
    this.memoryPath = join(projectPath, ".ai", "memory");
    this.projectId = projectId;
  }

  /**
   * Initialize memory system
   */
  async initialize(): Promise<void> {
    try {
      await this.ensurePaths();
      await this.loadProjectMemory();
      await this.loadMetadata();
    } catch (error) {
      console.error("Memory initialization error:", error);
      throw error;
    }
  }

  /**
   * Ensure all required directories exist
   */
  private async ensurePaths(): Promise<void> {
    const paths = [
      this.memoryPath,
      join(this.memoryPath, "projects"),
      join(this.memoryPath, "executions"),
      join(this.memoryPath, "patterns"),
      join(this.memoryPath, "context"),
    ];

    for (const path of paths) {
      try {
        await fs.mkdir(path, { recursive: true });
      } catch (error) {
        // Directory may already exist
      }
    }
  }

  /**
   * Load or create project memory
   */
  private async loadProjectMemory(): Promise<void> {
    const projectMemoryPath = join(
      this.memoryPath,
      "projects",
      `${this.projectId}.json`
    );

    try {
      const data = await fs.readFile(projectMemoryPath, "utf-8");
      this.projectMemory = JSON.parse(data);
    } catch (error) {
      // Create new project memory
      this.projectMemory = {
        projectId: this.projectId,
        projectName: this.projectId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        description: "Project memory initialized",
        tags: [],
        metadata: {},
      };
      await this.saveProjectMemory();
    }
  }

  /**
   * Load or create metadata
   */
  private async loadMetadata(): Promise<void> {
    const metadataPath = join(
      this.memoryPath,
      "projects",
      `${this.projectId}-metadata.json`
    );

    try {
      const data = await fs.readFile(metadataPath, "utf-8");
      this.metadata = JSON.parse(data);
    } catch (error) {
      this.metadata = {
        projectId: this.projectId,
        projectPath: "",
        languages: ["typescript", "javascript", "python"],
        frameworks: ["node", "react", "express"],
        appsCount: 0,
        totalFiles: 0,
        learningStatus: "fresh",
        confidence: 0,
      };
      await this.saveMetadata();
    }
  }

  /**
   * Save project memory to disk
   */
  private async saveProjectMemory(): Promise<void> {
    if (!this.projectMemory) return;

    this.projectMemory.updatedAt = new Date().toISOString();
    const path = join(
      this.memoryPath,
      "projects",
      `${this.projectId}.json`
    );

    await fs.writeFile(path, JSON.stringify(this.projectMemory, null, 2));
  }

  /**
   * Save metadata to disk
   */
  private async saveMetadata(): Promise<void> {
    if (!this.metadata) return;

    const path = join(
      this.memoryPath,
      "projects",
      `${this.projectId}-metadata.json`
    );

    await fs.writeFile(path, JSON.stringify(this.metadata, null, 2));
  }

  /**
   * Record an execution
   */
  async recordExecution(record: Omit<ExecutionRecord, "id">): Promise<string> {
    const id = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const execution: ExecutionRecord = {
      ...record,
      id,
    };

    const path = join(
      this.memoryPath,
      "executions",
      `${id}.json`
    );

    await fs.writeFile(path, JSON.stringify(execution, null, 2));

    // Update metadata
    if (this.metadata) {
      this.metadata.learningStatus = "learning";
      await this.saveMetadata();
    }

    return id;
  }

  /**
   * Get recent executions
   */
  async getRecentExecutions(limit: number = 10): Promise<ExecutionRecord[]> {
    const execPath = join(this.memoryPath, "executions");
    const files = await fs.readdir(execPath);

    const records: ExecutionRecord[] = [];

    for (const file of files.slice(-limit)) {
      try {
        const data = await fs.readFile(join(execPath, file), "utf-8");
        records.push(JSON.parse(data));
      } catch (error) {
        // Skip invalid files
      }
    }

    return records.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Record a learned pattern
   */
  async recordPattern(pattern: Omit<PatternRecord, "id">): Promise<string> {
    const id = `pattern-${Date.now()}`;
    const record: PatternRecord = {
      ...pattern,
      id,
    };

    const path = join(
      this.memoryPath,
      "patterns",
      `${id}.json`
    );

    await fs.writeFile(path, JSON.stringify(record, null, 2));
    return id;
  }

  /**
   * Get patterns
   */
  async getPatterns(limit: number = 50): Promise<PatternRecord[]> {
    const patternsPath = join(this.memoryPath, "patterns");
    const files = await fs.readdir(patternsPath).catch(() => []);

    const patterns: PatternRecord[] = [];

    for (const file of files) {
      try {
        const data = await fs.readFile(join(patternsPath, file), "utf-8");
        patterns.push(JSON.parse(data));
      } catch (error) {
        // Skip invalid files
      }
    }

    return patterns
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
  }

  /**
   * Store context value
   */
  async setContext(
    key: string,
    value: unknown,
    scope: "global" | "session" | "task" = "global",
    ttl?: number
  ): Promise<void> {
    const entry: ContextEntry = {
      key,
      value,
      timestamp: new Date().toISOString(),
      scope,
      ttl,
    };

    const path = join(
      this.memoryPath,
      "context",
      `${scope}-${key}.json`
    );

    await fs.writeFile(path, JSON.stringify(entry, null, 2));
  }

  /**
   * Get context value
   */
  async getContext(
    key: string,
    scope: "global" | "session" | "task" = "global"
  ): Promise<unknown | null> {
    const path = join(
      this.memoryPath,
      "context",
      `${scope}-${key}.json`
    );

    try {
      const data = await fs.readFile(path, "utf-8");
      const entry: ContextEntry = JSON.parse(data);

      // Check TTL
      if (entry.ttl) {
        const age = Date.now() - new Date(entry.timestamp).getTime();
        if (age > entry.ttl * 1000) {
          await fs.unlink(path);
          return null;
        }
      }

      return entry.value;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get all context in a scope
   */
  async getContextScope(
    scope: "global" | "session" | "task" = "global"
  ): Promise<Record<string, unknown>> {
    const contextPath = join(this.memoryPath, "context");
    const files = await fs.readdir(contextPath).catch(() => []);

    const context: Record<string, unknown> = {};

    for (const file of files) {
      if (!file.startsWith(`${scope}-`)) continue;

      try {
        const data = await fs.readFile(join(contextPath, file), "utf-8");
        const entry: ContextEntry = JSON.parse(data);
        context[entry.key] = entry.value;
      } catch (error) {
        // Skip invalid files
      }
    }

    return context;
  }

  /**
   * Update project metadata
   */
  async updateMetadata(updates: Partial<ProjectMetadata>): Promise<void> {
    if (!this.metadata) return;

    this.metadata = {
      ...this.metadata,
      ...updates,
    };

    await this.saveMetadata();
  }

  /**
   * Update project memory
   */
  async updateProjectMemory(updates: Partial<ProjectMemory>): Promise<void> {
    if (!this.projectMemory) return;

    this.projectMemory = {
      ...this.projectMemory,
      ...updates,
    };

    await this.saveProjectMemory();
  }

  /**
   * Get project info
   */
  getProjectMemory(): ProjectMemory | null {
    return this.projectMemory;
  }

  /**
   * Get metadata
   */
  getMetadata(): ProjectMetadata | null {
    return this.metadata;
  }

  /**
   * Get memory path
   */
  getMemoryPath(): string {
    return this.memoryPath;
  }

  /**
   * Clear all session context
   */
  async clearSessionContext(): Promise<void> {
    const contextPath = join(this.memoryPath, "context");
    const files = await fs.readdir(contextPath).catch(() => []);

    for (const file of files) {
      if (file.startsWith("session-")) {
        await fs.unlink(join(contextPath, file)).catch(() => {});
      }
    }
  }

  /**
   * Clear all task context
   */
  async clearTaskContext(): Promise<void> {
    const contextPath = join(this.memoryPath, "context");
    const files = await fs.readdir(contextPath).catch(() => []);

    for (const file of files) {
      if (file.startsWith("task-")) {
        await fs.unlink(join(contextPath, file)).catch(() => {});
      }
    }
  }

  /**
   * Export memory summary
   */
  async exportSummary(): Promise<{
    project: ProjectMemory | null;
    metadata: ProjectMetadata | null;
    recentExecutions: ExecutionRecord[];
    patterns: PatternRecord[];
  }> {
    return {
      project: this.projectMemory,
      metadata: this.metadata,
      recentExecutions: await this.getRecentExecutions(5),
      patterns: await this.getPatterns(10),
    };
  }
}

/**
 * Create project memory manager for workspace
 */
export async function createProjectMemory(
  projectPath: string,
  projectId: string = "default"
): Promise<ProjectMemoryManager> {
  const manager = new ProjectMemoryManager(projectPath, projectId);
  await manager.initialize();
  return manager;
}
