/**
 * Context Cache Layer
 *
 * Provides in-memory caching with disk-backed persistence for fast retrieval
 * of frequently used context during AI interactions.
 */

import { promises as fs } from "fs";
import { join } from "path";

interface CacheEntry {
  key: string;
  value: unknown;
  expiresAt?: number | null;
}

export class ContextCache {
  private cache: Map<string, CacheEntry> = new Map();
  private persistPath: string;
  private autosaveIntervalMs: number = 5000;
  private autosaveTimer: NodeJS.Timeout | null = null;

  constructor(projectPath: string) {
    this.persistPath = join(projectPath, ".ai", "cache.json");
    this.loadFromDisk().catch(() => {});
    this.startAutosave();
  }

  private async loadFromDisk() {
    try {
      const data = await fs.readFile(this.persistPath, "utf-8");
      const items: CacheEntry[] = JSON.parse(data);
      for (const e of items) {
        this.cache.set(e.key, e);
      }
    } catch (error) {
      // no-op
    }
  }

  private startAutosave() {
    this.autosaveTimer = setInterval(() => this.saveToDisk(), this.autosaveIntervalMs);
  }

  private async saveToDisk() {
    try {
      const items = Array.from(this.cache.values());
      await fs.mkdir(join(this.persistPath, ".."), { recursive: true });
      await fs.writeFile(this.persistPath, JSON.stringify(items, null, 2), "utf-8");
    } catch (error) {
      // non-fatal
    }
  }

  set(key: string, value: unknown, ttlSeconds?: number) {
    const entry: CacheEntry = {
      key,
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    };

    this.cache.set(key, entry);
  }

  get(key: string): unknown | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  async flushToDisk() {
    await this.saveToDisk();
  }

  stop() {
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
      this.autosaveTimer = null;
    }
    this.saveToDisk().catch(() => {});
  }
}
