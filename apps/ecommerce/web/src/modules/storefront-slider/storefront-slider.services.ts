import { ecommerceFetch } from "../../shared/ecommerce-fetch";
import type {
  FrappeSliderItem,
  SliderStorageSettings,
  FrappeCatalogSyncResult,
  StorefrontSliderPayload,
  StorefrontSliderRecord,
  StorefrontSliderStatus
} from "./storefront-slider.types";

type Envelope<T> = { data: T; success: true } | { error: { message: string }; success: false };
const base = "/api/platform/ecommerce/storefront/sliders";
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
    throw new Error(body.success ? "Home slider request failed." : body.error.message);
  }
  return body.data;
}

export const listStorefrontSliders = (search = "", status?: StorefrontSliderStatus) =>
  request<StorefrontSliderRecord[]>(
    `${base}?search=${encodeURIComponent(search)}${status ? `&status=${status}` : ""}`
  );
export const listFrappeSliderItems = async (search = "") =>
  (
    await request<FrappeItemResponse[]>(
      `${frappeItemsBase}?search=${encodeURIComponent(search)}`
    )
  ).map(toFrappeSliderItem);
export const getFrappeSliderItem = async (itemCode: string) =>
  toFrappeSliderItem(
    await request<FrappeItemResponse>(`${frappeItemsBase}/${encodeURIComponent(itemCode)}`)
  );
export const getSliderStorageSettings = () =>
  request<SliderStorageSettings>(`${base}/storage`);
export const uploadSliderImage = (fileName: string, contentBase64: string) =>
  request<{ imageUrl: string; sizeBytes: number }>(`${base}/images`, {
    body: JSON.stringify({ contentBase64, fileName }),
    method: "POST"
  });
export const createStorefrontSlider = (value: StorefrontSliderPayload) =>
  request<StorefrontSliderRecord>(base, { body: JSON.stringify(value), method: "POST" });
export const updateStorefrontSlider = (id: number, value: StorefrontSliderPayload) =>
  request<StorefrontSliderRecord>(`${base}/${id}`, {
    body: JSON.stringify(value),
    method: "PUT"
  });
export const changeStorefrontSliderStatus = (id: number, status: StorefrontSliderStatus) =>
  request<StorefrontSliderRecord>(
    `${base}/${id}/${status === "active" ? "activate" : "deactivate"}`,
    { body: "{}", method: "POST" }
  );
export const pullStorefrontSlidersFromFrappe = () =>
  request<FrappeCatalogSyncResult>("/api/platform/ecommerce/settings/data-source/sync/pull", {
    body: "{}",
    method: "POST"
  });

function toFrappeSliderItem(item: FrappeItemResponse): FrappeSliderItem {
  return {
    brand: item.brand ?? "",
    description: item.description ?? "",
    image: item.image ?? "",
    itemCode: item.item_code,
    itemGroup: item.item_group ?? "",
    itemName: item.item_name
  };
}
