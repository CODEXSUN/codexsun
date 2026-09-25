import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import type { ApplyPatchInput, ApplyPatchResult } from "../contracts/swe-contracts.js";

export class CodePatcherService {
  private readonly backups = new Map<string, string>();

  constructor(private readonly rootDir: string = resolve(".")) {}

  private resolveSafePath(targetPath: string): string {
    const fullPath = resolve(this.rootDir, targetPath);
    const rel = relative(this.rootDir, fullPath);
    if (rel.startsWith("..") || /^[a-zA-Z]:/.test(rel)) {
      throw new Error(`Security Exception: Cannot patch file outside workspace root (${this.rootDir}).`);
    }
    return fullPath;
  }

  applyPatch(input: ApplyPatchInput): ApplyPatchResult {
    const fullPath = this.resolveSafePath(input.filePath);
    const exists = existsSync(fullPath);
    let original = "";

    if (exists) {
      original = readFileSync(fullPath, "utf8");
      this.backups.set(fullPath, original);
    }

    let updated = "";
    let linesChanged = 0;

    if (input.fullContent !== undefined) {
      updated = input.fullContent;
      linesChanged = Math.abs(updated.split("\n").length - original.split("\n").length) || 1;
    } else if (input.targetContent && input.replacementContent !== undefined) {
      if (!exists) {
        throw new Error(`File '${input.filePath}' does not exist for targeted patch replacement.`);
      }
      if (!original.includes(input.targetContent)) {
        throw new Error(`Target content block not found in '${input.filePath}'.`);
      }
      updated = original.replace(input.targetContent, input.replacementContent);
      linesChanged = Math.abs(input.replacementContent.split("\n").length - input.targetContent.split("\n").length) || 1;
    } else {
      throw new Error("Must provide either 'fullContent' or both 'targetContent' and 'replacementContent'.");
    }

    try {
      writeFileSync(fullPath, updated, "utf8");
    } catch (err) {
      if (exists && this.backups.has(fullPath)) {
        writeFileSync(fullPath, this.backups.get(fullPath)!, "utf8");
      }
      throw err;
    }

    const diffPreview = `--- a/${input.filePath}\n+++ b/${input.filePath}\n@@ -1,${original.split("\n").length} +1,${updated.split("\n").length} @@\n${
      input.description ? `# ${input.description}\n` : ""
    }${input.targetContent ? `- ${input.targetContent.slice(0, 100)}\n+ ${input.replacementContent?.slice(0, 100)}` : `+ [Updated ${updated.length} bytes]`}`;

    return {
      success: true,
      filePath: input.filePath,
      linesChanged,
      diffPreview,
      message: `Successfully applied patch to '${input.filePath}' (${linesChanged} lines modified).`,
      backupCreated: exists,
    };
  }

  rollback(filePath: string): boolean {
    const fullPath = this.resolveSafePath(filePath);
    if (!this.backups.has(fullPath)) return false;
    const original = this.backups.get(fullPath)!;
    writeFileSync(fullPath, original, "utf8");
    this.backups.delete(fullPath);
    return true;
  }
}
