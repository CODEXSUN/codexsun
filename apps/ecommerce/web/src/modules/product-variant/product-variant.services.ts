import { ecommerceFetch } from "../../shared/ecommerce-fetch";
import type {
  CatalogProductOption,
  ProductVariantPayload,
  ProductVariantRecord,
  VariantStatus
} from "./product-variant.types";
type Envelope<T> = { data: T; success: true } | { error: { message: string }; success: false };
const base = "/api/platform/ecommerce/catalog/variants";
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
    throw new Error(body.success ? "Variant request failed." : body.error.message);
  return body.data;
}
export const listProductVariants = (search = "", status?: VariantStatus) =>
  request<ProductVariantRecord[]>(
    `${base}?search=${encodeURIComponent(search)}${status ? `&status=${status}` : ""}`
  );
export const listVariantProducts = () => request<CatalogProductOption[]>(`${base}/products`);
export const createProductVariant = (payload: ProductVariantPayload) =>
  request<ProductVariantRecord>(base, { body: JSON.stringify(payload), method: "POST" });
export const updateProductVariant = (id: number, payload: ProductVariantPayload) =>
  request<ProductVariantRecord>(`${base}/${id}`, { body: JSON.stringify(payload), method: "PUT" });
export const changeProductVariantStatus = (id: number, status: VariantStatus) =>
  request<ProductVariantRecord>(
    `${base}/${id}/${status === "active" ? "activate" : "deactivate"}`,
    { body: "{}", method: "POST" }
  );
