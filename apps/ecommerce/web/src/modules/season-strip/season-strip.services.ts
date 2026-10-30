import { ecommerceFetch } from "../../shared/ecommerce-fetch";
import type { CatalogSyncResult } from "../catalog-data-source";
import type {
  FrappeSeasonItem,
  SeasonStripPayload,
  SeasonStripRecord,
  SeasonStripStatus
} from "./season-strip.types";

type Envelope<T> = { data: T; success: true } | { error: { message: string }; success: false };
type FrappeItemResponse = {
  brand?: string | null;
  description?: string | null;
  image?: string | null;
  item_code: string;
  item_group?: string | null;
  item_name: string;
};
const base = "/api/platform/ecommerce/storefront/season-strips";
const frappeItemsBase = "/api/platform/ecommerce/settings/data-source/frappe-items";

async function request<T>(url: string, options: RequestInit = {}) {
  const response = await ecommerceFetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers
    }
  });
  const body = (await response.json()) as Envelope<T>;
  if (!response.ok || !body.success)
    throw new Error(body.success ? "Season strip request failed." : body.error.message);
  return body.data;
}

export const listSeasonStrips = (search = "", status?: SeasonStripStatus) =>
  request<SeasonStripRecord[]>(
    `${base}?search=${encodeURIComponent(search)}${status ? `&status=${status}` : ""}`
  );
export const listFrappeSeasonItems = async (search = "") =>
  (
    await request<FrappeItemResponse[]>(`${frappeItemsBase}?search=${encodeURIComponent(search)}`)
  ).map(toFrappeSeasonItem);
export const getFrappeSeasonItem = async (itemCode: string) =>
  toFrappeSeasonItem(
    await request<FrappeItemResponse>(`${frappeItemsBase}/${encodeURIComponent(itemCode)}`)
  );
export const createSeasonStrip = (value: SeasonStripPayload) =>
  request<SeasonStripRecord>(base, { body: JSON.stringify(value), method: "POST" });
export const updateSeasonStrip = (id: number, value: SeasonStripPayload) =>
  request<SeasonStripRecord>(`${base}/${id}`, { body: JSON.stringify(value), method: "PUT" });
export const changeSeasonStripStatus = (id: number, status: SeasonStripStatus) =>
  request<SeasonStripRecord>(`${base}/${id}/${status === "active" ? "activate" : "deactivate"}`, {
    body: "{}",
    method: "POST"
  });
export const uploadSeasonImage = (fileName: string, contentBase64: string) =>
  request<{ imageUrl: string; sizeBytes: number }>(
    "/api/platform/ecommerce/catalog/images/upload",
    {
      body: JSON.stringify({ contentBase64, fileName }),
      method: "POST"
    }
  );
export const pullSeasonStripsFromFrappe = () =>
  request<CatalogSyncResult>("/api/platform/ecommerce/settings/data-source/sync/pull", {
    body: "{}",
    method: "POST"
  });

function toFrappeSeasonItem(item: FrappeItemResponse): FrappeSeasonItem {
  return {
    brand: item.brand ?? "",
    description: item.description ?? "",
    image: item.image ?? "",
    itemCode: item.item_code,
    itemGroup: item.item_group ?? "",
    itemName: item.item_name
  };
}
