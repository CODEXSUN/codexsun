import { z } from "zod";
import { AppError } from "@codexsun/framework/errors";
import type { CommonTableImportHost } from "../import-review/index.js";
import { BusinessImportService } from "./business-import.service.js";
import type { BusinessProgress } from "./business-import.types.js";
const payload = z
  .object({ runId: z.string().uuid(), targetTenantId: z.number().int().positive() })
  .strict();
export function businessImportWorker(host: CommonTableImportHost) {
  return async function processBusinessImport(
    job: { payload: Record<string, unknown>; tenantId: string | null },
    progress: BusinessProgress
  ) {
    const parsed = payload.safeParse(job.payload);
    if (!parsed.success || job.tenantId !== String(parsed.data.targetTenantId))
      throw AppError.forbidden("Invalid business import job target context.");
    return new BusinessImportService(host).run(
      parsed.data.runId,
      parsed.data.targetTenantId,
      progress
    );
  };
}
