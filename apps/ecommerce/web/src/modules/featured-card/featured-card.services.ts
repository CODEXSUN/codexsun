import { ecommerceFetch } from "../../shared/ecommerce-fetch";
import type {
  FrappeFeaturedItem,
  FrappeCatalogSyncResult,
  FeaturedCardPayload,
  FeaturedCardRecord,
  FeaturedCardStatus
} from "./featured-card.types";

type Envelope<T> = { data: T; success: true } | { error: { message: string }; success: false };
const base = "/api/platform/ecommerce/storefront/featured-cards";
const frappeItemsBase = "/api/platform/ecommerce/settings/data-source/frappe-items";

type FrappeItemResponse = {
  brand?: string | null;
  description?: string | null;
  image?: string | null;
  item_code: string;
  item_group?: string | null;
  item_name: string;
};

async function request<T>(url: string, options: RequestInit = {}) {
  const response = await ecommerceFetch(url, {
    ...options,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers
    }
  });
  const body = (await response.json()) as Envelope<T>;
  if (!response.ok || !body.success) {
    throw new Error(body.success ? "Featured card request failed." : body.error.message);
  }
  return body.data;
}

export const listFeaturedCards = (search = "", status?: FeaturedCardStatus) =>
  request<FeaturedCardRecord[]>(
    `${base}?search=${encodeURIComponent(search)}${status ? `&status=${status}` : ""}`
  );
export const listFrappeFeaturedItems = async (search = "") =>
  (
    await request<FrappeItemResponse[]>(`${frappeItemsBase}?search=${encodeURIComponent(search)}`)
  ).map(toFrappeFeaturedItem);
export const getFrappeFeaturedItem = async (itemCode: string) =>
  toFrappeFeaturedItem(
    await request<FrappeItemResponse>(`${frappeItemsBase}/${encodeURIComponent(itemCode)}`)
  );
export const createFeaturedCard = (value: FeaturedCardPayload) =>
  request<FeaturedCardRecord>(base, { body: JSON.stringify(value), method: "POST" });
export const uploadFeaturedImage = (fileName: string, contentBase64: string) =>
  request<{ imageUrl: string; sizeBytes: number }>(
    "/api/platform/ecommerce/catalog/images/upload",
    { body: JSON.stringify({ contentBase64, fileName }), method: "POST" }
  );
export const updateFeaturedCard = (id: number, value: FeaturedCardPayload) =>
  request<FeaturedCardRecord>(`${base}/${id}`, {
    body: JSON.stringify(value),
    method: "PUT"
  });
export const changeFeaturedCardStatus = (id: number, status: FeaturedCardStatus) =>
  request<FeaturedCardRecord>(`${base}/${id}/${status === "active" ? "activate" : "deactivate"}`, {
    body: "{}",
    method: "POST"
  });
export const pullFeaturedCardsFromFrappe = () =>
  request<FrappeCatalogSyncResult>("/api/platform/ecommerce/settings/data-source/sync/pull", {
    body: "{}",
    method: "POST"
  });

function toFrappeFeaturedItem(item: FrappeItemResponse): FrappeFeaturedItem {
  return {
    brand: item.brand ?? "",
    description: item.description ?? "",
    image: item.image ?? "",
    itemCode: item.item_code,
    itemGroup: item.item_group ?? "",
    itemName: item.item_name
  };
}
