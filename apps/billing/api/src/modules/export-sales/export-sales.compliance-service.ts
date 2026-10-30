import { sql } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import { currentBillingScope } from "../../auth/billing-scope.js";
import { getBillingDatabase, withBillingTransaction } from "../../database/billing-database.js";
import { env } from "../../env.js";
import { ExportSalesService } from "./export-sales.service.js";
import { loadComplianceParties } from "./export-sales.compliance-parties.js";
import { ExportSalesComplianceRepository } from "./export-sales.compliance-repository.js";
import { prepareExportSalesComplianceProvider } from "./export-sales.compliance-provider.js";
import { BillingSettingsRepository } from "../settings/settings.repository.js";
import type { ExportSalesComplianceAction } from "./export-sales.compliance-types.js";
import type { ExportSaleEwayDetails } from "./export-sales.types.js";

let runtimeEnabled = false;
export function configureExportSalesComplianceRuntime(enabled: boolean) {
  runtimeEnabled = enabled;
}
export class ExportSalesComplianceService {
  constructor(
    private readonly jobs = new ExportSalesComplianceRepository(),
    private readonly service = new ExportSalesService()
  ) {}
  async request(
    databaseName: string,
    id: string,
    action: ExportSalesComplianceAction,
    input: {
      eway?: ExportSaleEwayDetails | undefined;
      distanceKm?: number;
      reasonCode?: number;
      remarks?: string;
    } = {}
  ) {
    if (!runtimeEnabled)
      throw AppError.conflict(
        "The compliance queue worker is disabled. Enable it before submitting documents."
      );
    return withBillingTransaction(databaseName, async () => {
      const db = await getBillingDatabase(databaseName),
        scope = currentBillingScope();
      await sql`SELECT id FROM billing_export_sales WHERE uuid=${id} AND company_id=${scope.companyId} AND financial_year_id=${scope.financialYearId} FOR UPDATE`.execute(
        db
      );
      let invoice = await this.service.getExportSale(databaseName, id);
      if (!invoice) throw AppError.notFound("Invoice not found.");
      const settings = await new BillingSettingsRepository().getBillingSettings(
        databaseName,
        invoice.companyId
      );
      if (action === "einvoice.generate" && !settings.layout.useEinvoice)
        throw AppError.conflict("E-invoice is disabled for this company.");
      if (action === "eway.generate" && !settings.layout.useEway)
        throw AppError.conflict("E-way is disabled for this company.");
      if (action === "eway.generate" && invoice.eway.status !== "not-generated")
        throw AppError.conflict("This invoice already has an E-way result.");
      if (action === "eway.generate" && input.eway)
        invoice = {
          ...invoice,
          eway: { ...input.eway, billNo: "", billDate: "", status: "not-generated" }
        };
      const snapshot = {
        invoice,
        parties: await loadComplianceParties(databaseName, invoice),
        distanceKm: input.distanceKm ?? 0,
        reasonCode: input.reasonCode ?? 0,
        remarks: input.remarks?.trim() ?? "",
        environment: env.GSP_ENVIRONMENT,
        gstin: env.GSP_GSTIN
      };
      prepareExportSalesComplianceProvider(snapshot, action);
      return this.jobs.request(databaseName, snapshot, action);
    });
  }
  list(databaseName: string, id: string) {
    return this.jobs.list(databaseName, id);
  }
  get(databaseName: string, id: string, uuid: string) {
    return this.jobs.read(databaseName, uuid, id);
  }
  reconcile(databaseName: string, id: string, uuid: string, billNo?: string) {
    return this.jobs.reconcile(databaseName, id, uuid, billNo);
  }
}
