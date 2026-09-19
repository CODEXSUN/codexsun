import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

export type OrshipInfraLog = {
  readonly line: string;
  readonly level: "info" | "warning";
  readonly time: string;
};

export type OrshipInfraMetric = {
  readonly label: string;
  readonly percent?: number;
  readonly series: number[];
  readonly value: string;
};

export type OrshipInfraDetail = {
  readonly connectionStrength: string;
  readonly containerName: string;
  readonly endpoint: string;
  readonly image: string;
  readonly latencyMs: number;
  readonly port: number;
  readonly ports: string;
  readonly rootPasswordHidden: string;
  readonly rootUser: string;
};

export type OrshipInfraRecord = {
  readonly description: string;
  readonly detail: OrshipInfraDetail;
  readonly id: number;
  readonly kind: "infras";
  readonly logs: OrshipInfraLog[];
  readonly metrics: OrshipInfraMetric[];
  readonly name: string;
  readonly composeYaml: string;
  readonly status: "running";
  readonly summary: string;
  readonly uuid: string;
};

export type CreateInfraInput = {
  readonly composeYaml: string;
  readonly containerName: string;
  readonly description: string;
  readonly image: string;
  readonly name: string;
  readonly port: number;
  readonly ports: string;
  readonly rootUser: string;
  readonly summary: string;
};

type InfrasPayload = Omit<OrshipInfraRecord, "id" | "kind" | "uuid">;

type InfrasRow = {
  id: number;
  kind: "infras";
  payload: string;
  uuid: string;
};

const infrasSeed: Array<{ payload: InfrasPayload; uuid: string }> = [
  {
    uuid: "0d12fb98-25a4-4b26-9d72-133f2d0fce01",
    payload: {
      description: "Primary relational database service for application data.",
      detail: {
        connectionStrength: "Strong",
        containerName: "orship-mariadb",
        endpoint: "mariadb://orship-mariadb:3306",
        image: "mariadb:11",
        latencyMs: 12,
        port: 3306,
        ports: "3306:3306",
        rootPasswordHidden: "********",
        rootUser: "root",
      },
      logs: [
        { level: "warning", line: "Aborted connection 897853 to db: 'orship_db' user: 'root' host: '172.18.0.5'.", time: "2026-09-19 12:39:35" },
        { level: "warning", line: "Aborted connection 897870 to db: 'orship_db' user: 'root' host: '172.18.0.5'.", time: "2026-09-19 12:40:26" },
        { level: "info", line: "Ready for connections on port 3306.", time: "2026-09-19 12:41:27" },
        { level: "info", line: "Background checkpoint completed.", time: "2026-09-19 12:54:19" },
      ],
      metrics: [
        { label: "CPU usage", percent: 8, series: [7, 7, 8, 13, 8, 7, 8, 8, 9, 9, 10], value: "8%" },
        { label: "Memory usage", percent: 23, series: [22, 23, 23, 22, 23, 24, 23, 23, 22, 23, 23], value: "476.20 MB" },
        { label: "Incoming traffic", series: [8, 11, 9, 12, 18, 14, 19, 12, 10, 11, 10], value: "10.15 GB" },
        { label: "Outgoing traffic", series: [10, 14, 13, 17, 22, 18, 16, 19, 18, 17, 18], value: "17.88 GB" },
        { label: "Disk usage", percent: 24, series: [24, 24, 25, 24, 24, 24, 25, 24, 24, 25, 24], value: "47 GB / 200 GB" },
        { label: "Bandwidth", percent: 1, series: [1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 1], value: "0.018 TB / 16 TB" },
      ],
      composeYaml: `name: orship-mariadb
services:
  mariadb:
    image: mariadb:11
    container_name: orship-mariadb
    restart: unless-stopped
    ports:
      - "3306:3306"
    environment:
      MARIADB_ROOT_PASSWORD: \${MARIADB_ROOT_PASSWORD}
      MARIADB_DATABASE: orship_db
`,
      name: "MariaDB",
      status: "running",
      summary: "Database container scaffold",
    },
  },
  {
    uuid: "724f0234-fc6d-4ebd-8ac8-691d3e92595a",
    payload: {
      description: "Cache and queue coordination service for runtime jobs.",
      detail: {
        connectionStrength: "Strong",
        containerName: "orship-redis",
        endpoint: "redis://orship-redis:6379",
        image: "redis:7",
        latencyMs: 4,
        port: 6379,
        ports: "6379:6379",
        rootPasswordHidden: "********",
        rootUser: "default",
      },
      logs: [
        { level: "info", line: "Server initialized for standalone mode.", time: "2026-09-19 12:39:35" },
        { level: "info", line: "Ready to accept connections on port 6379.", time: "2026-09-19 12:39:36" },
        { level: "warning", line: "Memory policy is scaffolded for local operations.", time: "2026-09-19 12:41:27" },
      ],
      metrics: [
        { label: "CPU usage", percent: 3, series: [2, 2, 3, 2, 4, 3, 3, 2, 3, 4, 3], value: "3%" },
        { label: "Memory usage", percent: 18, series: [17, 18, 18, 19, 18, 17, 18, 19, 18, 18, 18], value: "128.00 MB" },
        { label: "Incoming traffic", series: [2, 3, 5, 3, 4, 6, 5, 4, 4, 5, 4], value: "2.40 GB" },
        { label: "Outgoing traffic", series: [2, 4, 4, 6, 5, 8, 5, 5, 6, 5, 6], value: "3.10 GB" },
        { label: "Disk usage", percent: 10, series: [10, 10, 10, 11, 10, 10, 10, 11, 10, 10, 10], value: "2 GB / 20 GB" },
        { label: "Bandwidth", percent: 1, series: [1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1], value: "0.004 TB / 16 TB" },
      ],
      composeYaml: `name: orship-redis
services:
  redis:
    image: redis:7
    container_name: orship-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
`,
      name: "Redis",
      status: "running",
      summary: "Memory store container scaffold",
    },
  },
  {
    uuid: "c1e7ff43-3efb-43b3-bb02-0a1749040fbb",
    payload: {
      description: "Managed file browser for container volumes and runtime files.",
      detail: {
        connectionStrength: "Good",
        containerName: "orship-file-browser",
        endpoint: "http://orship-files:8080",
        image: "filebrowser/filebrowser",
        latencyMs: 18,
        port: 8080,
        ports: "8080:8080",
        rootPasswordHidden: "********",
        rootUser: "admin",
      },
      logs: [
        { level: "info", line: "File browser service started.", time: "2026-09-19 12:39:35" },
        { level: "info", line: "Mounted Orship private storage volume.", time: "2026-09-19 12:39:37" },
        { level: "warning", line: "External sharing is disabled in scaffold mode.", time: "2026-09-19 12:40:26" },
      ],
      metrics: [
        { label: "CPU usage", percent: 5, series: [4, 4, 5, 6, 5, 5, 6, 4, 5, 5, 5], value: "5%" },
        { label: "Memory usage", percent: 16, series: [15, 16, 16, 15, 16, 17, 16, 16, 15, 16, 16], value: "196.00 MB" },
        { label: "Incoming traffic", series: [4, 6, 5, 8, 7, 6, 9, 8, 7, 7, 8], value: "4.18 GB" },
        { label: "Outgoing traffic", series: [3, 5, 5, 7, 6, 6, 8, 7, 7, 6, 7], value: "5.63 GB" },
        { label: "Disk usage", percent: 32, series: [31, 32, 32, 33, 32, 32, 32, 33, 32, 32, 32], value: "64 GB / 200 GB" },
        { label: "Bandwidth", percent: 2, series: [1, 2, 2, 2, 3, 2, 2, 2, 3, 2, 2], value: "0.036 TB / 16 TB" },
      ],
      composeYaml: `name: orship-file-browser
services:
  file-browser:
    image: filebrowser/filebrowser
    container_name: orship-file-browser
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - ./storage/apps/orship/private:/srv
`,
      name: "File browser",
      status: "running",
      summary: "Storage browser container scaffold",
    },
  },
];

