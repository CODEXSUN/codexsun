/**
 * Quick Reference Generator
 *
 * Generates a concise knowledge summary of the codebase for fast lookups
 * used by the agent to answer project-specific questions quickly.
 */

import { CodebaseAnalyzer } from "./codebase-analyzer.js";
import { promises as fs } from "fs";
import { join } from "path";

export async function generateQuickReference(projectPath: string) {
  const analyzer = new CodebaseAnalyzer(projectPath);
  const index = await analyzer.analyze();
  const summary = analyzer.getArchitectureSummary();

  const refPath = join(projectPath, ".ai", "quick-ref.md");
  await fs.mkdir(join(projectPath, ".ai"), { recursive: true });
  await fs.writeFile(refPath, summary, "utf-8");

  return refPath;
}

export async function loadQuickReference(projectPath: string) {
  const refPath = join(projectPath, ".ai", "quick-ref.md");
  try {
    const content = await fs.readFile(refPath, "utf-8");
    return content;
  } catch {
    return null;
  }
}
