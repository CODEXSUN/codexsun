import { ecommerceFetch } from "../../shared/ecommerce-fetch";
import type {
  CoreBrandOption,
  CoreProductOption,
  FrappeItemOption,
  ProductInformationPayload,
  ProductInformationRecord,
  PublicationStatus
} from "./product-information.types";
type Envelope<T> = { data: T; success: true } | { error: { message: string }; success: false };
const base = "/api/platform/ecommerce/catalog/product-information";
const frappeItemsBase = "/api/platform/ecommerce/settings/data-source/frappe-items";
type FrappeItemResponse = {
  brand?: string | null;
  description?: string | null;
  image?: string | null;
  item_code: string;
  item_group?: string | null;
  item_name: string;
  standard_rate?: number | string | null;
  stock_uom?: string | null;
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
  if (!response.ok || !body.success)
    throw new Error(body.success ? "Ecommerce request failed." : body.error.message);
  return body.data;
}
export const listProductInformation = (search = "", status?: PublicationStatus) =>
  request<ProductInformationRecord[]>(
    `${base}?search=${encodeURIComponent(search)}${status ? `&status=${status}` : ""}`
  );
export const listCoreProductOptions = () => request<CoreProductOption[]>(`${base}/core-products`);
export const listCoreBrandOptions = () => request<CoreBrandOption[]>(`${base}/core-brands`);
export const listFrappeItems = async (search = "") =>
  (await request<FrappeItemResponse[]>(`${frappeItemsBase}?search=${encodeURIComponent(search)}`)).map(
    toFrappeItem
  );
export const getFrappeItem = async (itemCode: string) =>
  toFrappeItem(await request<FrappeItemResponse>(`${frappeItemsBase}/${encodeURIComponent(itemCode)}`));
export const createProductInformation = (payload: ProductInformationPayload) =>
  request<ProductInformationRecord>(base, { body: JSON.stringify(payload), method: "POST" });
export const updateProductInformation = (id: number, payload: ProductInformationPayload) =>
  request<ProductInformationRecord>(`${base}/${id}`, {
    body: JSON.stringify(payload),
    method: "PUT"
  });
export const archiveProductInformation = (id: number) =>
  request<ProductInformationRecord>(`${base}/${id}/archive`, { body: "{}", method: "POST" });

function toFrappeItem(item: FrappeItemResponse): FrappeItemOption {
  const rate = item.standard_rate === null || item.standard_rate === undefined
    ? null
    : Number(item.standard_rate);
  return {
    brand: item.brand ?? "",
    description: item.description ?? "",
    image: item.image ?? "",
    itemCode: item.item_code,
    itemGroup: item.item_group ?? "",
    itemName: item.item_name,
    standardRate: rate !== null && Number.isFinite(rate) ? rate : null,
    stockUom: item.stock_uom ?? ""
  };
}
