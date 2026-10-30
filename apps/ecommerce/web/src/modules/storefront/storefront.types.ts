export type StorefrontProduct = {
  brand: string | null;
  category: string;
  compareAtPrice: number | null;
  description: string;
  featured: boolean;
  featuredOrder?: number | null;
  imageAlt: string;
  imageUrl: string;
  name: string;
  price: number;
  shortDescription: string;
  slug: string;
  subtitle: string;
  variantCount: number;
};

export type StorefrontSlider = {
  actionLabel: string;
  actionUrl: string;
  description: string;
  displayOrder: number;
  eyebrow: string;
  imageAlt: string;
  imageUrl: string;
  linkedItem: string | null;
  sliderCode: string;
  title: string;
};
export type StorefrontPromotion = {
  actionLabel: string;
  actionUrl: string;
  badge: string;
  badgePosition: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  badgeTint: string;
  badgeTextColor: string;
  description: string;
  displayOrder: number;
  eyebrow: string;
  imageAlt: string;
  imageUrl: string;
  linkedItem: string | null;
  offerPrice: number;
  originalPrice: number | null;
  promotionCode: string;
  title: string;
};
export type StorefrontFeaturedCard = Omit<StorefrontPromotion, "promotionCode"> & {
  featuredCode: string;
};
export type StorefrontProductDetail = StorefrontProduct & {
  bulletPoints: string[];
  returnPolicy: string;
  variants: Array<{ id: number; price: number; sku: string; title: string }>;
  warranty: string;
};
export type StorefrontCategory = { name: string; productCount: number };
export type StorefrontSearchScope = "all" | "products" | "brands" | "categories";
export type StorefrontSort = "featured" | "name" | "price-asc" | "price-desc" | "discount";
export type StorefrontFilters = {
  brand: string;
  category: string;
  maxPrice: number | null;
  minPrice: number | null;
  scope: StorefrontSearchScope;
  search: string;
  sort: StorefrontSort;
};
export type StorefrontDiscovery = {
  brands: Array<{ logoAlt: string; logoUrl: string; name: string; productCount: number }>;
  categories: StorefrontCategory[];
  priceRange: { maximum: number; minimum: number };
};
export type StorefrontBlogPost = {
  excerpt: string;
  featuredImage: string;
  imageAlt: string;
  publishedAt: string | null;
  slug: string;
  title: string;
};
export type StorefrontSiteNavigation = {
  about: string;
  copyrightText: string;
  groups: Array<{ title: string; links: Array<{ label: string; href: string }> }>;
  paymentMethods: Array<{ logoUrl: string; name: string }>;
  socialLinks: Array<{ label: string; href: string }>;
  poweredByText: string;
  serviceBanner: {
    actionLabel: string;
    actionUrl: string;
    description: string;
    eyebrow: string;
    title: string;
  };
  tagline: string;
  trustedStrip: {
    description: string;
    eyebrow: string;
    proofPoints: string[];
    title: string;
  };
};
export type StorefrontAnnouncement = {
  displayDurationMs: number;
  endsAt: string | null;
  eventKey: string;
  message: string;
  startsAt: string;
};
export type StorefrontBranding = {
  brandName: string;
  logoDarkUrl: string | null;
  logoUrl: string | null;
  primaryPhone: string | null;
};
export type StorefrontBootstrap = {
  announcement: StorefrontAnnouncement | null;
  brandStrips: StorefrontDiscovery["brands"];
  campaignEvents: StorefrontPromotion[];
  discovery: StorefrontDiscovery;
  featuredCards: StorefrontFeaturedCard[];
  promotions: StorefrontPromotion[];
  seasonStrips: StorefrontPromotion[];
  siteNavigation: StorefrontSiteNavigation | null;
  sliders: StorefrontSlider[];
};
