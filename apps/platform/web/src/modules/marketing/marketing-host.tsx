import { useMemo } from "react";
import { BrandWorkspace, CampaignWorkspace, CaptureWorkspace, ConnectionWorkspace, MarketingTransportProvider } from "@codexsun/marketing-web";
import { createSessionBoundGateway } from "../../shared/api/platform-api";

export function MarketingHost({ page }: { page: string }) {
  const transport = useMemo(() => {
    const api = createSessionBoundGateway("tenant");
    return { ...api, scopeKey: api.sessionKey + ":marketing" };
  }, []);
  return <MarketingTransportProvider.Provider value={transport}>
    {page === "marketing.brands" ? <BrandWorkspace /> : null}
    {page === "marketing.campaigns" ? <CampaignWorkspace /> : null}
    {page === "marketing.captures" ? <CaptureWorkspace /> : null}
    {page === "marketing.connections" ? <ConnectionWorkspace /> : null}
  </MarketingTransportProvider.Provider>;
}
