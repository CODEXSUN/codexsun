import { resolve } from "node:path";
import { getEcommerceTenantKey } from "./database/ecommerce-database.js";

const maxImageBytes = 8 * 1024 * 1024;

function mediaRoot(kind: "products" | "sliders") {
  const storageRoot = process.env.STORAGE_ROOT;
  if (!storageRoot) throw new Error("STORAGE_ROOT is required for ecommerce images.");
  return resolve(storageRoot, "ecommerce", getEcommerceTenantKey(), kind);
}

export const ecommerceEnv = {
  get ECOMMERCE_PRODUCT_IMAGE_MAX_BYTES() {
    return maxImageBytes;
  },
  get ECOMMERCE_PRODUCT_IMAGE_ROOT() {
    return mediaRoot("products");
  },
  get ECOMMERCE_SLIDER_IMAGE_MAX_BYTES() {
    return maxImageBytes;
  },
  get ECOMMERCE_SLIDER_IMAGE_ROOT() {
    return mediaRoot("sliders");
  }
};
