export type CatalogDataSourceProvider = "frappe" | "own";
export type CatalogDataSourceModule =
  | "categories"
  | "brands"
  | "products"
  | "product-details"
  | "variants"
  | "product-images"
  | "sliders"
  | "promotions"
  | "featured-cards"
  | "brand-strips"
  | "season-strips"
  | "campaign-events";
export type CatalogModuleDataSource = {
  enabled: boolean;
  description: string;
  label: string;
  module: CatalogDataSourceModule;
  provider: CatalogDataSourceProvider;
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

export type CatalogDataSourceConnectionResult = {
  connected: boolean;
  latencyMs: number;
  message: string;
  provider: CatalogDataSourceProvider;
  providerLabel: string;
};

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
