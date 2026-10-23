import { sql, type Kysely } from "kysely";
import type { FrappeDatabase } from "../connection/index.js";

export async function withEnquiryImportLock<T>(
  database: Kysely<FrappeDatabase>,
  run: () => Promise<T>
) {
  return database.connection().execute(async (connection) => {
    const key = sql<string>`CONCAT('codexsun-frappe-', MD5(DATABASE()))`;
    const acquired = await sql<{
      acquired: number;
    }>`SELECT GET_LOCK(${key}, 0) AS acquired`.execute(connection);
    if (Number(acquired.rows[0]?.acquired) !== 1)
      throw new Error("Another enquiry import is running. Retry this job after it completes.");
    try {
      return await run();
    } finally {
      await sql`SELECT RELEASE_LOCK(${key})`.execute(connection);
    }
  });
}
