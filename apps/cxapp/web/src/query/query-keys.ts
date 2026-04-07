export const queryKeys = {
  runtimeBrand: ["runtime", "brand-profile"] as const,
  runtimeAppSettings: ["runtime", "app-settings"] as const,
  demoSummary: ["demo", "summary"] as const,
  demoJob: (jobId: string | null) => ["demo", "job", jobId] as const,
  storefrontLanding: ["storefront", "landing"] as const,
  storefrontCatalog: (search: string) => ["storefront", "catalog", search] as const,
  storefrontProduct: (slug: string) => ["storefront", "product", slug] as const,
  storefrontLegalPage: (pageId: string) => ["storefront", "legal-page", pageId] as const,
  storefrontCustomerPortal: ["storefront", "customer-portal"] as const,
  storefrontCustomerOrders: ["storefront", "customer-orders"] as const,
  storefrontCustomerSupportCases: ["storefront", "customer-support-cases"] as const,
}
