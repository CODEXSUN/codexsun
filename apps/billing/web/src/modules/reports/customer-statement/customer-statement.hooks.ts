import {
  getTenantId as reportTenantId,
  getFinancialYearId as reportYearId,
  getReportCurrencyCode
} from "../../../shared/api/tenant-context";
import { useQuery } from "@tanstack/react-query";
import { getCompanyId } from "../../../shared/api/tenant-context";
import { getCustomerStatementForPrint } from "./customer-statement.services";
import type { CustomerStatementFilters } from "./customer-statement.types";

export function useCustomerStatement(filters: CustomerStatementFilters) {
  const scope = { from: filters.from, to: filters.to, contactId: filters.contactId };
  const companyId = getCompanyId();
  return useQuery({
    enabled: Boolean(companyId),
    queryFn: () => getCustomerStatementForPrint(scope),
    queryKey: [
      "billing",
      "reports",
      "customer-statement",
      companyId,
      "complete",
      scope,
      reportTenantId(),
      reportYearId(),
      getReportCurrencyCode()
    ]
  });
}
