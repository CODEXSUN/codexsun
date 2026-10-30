import { AppError } from "@codexsun/framework/errors";
import type {
  StorefrontCatalogFilters,
  StorefrontDiscovery,
  StorefrontProduct,
  StorefrontProductDetail
} from "../storefront/storefront.types.js";
import type {
  FrappeCatalogSnapshot,
  FrappeCatalogCredentials,
  FrappeErpItem,
  FrappeIShopCatalog,
  FrappeIShopItem,
  FrappeIShopCampaignEvent,
  FrappeIShopSeasonStrip,
  StorefrontCatalogSource
} from "./catalog-data-source.types.js";

type CatalogItem = { display_order?: number; ishop_item?: string | null };
type IShopItem = FrappeIShopItem & { name: string };
type IShopCatalog = FrappeIShopCatalog & { catalog_items?: CatalogItem[]; name: string };
type CatalogMembership = { category: string; displayOrder: number };
type CatalogSnapshot = {
  catalogs: IShopCatalog[];
  erpItems: Map<string, FrappeErpItem>;
  items: IShopItem[];
  memberships: Map<string, CatalogMembership[]>;
  sliders: FrappeCatalogSnapshot["sliders"];
  promotions: FrappeCatalogSnapshot["promotions"];
  featuredCards: FrappeCatalogSnapshot["featured_cards"];
  brandStrips: NonNullable<FrappeCatalogSnapshot["brand_strips"]>;
  seasonStrips: NonNullable<FrappeCatalogSnapshot["season_strips"]>;
  campaignEvents: NonNullable<FrappeCatalogSnapshot["campaign_events"]>;
};

export class FrappeCatalogSource implements StorefrontCatalogSource {
  constructor(private readonly resolveCredentials: () => Promise<FrappeCatalogCredentials>) {}

  async catalog(filters: StorefrontCatalogFilters) {
    const snapshot = await this.snapshot();
    const products = snapshot.items.map((item) => this.toProduct(item, snapshot));
    const filtered = sortProducts(
      products.filter((product) => matches(product, filters)),
      filters.sort
    );
    if (filters.limit == null) return filtered;
    const offset = filters.offset ?? 0;
    return filtered.slice(offset, offset + filters.limit);
  }

  async categories() {
    const snapshot = await this.snapshot();
    return categoriesFrom(snapshot);
  }

  async discovery(): Promise<StorefrontDiscovery> {
    const snapshot = await this.snapshot();
    const products = snapshot.items.map((item) => this.toProduct(item, snapshot));
    const prices = products.map((product) => product.price);
    return {
      brands: brandsFrom(products),
      categories: categoriesFrom(snapshot),
      priceRange: {
        maximum: prices.length ? Math.max(...prices) : 0,
        minimum: prices.length ? Math.min(...prices) : 0
      }
    };
  }

  async product(slug: string): Promise<StorefrontProductDetail | null> {
    const snapshot = await this.snapshot();
    const item = snapshot.items.find((candidate) => slugify(candidate.item_code) === slug);
    if (!item) return null;
    return {
      ...this.toProduct(item, snapshot),
      bulletPoints: highlights(item.highlights),
      returnPolicy: "",
      variants: [],
      warranty: ""
    };
  }

