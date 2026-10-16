import { AppError } from "@codexsun/framework/errors";
import { FrappeConnectionAccess } from "@codexsun/frappe-api";
import type { FrappeDatabase, FrappeSettings } from "@codexsun/frappe-api";
import type { Kysely } from "kysely";
import {
  getEcommerceDatabase,
  getEcommerceFrappeEnabled
} from "../../database/ecommerce-database.js";
import type {
  CatalogDataSourceControl,
  CatalogDataSourceProvider
} from "./catalog-data-source.types.js";

export function createCatalogDataSourceControl(
  encryptionSecret: string,
  defaults: FrappeSettings
): CatalogDataSourceControl {
  const connection = () =>
    new FrappeConnectionAccess(
      getEcommerceDatabase() as unknown as Kysely<FrappeDatabase>,
      encryptionSecret,
      defaults
    );

  return {
    async credentials() {
      if (!getEcommerceFrappeEnabled())
        throw AppError.conflict("Enable the Frappe app before using its catalog.");
      const settings = await connection().credentials();
      if (!settings) throw AppError.conflict("Enable and verify the connection in the Frappe app.");
      return { url: settings.baseUrl, apiKey: settings.apiKey, apiSecret: settings.apiSecret };
    },
    async settings() {
      const state = await connection().state();
      return {
        frappeConfigured: getEcommerceFrappeEnabled() && state.usable,
        frappeEnabled: getEcommerceFrappeEnabled() && state.enabled,
        frappeUrl: state.baseUrl,
        verificationStatus:
          state.verificationStatus === "verified"
            ? ("live" as const)
            : state.verificationStatus === "failed"
              ? ("offline" as const)
              : ("unverified" as const)
      };
    },
    async test(provider: CatalogDataSourceProvider) {
      if (provider === "own")
        return {
          connected: true,
          latencyMs: 0,
          message: "Local catalog is available.",
          provider,
          providerLabel: "Local"
        };
      const state = await connection().state();
      const connected = getEcommerceFrappeEnabled() && state.usable;
      return {
        connected,
        latencyMs: 0,
        message: connected
          ? "Frappe connection is verified."
          : "Enable and verify the connection in the Frappe app.",
        provider,
        providerLabel: "Frappe"
      };
    }
  };
}
