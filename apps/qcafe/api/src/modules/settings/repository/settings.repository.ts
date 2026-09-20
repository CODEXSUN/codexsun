import { randomUUID } from "node:crypto";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type { Connector, CreateConnector } from "../contracts/settings.contract.js";

const cloudSyncKey = "cloud-sync.enabled";

export class SettingsRepository {
  constructor(private readonly database: Kysely<QcafeFoundationDatabase>) {}

  async readCloudSync(): Promise<{ enabled: boolean; updatedAt: string | null }> {
    const row = await this.database.selectFrom("qcafe_runtime_settings").selectAll().where("key", "=", cloudSyncKey).executeTakeFirst();
    if (!row) return { enabled: false, updatedAt: null };
    try { return { enabled: JSON.parse(row.value_json) === true, updatedAt: row.updated_at }; }
    catch { return { enabled: false, updatedAt: row.updated_at }; }
  }

  async writeCloudSync(enabled: boolean, actorId: string, now: string): Promise<void> {
    const existing = await this.database.selectFrom("qcafe_runtime_settings").select("key").where("key", "=", cloudSyncKey).executeTakeFirst();
    if (existing) {
      await this.database.updateTable("qcafe_runtime_settings").set({ updated_at: now, updated_by: actorId, value_json: JSON.stringify(enabled) }).where("key", "=", cloudSyncKey).execute();
      return;
    }
    await this.database.insertInto("qcafe_runtime_settings").values({ key: cloudSyncKey, updated_at: now, updated_by: actorId, value_json: JSON.stringify(enabled) }).execute();
  }

  async listConnectors(): Promise<Connector[]> {
    const rows = await this.database.selectFrom("qcafe_connectors").selectAll().orderBy("kind").orderBy("name").execute();
    return rows.map((row) => ({ code: row.code, enabled: row.enabled === 1, endpointLabel: row.endpoint_label, id: row.id, kind: row.kind, name: row.name, secretReference: row.secret_reference, status: row.status, updatedAt: row.updated_at }));
  }

  async createConnector(input: CreateConnector, now: string): Promise<string> {
    const id = randomUUID();
    const configured = Boolean(input.endpointLabel && input.secretReference);
    await this.database.insertInto("qcafe_connectors").values({ code: input.code, created_at: now, enabled: 0, endpoint_label: input.endpointLabel ?? null, id, kind: input.kind, name: input.name, secret_reference: input.secretReference ?? null, status: configured ? "configured" : "not_configured", updated_at: now }).execute();
    return id;
  }

  async connector(id: string): Promise<Connector | undefined> {
    return (await this.listConnectors()).find((connector) => connector.id === id);
  }

  async setConnectorEnabled(id: string, enabled: boolean, now: string): Promise<void> {
    await this.database.updateTable("qcafe_connectors").set({ enabled: enabled ? 1 : 0, updated_at: now }).where("id", "=", id).execute();
  }
}
