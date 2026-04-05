import { storefrontSettingsSchema } from "../../shared/index.js"

export const defaultStorefrontSettings = storefrontSettingsSchema.parse({
  id: "storefront-settings:default",
  hero: {
    eyebrow: "Everyday commerce",
    title: "A modern storefront rebuilt on shared core masters.",
    summary:
      "Browse the live core catalog, check out with Razorpay, track shipments, and manage orders from one customer portal.",
    primaryCtaLabel: "Shop the catalog",
    primaryCtaHref: "/shop/catalog",
    secondaryCtaLabel: "Track an order",
    secondaryCtaHref: "/shop/track-order",
    heroImageUrl:
      "https://placehold.co/1440x960/e9ddcf/2d211b?text=Codexsun+Storefront",
    highlights: [
      {
        id: "highlight:shipping",
        label: "Fast shipping",
        summary: "Dispatch in 24-48 hours for ready-to-ship catalog items.",
      },
      {
        id: "highlight:payments",
        label: "Secure payments",
        summary: "Razorpay checkout with live or mock development flow.",
      },
      {
        id: "highlight:portal",
        label: "Customer portal",
        summary: "Order history, account details, and tracking in one place.",
      },
    ],
  },
  announcement:
    "Free shipping on prepaid orders above Rs. 3,999 across the primary storefront catalog.",
  supportPhone: "+91 90000 12345",
  supportEmail: "storefront@codexsun.local",
  freeShippingThreshold: 3999,
  defaultShippingAmount: 149,
  createdAt: "2026-04-04T10:00:00.000Z",
  updatedAt: "2026-04-04T10:00:00.000Z",
})