  async sliders() {
    const snapshot = await this.snapshot();
    const now = Date.now();
    return snapshot.sliders
      .filter((slider) => {
        const startsAt = slider.starts_at ? new Date(slider.starts_at).getTime() : null;
        const endsAt = slider.ends_at ? new Date(slider.ends_at).getTime() : null;
        return (
          slider.status !== "inactive" &&
          Boolean(slider.published) &&
          (startsAt == null || startsAt <= now) &&
          (endsAt == null || endsAt >= now)
        );
      })
      .sort((left, right) => (left.display_order ?? 0) - (right.display_order ?? 0))
      .map((slider) => ({
        actionLabel: slider.action_label?.trim() || "Explore now",
        actionUrl: slider.action_url?.trim() || "#catalog",
        description: plainText(slider.description),
        displayOrder: slider.display_order ?? 0,
        eyebrow: slider.eyebrow?.trim() || "",
        imageAlt: slider.title,
        imageUrl: absoluteUrl(slider.image_url, this.currentBaseUrl),
        linkedItem: slider.erpnext_item?.trim() || slider.ishop_item?.trim() || null,
        sliderCode: slider.slider_code,
        title: slider.title
      }));
  }
  async promotions() {
    const snapshot = await this.snapshot();
    const now = Date.now();
    return snapshot.promotions
      .filter(
        (item) =>
          item.status !== "inactive" &&
          Boolean(item.published) &&
          (!item.starts_at || new Date(item.starts_at).getTime() <= now) &&
          (!item.ends_at || new Date(item.ends_at).getTime() >= now)
      )
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .map((item) => ({
        actionLabel: item.action_label?.trim() || "View offer",
        actionUrl: item.action_url?.trim() || "#catalog",
        badge: item.badge?.trim() || "",
        badgePosition: item.badge_position || "top-right",
        badgeTint: item.badge_tint?.trim() || "brand",
        badgeTextColor: item.badge_text_color?.trim() || "#ffffff",
        description: plainText(item.description),
        displayOrder: item.display_order ?? 0,
        eyebrow: item.eyebrow?.trim() || "",
        imageAlt: item.title,
        imageUrl: absoluteUrl(item.image_url, this.currentBaseUrl),
        linkedItem: item.erpnext_item?.trim() || item.ishop_item?.trim() || null,
        offerPrice: Number(item.offer_price ?? 0),
        originalPrice: item.original_price == null ? null : Number(item.original_price),
        promotionCode: item.promotion_code,
        title: item.title
      }));
  }

  async featuredCards() {
    const snapshot = await this.snapshot();
    const now = Date.now();
    return snapshot.featuredCards
      .filter(
        (item) =>
          item.status !== "inactive" &&
          Boolean(item.published) &&
          (!item.starts_at || new Date(item.starts_at).getTime() <= now) &&
          (!item.ends_at || new Date(item.ends_at).getTime() >= now)
      )
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .map((item) => ({
        actionLabel: item.action_label?.trim() || "Explore now",
        actionUrl: item.action_url?.trim() || "#catalog",
        badge: item.badge?.trim() || "",
        badgePosition: item.badge_position || "top-right",
        badgeTint: item.badge_tint?.trim() || "#0f766e",
        badgeTextColor: item.badge_text_color?.trim() || "#ffffff",
        description: plainText(item.description),
        displayOrder: item.display_order ?? 0,
        eyebrow: item.eyebrow?.trim() || "",
        featuredCode: item.featured_code,
        imageAlt: item.title,
        imageUrl: absoluteUrl(item.image_url, this.currentBaseUrl),
        linkedItem: item.erpnext_item?.trim() || item.ishop_item?.trim() || null,
        offerPrice: Number(item.offer_price ?? 0),
        originalPrice: item.original_price == null ? null : Number(item.original_price),
        title: item.title
      }));
  }

  async brandStrips() {
    const snapshot = await this.snapshot();
    return snapshot.brandStrips
      .filter((item) => item.status !== "inactive" && Boolean(item.published))
      .sort((left, right) => (left.display_order ?? 0) - (right.display_order ?? 0))
      .map((item) => ({
        logoAlt: item.logo_alt?.trim() || `${item.brand_name} logo`,
        logoUrl: absoluteUrl(item.logo_url, this.currentBaseUrl),
        name: item.brand_name,
        productCount: snapshot.items.filter(
          (product) =>
            this.toProduct(product, snapshot).brand?.trim().toLowerCase() ===
            item.brand_name.trim().toLowerCase()
        ).length
      }));
  }

  async seasonStrips() {
    const snapshot = await this.snapshot();
    return activePromotionalContent(snapshot.seasonStrips, this.currentBaseUrl);
  }

