import { ecommerceFetch } from "../../shared/ecommerce-fetch";
import type { StorefrontProfile } from "./storefront-profile.types";

type Envelope<T> = { data: T; success: true } | { error: { message: string }; success: false };
const url = "/api/platform/ecommerce/storefront/profile";

async function request(options: RequestInit = {}) {
  const response = await ecommerceFetch(url, {
    ...options,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {})
    }
  });
  const body = (await response.json()) as Envelope<StorefrontProfile>;
  if (!response.ok || !body.success)
    throw new Error(body.success ? "The storefront profile request failed." : body.error.message);
  return body.data;
}

export const getStorefrontProfile = () => request();
export const saveStorefrontProfile = (input: StorefrontProfile) =>
  request({ body: JSON.stringify(input), method: "PUT" });

export async function uploadStorefrontProfileImage(fileName: string, contentBase64: string) {
  const response = await ecommerceFetch("/api/platform/ecommerce/catalog/images/upload", {
    body: JSON.stringify({ contentBase64, fileName }),
    credentials: "same-origin",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    method: "POST"
  });
  const body = (await response.json()) as Envelope<{ imageUrl: string; sizeBytes: number }>;
  if (!response.ok || !body.success) {
    throw new Error(body.success ? "The image upload failed." : body.error.message);
  }
  return body.data;
}
