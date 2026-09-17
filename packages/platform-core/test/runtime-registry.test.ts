import assert from "node:assert/strict";
import test from "node:test";
import type { ModuleProvider } from "@codexsun/framework";
import {
  createPlatformRuntime,
  readDocsApiRuntimeConfig,
  readDocsWebRuntimeConfig,
  ModuleEnablementPolicy,
  PlatformRuntimeRegistry,
  readApiRuntimeConfig,
  readDesktopRuntimeConfig,
  readMobileRuntimeConfig,
  readRedisRuntimeConfig,
  readWebRuntimeConfig,
} from "../src/index.js";

function provider(id: string): ModuleProvider {
  return {
    manifest: {
      id,
      owner: "packages/platform-core/test",
      version: "1.0.2",
      dependencies: id === "platform.test" ? ["platform.core"] : [],
      contracts: [],
    },
    register(): void {},
  };
}

test("composes platform and application providers from one registry", () => {
  const runtime = createPlatformRuntime({ id: "test", enabledProviderIds: ["platform.core", "platform.test"] }, [
    provider("platform.test"),
  ]);

  assert.deepEqual(runtime.enabledProviderIds, ["platform.core", "platform.test"]);
  runtime.start();
  runtime.stop();
});

test("requires a deployable profile to select providers and their dependencies", () => {
  const policy = new ModuleEnablementPolicy();
  const providers = [provider("platform.core"), provider("platform.test")];

  assert.throws(
    () => policy.select({ id: "test", enabledProviderIds: ["platform.test"] }, providers),
    /omits dependency platform.core/u,
  );
  assert.throws(
    () => policy.select({ id: "test", enabledProviderIds: ["missing"] }, providers),
    /enables unavailable provider/u,
  );
});

test("rejects duplicate runtime providers before engine composition", () => {
  const registry = new PlatformRuntimeRegistry();
  registry.include(provider("platform.test"));

  assert.throws(() => registry.include(provider("platform.test")), /already includes provider/u);
});

test("validates each host configuration without exposing server values to clients", () => {
  const api = readApiRuntimeConfig({
    PLATFORM_HOST: "127.0.0.1",
    PLATFORM_API_PORT: "6100",
    DATABASE_URL: "sqlite://local",
    PLATFORM_JWT_SECRET: "runtime-config-test-secret-runtime-config-test",
    PLATFORM_JWT_ISSUER: "codexsun-platform",
    PLATFORM_JWT_AUDIENCE: "codexsun-platform-api",
    PLATFORM_DEPLOYMENT_MODE: "single",
    PLATFORM_DEPLOYMENT_NAME: "aaran",
    PLATFORM_BOOTSTRAP_ADMIN_EMAIL: "admin@admin.com",
  });
  const web = readWebRuntimeConfig({
    PLATFORM_HOST: "127.0.0.1",
    PLATFORM_WEB_PORT: "6101",
    VITE_PLATFORM_API_URL: "http://127.0.0.1:6100",
    DATABASE_URL: "sqlite://local",
  });

  assert.equal(api.NODE_ENV, "development");
  assert.equal(api.PLATFORM_DEPLOYMENT_MODE, "single");
  assert.equal(web.VITE_PLATFORM_API_URL, "http://127.0.0.1:6100");
  assert.equal("DATABASE_URL" in web, false);
  assert.equal(
    readDocsApiRuntimeConfig({
      PLATFORM_HOST: "127.0.0.1",
      DOCS_API_PORT: "6030",
      DOCS_DATABASE_URL: "sqlite://docs",
      DOCS_INDEX_PATH: "../../../storage/apps/private/docs/index.sqlite",
      DOCS_WEB_ORIGIN: "http://127.0.0.1:6040",
    }).DOCS_API_PORT,
    6030,
  );
  assert.equal(
    readDocsWebRuntimeConfig({
      PLATFORM_HOST: "127.0.0.1",
      DOCS_WEB_PORT: "6040",
      VITE_DOCS_API_URL: "http://127.0.0.1:6030",
      DATABASE_URL: "sqlite://private",
    }).VITE_DOCS_API_URL,
    "http://127.0.0.1:6030",
  );
  assert.equal(
    readDesktopRuntimeConfig({
      PLATFORM_HOST: "127.0.0.1",
      PLATFORM_DESKTOP_PORT: "6103",
      PLATFORM_DESKTOP_API_URL: "http://127.0.0.1:6100",
    }).PLATFORM_DESKTOP_API_URL,
    "http://127.0.0.1:6100",
  );
  assert.equal(
    readMobileRuntimeConfig({ PLATFORM_MOBILE_API_URL: "http://127.0.0.1:6100" }).PLATFORM_MOBILE_API_URL,
    "http://127.0.0.1:6100",
  );
  assert.equal(readRedisRuntimeConfig({ REDIS_URL: "redis://127.0.0.1:6379" }).REDIS_URL, "redis://127.0.0.1:6379");
  assert.throws(() => readRedisRuntimeConfig({ REDIS_URL: "https://127.0.0.1:6379" }));
  assert.throws(() => readWebRuntimeConfig({ PLATFORM_HOST: "", PLATFORM_WEB_PORT: "0" }));
});
