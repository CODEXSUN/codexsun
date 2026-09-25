import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { findWorkspaceRoot } from "../../engineering/service/workspace-root.js";
import type {
  OrganizeSkillInput,
  ParsedSkill,
  SkillCatalog,
  SkillRecommendation,
} from "../contracts/skills-contracts.js";
import { SkillReaderService } from "./skill-reader.service.js";

export class SkillOrganiserService {
  private readonly db: DatabaseSync;
  private readonly jsonCatalogPath: string;
  private readonly reader: SkillReaderService;

  constructor(
    options: {
      sqlitePath?: string;
      jsonCatalogPath?: string;
      reader?: SkillReaderService;
      inMemorySqlite?: boolean;
    } = {},
  ) {
    this.reader = options.reader ?? new SkillReaderService();
    const root = findWorkspaceRoot();
    const dbPath = options.inMemorySqlite
      ? ":memory:"
      : (options.sqlitePath ?? resolve(root, "storage/runtime/codeitz/skills.sqlite"));
    this.jsonCatalogPath = options.jsonCatalogPath ?? resolve(root, "storage/runtime/codeitz/skills-catalog.json");

    if (dbPath !== ":memory:") {
      const dir = dirname(dbPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }
    const jsonDir = dirname(this.jsonCatalogPath);
    if (!existsSync(jsonDir)) {
      mkdirSync(jsonDir, { recursive: true });
    }

    this.db = new DatabaseSync(dbPath);
    this.initTables();
    this.scanAndIndex();
  }

  private initTables(): void {
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA busy_timeout = 5000;

      CREATE TABLE IF NOT EXISTS indexed_skills (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        domain TEXT NOT NULL,
        description TEXT NOT NULL,
        tags TEXT NOT NULL,
        source_path TEXT NOT NULL,
        workflow TEXT NOT NULL,
        verification_checks TEXT NOT NULL,
        guardrails TEXT NOT NULL,
        exclusions TEXT NOT NULL,
        scripts TEXT NOT NULL,
        references_list TEXT NOT NULL,
        markdown TEXT NOT NULL,
        rating INTEGER DEFAULT 5,
        usage_count INTEGER DEFAULT 0,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_skills_category ON indexed_skills(category);
      CREATE INDEX IF NOT EXISTS idx_skills_name ON indexed_skills(name);
    `);
  }

  scanAndIndex(paths?: string[], forceReindex: boolean = false): SkillCatalog {
    const defaultSearchDirs = [".agents/skills", "packages/addons"];
    const files = this.reader.discoverSkillFiles(paths ?? defaultSearchDirs);

    for (const f of files) {
      try {
        const parsed = this.reader.parseSkillFile(f);
        this.saveSkillToSqlite(parsed, forceReindex);
      } catch {
        // Skip malformed files safely
      }
    }

    return this.exportJsonCatalog();
  }

  private saveSkillToSqlite(skill: ParsedSkill, forceReindex: boolean = false): void {
    const existing = this.getSkillByName(skill.name);
    const rating = (!forceReindex && existing) ? existing.rating : skill.rating;
    const usageCount = (!forceReindex && existing) ? existing.usageCount : skill.usageCount;
    const category = (!forceReindex && existing && existing.category !== "general") ? existing.category : skill.category;

    const stmt = this.db.prepare(`
      INSERT INTO indexed_skills (
        id, name, category, domain, description, tags, source_path,
        workflow, verification_checks, guardrails, exclusions, scripts,
        references_list, markdown, rating, usage_count, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET
        category = excluded.category,
        description = excluded.description,
        tags = excluded.tags,
        source_path = excluded.source_path,
        workflow = excluded.workflow,
        verification_checks = excluded.verification_checks,
        guardrails = excluded.guardrails,
        exclusions = excluded.exclusions,
        scripts = excluded.scripts,
        references_list = excluded.references_list,
        markdown = excluded.markdown,
        rating = excluded.rating,
        usage_count = excluded.usage_count,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      skill.id,
      skill.name,
      category,
      skill.domain,
      skill.description,
      JSON.stringify(skill.tags),
      skill.sourcePath,
      JSON.stringify(skill.workflow),
      JSON.stringify(skill.verificationCriteria),
      JSON.stringify(skill.guardrails),
      JSON.stringify(skill.exclusions),
      JSON.stringify(skill.scripts),
      JSON.stringify(skill.references),
      skill.markdown,
      rating,
      usageCount,
      new Date().toISOString(),
    );
  }

  getSkillByName(name: string): ParsedSkill | null {
    const stmt = this.db.prepare(`SELECT * FROM indexed_skills WHERE name = ? OR id = ?`);
    const row = stmt.get(name, name) as Record<string, unknown> | undefined;
    if (!row) return null;
    return this.mapRowToParsedSkill(row);
  }

  listSkills(category?: string): ParsedSkill[] {
    let sql = `SELECT * FROM indexed_skills`;
    const params: string[] = [];
    if (category && category !== "all") {
      sql += ` WHERE category = ?`;
      params.push(category);
    }
    sql += ` ORDER BY rating DESC, usage_count DESC, name ASC`;

    const stmt = this.db.prepare(sql);
    const rows = (params.length > 0 ? stmt.all(...params) : stmt.all()) as Array<Record<string, unknown>>;
    return rows.map((r) => this.mapRowToParsedSkill(r));
  }

  recommendSkills(prompt: string, limit: number = 3): SkillRecommendation[] {
    const allSkills = this.listSkills();
    const promptLower = prompt.toLowerCase();
    const words = promptLower.split(/\W+/).filter((w) => w.length > 2);

    const scored: Array<{ skill: ParsedSkill; score: number; reason: string; matches: string[] }> = [];

    for (const skill of allSkills) {
      let score = 0;
      const matches: string[] = [];

      // Check skill name
      if (promptLower.includes(skill.name.toLowerCase())) {
        score += 0.5;
        matches.push(skill.name);
      }

      // Check tags
      for (const tag of skill.tags) {
        if (promptLower.includes(tag.toLowerCase())) {
          score += 0.2;
          if (!matches.includes(tag)) matches.push(tag);
        }
      }

      // Check description & workflow keywords
      const combined = `${skill.description} ${skill.workflow.join(" ")}`.toLowerCase();
      for (const w of words) {
        if (combined.includes(w)) {
          score += 0.05;
          if (!matches.includes(w) && matches.length < 5) matches.push(w);
        }
      }

      // Prioritize higher-rated skills
      score += (skill.rating / 10) * 0.1;

      if (score > 0.1) {
        let reason = `Matches prompt intent on: ${matches.join(", ")}`;
        if (skill.category === "swe") reason += " (Standard SWE pipeline guardrails)";
        scored.push({ skill, score: Math.min(1, Math.round(score * 100) / 100), reason, matches });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => ({
      skill: s.skill,
      score: s.score,
      reason: s.reason,
      matchedKeywords: s.matches,
    }));
  }

  organizeSkill(input: OrganizeSkillInput): ParsedSkill {
    const existing = this.getSkillByName(input.name);
    if (!existing) {
      throw new Error(`Skill '${input.name}' not found in catalog.`);
    }

    const updatedCategory = input.category ?? existing.category;
    const updatedTags = input.tags ?? existing.tags;
    const updatedRating = input.rating ?? existing.rating;

    const stmt = this.db.prepare(`
      UPDATE indexed_skills SET
        category = ?,
        tags = ?,
        rating = ?,
        updated_at = ?
      WHERE name = ?
    `);

    stmt.run(
      updatedCategory,
      JSON.stringify(updatedTags),
      updatedRating,
      new Date().toISOString(),
      input.name,
    );

    this.exportJsonCatalog();
    return this.getSkillByName(input.name)!;
  }

  recordSkillUsage(name: string): void {
    const stmt = this.db.prepare(`UPDATE indexed_skills SET usage_count = usage_count + 1 WHERE name = ?`);
    stmt.run(name);
  }

  exportJsonCatalog(): SkillCatalog {
    const skills = this.listSkills();
    const catMap = new Map<string, number>();

    for (const s of skills) {
      catMap.set(s.category, (catMap.get(s.category) ?? 0) + 1);
    }

    const categories = Array.from(catMap.entries()).map(([name, count]) => ({ name, count }));

    const catalog: SkillCatalog = {
      totalCount: skills.length,
      categories,
      skills,
      lastScannedAt: new Date().toISOString(),
    };

    try {
      writeFileSync(this.jsonCatalogPath, JSON.stringify(catalog, null, 2), "utf8");
    } catch {
      // Safe fallback
    }

    return catalog;
  }

  close(): void {
    this.db.close();
  }

  private mapRowToParsedSkill(row: Record<string, unknown>): ParsedSkill {
    const parseArr = (val: unknown): string[] => {
      if (!val) return [];
      try {
        return JSON.parse(String(val));
      } catch {
        return [];
      }
    };

    return {
      id: String(row.id),
      name: String(row.name),
      description: String(row.description || ""),
      category: String(row.category || "general"),
      domain: String(row.domain || "software-engineering"),
      tags: parseArr(row.tags),
      sourcePath: String(row.source_path || ""),
      workflow: parseArr(row.workflow),
      verificationCriteria: parseArr(row.verification_checks),
      guardrails: parseArr(row.guardrails),
      exclusions: parseArr(row.exclusions),
      markdown: String(row.markdown || ""),
      scripts: parseArr(row.scripts),
      references: parseArr(row.references_list),
      valid: true,
      validationErrors: [],
      rating: Number(row.rating || 5),
      usageCount: Number(row.usage_count || 0),
      updatedAt: String(row.updated_at || new Date().toISOString()),
    };
  }
}
