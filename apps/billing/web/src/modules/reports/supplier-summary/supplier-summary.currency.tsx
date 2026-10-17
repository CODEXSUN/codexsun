import { useQuery } from "@tanstack/react-query";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { billingApiGet } from "../../../shared/api/billing-api";
import {
  getTenantId,
  getCompanyId,
  getFinancialYearId,
  getReportCurrencyCode,
  selectReportCurrencyCode
} from "../../../shared/api/tenant-context";

export function SupplierSummaryCurrencySelection() {
  const query = useQuery({
    queryKey: [
      "billing",
      "supplier-summary",
      "report-currencies",
      getTenantId(),
      getCompanyId(),
      getFinancialYearId()
    ],
    queryFn: () =>
      billingApiGet<Array<{ id: number; name: string }>>(
        "/billing/reports/supplier-summary/currencies"
      )
  });
  return (
    <div className="min-w-40 print:hidden">
      <span className="text-xs text-muted-foreground">Reporting currency</span>
      <WorkspaceSelect
        aria-label="Reporting currency"
        value={getReportCurrencyCode()}
        options={(query.data ?? [])
          .filter((row) => /^[A-Z]{3}$/.test(row.name.toUpperCase()))
          .map((row) => ({ label: row.name.toUpperCase(), value: row.name.toUpperCase() }))}
        onValueChange={selectReportCurrencyCode}
      />
      {query.isError ? (
        <p className="text-xs text-destructive">Currencies could not be loaded.</p>
      ) : null}
    </div>
  );
}
