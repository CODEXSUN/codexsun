import {
  getTenantId as reportTenantId,
  getFinancialYearId as reportYearId,
  getReportCurrencyCode
} from "../../shared/api/tenant-context";
import { useQuery } from "@tanstack/react-query";
import { getCompanyId } from "../../shared/api/tenant-context";
import { getBillingDashboard } from "./dashboard.api";

export function useBillingDashboard() {
  const companyId = getCompanyId();
  return useQuery({
    enabled: Boolean(companyId),
    queryFn: getBillingDashboard,
    queryKey: [
      "billing",
      "dashboard",
      companyId,
      reportTenantId(),
      reportYearId(),
      getReportCurrencyCode()
    ],
    refetchInterval: 15_000,
    refetchOnMount: "always"
  });
}