export class InfrasStore {
  private readonly database: DatabaseSync;

  constructor(databasePath: string) {
    mkdirSync(dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    this.database.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS orship_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NOT NULL UNIQUE,
        kind TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS orship_records_by_kind
        ON orship_records(kind, updated_at);
    `);
    this.seedInfras();
  }

  close(): void {
    this.database.close();
  }

  get(uuid: string): OrshipInfraRecord | undefined {
    const row = this.database.prepare("SELECT id, uuid, kind, payload FROM orship_records WHERE kind = ? AND uuid = ?").get("infras", uuid) as InfrasRow | undefined;
    return row ? toRecord(row) : undefined;
  }

  list(): OrshipInfraRecord[] {
    const rows = this.database.prepare("SELECT id, uuid, kind, payload FROM orship_records WHERE kind = ? ORDER BY id").all("infras") as InfrasRow[];
    return rows.map(toRecord);
  }

  create(input: CreateInfraInput): OrshipInfraRecord {
    const now = Date.now();
    const uuid = randomUUID();
    const payload = createPayload(input);
    this.database.prepare("INSERT INTO orship_records (uuid, kind, payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").run(uuid, "infras", JSON.stringify(payload), now, now);
    const record = this.get(uuid);
    if (!record) throw new Error("Failed to create infra record.");
    return record;
  }

  private seedInfras(): void {
    const now = Date.now();
    const statement = this.database.prepare(`
      INSERT INTO orship_records (uuid, kind, payload, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at
    `);
    for (const item of infrasSeed) statement.run(item.uuid, "infras", JSON.stringify(item.payload), now, now);
  }
}

function toRecord(row: InfrasRow): OrshipInfraRecord {
  return { ...JSON.parse(row.payload) as InfrasPayload, id: row.id, kind: row.kind, uuid: row.uuid };
}

function createPayload(input: CreateInfraInput): InfrasPayload {
  return {
    composeYaml: input.composeYaml,
    description: input.description,
    detail: {
      connectionStrength: "Pending",
      containerName: input.containerName,
      endpoint: `${input.containerName}:${input.port}`,
      image: input.image,
      latencyMs: 0,
      port: input.port,
      ports: input.ports,
      rootPasswordHidden: "********",
      rootUser: input.rootUser,
    },
    logs: [{ level: "info", line: "Create-and-run scaffold prepared from Orship upsert page.", time: new Date().toISOString() }],
    metrics: [
      { label: "CPU usage", percent: 0, series: [0, 0, 0, 0], value: "0%" },
      { label: "Memory usage", percent: 0, series: [0, 0, 0, 0], value: "0 MB" },
      { label: "Incoming traffic", series: [0, 0, 0, 0], value: "0 GB" },
      { label: "Outgoing traffic", series: [0, 0, 0, 0], value: "0 GB" },
      { label: "Disk usage", percent: 0, series: [0, 0, 0, 0], value: "0 GB / 0 GB" },
      { label: "Bandwidth", percent: 0, series: [0, 0, 0, 0], value: "0 TB / 0 TB" },
    ],
    name: input.name,
    status: "running",
    summary: input.summary,
  };
}
