import { sql, type Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { QCafeDatabase } from "../../cloud/runtime.js";
import { defaultCafeSettings, type CafeSettings } from "./settings.types.js";
export class SettingsRepository {
  constructor(private readonly database: Kysely<QCafeDatabase>) {}
  async get(): Promise<CafeSettings> {
    const row = (
      await sql<{
        revision: number;
        payload: string | CafeSettings;
      }>`SELECT revision,payload FROM qcafe_settings WHERE id=1`.execute(this.database)
    ).rows[0];
    return row
      ? {
          ...defaultCafeSettings,
          ...(typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload),
          revision: row.revision
        }
      : { ...defaultCafeSettings };
  }
  async save(input: CafeSettings, actor: string) {
    return this.database.transaction().execute(async (db) => {
      await sql`INSERT IGNORE INTO qcafe_settings(id,payload,updated_by) VALUES(1,${JSON.stringify(defaultCafeSettings)},${actor})`.execute(
        db
      );
      const row = (
        await sql<{
          revision: number;
        }>`SELECT revision FROM qcafe_settings WHERE id=1 FOR UPDATE`.execute(db)
      ).rows[0]!;
      if (row.revision !== input.revision)
        throw AppError.conflict("Settings changed in another session. Reload before saving.");
      const result = { ...input, revision: row.revision + 1 };
      const payload = JSON.stringify(result);
      await sql`UPDATE qcafe_settings SET payload=${payload},revision=${result.revision},updated_by=${actor} WHERE id=1`.execute(
        db
      );
      await sql`INSERT INTO qcafe_settings_activity(revision,actor,payload) VALUES(${result.revision},${actor},${payload})`.execute(
        db
      );
      return result;
    });
  }
}
export const readQCafeSettings = (database: Kysely<QCafeDatabase>) =>
  new SettingsRepository(database).get();
