export type MenuCatalog = {
  allergenTags: Array<{ code: string; id: string; name: string; severity: "high" | "low" | "medium" }>;
  availability: Array<{
    endsAt: string | null;
    id: string;
    itemId: string;
    locationId: string;
    reason: string | null;
    serviceChannelId: string | null;
    startsAt: string;
    status: "available" | "unavailable";
    variantId: string | null;
  }>;
  categories: Array<{ active: boolean; code: string; id: string; name: string; sortOrder: number }>;
  items: Array<{
    active: boolean;
    businessId: string;
    categoryId: string;
    code: string;
    id: string;
    itemType: "food" | "beverage" | "packaged" | "service";
    name: string;
    taxCode: string | null;
    variants: Array<{ active: boolean; code: string; id: string; name: string }>;
  }>;
  itemAllergens: Array<{
    allergenTagId: string;
    id: string;
    itemId: string;
    note: string | null;
    variantId: string | null;
  }>;
  itemModifierGroups: Array<{
    groupId: string;
    id: string;
    itemId: string;
    sortOrder: number;
    variantId: string | null;
  }>;
  media: Array<{
    assetId: string;
    checksum: string;
    height: number | null;
    id: string;
    itemId: string;
    mimeType: string;
    sortOrder: number;
    status: "active" | "processing" | "rejected";
    usage: "delivery" | "menu" | "qr";
    variantId: string | null;
    width: number | null;
  }>;
  modifierGroups: Array<{
    active: boolean;
    code: string;
    id: string;
    maxSelections: number;
    minSelections: number;
    name: string;
    options: Array<{
      active: boolean;
      code: string;
      groupId: string;
      id: string;
      name: string;
      priceAdjustmentMinor: number;
      stockItemRef: string | null;
    }>;
  }>;
  priceBooks: Array<{ active: boolean; code: string; currency: string; id: string; name: string }>;
  prices: Array<{
    active: boolean;
    amountMinor: number;
    id: string;
    itemId: string;
    locationId: string | null;
    priceBookId: string;
    serviceChannelId: string | null;
    validFrom: string;
    validTo: string | null;
    variantId: string | null;
  }>;
  specialCampaigns: Array<{
    businessId: string;
    endsAt: string;
    id: string;
    locationId: string | null;
    name: string;
    priority: number;
    scope: "business" | "location";
    startsAt: string;
    status: "active" | "draft" | "inactive";
  }>;
  specialPrices: Array<{
    amountMinor: number | null;
    campaignId: string;
    discountBasisPoints: number | null;
    id: string;
    itemId: string;
    usageLimit: number | null;
    usedCount: number;
    variantId: string | null;
  }>;
};

export function readMenu(request: typeof fetch, businessId: string): Promise<MenuCatalog> {
  return send(request, `/api/v1/qcafe/menu?businessId=${encodeURIComponent(businessId)}`);
}
export function createMenuCategory(
  request: typeof fetch,
  input: { businessId: string; code: string; name: string; sortOrder: number },
) {
  return send(request, "/api/v1/qcafe/menu/categories", input);
}
export function createMenuItem(
  request: typeof fetch,
  input: { businessId: string; categoryId: string; code: string; itemType: string; name: string; taxCode?: string },
) {
  return send(request, "/api/v1/qcafe/menu/items", input);
}
export function createMenuVariant(
  request: typeof fetch,
  businessId: string,
  input: { code: string; itemId: string; name: string },
) {
  return send(request, `/api/v1/qcafe/menu/variants?businessId=${encodeURIComponent(businessId)}`, input);
}
export function createPriceBook(
  request: typeof fetch,
  input: { businessId: string; code: string; currency: string; name: string },
) {
  return send(request, "/api/v1/qcafe/menu/price-books", input);
}
export function setMenuPrice(request: typeof fetch, businessId: string, input: Record<string, unknown>) {
  return send(request, `/api/v1/qcafe/menu/prices?businessId=${encodeURIComponent(businessId)}`, input);
}

export type SpecialCampaignInput = {
  businessId: string;
  endsAt: string;
  locationId?: string;
  name: string;
  priority: number;
  scope: "business" | "location";
  startsAt: string;
  status: "active" | "draft" | "inactive";
};
export type SpecialPriceInput = {
  amountMinor?: number;
  businessId: string;
  campaignId: string;
  discountBasisPoints?: number;
  itemId: string;
  usageLimit?: number;
  variantId?: string;
};

export function createSpecialCampaign(request: typeof fetch, input: SpecialCampaignInput) {
  return send(request, "/api/v1/qcafe/menu/special-campaigns", input);
}
export function createSpecialPrice(request: typeof fetch, input: SpecialPriceInput) {
  return send(request, "/api/v1/qcafe/menu/special-prices", input);
}

export type ItemAvailabilityInput = {
  businessId: string;
  endsAt?: string;
  itemId: string;
  locationId: string;
  reason?: string;
  serviceChannelId?: string;
  startsAt: string;
  status: "available" | "unavailable";
  variantId?: string;
};

export function createItemAvailability(request: typeof fetch, input: ItemAvailabilityInput) {
  return send(request, "/api/v1/qcafe/menu/availability", input);
}