  async campaignEvents() {
    const snapshot = await this.snapshot();
    return activePromotionalContent(snapshot.campaignEvents, this.currentBaseUrl);
  }

  async integrationSnapshot(): Promise<FrappeCatalogSnapshot> {
    const credentials = await this.resolveCredentials();
    return this.method<FrappeCatalogSnapshot>(credentials, "get_catalog_snapshot", "GET");
  }

  async upsert(snapshot: FrappeCatalogSnapshot) {
    const credentials = await this.resolveCredentials();
    return this.method<{
      catalogs: number;
      erpnext_items: number;
      items: number;
      featured_cards: number;
      brand_strips: number;
      season_strips: number;
      campaign_events: number;
      promotions: number;
      sliders: number;
    }>(credentials, "upsert_catalog_snapshot", "POST", { payload: JSON.stringify(snapshot) });
  }

  async itemLookup(search: string) {
    const credentials = await this.resolveCredentials();
    const url = resourceUrl(credentials.url, "Item");
    url.searchParams.set(
      "fields",
      JSON.stringify([
        "name",
        "item_code",
        "item_name",
        "item_group",
        "brand",
        "description",
        "image",
        "stock_uom",
        "standard_rate"
      ])
    );
    if (search.trim()) {
      url.searchParams.set(
        "or_filters",
        JSON.stringify([
          ["item_code", "like", `%${search.trim()}%`],
          ["item_name", "like", `%${search.trim()}%`]
        ])
      );
    }
    url.searchParams.set("filters", JSON.stringify([["disabled", "=", 0]]));
    url.searchParams.set("limit_page_length", "30");
    const body = await this.request<{ data?: FrappeErpItem[] }>(credentials, url);
    return body.data ?? [];
  }

  async item(itemCode: string) {
    const credentials = await this.resolveCredentials();
    return this.document<FrappeErpItem>(credentials, "Item", itemCode);
  }

  private async snapshot(): Promise<CatalogSnapshot> {
    if (this.snapshotCache && this.snapshotCache.expiresAt > Date.now()) {
      return this.snapshotCache.value;
    }
    this.snapshotRequest ??= this.loadSnapshot();
    try {
      const value = await this.snapshotRequest;
      this.snapshotCache = { expiresAt: Date.now() + 5_000, value };
      return value;
    } finally {
      this.snapshotRequest = undefined;
    }
  }

  private async loadSnapshot(): Promise<CatalogSnapshot> {
    const credentials = await this.resolveCredentials();
    const payload = await this.method<FrappeCatalogSnapshot>(
      credentials,
      "get_catalog_snapshot",
      "GET"
    );
    this.currentBaseUrl = credentials.url;
    const items = payload.items
      .filter((item) => Boolean(item.published))
      .map((item) => ({ ...item, name: item.name || item.item_code }));
    const catalogs = payload.catalogs
      .filter((catalog) => Boolean(catalog.published))
      .map((catalog) => ({ ...catalog, name: catalog.name || catalog.catalog_code }));
    return {
      catalogs,
      erpItems: new Map(payload.erpnext_items.map((item) => [item.item_code, item])),
      items,
      memberships: membershipsFrom(catalogs),
      sliders: payload.sliders ?? [],
      promotions: payload.promotions ?? [],
      featuredCards: payload.featured_cards ?? [],
      brandStrips: payload.brand_strips ?? [],
      seasonStrips: payload.season_strips ?? [],
      campaignEvents: payload.campaign_events ?? []
    };
  }

  private document<T>(credentials: FrappeCatalogCredentials, doctype: string, name: string) {
    const url = resourceUrl(credentials.url, doctype, name);
    return this.request<{ data?: T }>(credentials, url).then((body) => {
      if (!body.data) throw frappeError("Frappe returned an empty catalog document.");
      return body.data;
    });
  }

