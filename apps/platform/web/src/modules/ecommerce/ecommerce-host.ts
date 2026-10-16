import { createEcommerceOverviewGateway } from "@codexsun/ecommerce-web/modules/overview/gateway";
import { apiGet } from "../../shared/api/platform-api";
export const ecommerceOverviewGateway = createEcommerceOverviewGateway(<T>(path: string) =>
  apiGet<T>(path, "tenant")
);

declare const __CODEXSUN_ECOMMERCE_WEB_PORT__: number;
export function openPublicStorefront() {
  const url = new URL(window.location.href);
  url.port = String(__CODEXSUN_ECOMMERCE_WEB_PORT__);
  url.pathname = "/shop";
  url.search = "";
  url.hash = "";
  window.open(url.href, "_blank", "noopener,noreferrer");
}
