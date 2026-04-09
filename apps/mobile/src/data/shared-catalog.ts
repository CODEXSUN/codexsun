import { productModules } from "@core/shared/domain/module-registry"
import { projectDesignSystemDefaults } from "@shared-ui/design-system/data/project-defaults"
import {
  storefrontAnnouncementDesignSchema,
  storefrontHeroSchema,
} from "@ecommerce/shared/schemas/catalog"

const sharedHeroSeed = storefrontHeroSchema.parse({
  eyebrow: "Shared Repo",
  title: "Mobile shell backed by Codexsun modules",
  summary:
    "This Expo app lives inside apps/mobile and reuses shared domain and design metadata from the same repository.",
  primaryCtaLabel: "Connect to backend",
  primaryCtaHref: "/health",
  secondaryCtaLabel: "Inspect modules",
  secondaryCtaHref: "/modules",
  heroImageUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c",
  highlights: [
    {
      id: "repo-shared",
      label: "Repo-shared",
      summary: "Home screen content is parsed using ecommerce shared schemas.",
    },
    {
      id: "mobile-standalone",
      label: "Standalone",
      summary: "The app can run independently through Expo while living in this repo.",
    },
    {
      id: "api-ready",
      label: "API-ready",
      summary: "The screen can ping the existing backend health endpoint.",
    },
  ],
})

const sharedAnnouncementSeed = storefrontAnnouncementDesignSchema.parse({
  backgroundColor: "#17324d",
  textColor: "#f7f1e8",
  iconColor: "#f3b562",
  iconKey: "sparkles",
  cornerStyle: "pill",
})

export const mobileSharedCatalog = {
  hero: sharedHeroSeed,
  announcement: sharedAnnouncementSeed,
  modules: productModules,
  defaults: {
    button: projectDesignSystemDefaults.button,
    card: projectDesignSystemDefaults.card,
    input: projectDesignSystemDefaults.input,
  },
}
