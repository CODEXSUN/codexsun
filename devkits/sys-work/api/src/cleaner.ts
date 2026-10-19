import { randomUUID } from "node:crypto";
import { lstat, readdir, unlink } from "node:fs/promises";
import { isAbsolute, join, parse, relative, resolve, sep } from "node:path";
import { cleanerTargets, defaultHome, type CleanerTarget } from "./catalog.js";

type Candidate = { path: string; bytes: number; modifiedMs: number };
type TargetSnapshot = { candidates: Candidate[]; roots: string[]; canClean: boolean };

class ScanSemaphore {
  private active = 0;
  private readonly waiters: (() => void)[] = [];

  constructor(private readonly limit = 16) {}

  async run<T>(operation: () => Promise<T>): Promise<T> {
    if (this.active >= this.limit) await new Promise<void>((resolve) => this.waiters.push(resolve));
    this.active++;
    try {
      return await operation();
    } finally {
      this.active--;
      this.waiters.shift()?.();
    }
  }
}

export type ScanRow = {
  id: string;
  group: CleanerTarget["group"];
  label: string;
  detail: string;
  canClean: boolean;
  bytes: number;
  files: number;
  paths: string[];
  largest: { path: string; bytes: number }[];
};

export type ScanResult = {
  scanId: string;
  scannedAt: string;
  expiresAt: string;
  minAgeDays: number;
  rows: ScanRow[];
};

export type CleanResult = {
  deletedFiles: number;
  reclaimedBytes: number;
  skippedFiles: number;
  errors: { path: string; message: string }[];
};

export class Cleaner {
  private snapshot: { id: string; expires: number; targets: Map<string, TargetSnapshot> } | null =
    null;

  constructor(
    private readonly home = defaultHome,
    private readonly targets = cleanerTargets,
    private readonly externalRoots = [join(process.env.WINDIR ?? "C:\\Windows", "Temp")]
  ) {}

  async scan(minAgeDays: number): Promise<ScanResult> {
    if (!Number.isInteger(minAgeDays) || minAgeDays < 0 || minAgeDays > 365) {
      throw new Error("Choose an age from 0 to 365 days.");
    }
    const cutoff = Date.now() - minAgeDays * 86_400_000;
    const semaphore = new ScanSemaphore();
    const snapshots = new Map<string, TargetSnapshot>();
    const rows: ScanRow[] = [];
    for (const target of this.targets) {
      const roots = await target.roots(this.home);
      const measuredFiles: Candidate[] = [];
      for (const root of roots) {
        if (!this.isApprovedRoot(root) || !(await this.hasSafeAncestors(root, root))) continue;
        await this.collect(
          root,
          target.mode === "inventory" ? Number.POSITIVE_INFINITY : cutoff,
          measuredFiles,
          semaphore
        );
      }
      snapshots.set(target.id, {
        candidates: target.mode === "inventory" ? [] : measuredFiles,
        roots,
        canClean: target.mode !== "inventory"
      });
      rows.push({
        id: target.id,
        group: target.group,
        label: target.label,
        detail: target.detail,
        canClean: target.mode !== "inventory",
        bytes: measuredFiles.reduce((sum, file) => sum + file.bytes, 0),
        files: measuredFiles.length,
        paths: roots,
        largest: [...measuredFiles]
          .sort((a, b) => b.bytes - a.bytes)
          .slice(0, 3)
          .map(({ path, bytes }) => ({ path, bytes }))
      });
    }
    const now = Date.now();
    const scanId = randomUUID();
    this.snapshot = { id: scanId, expires: now + 10 * 60_000, targets: snapshots };
    return {
      scanId,
      scannedAt: new Date(now).toISOString(),
      expiresAt: new Date(this.snapshot.expires).toISOString(),
      minAgeDays,
      rows
    };
  }

