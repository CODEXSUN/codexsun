export type MenuCatalog = {
  categories: Array<{ active: boolean; code: string; id: string; name: string; sortOrder: number }>;
  items: Array<{
    active: boolean; businessId: string; categoryId: string; code: string; id: string;
    itemType: "food" | "beverage" | "service"; name: string; taxCode: string | null;
    variants: Array<{ active: boolean; code: string; id: string; name: string }>;
  }>;
  priceBooks: Array<{ active: boolean; code: string; currency: string; id: string; name: string }>;
  prices: Array<{
    active: boolean; amountMinor: number; id: string; itemId: string; locationId: string | null;
    priceBookId: string; serviceChannelId: string | null; validFrom: string; validTo: string | null; variantId: string | null;
  }>;
};

export function readMenu(request: typeof fetch, businessId: string): Promise<MenuCatalog> {
  return send(request, `/api/v1/qcafe/menu?businessId=${encodeURIComponent(businessId)}`);
}
export function createMenuCategory(request: typeof fetch, input: { businessId: string; code: string; name: string; sortOrder: number }) {
  return send(request, "/api/v1/qcafe/menu/categories", input);
}
export function createMenuItem(request: typeof fetch, input: { businessId: string; categoryId: string; code: string; itemType: string; name: string; taxCode?: string }) {
  return send(request, "/api/v1/qcafe/menu/items", input);
}
export function createMenuVariant(request: typeof fetch, businessId: string, input: { code: string; itemId: string; name: string }) {
  return send(request, `/api/v1/qcafe/menu/variants?businessId=${encodeURIComponent(businessId)}`, input);
}
export function createPriceBook(request: typeof fetch, input: { businessId: string; code: string; currency: string; name: string }) {
  return send(request, "/api/v1/qcafe/menu/price-books", input);
}
export function setMenuPrice(request: typeof fetch, businessId: string, input: Record<string, unknown>) {
  return send(request, `/api/v1/qcafe/menu/prices?businessId=${encodeURIComponent(businessId)}`, input);
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