export type ModifierGroupInput = {
  businessId: string;
  code: string;
  maxSelections: number;
  minSelections: number;
  name: string;
};
export type ModifierOptionInput = {
  businessId: string;
  code: string;
  groupId: string;
  name: string;
  priceAdjustmentMinor: number;
  stockItemRef?: string;
};
export type ItemModifierGroupInput = {
  businessId: string;
  groupId: string;
  itemId: string;
  sortOrder: number;
  variantId?: string;
};
export type AllergenTagInput = { businessId: string; code: string; name: string; severity: "high" | "low" | "medium" };
export type ItemAllergenInput = {
  allergenTagId: string;
  businessId: string;
  itemId: string;
  note?: string;
  variantId?: string;
};

export function createModifierGroup(request: typeof fetch, input: ModifierGroupInput) {
  return send(request, "/api/v1/qcafe/menu/modifier-groups", input);
}
export function createModifierOption(request: typeof fetch, input: ModifierOptionInput) {
  return send(request, "/api/v1/qcafe/menu/modifier-options", input);
}
export function assignItemModifierGroup(request: typeof fetch, input: ItemModifierGroupInput) {
  return send(request, "/api/v1/qcafe/menu/item-modifier-groups", input);
}
export function createAllergenTag(request: typeof fetch, input: AllergenTagInput) {
  return send(request, "/api/v1/qcafe/menu/allergen-tags", input);
}
export function assignItemAllergen(request: typeof fetch, input: ItemAllergenInput) {
  return send(request, "/api/v1/qcafe/menu/item-allergens", input);
}

export type SaleabilityInput = {
  at: string;
  businessId: string;
  itemId: string;
  locationId: string;
  priceBookId: string;
  serviceChannelId?: string;
  variantId?: string;
};
export type SaleabilityReason =
  | "item_not_found"
  | "item_inactive"
  | "category_inactive"
  | "variant_invalid"
  | "variant_inactive"
  | "location_invalid"
  | "channel_invalid"
  | "price_book_ineligible"
  | "price_missing"
  | "item_unavailable"
  | "modifier_configuration_invalid";
export type SaleabilityResult = {
  availableRule: MenuCatalog["availability"][number] | null;
  campaign: MenuCatalog["specialCampaigns"][number] | null;
  effectiveAmountMinor: number | null;
  invalidModifierGroupIds: string[];
  price: MenuCatalog["prices"][number] | null;
  reasons: SaleabilityReason[];
  saleable: boolean;
  specialPrice: MenuCatalog["specialPrices"][number] | null;
};

export async function readEffectiveSaleability(
  request: typeof fetch,
  input: SaleabilityInput,
): Promise<SaleabilityResult> {
  const query = new URLSearchParams({
    at: input.at,
    businessId: input.businessId,
    itemId: input.itemId,
    locationId: input.locationId,
    priceBookId: input.priceBookId,
  });
  if (input.serviceChannelId) query.set("serviceChannelId", input.serviceChannelId);
  if (input.variantId) query.set("variantId", input.variantId);
  const response = await request(`/api/v1/qcafe/menu/effective-saleability?${query}`, {
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Saleability check failed: ${response.status}`);
  return response.json() as Promise<SaleabilityResult>;
}

export type MenuMediaUpload = {
  file: File;
  height?: number;
  itemId: string;
  sortOrder: number;
  usage: "delivery" | "menu" | "qr";
  variantId?: string;
  width?: number;
};

export async function uploadMenuMedia(
  request: typeof fetch,
  businessId: string,
  input: MenuMediaUpload,
): Promise<MenuCatalog> {
  const query = new URLSearchParams({
    businessId,
    itemId: input.itemId,
    sortOrder: String(input.sortOrder),
    usage: input.usage,
  });
  if (input.variantId) query.set("variantId", input.variantId);
  if (input.width) query.set("width", String(input.width));
  if (input.height) query.set("height", String(input.height));
  const response = await request(`/api/v1/qcafe/menu/media?${query}`, {
    body: input.file,
    headers: { "Content-Type": input.file.type, "X-Correlation-Id": crypto.randomUUID() },
    method: "POST",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => undefined)) as { error?: string } | undefined;
    throw new Error(error?.error ?? `Menu media upload failed: ${response.status}`);
  }
  return response.json() as Promise<MenuCatalog>;
}

export async function readMenuMediaContent(request: typeof fetch, businessId: string, assetId: string): Promise<Blob> {
  const response = await request(
    `/api/v1/qcafe/menu/media/${encodeURIComponent(assetId)}/content?businessId=${encodeURIComponent(businessId)}`,
    {
      signal: AbortSignal.timeout(8_000),
    },
  );
  if (!response.ok) throw new Error(`Menu image could not be loaded: ${response.status}`);
  return response.blob();
}

async function send(request: typeof fetch, path: string, body?: Record<string, unknown>): Promise<MenuCatalog> {
  const response = await request(path, {
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "Content-Type": "application/json", "X-Correlation-Id": crypto.randomUUID() } : undefined,
    method: body ? "POST" : "GET",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => undefined)) as { error?: string } | undefined;
    throw new Error(error?.error ?? `Menu request failed: ${response.status}`);
  }
  return response.json() as Promise<MenuCatalog>;
}
