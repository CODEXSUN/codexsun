import { createHash, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";
import type {
  ClientRuntimeProfile,
  ClientWorkspace,
  DeploymentState,
  EnvironmentName,
  EnvironmentState,
  SiteDeployment,
  WorkspaceStatus,
} from "../../../../contracts/workspace.js";

export type {
  ClientRuntimeProfile,
  ClientWorkspace,
  DeploymentState,
  EnvironmentName,
  EnvironmentState,
  SiteDeployment,
  SiteEnvironment,
  WorkspaceStatus,
} from "../../../../contracts/workspace.js";

type WorkspaceRow = {
  slug: string;
  name: string;
  description: string;
  status: WorkspaceStatus;
  runtime_profile: ClientRuntimeProfile;
  source_ref: string;
  design_version: string;
  updated_at: string;
};

type DeploymentRow = {
  id: string;
  client_slug: string;
  environment: EnvironmentName;
  release_tag: string;
  source_ref: string;
  state: DeploymentState;
  requested_at: string;
  completed_at: string | null;
  error_message: string | null;
};

export class SitesWorkspaceStore {
  private readonly database: DatabaseSync;

  constructor(filename: string) {
    if (filename !== ":memory:") mkdirSync(dirname(filename), { recursive: true });
    this.database = new DatabaseSync(filename);
    this.database.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
    this.applyMigrations();
  }

  syncClient(input: { slug: string; name: string; description: string }): void {
    const now = new Date().toISOString();
    this.database
      .prepare(
        "INSERT INTO sites_client_workspaces (slug, name, description, status, runtime_profile, source_ref, design_version, updated_at) VALUES (?, ?, ?, 'active', 'dynamic-forms', ?, 'design.v1', ?) ON CONFLICT(slug) DO UPDATE SET name = excluded.name, description = excluded.description, updated_at = excluded.updated_at",
      )
      .run(input.slug, input.name, input.description, `clients/${input.slug}/main`, now);
    for (const environment of ["development", "staging", "production"] as const) {
      const origin =
        environment === "production"
          ? `https://${input.slug}.example`
          : `http://${input.slug}-${environment}.localhost`;
      this.database
        .prepare(
          "INSERT INTO sites_environments (id, client_slug, name, state, public_origin, database_name, image_tag, updated_at) VALUES (?, ?, ?, 'planned', ?, ?, 'unreleased', ?) ON CONFLICT(client_slug, name) DO NOTHING",
        )
        .run(randomUUID(), input.slug, environment, origin, `sites_${input.slug}_${environment}`, now);
    }
  }

  listWorkspaces(): ClientWorkspace[] {
    return (
      this.database
        .prepare(
          "SELECT slug, name, description, status, runtime_profile, source_ref, design_version, updated_at FROM sites_client_workspaces ORDER BY lower(name)",
        )
        .all() as unknown as WorkspaceRow[]
    ).map((row) => this.toWorkspace(row));
  }

  findWorkspace(slug: string): ClientWorkspace | undefined {
    const row = this.database
      .prepare(
        "SELECT slug, name, description, status, runtime_profile, source_ref, design_version, updated_at FROM sites_client_workspaces WHERE slug = ?",
      )
      .get(slug) as unknown as WorkspaceRow | undefined;
    return row ? this.toWorkspace(row) : undefined;
  }

  requestDeployment(slug: string, environment: EnvironmentName, sourceRef?: string): SiteDeployment | undefined {
    if (!this.findWorkspace(slug)) return undefined;
    const requestedAt = new Date().toISOString();
    const releaseTag = `${slug}-${requestedAt.replace(/[-:TZ.]/gu, "").slice(0, 14)}`;
    const deployment: SiteDeployment = {
      id: randomUUID(),
      clientSlug: slug,
      environment,
      releaseTag,
      sourceRef: sourceRef?.trim() || `clients/${slug}/main`,
      state: "queued",
      requestedAt,
    };
    this.database
      .prepare(
        "INSERT INTO sites_deployments (id, client_slug, environment, release_tag, source_ref, state, requested_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .run(deployment.id, slug, environment, releaseTag, deployment.sourceRef, deployment.state, requestedAt);
    this.database
      .prepare(
        "UPDATE sites_environments SET state = 'ready', image_tag = ?, updated_at = ? WHERE client_slug = ? AND name = ?",
      )
      .run(releaseTag, requestedAt, slug, environment);
    return deployment;
  }

  findDeployment(slug: string, deploymentId: string): SiteDeployment | undefined {
    const deployment = this.findDeploymentById(deploymentId);
    return deployment?.clientSlug === slug ? deployment : undefined;
  }

  findDeploymentById(deploymentId: string): SiteDeployment | undefined {
    const value = this.database
      .prepare(
        "SELECT id, client_slug, environment, release_tag, source_ref, state, requested_at, completed_at, error_message FROM sites_deployments WHERE id = ?",
      )
      .get(deploymentId) as DeploymentRow | undefined;
    return value ? this.toDeployment(value) : undefined;
  }

  updateDeployment(
    deploymentId: string,
    update: { state: DeploymentState; completedAt?: string; errorMessage?: string },
  ): SiteDeployment | undefined {
    const result = this.database
      .prepare("UPDATE sites_deployments SET state = ?, completed_at = ?, error_message = ? WHERE id = ?")
      .run(update.state, update.completedAt ?? null, update.errorMessage ?? null, deploymentId);
    return Number(result.changes) ? this.findDeploymentById(deploymentId) : undefined;
  }

  close(): void {
    this.database.close();
  }

  private toWorkspace(row: WorkspaceRow): ClientWorkspace {
    return {
      slug: row.slug,
      name: row.name,
      description: row.description,
      status: row.status,
      runtimeProfile: row.runtime_profile,
      sourceRef: row.source_ref,
      designVersion: row.design_version,
      environments: this.database
        .prepare(
          "SELECT id, client_slug, name, state, public_origin, database_name, image_tag, updated_at FROM sites_environments WHERE client_slug = ? ORDER BY CASE name WHEN 'development' THEN 1 WHEN 'staging' THEN 2 ELSE 3 END",
        )
        .all(row.slug)
        .map((item) => {
          const value = item as {
            id: string;
            client_slug: string;
            name: EnvironmentName;
            state: EnvironmentState;
            public_origin: string;
            database_name: string;
            image_tag: string;
            updated_at: string;
          };
          return {
            id: value.id,
            clientSlug: value.client_slug,
            name: value.name,
            state: value.state,
            publicOrigin: value.public_origin,
            databaseName: value.database_name,
            imageTag: value.image_tag,
            updatedAt: value.updated_at,
          };
        }),
      latestDeployment: this.readLatestDeployment(row.slug),
      updatedAt: row.updated_at,
    };
  }

  private readLatestDeployment(slug: string): SiteDeployment | undefined {
    const value = this.database
      .prepare(
        "SELECT id, client_slug, environment, release_tag, source_ref, state, requested_at, completed_at, error_message FROM sites_deployments WHERE client_slug = ? ORDER BY requested_at DESC LIMIT 1",
      )
      .get(slug) as DeploymentRow | undefined;
    return value ? this.toDeployment(value) : undefined;
  }

  private toDeployment(value: DeploymentRow): SiteDeployment {
    return {
      id: value.id,
      clientSlug: value.client_slug,
      environment: value.environment,
      releaseTag: value.release_tag,
      sourceRef: value.source_ref,
      state: value.state,
      requestedAt: value.requested_at,
      completedAt: value.completed_at ?? undefined,
      errorMessage: value.error_message ?? undefined,
    };
  }

  private applyMigrations(): void {
    this.database.exec(
      "CREATE TABLE IF NOT EXISTS sites_control_migrations (id TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL)",
    );
    const migrations = [
      {
        id: "sites.workspace.001",
        definition: "client workspaces environments deployments with isolated runtime references",
      },
    ];
    for (const migration of migrations) {
      const checksum = createHash("sha256").update(`${migration.id}|${migration.definition}`).digest("hex");
      const recorded = this.database
        .prepare("SELECT checksum FROM sites_control_migrations WHERE id = ?")
        .get(migration.id) as { checksum: string } | undefined;
      if (recorded && recorded.checksum !== checksum)
        throw new Error(`Sites migration checksum changed: ${migration.id}.`);
      if (!recorded) {
        this.database.exec(
          "CREATE TABLE IF NOT EXISTS sites_client_workspaces (slug TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, status TEXT NOT NULL, runtime_profile TEXT NOT NULL, source_ref TEXT NOT NULL, design_version TEXT NOT NULL, updated_at TEXT NOT NULL)",
        );
        this.database.exec(
          "CREATE TABLE IF NOT EXISTS sites_environments (id TEXT PRIMARY KEY, client_slug TEXT NOT NULL, name TEXT NOT NULL, state TEXT NOT NULL, public_origin TEXT NOT NULL, database_name TEXT NOT NULL, image_tag TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(client_slug, name))",
        );
        this.database.exec(
          "CREATE TABLE IF NOT EXISTS sites_deployments (id TEXT PRIMARY KEY, client_slug TEXT NOT NULL, environment TEXT NOT NULL, release_tag TEXT NOT NULL, source_ref TEXT NOT NULL, state TEXT NOT NULL, requested_at TEXT NOT NULL, completed_at TEXT, error_message TEXT)",
        );
        this.database
          .prepare("INSERT INTO sites_control_migrations (id, checksum, applied_at) VALUES (?, ?, ?)")
          .run(migration.id, checksum, new Date().toISOString());
      }
    }
  }
}
