import {
  getTenantId as reportTenantId,
  getFinancialYearId as reportYearId,
  getReportCurrencyCode
} from "../../../shared/api/tenant-context";
import { useQuery } from "@tanstack/react-query";
import { getCompanyId } from "../../../shared/api/tenant-context";
import { getCustomerSummary } from "./customer-summary.services";

export function useCustomerSummary() {
  const companyId = getCompanyId();
  return useQuery({
    enabled: Boolean(companyId),
    queryFn: getCustomerSummary,
    queryKey: [
      "billing",
      "reports",
      "customer-summary",
      companyId,
      reportTenantId(),
      reportYearId(),
      getReportCurrencyCode()
    ]
  });
}
