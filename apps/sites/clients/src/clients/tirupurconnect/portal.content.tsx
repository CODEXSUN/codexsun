import { createContext, useContext } from "react";
import { initialSitePage } from "@codexsun/sites-api/page-defaults";
import type { PageContent } from "@codexsun/sites-api/page-contract";
export const initialTirupurPage = initialSitePage({
  id: 0,
  uuid: "e303865e",
  slug: "tirupurconnect",
  name: "Tirupur Connect",
  status: "active",
  primaryDomain: "tirupurconnect.com"
});
export const PortalContent = createContext<PageContent>(initialTirupurPage);
export function usePortalContent() {
  return useContext(PortalContent);
}
export function useTextileContent() {
  return usePortalContent().textile ?? initialTirupurPage.textile!;
}
export function PortalClosingBanner() {
  const { banner } = useTextileContent();
  return (
    <section className="tc-bottom-cta tc-container tc-managed-banner">
      <img src={banner.image} alt="" loading="lazy" />
      <div>
        <span className="tc-eyebrow">{banner.label}</span>
        <h2>
          {banner.title}
          <br />
          <em>{banner.emphasis}</em>
        </h2>
        <p>{banner.intro}</p>
        <a className="tc-button tc-button-light" href="/join">
          {banner.button} ↗
        </a>
      </div>
    </section>
  );
}
