import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { zetroPreparedTaskHandoffSchema, type ZetroHandoffReceipt, type ZetroPreparedTaskHandoff, type ZunoAcceptedZetroHandoff } from "@codexsun/zetro-contracts";

export type HandoffRow = {
  accepted_at: string;
  id: string;
  idempotency_key: string;
  payload_hash: string;
  payload_json: string;
};

export class ZunoHandoffStore {
  private readonly database: DatabaseSync;

  constructor(databasePath: string) {
    if (databasePath !== ":memory:") mkdirSync(dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    this.database.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS zuno_zetro_handoffs (
        id TEXT PRIMARY KEY,
        idempotency_key TEXT NOT NULL UNIQUE,
        payload_hash TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        accepted_at TEXT NOT NULL
      );
    `);
  }

  find(idempotencyKey: string): HandoffRow | undefined {
    return this.database.prepare("SELECT * FROM zuno_zetro_handoffs WHERE idempotency_key = ?").get(idempotencyKey) as HandoffRow | undefined;
  }

  list(): ZunoAcceptedZetroHandoff[] {
    const rows = this.database.prepare("SELECT * FROM zuno_zetro_handoffs ORDER BY accepted_at DESC").all() as unknown as HandoffRow[];
    return rows.map((row) => ({
      acceptedAt: row.accepted_at,
      handoff: zetroPreparedTaskHandoffSchema.parse(JSON.parse(row.payload_json)),
      zunoHandoffId: row.id,
    }));
  }

  insert(handoff: ZetroPreparedTaskHandoff, payloadHash: string): ZetroHandoffReceipt {
    const receipt = { acceptedAt: new Date().toISOString(), idempotencyKey: handoff.idempotencyKey, status: "accepted" as const, zunoHandoffId: randomUUID() };
    this.database.prepare("INSERT INTO zuno_zetro_handoffs (id, idempotency_key, payload_hash, payload_json, accepted_at) VALUES (?, ?, ?, ?, ?)").run(receipt.zunoHandoffId, receipt.idempotencyKey, payloadHash, JSON.stringify(handoff), receipt.acceptedAt);
    return receipt;
  }

  close(): void {
    this.database.close();
  }
}

export function receiptFromRow(row: HandoffRow): ZetroHandoffReceipt {
  return { acceptedAt: row.accepted_at, idempotencyKey: row.idempotency_key, status: "accepted", zunoHandoffId: row.id };
}
