import type { MarketingContext } from "../../context.js";
export function createSubmissionHandoffJob(context: MarketingContext, uuid: string) {
  return {
    tenantId: context.tenantId,
    actorEmail: context.actorEmail,
    jobName: "marketing.submission.handoff",
    queueName: "marketing",
    sourceModule: "marketing",
    correlationId: uuid,
    idempotencyKey: "marketing.handoff:" + context.tenantId + ":" + uuid,
    maxAttempts: 8,
    payload: { uuid, companyId: context.companyId }
  };
}
