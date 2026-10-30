import { sql, type Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { QCafeDatabase } from "../../cloud/runtime.js";
import { emptySpecialSettings, type SpecialSettings } from "./special.types.js";
export class SpecialRepository {
  constructor(private readonly database: Kysely<QCafeDatabase>) {}
  async get(): Promise<SpecialSettings> {
    const row = (
      await sql<{
        revision: number;
        payload: string | SpecialSettings;
      }>`SELECT revision,payload FROM qcafe_special_settings WHERE id=1`.execute(this.database)
    ).rows[0];
    return row
      ? {
          ...(typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload),
          revision: row.revision
        }
      : { ...emptySpecialSettings };
  }
  async save(input: SpecialSettings, actor: string) {
    return this.database.transaction().execute(async (db) => {
      await sql`INSERT IGNORE INTO qcafe_special_settings(id,payload,updated_by) VALUES(1,${JSON.stringify(emptySpecialSettings)},${actor})`.execute(
        db
      );
      const row = (
        await sql<{
          revision: number;
        }>`SELECT revision FROM qcafe_special_settings WHERE id=1 FOR UPDATE`.execute(db)
      ).rows[0]!;
      if (row.revision !== input.revision)
        throw AppError.conflict("Today Special settings changed. Reload them before saving.");
      const saved = { ...input, revision: row.revision + 1 };
      const payload = JSON.stringify(saved);
      await sql`UPDATE qcafe_special_settings SET revision=${saved.revision},payload=${payload},updated_by=${actor} WHERE id=1`.execute(
        db
      );
      await sql`INSERT INTO qcafe_special_activity(actor,revision,payload) VALUES(${actor},${saved.revision},${payload})`.execute(
        db
      );
      return saved;
    });
  }
}
export const readQCafeSpecial = (database: Kysely<QCafeDatabase>) =>
  new SpecialRepository(database).get();
