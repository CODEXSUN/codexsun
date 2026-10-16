import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "@codexsun/framework/errors";
import { isFrappeOperatingWindow } from "./catalog-data-source.availability.js";
import { CatalogDataSourceService } from "./catalog-data-source.service.js";

test("storefront falls back to local catalog and resumes Frappe after recovery", async () => {
  let frappeCalls = 0;
  const localProducts = [{ name: "Cached product" }];
  const liveProducts = [{ name: "Live product" }];
  const repository = {
    moduleProviders: async () => [{ module: "products", provider: "frappe" }],
    cacheAgeMs: async () => 0
  };
  const service = new CatalogDataSourceService(
    { settings: async () => ({ frappeConfigured: true }) } as ConstructorParameters<
      typeof CatalogDataSourceService
    >[0],
    repository as unknown as ConstructorParameters<typeof CatalogDataSourceService>[1],
    () => new Date("2026-08-14T04:00:00.000Z"),
    () => "tenant-test"
  );
  Object.assign(service as object, {
    frappe: {
      catalog: async () => {
        frappeCalls += 1;
        if (frappeCalls === 1) {
          throw new AppError({
            code: "FRAPPE_CATALOG_UNAVAILABLE",
            message: "Frappe is offline.",
            statusCode: 502
          });
        }
        return liveProducts;
      }
    },
    fallback: { catalog: async () => localProducts },
    own: { catalog: async () => localProducts }
  });

  assert.equal((await service.catalog({}))[0]?.name, "Cached product");
  assert.equal((await service.catalog({}))[0]?.name, "Cached product");
  assert.equal(frappeCalls, 1);

  Object.assign(service as object, { frappeRetryAfter: 0 });
  assert.equal((await service.catalog({}))[0]?.name, "Live product");
  assert.equal(frappeCalls, 2);

  Object.assign(service as object, { now: () => new Date("2026-08-14T17:00:00.000Z") });
  assert.equal((await service.catalog({}))[0]?.name, "Cached product");
  assert.equal(frappeCalls, 2);
});

test("scheduled Frappe refresh runs only from 8 AM until 10 PM India time", () => {
  assert.equal(isFrappeOperatingWindow(new Date("2026-08-14T02:29:00.000Z")), false);
  assert.equal(isFrappeOperatingWindow(new Date("2026-08-14T02:30:00.000Z")), true);
  assert.equal(isFrappeOperatingWindow(new Date("2026-08-14T16:29:00.000Z")), true);
  assert.equal(isFrappeOperatingWindow(new Date("2026-08-14T16:30:00.000Z")), false);
});

test("empty Frappe cache falls back to the complete local catalog", async () => {
  const repository = {
    moduleProviders: async () => [{ module: "products", provider: "frappe" }],
    cacheAgeMs: async () => 0
  };
  const service = new CatalogDataSourceService(
    { settings: async () => ({ frappeConfigured: true }) } as ConstructorParameters<
      typeof CatalogDataSourceService
    >[0],
    repository as unknown as ConstructorParameters<typeof CatalogDataSourceService>[1],
    () => new Date("2026-08-14T17:00:00.000Z"),
    () => "tenant-test"
  );
  Object.assign(service as object, {
    fallback: { catalog: async () => [] },
    own: { catalog: async () => [{ name: "Available local product" }] }
  });

  assert.equal((await service.catalog({}))[0]?.name, "Available local product");
});

test("disabled Frappe connection reads the local cache without making a live request", async () => {
  const service = new CatalogDataSourceService(
    { settings: async () => ({ frappeConfigured: false }) } as ConstructorParameters<
      typeof CatalogDataSourceService
    >[0],
    {
      moduleProviders: async () => [{ module: "products", provider: "frappe" }],
      cacheAgeMs: async () => null
    } as ConstructorParameters<typeof CatalogDataSourceService>[1],
    () => new Date("2026-08-14T04:00:00.000Z"),
    () => "tenant-test"
  );
  Object.assign(service as object, {
    frappe: {
      catalog: async () => {
        throw new Error("Live Frappe must not be called.");
      }
    },
    fallback: { catalog: async () => [{ name: "Cached product" }] }
  });
  assert.equal((await service.catalog({}))[0]?.name, "Cached product");
});

test("a live catalog read refreshes a stale local cache once per interval", async () => {
  let pulls = 0;
  const now = new Date("2026-08-14T04:00:00.000Z");
  const snapshot = {
    catalogs: [],
    erpnext_items: [],
    items: [],
    sliders: [],
    promotions: [],
    featured_cards: [],
    brand_strips: [],
    season_strips: [],
    campaign_events: []
  };
  const repository = {
    moduleProviders: async () => [{ module: "products", provider: "frappe" }],
    cacheAgeMs: async () => (pulls ? 0 : null),
    replaceFromFrappe: async () => {
      pulls += 1;
    }
  };
  const service = new CatalogDataSourceService(
    { settings: async () => ({ frappeConfigured: true }) } as ConstructorParameters<
      typeof CatalogDataSourceService
    >[0],
    repository as unknown as ConstructorParameters<typeof CatalogDataSourceService>[1],
    () => now,
    () => "tenant-refresh-test"
  );
  Object.assign(service as object, {
    frappe: {
      catalog: async () => [{ name: "Live product" }],
      integrationSnapshot: async () => snapshot
    }
  });
  assert.equal((await service.catalog({}))[0]?.name, "Live product");
  assert.equal((await service.catalog({}))[0]?.name, "Live product");
  assert.equal(pulls, 1);
});

test("disabled product and discovery modules return their API response shapes", async () => {
  const repository = {
    moduleProviders: async () => [
      { module: "products", provider: "own", enabled: false },
      { module: "categories", provider: "own", enabled: false },
      { module: "brands", provider: "own", enabled: false },
      { module: "product-details", provider: "own", enabled: false },
      { module: "variants", provider: "own", enabled: false },
      { module: "product-images", provider: "own", enabled: false }
    ]
  };
  const service = new CatalogDataSourceService(
    {} as ConstructorParameters<typeof CatalogDataSourceService>[0],
    repository as unknown as ConstructorParameters<typeof CatalogDataSourceService>[1]
  );
  assert.deepEqual(await service.discovery(), {
    brands: [],
    categories: [],
    priceRange: { maximum: 0, minimum: 0 }
  });
  assert.equal(await service.product("missing"), null);
});
