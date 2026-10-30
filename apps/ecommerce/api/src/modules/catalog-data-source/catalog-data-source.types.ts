import type {
  StorefrontCatalogFilters,
  StorefrontDiscovery,
  StorefrontProduct,
  StorefrontProductDetail,
  StorefrontPromotion,
  StorefrontFeaturedCard,
  StorefrontSlider
} from "../storefront/storefront.types.js";

export type CatalogDataSourceProvider = "frappe" | "own";

export const catalogDataSourceModules = [
  "categories",
  "brands",
  "products",
  "product-details",
  "variants",
  "product-images",
  "sliders",
  "promotions",
  "featured-cards",
  "brand-strips",
  "season-strips",
  "campaign-events"
] as const;
export type CatalogDataSourceModule = (typeof catalogDataSourceModules)[number];

export type CatalogModuleDataSource = {
  description: string;
  label: string;
  module: CatalogDataSourceModule;
  provider: CatalogDataSourceProvider;
  enabled: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type CatalogDataSourceSettings = {
  frappeConfigured: boolean;
  frappeEnabled: boolean;
  frappeUrl: string | null;
  modules: CatalogModuleDataSource[];
  verificationStatus: "live" | "offline" | "unverified";
};

export type CatalogDataSourceConnectionSettings = Omit<CatalogDataSourceSettings, "modules">;

export type CatalogDataSourceConnectionResult = {
  connected: boolean;
  latencyMs: number;
  message: string;
  provider: CatalogDataSourceProvider;
  providerLabel: string;
};

export type FrappeCatalogCredentials = { apiKey: string; apiSecret: string; url: string };

export type FrappeErpItem = {
  brand?: string | null;
  description?: string | null;
  disabled?: number;
  image?: string | null;
  is_stock_item?: number;
  item_code: string;
  item_group?: string | null;
  item_name: string;
  modified?: string | null;
  standard_rate?: number | string | null;
  stock_uom?: string | null;
};

export type FrappeIShopItem = {
  availability?: string | null;
  brand?: string | null;
  erpnext_item?: string | null;
  full_description?: string | null;
  highlights?: string | null;
  image?: string | null;
  item_code: string;
  item_group?: string | null;
  item_name: string;
  mrp?: number | string | null;
  modified?: string | null;
  name?: string;
  published?: number;
  short_description?: string | null;
  web_price?: number | string | null;
};

export type FrappeIShopCatalog = {
  catalog_code: string;
  catalog_image?: string | null;
  catalog_items?: Array<{ display_order?: number; ishop_item: string }>;
  catalog_name: string;
  description?: string | null;
  modified?: string | null;
  name?: string;
  published?: number;
};

export type FrappeIShopSlider = {
  action_label?: string | null;
  action_url?: string | null;
  description?: string | null;
  display_order?: number;
  ends_at?: string | null;
  eyebrow?: string | null;
  erpnext_item?: string | null;
  image_url?: string | null;
  ishop_item?: string | null;
  modified?: string | null;
  name?: string;
  published?: number;
  slider_code: string;
  starts_at?: string | null;
  title: string;
  status?: "active" | "inactive";
};

export type FrappeCatalogSnapshot = {
  catalogs: FrappeIShopCatalog[];
  erpnext_items: FrappeErpItem[];
  items: FrappeIShopItem[];
  sliders: FrappeIShopSlider[];
  promotions: FrappeIShopPromotion[];
  featured_cards: FrappeIShopFeaturedCard[];
  brand_strips?: FrappeIShopBrandStrip[];
  season_strips?: FrappeIShopSeasonStrip[];
  campaign_events?: FrappeIShopCampaignEvent[];
};
export type FrappeIShopPromotion = {
  action_label?: string | null;
  action_url?: string | null;
  badge?: string | null;
  badge_position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  badge_tint?: string | null;
  badge_text_color?: string | null;
  description?: string | null;
  display_order?: number;
  ends_at?: string | null;
  eyebrow?: string | null;
  erpnext_item?: string | null;
  image_url?: string | null;
  ishop_item?: string | null;
  modified?: string | null;
  name?: string;
  offer_price?: number | string;
  original_price?: number | string | null;
  promotion_code: string;
  published?: number;
  starts_at?: string | null;
  status?: "active" | "inactive";
  title: string;
};
export type FrappeIShopFeaturedCard = Omit<FrappeIShopPromotion, "promotion_code"> & {
  featured_code: string;
};
export type FrappeIShopBrandStrip = {
  action_url?: string | null;
  brand_code: string;
  brand_name: string;
  display_order?: number;
  logo_alt?: string | null;
  logo_url?: string | null;
  modified?: string | null;
  name?: string;
  published?: number;
  status?: "active" | "inactive";
};
export type FrappeIShopSeasonStrip = Omit<FrappeIShopPromotion, "promotion_code"> & {
  season_code: string;
};
export type FrappeIShopCampaignEvent = Omit<
  FrappeIShopPromotion,
  "badge_position" | "offer_price" | "original_price" | "promotion_code"
> & { campaign_code: string };

export type CatalogSyncResult = {
  catalogs: number;
  direction: "frappe-to-own" | "own-to-frappe";
  erpnextItems: number;
  items: number;
  sliders: number;
  promotions: number;
  featuredCards: number;
  brandStrips: number;
  seasonStrips: number;
  campaignEvents: number;
  message: string;
};

export type CatalogDataSourceControl = {
  credentials(): Promise<FrappeCatalogCredentials>;
  settings(): Promise<CatalogDataSourceConnectionSettings>;
  test(provider: CatalogDataSourceProvider): Promise<CatalogDataSourceConnectionResult>;
};

export interface StorefrontCatalogSource {
  catalog(filters: StorefrontCatalogFilters): Promise<StorefrontProduct[]>;
  categories(): Promise<StorefrontDiscovery["categories"]>;
  discovery(): Promise<StorefrontDiscovery>;
  product(slug: string): Promise<StorefrontProductDetail | null>;
  sliders(): Promise<StorefrontSlider[]>;
  promotions(): Promise<StorefrontPromotion[]>;
  featuredCards(): Promise<StorefrontFeaturedCard[]>;
  brandStrips(): Promise<StorefrontDiscovery["brands"]>;
  seasonStrips(): Promise<StorefrontPromotion[]>;
  campaignEvents(): Promise<StorefrontPromotion[]>;
}
