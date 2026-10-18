import { randomBytes } from "node:crypto";
import type { Transaction } from "kysely";
import { WorkReportRepository } from "./work-report.repository.js";
import type {
  WorkReportContext,
  WorkReportDatabase,
  WorkReportTarget
} from "./work-report.types.js";
export async function recordWorkEvent(
  context: WorkReportContext,
  transaction: Transaction<WorkReportDatabase>,
  target: WorkReportTarget,
  action: string,
  body: string
) {
  return new WorkReportRepository(context.database).insert(
    transaction,
    {
      ...target,
      action: action === "comment" ? "comment-added" : action,
      body,
      requestId: randomBytes(16).toString("hex"),
      latitude: null,
      longitude: null,
      accuracyMeters: null,
      capturedAt: null
    },
    context
  );
}
