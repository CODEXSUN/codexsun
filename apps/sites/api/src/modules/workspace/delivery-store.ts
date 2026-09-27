import { createHash, randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import type {
  ActionPriority,
  ActionReport,
  ClientDeliveryWorkspace,
  ClientHandoff,
  DeliveryStatus,
  DeveloperProfile,
  WorkPlanItem,
} from "../../../../contracts/delivery.js";

type DeliveryConfig = { readonly databasePath: string };
type WorkPlanRow = WorkPlanItem & {
  assignee_id: string | null;
  client_slug: string;
  due_date: string | null;
  updated_at: string;
};
type ActionReportRow = ActionReport & {
  client_slug: string;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
};

export class SitesDeliveryStore {
  private readonly database: DatabaseSync;

  constructor(configuration: DeliveryConfig) {
    this.database = new DatabaseSync(configuration.databasePath);
    this.database.exec("PRAGMA busy_timeout = 5000;");
    this.applyMigration();
  }

  syncClient(clientSlug: string): void {
    const now = new Date().toISOString();
    const defaults = [
      ["brief", "Confirm client brief", "Capture goals, scope, pages, references, and acceptance criteria."],
      ["design", "Implement approved design direction", "Keep the client concept independent from other client sites."],
      ["content", "Collect and place client content", "Use approved copy, assets, contact details, and SEO metadata."],
      ["development", "Build the client site", "Implement responsive public pages and requested interactions."],
      ["review", "Run client review and responsive QA", "Resolve feedback before staging approval."],
      ["launch", "Prepare live release", "Verify domain, forms, health, backup, and handoff notes."],
    ] as const;
    const insert = this.database.prepare(
      "INSERT OR IGNORE INTO sites_work_plan (id, client_slug, stage, title, details, status, assignee_id, due_date, position, updated_at) VALUES (?, ?, ?, ?, ?, 'todo', NULL, NULL, ?, ?)",
    );
    defaults.forEach(([stage, title, details], position) =>
      insert.run(`plan-${clientSlug}-${stage}`, clientSlug, stage, title, details, position, now),
    );
    this.database
      .prepare(
        "INSERT OR IGNORE INTO sites_handoffs (client_slug, brief, success_criteria_json, assets_json, access_notes, updated_at) VALUES (?, '', ?, ?, '', ?)",
      )
      .run(clientSlug, JSON.stringify([]), JSON.stringify([]), now);
  }

  read(clientSlug: string): ClientDeliveryWorkspace {
    return {
      developers: this.listDevelopers(),
      workPlan: this.listWorkPlan(clientSlug),
      actionReports: this.listActionReports(clientSlug),
      handoff: this.readHandoff(clientSlug),
    };
  }

  listDevelopers(): DeveloperProfile[] {
    return (
      this.database
        .prepare("SELECT id, name, role, focus, active FROM sites_developers WHERE active = 1 ORDER BY name")
        .all() as unknown as DeveloperProfile[]
    ).map((developer) => ({ ...developer, active: Boolean(developer.active) }));
  }

  listWorkPlan(clientSlug: string): WorkPlanItem[] {
    return (
      this.database
        .prepare(
          "SELECT id, client_slug, stage, title, details, status, assignee_id, due_date, position, updated_at FROM sites_work_plan WHERE client_slug = ? ORDER BY position, updated_at",
        )
        .all(clientSlug) as unknown as WorkPlanRow[]
    ).map((row) => ({
      id: row.id,
      clientSlug: row.client_slug,
      stage: row.stage,
      title: row.title,
      details: row.details,
      status: row.status,
      assigneeId: row.assignee_id ?? undefined,
      dueDate: row.due_date ?? undefined,
      position: row.position,
      updatedAt: row.updated_at,
    }));
  }

  updateWorkPlan(
    id: string,
    update: { status?: DeliveryStatus; assigneeId?: string | null; dueDate?: string | null },
  ): WorkPlanItem | undefined {
    const current = this.database
      .prepare(
        "SELECT id, client_slug, stage, title, details, status, assignee_id, due_date, position, updated_at FROM sites_work_plan WHERE id = ?",
      )
      .get(id) as WorkPlanRow | undefined;
    if (!current) return undefined;
    const updatedAt = new Date().toISOString();
    this.database
      .prepare("UPDATE sites_work_plan SET status = ?, assignee_id = ?, due_date = ?, updated_at = ? WHERE id = ?")
      .run(
        update.status ?? current.status,
        update.assigneeId === undefined ? current.assignee_id : update.assigneeId,
        update.dueDate === undefined ? current.due_date : update.dueDate,
        updatedAt,
        id,
      );
    return this.listWorkPlan(current.client_slug).find((item) => item.id === id);
  }

  listActionReports(clientSlug: string): ActionReport[] {
    return (
      this.database
        .prepare(
          "SELECT id, client_slug, title, summary, status, priority, owner_id, created_at, updated_at FROM sites_action_reports WHERE client_slug = ? ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END, updated_at DESC",
        )
        .all(clientSlug) as unknown as ActionReportRow[]
    ).map((row) => ({
      id: row.id,
      clientSlug: row.client_slug,
      title: row.title,
      summary: row.summary,
      status: row.status,
      priority: row.priority,
      ownerId: row.owner_id ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  createActionReport(input: {
    clientSlug: string;
    title: string;
    summary: string;
    priority: ActionPriority;
    ownerId?: string;
  }): ActionReport {
    const id = randomUUID();
    const now = new Date().toISOString();
    this.database
      .prepare(
        "INSERT INTO sites_action_reports (id, client_slug, title, summary, status, priority, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, 'open', ?, ?, ?, ?)",
      )
      .run(id, input.clientSlug, input.title, input.summary, input.priority, input.ownerId ?? null, now, now);
    return this.listActionReports(input.clientSlug).find((report) => report.id === id)!;
  }

  readHandoff(clientSlug: string): ClientHandoff {
    const row = this.database
      .prepare(
        "SELECT client_slug, brief, success_criteria_json, assets_json, access_notes, updated_at FROM sites_handoffs WHERE client_slug = ?",
      )
      .get(clientSlug) as
      | {
          client_slug: string;
          brief: string;
          success_criteria_json: string;
          assets_json: string;
          access_notes: string;
          updated_at: string;
        }
      | undefined;
    return row
      ? {
          clientSlug: row.client_slug,
          brief: row.brief,
          successCriteria: JSON.parse(row.success_criteria_json) as string[],
          assets: JSON.parse(row.assets_json) as string[],
          accessNotes: row.access_notes,
          updatedAt: row.updated_at,
        }
      : {
          clientSlug,
          brief: "",
          successCriteria: [],
          assets: [],
          accessNotes: "",
          updatedAt: new Date(0).toISOString(),
        };
  }

  saveHandoff(clientSlug: string, input: Omit<ClientHandoff, "clientSlug" | "updatedAt">): ClientHandoff {
    const updatedAt = new Date().toISOString();
    this.database
      .prepare(
        "INSERT INTO sites_handoffs (client_slug, brief, success_criteria_json, assets_json, access_notes, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(client_slug) DO UPDATE SET brief = excluded.brief, success_criteria_json = excluded.success_criteria_json, assets_json = excluded.assets_json, access_notes = excluded.access_notes, updated_at = excluded.updated_at",
      )
      .run(
        clientSlug,
        input.brief,
        JSON.stringify(input.successCriteria),
        JSON.stringify(input.assets),
        input.accessNotes,
        updatedAt,
      );
    return this.readHandoff(clientSlug);
  }

  close(): void {
    this.database.close();
  }

  private applyMigration(): void {
    this.database.exec(
      "CREATE TABLE IF NOT EXISTS sites_control_migrations (id TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL)",
    );
    const id = "sites.workspace.002";
    const definition = "developers work plan action reports and client handoff";
    const checksum = createHash("sha256").update(`${id}|${definition}`).digest("hex");
    const recorded = this.database.prepare("SELECT checksum FROM sites_control_migrations WHERE id = ?").get(id) as
      { checksum: string } | undefined;
    if (recorded && recorded.checksum !== checksum) throw new Error(`Sites migration checksum changed: ${id}.`);
    if (recorded) return;
    this.database.exec(
      "CREATE TABLE IF NOT EXISTS sites_developers (id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL, focus TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1)",
    );
    this.database.exec(
      "CREATE TABLE IF NOT EXISTS sites_work_plan (id TEXT PRIMARY KEY, client_slug TEXT NOT NULL, stage TEXT NOT NULL, title TEXT NOT NULL, details TEXT NOT NULL, status TEXT NOT NULL, assignee_id TEXT, due_date TEXT, position INTEGER NOT NULL, updated_at TEXT NOT NULL)",
    );
    this.database.exec(
      "CREATE TABLE IF NOT EXISTS sites_action_reports (id TEXT PRIMARY KEY, client_slug TEXT NOT NULL, title TEXT NOT NULL, summary TEXT NOT NULL, status TEXT NOT NULL, priority TEXT NOT NULL, owner_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
    );
    this.database.exec(
      "CREATE TABLE IF NOT EXISTS sites_handoffs (client_slug TEXT PRIMARY KEY, brief TEXT NOT NULL, success_criteria_json TEXT NOT NULL, assets_json TEXT NOT NULL, access_notes TEXT NOT NULL, updated_at TEXT NOT NULL)",
    );
    const developer = this.database.prepare(
      "INSERT OR IGNORE INTO sites_developers (id, name, role, focus) VALUES (?, ?, ?, ?)",
    );
    developer.run("design-lead", "Design lead", "Designer", "Client concept and visual direction");
    developer.run(
      "frontend-developer",
      "Frontend developer",
      "Developer",
      "Responsive implementation and interactions",
    );
    developer.run("content-qa", "Content and QA", "Developer", "Content, forms, accessibility, and release checks");
    this.database
      .prepare("INSERT INTO sites_control_migrations (id, checksum, applied_at) VALUES (?, ?, ?)")
      .run(id, checksum, new Date().toISOString());
  }
}
