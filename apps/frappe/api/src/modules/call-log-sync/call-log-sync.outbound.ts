import type { Kysely } from "kysely";
import type { FrappeDatabase } from "../connection/index.js";

export async function processLocalCallLogSync(
  database: Kysely<FrappeDatabase>,
  eventId: number,
  secret: string
) {
  void database;
  void secret;
  return { eventId, status: "stopped" as const };
}
