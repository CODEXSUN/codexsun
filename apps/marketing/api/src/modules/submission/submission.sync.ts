import { sql, type Kysely } from "kysely";
import type { MarketingDatabase } from "../../context.js";
export async function pendingSubmissionHandoffs(database: Kysely<MarketingDatabase>, afterId = 0) {
  return (
    await sql<{
      id: number;
      uuid: string;
      companyId: number;
      actorEmail: string;
    }>`SELECT id,uuid,company_id AS companyId,created_by AS actorEmail FROM marketing_submissions WHERE status='pending' AND id>${afterId} ORDER BY id LIMIT 100`.execute(
      database
    )
  ).rows;
}
export async function submissionRouting(database: Kysely<MarketingDatabase>, uuid: string) {
  return (
    (
      await sql<{
        companyId: number;
        actorEmail: string;
      }>`SELECT company_id AS companyId,created_by AS actorEmail FROM marketing_submissions WHERE uuid=${uuid}`.execute(
        database
      )
    ).rows[0] ?? null
  );
}
