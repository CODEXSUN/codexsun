import type { DatabaseLifecycleRecord } from "@codexsun/platform-core";
import type { ActivityRecorder, CommandContext } from "../../foundation/contracts/activity.contract.js";
import type { QcafePersistenceConfiguration } from "../../foundation/persistence/qcafe-persistence.js";
import type { CreateConnector, DatabaseSettings } from "../contracts/settings.contract.js";
import { SettingsRepository } from "../repository/settings.repository.js";

export class SettingsConflictError extends Error {}

export class SettingsService {
  constructor(
    private readonly repository: SettingsRepository,
    private readonly activity: ActivityRecorder,
    private readonly configuration: QcafePersistenceConfiguration,
    private readonly verifyLifecycle: () => Promise<readonly DatabaseLifecycleRecord[]>,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async database(): Promise<DatabaseSettings> {
    try {
      const records = await this.verifyLifecycle();
      return this.databaseResult("ready", records.length);
    } catch {
      return this.databaseResult("unavailable", 0);
    }
  }

  async verifyDatabase(context: CommandContext): Promise<DatabaseSettings> {
    const result = await this.database();
    await this.activity.record(context, { eventType: "qcafe.settings.database.verified", outcome: result.status === "ready" ? "success" : "failure", subjectId: this.configuration.mode, subjectType: "database" });
    return result;
  }

  async cloudSync() {
    const stored = await this.repository.readCloudSync();
    const availability = this.syncAvailability();
    return { ...availability, enabled: availability.available && stored.enabled, updatedAt: stored.updatedAt };
  }

  async setCloudSync(enabled: boolean, context: CommandContext) {
    const availability = this.syncAvailability();
    if (enabled && !availability.available) throw new SettingsConflictError(availability.reason ?? "Cloud sync is unavailable.");
    await this.repository.writeCloudSync(enabled, context.actorId, this.now().toISOString());
    await this.activity.record(context, { eventType: enabled ? "qcafe.settings.cloud-sync.enabled" : "qcafe.settings.cloud-sync.disabled", subjectId: "cloud-sync", subjectType: "runtime-setting" });
    return this.cloudSync();
  }

  listConnectors() { return this.repository.listConnectors(); }

  async createConnector(input: CreateConnector, context: CommandContext) {
    try {
      const id = await this.repository.createConnector(input, this.now().toISOString());
      await this.activity.record(context, { eventType: "qcafe.settings.connector.created", subjectId: id, subjectType: "connector", payload: { code: input.code, kind: input.kind } });
      return { connectors: await this.listConnectors() };
    } catch {
      throw new SettingsConflictError("A connector with this code already exists.");
    }
  }

  async setConnectorEnabled(id: string, enabled: boolean, context: CommandContext) {
    const connector = await this.repository.connector(id);
    if (!connector) throw new SettingsConflictError("The connector does not exist.");
    if (enabled && connector.status !== "configured") throw new SettingsConflictError("Add an endpoint label and secret reference before enabling this connector.");
    await this.repository.setConnectorEnabled(id, enabled, this.now().toISOString());
    await this.activity.record(context, { eventType: enabled ? "qcafe.settings.connector.enabled" : "qcafe.settings.connector.disabled", subjectId: id, subjectType: "connector" });
    return { connectors: await this.listConnectors() };
  }

  private databaseResult(status: DatabaseSettings["status"], lifecycleRecords: number): DatabaseSettings {
    const local = this.configuration.mode === "local";
    return { connectionSource: "environment", driver: local ? "sqlite" : "mariadb", engine: local ? "SQLite" : "MariaDB", lifecycleRecords, mode: this.configuration.mode, status, storageLabel: local ? "Application local data file" : "Configured Q Cafe database", verifiedAt: this.now().toISOString() };
  }

  private syncAvailability(): { available: boolean; reason: string | null; targetLabel: string | null } {
    if (this.configuration.mode === "cloud") return { available: false, reason: "Cloud mode already uses the central database.", targetLabel: null };
    if (!this.configuration.syncCloudUrl) return { available: false, reason: "Set QCAFE_SYNC_CLOUD_URL on the server to enable synchronization.", targetLabel: null };
    return { available: true, reason: null, targetLabel: "Configured cloud sync service" };
  }
}