  private async request<T>(credentials: FrappeCatalogCredentials, url: URL): Promise<T> {
    const response = await frappeFetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `token ${credentials.apiKey}:${credentials.apiSecret}`
      },
      signal: AbortSignal.timeout(10_000)
    });
    if (!response.ok) {
      const message = await frappeMessage(response);
      throw frappeError(message || `Frappe catalog returned HTTP ${response.status}.`);
    }
    return (await response.json()) as T;
  }

  private async method<T>(
    credentials: FrappeCatalogCredentials,
    method: string,
    httpMethod: "GET" | "POST",
    body?: Record<string, string>
  ): Promise<T> {
    const url = new URL(`/api/method/logicx_ishop.api.catalog_sync.${method}`, credentials.url);
    const request: RequestInit = {
      method: httpMethod,
      headers: {
        Accept: "application/json",
        Authorization: `token ${credentials.apiKey}:${credentials.apiSecret}`,
        "Content-Type": "application/json"
      },
      signal: AbortSignal.timeout(httpMethod === "POST" ? 120_000 : 15_000)
    };
    if (body) request.body = JSON.stringify(body);
    const response = await frappeFetch(url, request);
    if (!response.ok) {
      const message = await frappeMessage(response);
      throw frappeError(message || `Frappe catalog method returned HTTP ${response.status}.`);
    }
    const responseBody = (await response.json()) as { message?: T };
    if (!responseBody.message) throw frappeError("Frappe returned an empty catalog response.");
    return responseBody.message;
  }

  private toProduct(item: IShopItem, snapshot: CatalogSnapshot): StorefrontProduct {
    const erpItem = snapshot.erpItems.get(item.erpnext_item || item.item_code);
    const price = Number(item.web_price ?? erpItem?.standard_rate ?? 0);
    const mrp = Number(item.mrp ?? 0);
    const category =
      snapshot.memberships.get(item.name)?.[0]?.category ||
      item.item_group ||
      erpItem?.item_group ||
      "Uncategorised";
    const firstMembership = snapshot.memberships.get(item.name)?.[0];
    return {
      brand: item.brand?.trim() || erpItem?.brand?.trim() || null,
      category,
      compareAtPrice: mrp > price ? mrp : null,
      description: plainText(item.full_description),
      featured: Boolean(firstMembership),
      featuredOrder: firstMembership?.displayOrder ?? null,
      imageAlt: item.item_name,
      imageUrl: absoluteUrl(item.image || erpItem?.image, this.currentBaseUrl),
      name: item.item_name,
      price,
      shortDescription: plainText(item.short_description),
      slug: slugify(item.item_code),
      subtitle: item.availability?.trim() || "",
      variantCount: 0
    };
  }

  private currentBaseUrl = "";
  private snapshotCache: { expiresAt: number; value: CatalogSnapshot } | undefined;
  private snapshotRequest: Promise<CatalogSnapshot> | undefined;
}

function activePromotionalContent(
  items: Array<FrappeIShopCampaignEvent | FrappeIShopSeasonStrip>,
  baseUrl: string
) {
  const now = Date.now();
  return items
    .filter(
      (item) =>
        item.status !== "inactive" &&
        Boolean(item.published) &&
        (!item.starts_at || new Date(String(item.starts_at)).getTime() <= now) &&
        (!item.ends_at || new Date(String(item.ends_at)).getTime() >= now)
    )
    .sort((left, right) => Number(left.display_order ?? 0) - Number(right.display_order ?? 0))
    .map((item) => ({
      actionLabel: String(item.action_label ?? "").trim() || "Explore now",
      actionUrl: String(item.action_url ?? "").trim() || "#catalog",
      badge: String(item.badge ?? "").trim(),
      badgePosition: "top-left" as const,
      badgeTint: String(item.badge_tint ?? "#0f766e"),
      badgeTextColor: String(item.badge_text_color ?? "#ffffff"),
      description: plainText(String(item.description ?? "")),
      displayOrder: Number(item.display_order ?? 0),
      eyebrow: String(item.eyebrow ?? "").trim(),
      imageAlt: String(item.title ?? ""),
      imageUrl: absoluteUrl(String(item.image_url ?? ""), baseUrl),
      linkedItem: item.ishop_item ? String(item.ishop_item).trim() : null,
      offerPrice: 0,
      originalPrice: null,
      promotionCode: "campaign_code" in item ? item.campaign_code : item.season_code,
      title: String(item.title ?? "")
    }));
}

