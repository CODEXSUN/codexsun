import type { Kysely } from "kysely";
import type { FrappeDatabase } from "../connection/index.js";

export async function processLocalEnquirySync(
  database: Kysely<FrappeDatabase>,
  eventId: number,
  encryptionSecret: string,
  employeeCodeForEmail: (email: string, baseUrl: string) => Promise<string | null>
) {
  void database;
  void encryptionSecret;
  void employeeCodeForEmail;
  return { eventId, status: "stopped" as const, remoteName: null };
}
