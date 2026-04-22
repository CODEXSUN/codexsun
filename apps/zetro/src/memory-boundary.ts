/**
 * Memory Boundary Helper
 *
 * Ensures that the .ai directory is correctly created and protected.
 */

import { promises as fs } from "fs";
import { join } from "path";

export async function ensureAIFolders(projectPath: string) {
  const base = join(projectPath, ".ai");
  const dirs = [
    base,
    join(base, "memory"),
    join(base, "memory", "projects"),
    join(base, "memory", "executions"),
    join(base, "memory", "patterns"),
    join(base, "memory", "context"),
    join(base, "cache"),
  ];

  for (const d of dirs) {
    await fs.mkdir(d, { recursive: true }).catch(() => {});
  }

  // Create a .gitignore entry to avoid accidentally committing memory
  const gitignorePath = join(projectPath, ".gitignore");
  const gitignoreEntry = "\n# AI memory and cache\n.ai/\n";
  try {
    const content = await fs.readFile(gitignorePath, "utf-8");
    if (!content.includes(".ai/")) {
      await fs.appendFile(gitignorePath, gitignoreEntry, "utf-8");
    }
  } catch (error) {
    // Create .gitignore with entry
    await fs.writeFile(gitignorePath, gitignoreEntry, "utf-8");
  }
}
