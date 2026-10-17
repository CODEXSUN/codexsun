import {
  getTenantId as reportTenantId,
  getFinancialYearId as reportYearId,
  getReportCurrencyCode
} from "../../../shared/api/tenant-context";
import { useQuery } from "@tanstack/react-query";
import { getCompanyId } from "../../../shared/api/tenant-context";
import { getStockStatementForPrint } from "./stock-statement.services";
import type { StockStatementFilters } from "./stock-statement.types";

export function useStockStatement(filters: StockStatementFilters) {
  const scope = { from: filters.from, to: filters.to, search: "" };
  const companyId = getCompanyId();
  return useQuery({
    enabled: Boolean(companyId),
    queryFn: () => getStockStatementForPrint(scope),
    queryKey: [
      "billing",
      "reports",
      "stock-statement",
      companyId,
      "complete",
      scope,
      reportTenantId(),
      reportYearId(),
      getReportCurrencyCode()
    ]
  });
}
