import { createHimsxOverviewGateway } from "@codexsun/himsx-web/modules/overview/gateway";
import { apiGet } from "../../shared/api/platform-api";
export const himsxOverviewGateway = createHimsxOverviewGateway(<T>(path: string) =>
  apiGet<T>(path, "tenant")
);
