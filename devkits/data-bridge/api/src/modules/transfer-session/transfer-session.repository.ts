import { sql, type Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { TransferSession } from "./transfer-session.types.js";
export class TransferRepository {
  constructor(private readonly database: Kysely<unknown>) {}
  async list() {
    const result = await sql<{
      body: string | TransferSession;
      selected_rows: number;
      warning_rows: number;
    }>`SELECT JSON_REMOVE(body,'$.rows') AS body, JSON_LENGTH(JSON_EXTRACT(body,'$.rows')) AS selected_rows, COALESCE(JSON_LENGTH(JSON_SEARCH(body,'all','warning',NULL,'$.rows[*].status')),0) AS warning_rows FROM data_bridge_transfers ORDER BY updated_at DESC`.execute(
      this.database
    );
    return result.rows.map((row) => {
      const value =
        typeof row.body === "string" ? (JSON.parse(row.body) as TransferSession) : row.body;
      return {
        ...value,
        selectedRows: Number(row.selected_rows ?? 0),
        warningRows: Number(row.warning_rows ?? 0),
        rows: []
      };
    });
  }
  async get(id: string) {
    const result = await sql<{
      body: string | TransferSession;
    }>`SELECT body FROM data_bridge_transfers WHERE uuid=${id}`.execute(this.database);
    const row = result.rows[0];
    if (!row) throw AppError.validation("Import session was not found.");
    return typeof row.body === "string" ? (JSON.parse(row.body) as TransferSession) : row.body;
  }
  async create(value: TransferSession) {
    await sql`INSERT INTO data_bridge_transfers(uuid,body) VALUES (${value.id},${JSON.stringify(value)})`.execute(
      this.database
    );
    return value;
  }
  async save(value: TransferSession) {
    const previous = value.revision;
    value.revision++;
    value.updatedAt = new Date().toISOString();
    const result =
      await sql`UPDATE data_bridge_transfers SET body=${JSON.stringify(value)},updated_at=CURRENT_TIMESTAMP WHERE uuid=${value.id} AND CAST(JSON_VALUE(body,'$.revision') AS UNSIGNED)=${previous}`.execute(
        this.database
      );
    if (Number(result.numAffectedRows) !== 1)
      throw AppError.validation("This session changed. Refresh before continuing.");
    return value;
  }
}
