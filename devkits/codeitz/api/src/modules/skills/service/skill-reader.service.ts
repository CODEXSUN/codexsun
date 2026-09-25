import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import type { ParsedSkill } from "../contracts/skills-contracts.js";

function findWorkspaceRoot(startDir: string = resolve(".")): string {
  let curr = resolve(startDir);
  for (let i = 0; i < 5; i++) {
    if (existsSync(resolve(curr, "turbo.json")) || existsSync(resolve(curr, ".agents"))) {
      return curr;
    }
    const parent = dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  return resolve(startDir);
}

export class SkillReaderService {
  constructor(private readonly rootDir: string = findWorkspaceRoot()) {}

  private resolveSafePath(p: string): string {
    const full = resolve(this.rootDir, p);
    const rel = relative(this.rootDir, full);
    if (rel.startsWith("..") || /^[a-zA-Z]:/.test(rel)) {
      throw new Error(`Security Exception: Cannot access skill outside root (${this.rootDir}).`);
    }
    return full;
  }

  discoverSkillFiles(searchDirs: string[] = [".agents/skills", "devkits/codeitz/skills"]): string[] {
    const discovered: string[] = [];

    for (const dir of searchDirs) {
      try {
        const fullDir = this.resolveSafePath(dir);
        if (!existsSync(fullDir)) continue;

        const entries = readdirSync(fullDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const skillFile = join(fullDir, entry.name, "SKILL.md");
            if (existsSync(skillFile)) {
              discovered.push(relative(this.rootDir, skillFile).replace(/\\/g, "/"));
            }
          } else if (entry.name === "SKILL.md") {
            discovered.push(relative(this.rootDir, join(fullDir, entry.name)).replace(/\\/g, "/"));
          }
        }
      } catch {
        // Skip unreadable directories safely
      }
    }

    return discovered;
  }

  parseSkillFile(relPath: string): ParsedSkill {
    const fullPath = this.resolveSafePath(relPath);
    if (!existsSync(fullPath)) {
      throw new Error(`Skill file '${relPath}' does not exist.`);
    }

    const raw = readFileSync(fullPath, "utf8");
    const skillDir = dirname(fullPath);

    // 1. Parse frontmatter
    let frontmatter: Record<string, string> = {};
    let markdownBody = raw;
    const validationErrors: string[] = [];

    const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (fmMatch) {
      const fmLines = fmMatch[1].split(/\r?\n/);
      for (const line of fmLines) {
        const idx = line.indexOf(":");
        if (idx > 0) {
          const key = line.slice(0, idx).trim();
          const val = line.slice(idx + 1).trim();
          frontmatter[key] = val;
        }
      }
      markdownBody = fmMatch[2].trim();
    } else {
      validationErrors.push("Missing YAML frontmatter markers (---).");
    }

    // 2. Extract sections
    const name = frontmatter.name || basename(skillDir);
    const description = frontmatter.description || this.extractSection(markdownBody, "Purpose") || "";

    const workflow = this.extractNumberedList(markdownBody, "Workflow");
    const verificationCriteria = this.extractBulletList(markdownBody, "Verification");
    const guardrails = this.extractBulletList(markdownBody, "Guardrails");
    const exclusions = this.extractBulletList(markdownBody, "Exclusions");

    // 3. Inspect directory assets
    const scripts: string[] = [];
    const references: string[] = [];

    const scriptsDir = join(skillDir, "scripts");
    if (existsSync(scriptsDir) && statSync(scriptsDir).isDirectory()) {
      try {
        scripts.push(...readdirSync(scriptsDir));
      } catch {}
    }

    const refsDir = join(skillDir, "references");
    if (existsSync(refsDir) && statSync(refsDir).isDirectory()) {
      try {
        references.push(...readdirSync(refsDir));
      } catch {}
    }

    // Determine category
    const category = this.categorizeSkill(name, description, relPath);
    const tags = this.extractTags(name, description, category);

    return {
      id: `skill-${name}`,
      name,
      description,
      category,
      domain: "software-engineering",
      tags,
      sourcePath: relPath.replace(/\\/g, "/"),
      workflow,
      verificationCriteria,
      guardrails,
      exclusions,
      markdown: raw,
      scripts,
      references,
      valid: validationErrors.length === 0,
      validationErrors,
      rating: 5,
      usageCount: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  private extractSection(md: string, heading: string): string | null {
    const pattern = heading.toLowerCase() === "workflow"
      ? `##\\s+(?:[A-Za-z0-9_-]+\\s+)?Workflow\\s*\\r?\\n+([\\s\\S]*?)(?=\\r?\\n##\\s+[A-Za-z]|$)`
      : `##\\s+${heading}\\s*\\r?\\n+([\\s\\S]*?)(?=\\r?\\n##\\s+[A-Za-z]|$)`;
    const regex = new RegExp(pattern, "i");
    const match = md.match(regex);
    return match ? match[1].trim() : null;
  }

  private extractNumberedList(md: string, heading: string): string[] {
    const section = this.extractSection(md, heading);
    if (!section) return [];
    return section
      .split(/\r?\n/)
      .filter((line) => /^\s*\d+\.\s+/.test(line))
      .map((line) => line.replace(/^\s*\d+\.\s*/, "").trim())
      .filter((line) => line.length > 0);
  }

  private extractBulletList(md: string, heading: string): string[] {
    const section = this.extractSection(md, heading);
    if (!section) return [];
    return section
      .split(/\r?\n/)
      .filter((line) => /^\s*[-*]\s+/.test(line))
      .map((line) => line.replace(/^\s*[-*]\s*/, "").trim())
      .filter((line) => line.length > 0);
  }

  private categorizeSkill(name: string, description: string, path: string): string {
    const text = `${name} ${description} ${path}`.toLowerCase();
    if (text.includes("test") || text.includes("check") || text.includes("mock") || text.includes("coverage")) return "testing";
    if (text.includes("debug") || text.includes("leak") || text.includes("error") || text.includes("troubleshoot")) return "debugging";
    if (text.includes("git") || text.includes("branch") || text.includes("worktree") || text.includes("commit")) return "git";
    if (text.includes("swe") || text.includes("pipeline") || text.includes("patch") || text.includes("engineer")) return "swe";
    if (text.includes("arch") || text.includes("pattern") || text.includes("design") || text.includes("system")) return "architecture";
    if (text.includes("learn") || text.includes("distill") || text.includes("heuristic")) return "learning";
    if (text.includes("ui") || text.includes("widget") || text.includes("layout") || text.includes("a11y")) return "frontend";
    return "general";
  }

  private extractTags(name: string, description: string, category: string): string[] {
    const tags = new Set<string>([category]);
    const words = `${name} ${description}`.toLowerCase().match(/[a-z]{3,}/g) || [];
    const keywords = ["agentic", "swe", "verification", "pipeline", "diff", "safety", "testing", "regression", "learning", "heuristics", "git", "ast"];
    for (const w of words) {
      if (keywords.includes(w)) {
        tags.add(w);
      }
    }
    return Array.from(tags);
  }
}
