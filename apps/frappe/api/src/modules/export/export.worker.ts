import { z } from "zod";
import { AppError } from "@codexsun/framework/errors";
import type { Kysely } from "kysely";
import type { FrappeDatabase, FrappeSettings } from "../connection/index.js";
import { FrappeExportService } from "./export.service.js";
import type { ExportProgress } from "./export.types.js";

const payloadSchema = z.object({
  tenantDatabase: z.string().min(1),
  baseUrl: z.string().url(),
  kind: z.enum(["contacts", "enquiries", "activities", "call-logs"]),
  mode: z.enum(["verify", "export"]),
  ids: z.array(z.number().int().positive()).min(1).max(50)
});

export async function processFrappeExportJob(
  database: Kysely<FrappeDatabase>,
  secret: string,
  defaults: FrappeSettings,
  payload: Record<string, unknown>,
  expectedTenantDatabase: string,
  report: (progress: ExportProgress) => Promise<void>
) {
  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success || parsed.data.tenantDatabase !== expectedTenantDatabase)
    throw AppError.conflict("The Frappe export job has invalid tenant or record details.");
  return new FrappeExportService(database, secret, defaults).exportSelection(
    parsed.data.kind,
    parsed.data.ids,
    parsed.data.mode,
    parsed.data.baseUrl,
    report
  );
}