  async clean(scanId: string, targetIds: string[]): Promise<CleanResult> {
    const snapshot = this.snapshot;
    if (!snapshot || snapshot.id !== scanId || snapshot.expires < Date.now()) {
      throw new Error("The scan expired. Scan again before cleaning.");
    }
    if (
      !Array.isArray(targetIds) ||
      targetIds.length === 0 ||
      new Set(targetIds).size !== targetIds.length
    ) {
      throw new Error("Select one or more unique cache areas.");
    }
    if (targetIds.some((id) => !snapshot.targets.has(id))) {
      throw new Error("The selection contains an unknown cache area.");
    }
    if (targetIds.some((id) => !snapshot.targets.get(id)?.canClean)) {
      throw new Error("Inventory-only areas cannot be cleaned.");
    }
    this.snapshot = null;
    const result: CleanResult = { deletedFiles: 0, reclaimedBytes: 0, skippedFiles: 0, errors: [] };
    for (const id of targetIds) {
      const target = snapshot.targets.get(id)!;
      for (const candidate of target.candidates) {
        try {
          const approvedRoot = target.roots.find((root) => this.isWithin(root, candidate.path));
          if (!approvedRoot || !this.isApprovedRoot(approvedRoot))
            throw new Error("Path left the approved cache area.");
          if (!(await this.hasSafeAncestors(candidate.path, approvedRoot)))
            throw new Error("A directory changed to a link.");
          const current = await lstat(candidate.path);
          if (
            !current.isFile() ||
            current.isSymbolicLink() ||
            current.size !== candidate.bytes ||
            current.mtimeMs !== candidate.modifiedMs
          ) {
            result.skippedFiles++;
            continue;
          }
          await unlink(candidate.path);
          result.deletedFiles++;
          result.reclaimedBytes += candidate.bytes;
        } catch (error) {
          result.skippedFiles++;
          if (result.errors.length < 30)
            result.errors.push({
              path: candidate.path,
              message: error instanceof Error ? error.message : String(error)
            });
        }
      }
    }
    return result;
  }

  private async collect(
    path: string,
    cutoff: number,
    files: Candidate[],
    semaphore: ScanSemaphore
  ): Promise<void> {
    try {
      const stat = await semaphore.run(() => lstat(path));
      if (stat.isSymbolicLink()) return;
      if (stat.isFile()) {
        if (stat.mtimeMs <= cutoff)
          files.push({ path, bytes: stat.size, modifiedMs: stat.mtimeMs });
        return;
      }
      if (!stat.isDirectory()) return;
      const entries = await semaphore.run(() => readdir(path, { withFileTypes: true }));
      await Promise.all(
        entries
          .filter((entry) => !entry.isSymbolicLink())
          .map((entry) => this.collect(resolve(path, entry.name), cutoff, files, semaphore))
      );
    } catch (error) {
      if (
        (error as NodeJS.ErrnoException).code === "ENOENT" ||
        (error as NodeJS.ErrnoException).code === "EACCES"
      )
        return;
      throw error;
    }
  }

  private isInsideHome(path: string) {
    return isAbsolute(path) && this.isWithin(this.home, path);
  }

  private isApprovedRoot(path: string) {
    return (
      this.isInsideHome(path) ||
      this.externalRoots.some((root) => resolve(path).toLowerCase() === resolve(root).toLowerCase())
    );
  }

  private isWithin(root: string, path: string) {
    const part = relative(resolve(root), resolve(path));
    return part === "" || (part !== ".." && !part.startsWith(`..${sep}`) && !isAbsolute(part));
  }

  private async hasSafeAncestors(path: string, approvedRoot: string) {
    if (!this.isApprovedRoot(approvedRoot) || !this.isWithin(approvedRoot, path)) return false;
    let current = this.isInsideHome(approvedRoot)
      ? resolve(this.home)
      : parse(resolve(approvedRoot)).root;
    const parts = relative(current, path).split(sep).filter(Boolean);
    for (const part of parts.slice(0, -1)) {
      current = resolve(current, part);
      try {
        if (!(await lstat(current)).isDirectory()) return false;
      } catch {
        return false;
      }
    }
    return true;
  }
}
