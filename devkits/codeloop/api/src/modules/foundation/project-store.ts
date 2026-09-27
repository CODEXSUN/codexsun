import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

export type ProjectRecord = {
  id: string;
  ownerId: string;
  name: string;
  path: string;
  sourceType: "local" | "cloud";
  repository?: string;
  description: string;
  instructions: string;
};

type ProjectRow = Omit<ProjectRecord, "ownerId"> & { owner_id: string; repository: string | null; source_type: string };

export class ProjectStore {
  private readonly database: DatabaseSync;

  constructor(databasePath: string) {
    if (!existsSync(databasePath)) mkdirSync(dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    this.database.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
  }

  initialize(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS codeloop_projects (
        id TEXT NOT NULL,
        owner_id TEXT NOT NULL,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        source_type TEXT NOT NULL DEFAULT 'local',
        repository TEXT,
        description TEXT NOT NULL,
        instructions TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (owner_id, id)
      );
      CREATE INDEX IF NOT EXISTS idx_codeloop_projects_owner ON codeloop_projects(owner_id, name ASC);
    `);
    const columns = this.database.prepare("PRAGMA table_info(codeloop_projects)").all() as { name: string }[];
    if (!columns.some((column) => column.name === "source_type")) this.database.exec("ALTER TABLE codeloop_projects ADD COLUMN source_type TEXT NOT NULL DEFAULT 'local'");
  }

  list(ownerId: string): readonly ProjectRecord[] {
    const rows = this.database.prepare("SELECT id, owner_id, name, path, source_type, repository, description, instructions FROM codeloop_projects WHERE owner_id = ? ORDER BY name ASC").all(ownerId) as ProjectRow[];
    return rows.map(mapRow);
  }

  get(ownerId: string, projectId: string): ProjectRecord | null {
    const row = this.database.prepare("SELECT id, owner_id, name, path, source_type, repository, description, instructions FROM codeloop_projects WHERE owner_id = ? AND id = ?").get(ownerId, projectId) as ProjectRow | undefined;
    return row ? mapRow(row) : null;
  }

  create(ownerId: string, project: Omit<ProjectRecord, "ownerId">): ProjectRecord {
    const now = new Date().toISOString();
    this.database.prepare(`
      INSERT INTO codeloop_projects (id, owner_id, name, path, source_type, repository, description, instructions, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(project.id, ownerId, project.name, project.path, project.sourceType, project.repository ?? null, project.description, project.instructions, now, now);
    return { ...project, ownerId };
  }

  ensureDefault(ownerId: string, project: Omit<ProjectRecord, "ownerId">): ProjectRecord {
    const now = new Date().toISOString();
    this.database.prepare(`
      INSERT INTO codeloop_projects (id, owner_id, name, path, repository, description, instructions, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(owner_id, id) DO NOTHING
    `).run(project.id, ownerId, project.name, project.path, project.repository ?? null, project.description, project.instructions, now, now);
    return this.list(ownerId).find((item) => item.id === project.id) ?? { ...project, ownerId };
  }

  close(): void {
    this.database.close();
  }
}

function mapRow(row: ProjectRow): ProjectRecord {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    path: row.path,
    sourceType: row.source_type === "cloud" ? "cloud" : "local",
    ...(row.repository ? { repository: row.repository } : {}),
    description: row.description,
    instructions: row.instructions,
  };
}
