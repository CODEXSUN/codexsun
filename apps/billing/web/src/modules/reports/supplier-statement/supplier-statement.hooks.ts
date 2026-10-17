import {
  getTenantId as reportTenantId,
  getFinancialYearId as reportYearId,
  getReportCurrencyCode
} from "../../../shared/api/tenant-context";
import { useQuery } from "@tanstack/react-query";
import { getCompanyId } from "../../../shared/api/tenant-context";
import { getSupplierStatementForPrint } from "./supplier-statement.services";
import type { SupplierStatementFilters } from "./supplier-statement.types";

export function useSupplierStatement(filters: SupplierStatementFilters) {
  const scope = { from: filters.from, to: filters.to, contactId: filters.contactId };
  const companyId = getCompanyId();
  return useQuery({
    enabled: Boolean(companyId),
    queryFn: () => getSupplierStatementForPrint(scope),
    queryKey: [
      "billing",
      "reports",
      "supplier-statement",
      companyId,
      "complete",
      scope,
      reportTenantId(),
      reportYearId(),
      getReportCurrencyCode()
    ]
  });
}
