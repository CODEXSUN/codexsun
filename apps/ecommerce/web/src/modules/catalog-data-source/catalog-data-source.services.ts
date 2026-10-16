import { ecommerceFetch } from "../../shared/ecommerce-fetch";
import type {
  CatalogDataSourceConnectionResult,
  CatalogDataSourceModule,
  CatalogDataSourceProvider,
  CatalogDataSourceSettings,
  CatalogSyncResult
} from "./catalog-data-source.types";

type Envelope<T> = { data: T; success: true } | { error: { message: string }; success: false };
const base = "/api/platform/ecommerce/settings/data-source";

async function request<T>(options: RequestInit = {}, suffix = "") {
  const response = await ecommerceFetch(`${base}${suffix}`, {
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
    throw new Error(body.success ? "Ecommerce data-source request failed." : body.error.message);
  return body.data;
}

export const getCatalogDataSource = () => request<CatalogDataSourceSettings>();
export const saveCatalogDataSource = (input: {
  module: CatalogDataSourceModule;
  provider: CatalogDataSourceProvider;
}) => request<CatalogDataSourceSettings>({ body: JSON.stringify(input), method: "PUT" });
export const saveStorefrontSectionVisibility = (input: {
  enabled: boolean;
  module: CatalogDataSourceModule;
}) =>
  request<CatalogDataSourceSettings>({ body: JSON.stringify(input), method: "PUT" }, "/visibility");
export const testCatalogDataSource = (provider: CatalogDataSourceProvider) =>
  request<CatalogDataSourceConnectionResult>(
    { body: JSON.stringify({ provider }), method: "POST" },
    "/test"
  );
export const syncCatalogDataSource = (action: "pull" | "push") =>
  request<CatalogSyncResult>({ method: "POST" }, `/sync/${action}`);
