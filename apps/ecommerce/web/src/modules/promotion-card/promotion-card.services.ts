import { ecommerceFetch } from "../../shared/ecommerce-fetch";
import type {
  FrappePromotionItem,
  FrappeCatalogSyncResult,
  PromotionCardPayload,
  PromotionCardRecord,
  PromotionCardStatus
} from "./promotion-card.types";

type Envelope<T> = { data: T; success: true } | { error: { message: string }; success: false };
const base = "/api/platform/ecommerce/storefront/promotions";
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
    throw new Error(body.success ? "Promotion card request failed." : body.error.message);
  }
  return body.data;
}

export const listPromotionCards = (search = "", status?: PromotionCardStatus) =>
  request<PromotionCardRecord[]>(
    `${base}?search=${encodeURIComponent(search)}${status ? `&status=${status}` : ""}`
  );
export const listFrappePromotionItems = async (search = "") =>
  (
    await request<FrappeItemResponse[]>(`${frappeItemsBase}?search=${encodeURIComponent(search)}`)
  ).map(toFrappePromotionItem);
export const getFrappePromotionItem = async (itemCode: string) =>
  toFrappePromotionItem(
    await request<FrappeItemResponse>(`${frappeItemsBase}/${encodeURIComponent(itemCode)}`)
  );
export const createPromotionCard = (value: PromotionCardPayload) =>
  request<PromotionCardRecord>(base, { body: JSON.stringify(value), method: "POST" });
export const uploadPromotionImage = (fileName: string, contentBase64: string) =>
  request<{ imageUrl: string; sizeBytes: number }>(
    "/api/platform/ecommerce/catalog/images/upload",
    { body: JSON.stringify({ contentBase64, fileName }), method: "POST" }
  );
export const updatePromotionCard = (id: number, value: PromotionCardPayload) =>
  request<PromotionCardRecord>(`${base}/${id}`, {
    body: JSON.stringify(value),
    method: "PUT"
  });
export const changePromotionCardStatus = (id: number, status: PromotionCardStatus) =>
  request<PromotionCardRecord>(`${base}/${id}/${status === "active" ? "activate" : "deactivate"}`, {
    body: "{}",
    method: "POST"
  });
export const pullPromotionCardsFromFrappe = () =>
  request<FrappeCatalogSyncResult>("/api/platform/ecommerce/settings/data-source/sync/pull", {
    body: "{}",
    method: "POST"
  });

function toFrappePromotionItem(item: FrappeItemResponse): FrappePromotionItem {
  return {
    brand: item.brand ?? "",
    description: item.description ?? "",
    image: item.image ?? "",
    itemCode: item.item_code,
    itemGroup: item.item_group ?? "",
    itemName: item.item_name
  };
}
