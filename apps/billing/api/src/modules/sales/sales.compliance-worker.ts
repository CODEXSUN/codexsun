import { z } from "zod";
import { AppError } from "@codexsun/framework/errors";
import { withBillingScope } from "../../auth/billing-scope.js";
import { authorizeBillingPermission } from "../../auth/tenant-permission.js";
import { SalesComplianceRepository } from "./sales.compliance-repository.js";
import { SalesRepository } from "./sales.repository.js";
import { runSalesComplianceProvider } from "./sales.compliance-provider.js";
const status = z.enum(["not-generated", "generated", "cancelled"]);
const resultSchema = z.object({
  einvoice: z
    .object({
      irn: z.string(),
      ackNo: z.string(),
      ackDate: z.string(),
      signedQr: z.string(),
      status
    })
    .optional(),
  eway: z
    .object({
      billNo: z.string(),
      billDate: z.string(),
      notes: z.string(),
      part: z.enum(["Part A", "Part B"]),
      status,
      transport: z.string(),
      transportGst: z.string(),
      transportId: z.number().nullable(),
      vehicleNo: z.string()
    })
    .optional()
});
export async function processSalesComplianceJob(
  databaseName: string,
  uuid: string,
  authorize: (databaseName: string, actorEmail: string) => Promise<unknown> = (db, email) =>
    authorizeBillingPermission(db, email, "billing.application.records.compliance")
) {
  const jobs = new SalesComplianceRepository(),
    claim = await jobs.claim(databaseName, uuid);
  if (!claim) return { operationUuid: uuid, status: "already-claimed" };
  const { job, snapshot, lease } = claim;
  return withBillingScope(
    {
      companyId: job.companyId,
      financialYearId: job.financialYearId,
      actorEmail: job.actorEmail,
      complianceJobUuid: uuid,
      complianceLease: lease
    },
    async () => {
      try {
        await authorize(databaseName, job.actorEmail);
        const current = await new SalesRepository().get(databaseName, job.invoiceUuid);
        if (!current || current.status !== "confirmed")
          throw AppError.conflict("The invoice is no longer confirmed.");
        // Recorded outcomes are replayed locally after a process restart; no second provider write.
        const result = claim.result ?? (await runSalesComplianceProvider(snapshot, job.action));
        await jobs.saveResult(databaseName, uuid, lease, result);
        const patch = resultSchema.parse({
          ...result,
          ...(result.eway ? { eway: { ...snapshot.invoice.eway, ...(result.eway as object) } } : {})
        });
        await new SalesRepository().updateCompliance(
          databaseName,
          job.invoiceUuid,
          {
            ...(patch.einvoice ? { einvoice: patch.einvoice } : {}),
            ...(patch.eway ? { eway: patch.eway } : {})
          },
          job.action
        );
        await jobs.finish(databaseName, uuid, lease, "completed");
        return { operationUuid: uuid, status: "completed" };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Compliance processing failed.";
        // Definitive validation/rejection is safe to fix. Unknown submission outcomes stay locked.
        const definitive =
          (!snapshot.reconcileOnly ||
            (job.action.endsWith(".cancel") &&
              /Provider (IRN|E-way bill) is still active/.test(message))) &&
          error instanceof AppError &&
          !/incomplete|returned|response|provider.*status|before retrying|2150|2154|2295|2278|2283|duplicate/i.test(
            message
          );
        const state = definitive ? "failed" : "review";
        await jobs.finish(databaseName, uuid, lease, state, message.slice(0, 1000));
        return { operationUuid: uuid, status: state };
      }
    }
  );
}