function membershipsFrom(catalogs: IShopCatalog[]) {
  const memberships = new Map<string, CatalogMembership[]>();
  for (const catalog of catalogs) {
    for (const row of catalog.catalog_items ?? []) {
      if (!row.ishop_item) continue;
      const current = memberships.get(row.ishop_item) ?? [];
      current.push({ category: catalog.catalog_name, displayOrder: row.display_order ?? 0 });
      current.sort((left, right) => left.displayOrder - right.displayOrder);
      memberships.set(row.ishop_item, current);
    }
  }
  return memberships;
}

function categoriesFrom(snapshot: CatalogSnapshot) {
  return snapshot.catalogs.map((catalog) => ({
    name: catalog.catalog_name,
    productCount: (catalog.catalog_items ?? []).filter((row) =>
      snapshot.items.some((item) => item.name === row.ishop_item)
    ).length
  }));
}

function brandsFrom(products: StorefrontProduct[]) {
  return counted(products.flatMap((product) => (product.brand ? [product.brand] : []))).map(
    ([name, productCount]) => ({ logoAlt: `${name} logo`, logoUrl: "", name, productCount })
  );
}

function matches(product: StorefrontProduct, filters: StorefrontCatalogFilters) {
  const search = filters.search?.trim().toLowerCase() ?? "";
  const searchable = [product.name, product.description, product.brand ?? "", product.category];
  return (
    (!filters.brand || product.brand?.toLowerCase() === filters.brand.toLowerCase()) &&
    (!filters.category || product.category.toLowerCase() === filters.category.toLowerCase()) &&
    product.price >= (filters.minPrice ?? 0) &&
    product.price <= (filters.maxPrice ?? Number.MAX_SAFE_INTEGER) &&
    (!search || searchable.some((value) => value.toLowerCase().includes(search)))
  );
}

function sortProducts(products: StorefrontProduct[], sort: StorefrontCatalogFilters["sort"]) {
  return [...products].sort((left, right) => {
    if (sort === "price-asc") return left.price - right.price;
    if (sort === "price-desc") return right.price - left.price;
    if (sort === "featured" && left.featured !== right.featured) return left.featured ? -1 : 1;
    if (sort === "featured" && left.featuredOrder !== right.featuredOrder) {
      return (
        (left.featuredOrder ?? Number.MAX_SAFE_INTEGER) -
        (right.featuredOrder ?? Number.MAX_SAFE_INTEGER)
      );
    }
    return left.name.localeCompare(right.name);
  });
}

function resourceUrl(baseUrl: string, doctype: string, name?: string) {
  const path = ["api", "resource", doctype, name]
    .filter((value): value is string => Boolean(value))
    .map((value) => encodeURIComponent(value));
  return new URL(`/${path.join("/")}`, baseUrl);
}

function absoluteUrl(value: string | null | undefined, baseUrl: string) {
  if (!value) return "";
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

async function frappeMessage(response: Response) {
  try {
    const body = (await response.json()) as { message?: string; exception?: string };
    return body.message || body.exception || "";
  } catch {
    return "";
  }
}

function frappeError(message: string) {
  return new AppError({
    code: "FRAPPE_CATALOG_UNAVAILABLE",
    message: plainText(message),
    statusCode: 502
  });
}

async function frappeFetch(url: URL, request: RequestInit) {
  try {
    return await fetch(url, request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Frappe did not respond.";
    throw frappeError(`Frappe connection is unavailable. ${message}`);
  }
}

function highlights(value: string | null | undefined) {
  return (value ?? "")
    .split(/[\n,|]+/u)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function plainText(value: string | null | undefined) {
  return (value ?? "")
    .replace(/<[^>]+>/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function counted(values: string[]): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].sort(([left], [right]) => left.localeCompare(right));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/(^-|-$)/gu, "");
}
