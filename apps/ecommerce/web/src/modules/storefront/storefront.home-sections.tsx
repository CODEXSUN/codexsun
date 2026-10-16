import { useState, type ReactNode } from "react";
import {
  BlogSolutionsSection,
  BrandsSection,
  FeaturedCardsSection,
  HeroSlider,
  HomeClosingCta,
  PromotionsSection,
  ServiceBanner,
  SeasonBanner,
  TechMediaTrustSection
} from "./storefront.components";
import type {
  StorefrontBlogPost,
  StorefrontFeaturedCard,
  StorefrontPromotion,
  StorefrontSlider
} from "./storefront.types";
import { CampaignsAndEventsSection } from "./storefront.campaigns";

type HomeSectionKey =
  | "hero"
  | "trust"
  | "service-banner"
  | "promotions"
  | "season"
  | "campaigns-events"
  | "brands"
  | "featured"
  | "catalog"
  | "journal"
  | "closing-cta";

type HomeSectionsProps = {
  blogPosts: StorefrontBlogPost[];
  brandName?: string | undefined;
  brands: Array<{ logoAlt: string; logoUrl: string; name: string; productCount: number }>;
  brandStrips: Array<{ logoAlt: string; logoUrl: string; name: string; productCount: number }>;
  campaignEvents: StorefrontPromotion[];
  catalog: ReactNode;
  featuredCards: StorefrontFeaturedCard[];
  promotions: StorefrontPromotion[];
  seasonStrips: StorefrontPromotion[];
  siteNavigation: import("./storefront.types").StorefrontSiteNavigation | null;
  slides: StorefrontSlider[];
};

export const storefrontHomeSectionOrder: HomeSectionKey[] = [
  "hero",
  "trust",
  "promotions",
  "brands",
  "featured",
  "season",
  "catalog",
  "campaigns-events",
  "service-banner",
  "journal",
  "closing-cta"
];

export function StorefrontHomeSections(props: HomeSectionsProps) {
  const sections: Record<HomeSectionKey, ReactNode> = {
    hero: <HeroSlider slides={props.slides} />,
    trust: <TechMediaTrustSection content={props.siteNavigation?.trustedStrip} />,
    "service-banner": <ServiceBanner content={props.siteNavigation?.serviceBanner} />,
    promotions: <PromotionsSection promotions={props.promotions} />,
    season: <SeasonBanner promotions={props.seasonStrips} />,
    "campaigns-events": <CampaignsAndEventsSection campaigns={props.campaignEvents} />,
    brands: <BrandsSection brands={props.brandStrips} />,
    featured: <FeaturedCardsSection cards={props.featuredCards} />,
    catalog: props.catalog,
    journal: <BlogSolutionsSection brandName={props.brandName} posts={props.blogPosts} />,
    "closing-cta": <HomeClosingCta />
  };

  return storefrontHomeSectionOrder.map((key) => (
    <StorefrontSectionBoundary key={key} technicalName={`storefront.home.${key}`}>
      {sections[key]}
    </StorefrontSectionBoundary>
  ));
}

function StorefrontSectionBoundary({
  children,
  technicalName
}: {
  children: ReactNode;
  technicalName: string;
}) {
  const [copied, setCopied] = useState(false);
  const copyName = async () => {
    if (!(await copyToClipboard(technicalName))) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };
  return (
    <div className="cx-store__section-boundary" data-storefront-section={technicalName}>
      {showTechnicalSectionNames() ? (
        <button
          aria-label={`Copy section name ${technicalName}`}
          className="cx-store__section-technical-name"
          onClick={() => void copyName()}
          title="Copy technical section name"
          type="button"
        >
          {copied ? "Copied" : technicalName}
        </button>
      ) : null}
      {children}
    </div>
  );
}

async function copyToClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const field = document.createElement("textarea");
    field.value = value;
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.select();
    const copied = document.execCommand("copy");
    field.remove();
    return copied;
  }
}

function showTechnicalSectionNames() {
  const browser = window as typeof window & {
    __CODEXSUN_RUNTIME_CONFIG__?: Readonly<Record<string, string>>;
  };
  return browser.__CODEXSUN_RUNTIME_CONFIG__?.VITE_STOREFRONT_DEV_SECTION_LABELS === "1";
}
