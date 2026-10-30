import { ecommerceFetch } from "../../shared/ecommerce-fetch";
import type {
  ImageProductOption,
  ImageStatus,
  ImageVariantOption,
  ProductImagePayload,
  ProductImageRecord
} from "./product-image.types";
type Envelope<T> = { data: T; success: true } | { error: { message: string }; success: false };
const base = "/api/platform/ecommerce/catalog/images";
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
    throw new Error(body.success ? "Image request failed." : body.error.message);
  return body.data;
}
export const listProductImages = (search = "", status?: ImageStatus) =>
  request<ProductImageRecord[]>(
    `${base}?search=${encodeURIComponent(search)}${status ? `&status=${status}` : ""}`
  );
export const listImageProducts = () => request<ImageProductOption[]>(`${base}/products`);
export const listImageVariants = () => request<ImageVariantOption[]>(`${base}/variants`);
export const uploadProductImage = (fileName: string, contentBase64: string) =>
  request<{ imageUrl: string; sizeBytes: number }>(`${base}/upload`, {
    body: JSON.stringify({ contentBase64, fileName }),
    method: "POST"
  });
export const createProductImage = (value: ProductImagePayload) =>
  request<ProductImageRecord>(base, { body: JSON.stringify(value), method: "POST" });
export const updateProductImage = (id: number, value: ProductImagePayload) =>
  request<ProductImageRecord>(`${base}/${id}`, { body: JSON.stringify(value), method: "PUT" });
export const changeProductImageStatus = (id: number, status: ImageStatus) =>
  request<ProductImageRecord>(`${base}/${id}/${status === "active" ? "activate" : "deactivate"}`, {
    body: "{}",
    method: "POST"
  });
