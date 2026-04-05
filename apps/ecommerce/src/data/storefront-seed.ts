import { storefrontSettingsSchema } from "../../shared/index.js"

export const defaultStorefrontSettings = storefrontSettingsSchema.parse({
  id: "storefront-settings:default",
  hero: {
    eyebrow: "Factory direct storefront",
    title: "Premium-knit essentials shaped by a live core catalog.",
    summary:
      "Browse curated launches, search the full catalog, check out with Razorpay, and manage orders from one customer portal inside the ecommerce app boundary.",
    primaryCtaLabel: "Shop now",
    primaryCtaHref: "/shop/catalog",
    secondaryCtaLabel: "Track order",
    secondaryCtaHref: "/shop/track-order",
    heroImageUrl:
      "https://placehold.co/1440x960/e9ddcf/2d211b?text=Codexsun+Storefront+Hero",
    highlights: [
      {
        id: "highlight:shipping",
        label: "Factory-picked",
        summary: "Curated storefront stories are shaped from active shared product masters.",
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
  search: {
    placeholder: "Search for products, brands, and categories",
    departmentLabel: "Department",
    departments: [
      { value: "all", label: "All" },
      { value: "women", label: "Women" },
      { value: "men", label: "Men" },
      { value: "kids", label: "Kids" },
      { value: "accessories", label: "Accessories" },
    ],
  },
  sections: {
    featured: {
      eyebrow: "Featured edit",
      title: "Curated product stories",
      summary:
        "Feature-section products stay tied to the live catalog while the storefront keeps a more editorial, campaign-led tone.",
      ctaLabel: "View catalog",
      ctaHref: "/shop/catalog",
    },
    categories: {
      eyebrow: "Shop by category",
      title: "Category-led browsing",
      summary:
        "The top category rail and the home category cards both derive from shared core product categories flagged for storefront visibility.",
      ctaLabel: "Browse all categories",
      ctaHref: "/shop/catalog",
    },
    newArrivals: {
      eyebrow: "New arrivals",
      title: "Fresh into the catalog",
      summary:
        "New-arrival flags on shared core products drive the launch lane automatically.",
      ctaLabel: null,
      ctaHref: null,
    },
    bestSellers: {
      eyebrow: "Best sellers",
      title: "Fast movers right now",
      summary:
        "Best-seller product flags surface here without duplicating catalog ownership inside ecommerce.",
      ctaLabel: null,
      ctaHref: null,
    },
    cta: {
      eyebrow: "Storefront ready",
      title: "One storefront, one checkout, one customer portal.",
      summary:
        "The visual storefront lives in ecommerce, products and categories stay shared in core, and checkout remains connected end to end through ecommerce-owned order flow.",
      primaryCtaLabel: "Start browsing",
      primaryCtaHref: "/shop/catalog",
      secondaryCtaLabel: "Open cart",
      secondaryCtaHref: "/shop/cart",
    },
  },
  trustNotes: [
    {
      id: "trust:curation",
      title: "Editorial curation",
      summary:
        "Sections are arranged like a premium storefront while still using the live backend catalog.",
      iconKey: "sparkles",
    },
    {
      id: "trust:delivery",
      title: "Cart to checkout flow",
      summary:
        "Cart, checkout, and tracking stay shopper-first without leaking runtime ownership into shared apps.",
      iconKey: "truck",
    },
    {
      id: "trust:boundary",
      title: "Boundary kept clean",
      summary:
        "Products and reusable masters stay in core while storefront behavior remains fully inside ecommerce.",
      iconKey: "shield",
    },
  ],
  footer: {
    description:
      "A premium storefront built on shared core masters, with ecommerce-owned cart, checkout, tracking, and customer portal flows.",
    groups: [
      {
        id: "footer:shop",
        title: "Shop",
        links: [
          { label: "Catalog", href: "/shop/catalog" },
          { label: "Cart", href: "/shop/cart" },
          { label: "Checkout", href: "/shop/checkout" },
          { label: "Track Order", href: "/shop/track-order" },
        ],
      },
      {
        id: "footer:categories",
        title: "Top categories",
        links: [
          { label: "Ethnic Wear", href: "/shop/catalog?category=Ethnic%20Wear" },
          { label: "T-Shirts", href: "/shop/catalog?category=T-Shirts" },
          { label: "Knitted Fabrics", href: "/shop/catalog?category=Knitted%20Fabrics" },
          { label: "Accessories", href: "/shop/catalog?category=Accessories" },
        ],
      },
      {
        id: "footer:account",
        title: "Customer portal",
        links: [
          { label: "Sign In", href: "/profile/login" },
          { label: "Create Account", href: "/profile/register" },
          { label: "My Orders", href: "/profile" },
          { label: "Track Order", href: "/shop/track-order" },
        ],
      },
      {
        id: "footer:about",
        title: "Brand and support",
        links: [
          { label: "About the brand", href: "/" },
          { label: "Contact support", href: "/" },
          { label: "Privacy policy", href: "/" },
          { label: "Shipping policy", href: "/" },
        ],
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
