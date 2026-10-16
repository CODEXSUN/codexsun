import type { StorefrontCatalogFilters } from "./storefront.types.js";
import type { StorefrontCatalogSource } from "../catalog-data-source/catalog-data-source.types.js";
import { StorefrontProfileService } from "../storefront-profile/storefront-profile.service.js";
import { sliderContentUrl } from "../storefront-slider/storefront-slider.storage.js";
import { StorefrontAnnouncementService } from "../storefront-announcement/storefront-announcement.service.js";
import { readStorefrontCache } from "./storefront.cache.js";

export class StorefrontService {
  constructor(private readonly source: StorefrontCatalogSource) {}
  catalog(filters: StorefrontCatalogFilters) {
    return this.source.catalog({
      ...filters,
      brand: filters.brand?.trim(),
      category: filters.category?.trim(),
      search: filters.search?.trim()
    });
  }
  categories() {
    return this.source.categories();
  }
  discovery() {
    return this.source.discovery();
  }
  product(slug: string) {
    return this.source.product(slug.trim().toLowerCase());
  }
  async sliders() {
    return (await this.source.sliders()).map((slider) => ({
      ...slider,
      imageUrl: sliderContentUrl(slider.imageUrl)
    }));
  }
  promotions() {
    return this.source.promotions();
  }
  featuredCards() {
    return this.source.featuredCards();
  }
  bootstrap() {
    return readStorefrontCache("home-bootstrap", async () => {
      const startedAt = performance.now();
      const [
        discovery,
        siteNavigation,
        sliders,
        promotions,
        featuredCards,
        brandStrips,
        seasonStrips,
        campaignEvents,
        announcement
      ] = await Promise.all([
        resilient("discovery", () => this.discovery(), {
          brands: [],
          categories: [],
          priceRange: { maximum: 0, minimum: 0 }
        }),
        resilient("site-navigation", () => this.siteNavigation(), null),
        resilient("sliders", () => this.sliders(), []),
        resilient("promotions", () => this.promotions(), []),
        resilient("featured-cards", () => this.featuredCards(), []),
        resilient("brand-strips", () => this.source.brandStrips(), []),
        resilient("season-strips", () => this.source.seasonStrips(), []),
        resilient("campaign-events", () => this.source.campaignEvents(), []),
        resilient("announcement", () => new StorefrontAnnouncementService().active(), null)
      ]);
      console.info(
        `[ecommerce.storefront] bootstrap ready in ${Math.round(performance.now() - startedAt)}ms`
      );
      return {
        announcement,
        brandStrips,
        campaignEvents,
        discovery,
        featuredCards,
        promotions,
        seasonStrips,
        siteNavigation,
        sliders
      };
    });
  }
  async siteNavigation() {
    const profile = await new StorefrontProfileService().get();
    return {
      about: profile.aboutUs,
      copyrightText: profile.copyrightText,
      groups: [
        {
          title: "Shop",
          links: [
            { label: "All products", href: "/shop" },
            { label: "Promotions", href: "/#promotions" },
            { label: "Solutions", href: "/#solutions" },
            { label: "Brands", href: "/#brands" }
          ]
        },
        {
          title: "Company",
          links: [
            { label: "About", href: "/about" },
            { label: "Campaigns & events", href: "/campaigns" },
            { label: "Team", href: "/team" },
            { label: "Blog", href: "/blog" },
            { label: "Contact", href: "/contact" }
          ]
        },
        {
          title: "Help",
          links: [
            { label: "Shipping", href: "/shipping" },
            { label: "Returns & refunds", href: "/returns" },
            { label: "Order help", href: "/login" }
          ]
        }
      ],
      paymentMethods: profile.paymentMethods,
      poweredByText: profile.poweredByText,
      serviceBanner: {
        actionLabel: profile.serviceActionLabel,
        actionUrl: profile.serviceActionUrl,
        description: profile.serviceDescription,
        eyebrow: profile.serviceEyebrow,
        title: profile.serviceTitle
      },
      socialLinks: [
        { label: "Facebook", href: profile.facebookUrl },
        { label: "LinkedIn", href: profile.linkedinUrl },
        { label: "Instagram", href: profile.instagramUrl },
        { label: "X", href: profile.xUrl },
        { label: "YouTube", href: profile.youtubeUrl },
        { label: "WhatsApp", href: profile.whatsappUrl },
        { label: "Threads", href: profile.threadsUrl }
      ].filter((link) => link.href),
      tagline: profile.tagline,
      trustedStrip: {
        description: profile.trustedDescription,
        eyebrow: profile.trustedEyebrow,
        proofPoints: profile.trustedProofPoints
          .split(/\r?\n/u)
          .map((value) => value.trim())
          .filter(Boolean),
        title: profile.trustedTitle
      }
    };
  }
}

async function resilient<T>(name: string, loader: () => Promise<T>, fallback: T) {
  try {
    return await Promise.race([
      loader(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`${name} timed out`)), 4_000)
      )
    ]);
  } catch (error) {
    console.warn(`[ecommerce.storefront] ${name} unavailable`, error);
    return fallback;
  }
}
