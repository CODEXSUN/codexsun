import { TenantClientMarquee } from "./tenant-site/blocks/tenant-client-marquee";
import { TenantHomeHeroSection } from "./tenant-site/sections/home-hero.section";
import { lazy, Suspense } from "react";
import { useTenantSite } from "./tenant-site/tenant-site.context";

const TenantNewsDeskSection = lazy(() =>
  import("./tenant-site/sections/news-desk.section").then((module) => ({
    default: module.TenantNewsDeskSection
  }))
);
import { TenantSiteTemplate } from "./tenant-site/templates/tenant-site.template";

export function TenantHome() {
  return (
    <TenantSiteTemplate activePage="home">
      <TenantHomeHeroSection />
      <TenantClientMarquee />
      <HomeStories />
    </TenantSiteTemplate>
  );
}

function HomeStories() {
  const { loading, portal } = useTenantSite();
  if (loading || portal.blogEnabled === false) return null;
  return (
    <Suspense fallback={null}>
      <TenantNewsDeskSection />
    </Suspense>
  );
}
