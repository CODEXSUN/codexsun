import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { StorefrontPage } from "./modules/storefront";
import "@codexsun/ui/styles.css";

declare const __CODEXSUN_PLATFORM_WEB_PORT__: number;

const pathname = window.location.pathname;
const publicPage =
  ["/shop", "/cart", "/campaigns", "/search", "/blog"].includes(pathname) ||
  pathname.startsWith("/shop/") ||
  pathname.startsWith("/blog/");

if (publicPage) {
  createRoot(document.getElementById("root")!).render(
    <QueryClientProvider client={new QueryClient()}>
      <StorefrontPage />
    </QueryClientProvider>
  );
} else {
  const platformUrl = new URL(window.location.href);
  platformUrl.port = String(__CODEXSUN_PLATFORM_WEB_PORT__);
  platformUrl.pathname = "/app/ecommerce";
  platformUrl.search = "";
  platformUrl.hash = "";
  window.location.replace(platformUrl.href);
}
