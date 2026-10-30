import { ecommerceFetch } from "../../shared/ecommerce-fetch";
import type {
  StorefrontOrganisation,
  StorefrontOrganisationOptions
} from "./storefront-organisation.types";

async function response<T>(request: Promise<Response>): Promise<T> {
  const result = await request;
  const body = await result.json();
  if (!result.ok || !body.success)
    throw new Error(body.error?.message || "Storefront organisation request failed.");
  return body.data;
}
export const getStorefrontOrganisation = () =>
  response<StorefrontOrganisation>(
    ecommerceFetch("/api/platform/ecommerce/storefront/organisation")
  );
export const getStorefrontOrganisationOptions = () =>
  response<StorefrontOrganisationOptions>(
    ecommerceFetch("/api/platform/ecommerce/storefront/organisation/options")
  );
export const saveStorefrontOrganisation = (input: StorefrontOrganisation) =>
  response<StorefrontOrganisation>(
    ecommerceFetch("/api/platform/ecommerce/storefront/organisation", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    })
  );

export async function uploadStorefrontOrganisationLogo(file: File) {
  if (!file.size || file.size > 2 * 1024 * 1024) throw new Error("Use a logo no larger than 2 MB.");
  const contentBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The logo could not be read."));
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.readAsDataURL(file);
  });
  return response<{ logoFileName: string }>(
    ecommerceFetch("/api/platform/ecommerce/storefront/organisation/logo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentBase64 })
    })
  );
}
