import { sql, type Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
export class DatabaseImportLock {
  constructor(private readonly database: Kysely<unknown>) {}
  async withImportLock<T>(id: string, operation: () => Promise<T>): Promise<T> {
    return this.database.connection().execute(async (connection) => {
      const name = `codexsun.bridge:${id}`;
      const locked = await sql<{
        acquired: number;
      }>`SELECT GET_LOCK(${name}, 0) AS acquired`.execute(connection);
      if (Number(locked.rows[0]?.acquired) !== 1)
        throw AppError.validation("This review is being audited or imported. Wait and refresh.");
      try {
        return await operation();
      } finally {
        await sql`SELECT RELEASE_LOCK(${name})`.execute(connection);
      }
    });
  }
}
