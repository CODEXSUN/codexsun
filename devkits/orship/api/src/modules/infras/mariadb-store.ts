import { randomUUID } from "node:crypto";
import type { KyselyDataProvider } from "@codexsun/platform-core";
import type { Generated, Selectable } from "kysely";
import type { CreateInfraInput, OrshipInfraRecord } from "./infras-store.js";

export type InfrasDatabase = {
  orship_infras: {
    id: Generated<number>;
    uuid: string;
    kind: string;
    payload: string;
    created_at: string;
    updated_at: string;
  };
};

type MariaDbInfraConfig = {
  readonly containerName: string;
  readonly database: string;
  readonly hostPort: number;
  readonly image: string;
  readonly network: string;
};

type InfraRow = Selectable<InfrasDatabase["orship_infras"]>;
type InfraPayload = Omit<OrshipInfraRecord, "id" | "kind" | "uuid">;

export class MariaDbInfrasStore {
  constructor(
    private readonly provider: KyselyDataProvider<InfrasDatabase>,
    private readonly config: MariaDbInfraConfig,
  ) {}

  async initialize(): Promise<void> {
    const database = this.provider.queryDatabase();
    await database.schema
      .createTable("orship_infras")
      .ifNotExists()
      .addColumn("id", "integer", (column) => column.primaryKey().autoIncrement())
      .addColumn("uuid", "varchar(36)", (column) => column.notNull().unique())
      .addColumn("kind", "varchar(32)", (column) => column.notNull())
      .addColumn("payload", "text", (column) => column.notNull())
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .execute();
    await this.upsertDatabaseRecord();
  }

  async close(): Promise<void> {
    await this.provider.destroy();
  }

  async get(uuid: string): Promise<OrshipInfraRecord | undefined> {
    const row = await this.provider.queryDatabase()
      .selectFrom("orship_infras")
      .selectAll()
      .where("kind", "=", "infras")
      .where("uuid", "=", uuid)
      .executeTakeFirst();
    return row ? toRecord(row) : undefined;
  }

  async list(): Promise<OrshipInfraRecord[]> {
    const rows = await this.provider.queryDatabase()
      .selectFrom("orship_infras")
      .selectAll()
      .where("kind", "=", "infras")
      .orderBy("id")
      .execute();
    return rows.map(toRecord);
  }

  async create(input: CreateInfraInput): Promise<OrshipInfraRecord> {
    const now = new Date().toISOString();
    const uuid = randomUUID();
    await this.provider.queryDatabase().insertInto("orship_infras").values({
      uuid,
      kind: "infras",
      payload: JSON.stringify(createPayload(input)),
      created_at: now,
      updated_at: now,
    }).execute();
    const record = await this.get(uuid);
    if (!record) throw new Error("Failed to create infra record.");
    return record;
  }

  private async upsertDatabaseRecord(): Promise<void> {
    const uuid = "0d12fb98-25a4-4b26-9d72-133f2d0fce01";
    const now = new Date().toISOString();
    const payload: InfraPayload = {
      composeYaml: `name: ${this.config.containerName}\nservices:\n  mariadb:\n    image: ${this.config.image}\n    container_name: ${this.config.containerName}\n    networks:\n      - ${this.config.network}\n`,
      description: "Primary MariaDB service for Orship application data.",
      detail: {
        connectionStrength: "Checking",
        containerName: this.config.containerName,
        endpoint: `${this.config.containerName}:3306/${this.config.database}`,
        image: this.config.image,
        latencyMs: 0,
        port: 3306,
        ports: `${this.config.hostPort}:3306`,
        rootPasswordHidden: "********",
        rootUser: "root",
      },
      logs: [],
      metrics: [],
      name: "MariaDB",
      status: "unknown",
      summary: "Orship application database",
    };
    await this.provider.queryDatabase().insertInto("orship_infras").values({
      uuid,
      kind: "infras",
      payload: JSON.stringify(payload),
      created_at: now,
      updated_at: now,
    }).onDuplicateKeyUpdate({ payload: JSON.stringify(payload), updated_at: now }).execute();
  }
}

function toRecord(row: InfraRow): OrshipInfraRecord {
  return { ...JSON.parse(row.payload) as InfraPayload, id: row.id, kind: row.kind as "infras", uuid: row.uuid };
}

function createPayload(input: CreateInfraInput): InfraPayload {
  return {
    composeYaml: input.composeYaml,
    description: input.description,
    detail: {
      connectionStrength: "Checking",
      containerName: input.containerName,
      endpoint: `${input.containerName}:${input.port}`,
      image: input.image,
      latencyMs: 0,
      port: input.port,
      ports: input.ports,
      rootPasswordHidden: "********",
      rootUser: input.rootUser,
    },
    logs: [],
    metrics: [],
    name: input.name,
    status: "unknown",
    summary: input.summary,
  };
}
