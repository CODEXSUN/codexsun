import type {
  StorefrontCategory,
  StorefrontDiscovery,
  StorefrontFilters,
  StorefrontProduct,
  StorefrontProductDetail,
  StorefrontSlider,
  StorefrontPromotion
} from "./storefront.types";
import type { StorefrontFeaturedCard } from "./storefront.types";
import type { StorefrontBlogPost } from "./storefront.types";
import type { StorefrontSiteNavigation } from "./storefront.types";
import type { StorefrontAnnouncement } from "./storefront.types";
import type { StorefrontBranding } from "./storefront.types";
import type { StorefrontBootstrap } from "./storefront.types";
type Envelope<T> = { data: T; success: true } | { error: { message: string }; success: false };
const responseCache = new Map<string, { expiresAt: number; value: unknown }>();
const requestCache = new Map<string, Promise<unknown>>();
const clientCacheMs = 30_000;

async function get<T>(path: string) {
  const cached = responseCache.get(path);
  if (cached && cached.expiresAt > Date.now()) return cached.value as T;
  const pending = requestCache.get(path);
  if (pending) return pending as Promise<T>;
  const request = requestStorefront<T>(path).finally(() => requestCache.delete(path));
  requestCache.set(path, request);
  return request;
}

async function requestStorefront<T>(path: string) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 6_000);
  const response = await fetch(`/api/platform${path}`, {
    headers: { Accept: "application/json" },
    signal: controller.signal
  }).finally(() => window.clearTimeout(timeout));
  const body = (await response.json()) as Envelope<T>;
  if (!response.ok || !body.success)
    throw new Error(body.success ? "Store request failed." : body.error.message);
  responseCache.set(path, { expiresAt: Date.now() + clientCacheMs, value: body.data });
  return body.data;
}
export const listStorefrontProducts = (
  filters: StorefrontFilters,
  page?: { limit: number; offset: number }
) => {
  const query = new URLSearchParams({
    brand: filters.brand,
    category: filters.category,
    scope: filters.scope,
    search: filters.search,
    sort: filters.sort
  });
  if (filters.minPrice != null) query.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice != null) query.set("maxPrice", String(filters.maxPrice));
  if (page) {
    query.set("limit", String(page.limit));
    query.set("offset", String(page.offset));
  }
  return get<StorefrontProduct[]>(`/storefront/catalog?${query}`);
};
export const listStorefrontCategories = () => get<StorefrontCategory[]>("/storefront/categories");
export const getStorefrontDiscovery = () => get<StorefrontDiscovery>("/storefront/discovery");
export const getStorefrontSliders = () => get<StorefrontSlider[]>("/storefront/sliders");
export const getStorefrontPromotions = () => get<StorefrontPromotion[]>("/storefront/promotions");
export const getStorefrontFeaturedCards = () =>
  get<StorefrontFeaturedCard[]>("/storefront/featured-cards");
export const getStorefrontProduct = (slug: string) =>
  get<StorefrontProductDetail>(`/storefront/products/${encodeURIComponent(slug)}`);
export const listLatestBlogPosts = () => get<StorefrontBlogPost[]>("/public/blog?kind=post");
export const getStorefrontSiteNavigation = () =>
  get<StorefrontSiteNavigation>("/storefront/site-navigation");
export const getStorefrontAnnouncement = () =>
  get<StorefrontAnnouncement | null>("/storefront/announcement");
export const getStorefrontBranding = () => get<StorefrontBranding>("/storefront/branding");
export const getStorefrontBootstrap = () => get<StorefrontBootstrap>("/storefront/bootstrap");

export function invalidateStorefrontClientCache() {
  responseCache.clear();
}
