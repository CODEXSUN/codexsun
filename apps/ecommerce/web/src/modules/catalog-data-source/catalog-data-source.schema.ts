import { z } from "zod";

export const catalogDataSourceProviderSchema = z.enum(["own", "frappe"]);
export const catalogDataSourceModuleSchema = z.enum([
  "categories",
  "brands",
  "products",
  "product-details",
  "variants",
  "product-images"
]);
