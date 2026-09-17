import assert from "node:assert/strict";
import test from "node:test";
import type { ModuleProvider } from "@codexsun/framework";
import {
  createPlatformRuntime,
  ModuleEnablementPolicy,
  PlatformRuntimeRegistry,
  readApiRuntimeConfig,
  readDesktopRuntimeConfig,
  readMobileRuntimeConfig,
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
  });
  const web = readWebRuntimeConfig({
    PLATFORM_HOST: "127.0.0.1",
    PLATFORM_WEB_PORT: "6101",
    VITE_PLATFORM_API_URL: "http://127.0.0.1:6100",
    DATABASE_URL: "sqlite://local",
  });

  assert.equal(api.NODE_ENV, "development");
  assert.equal(web.VITE_PLATFORM_API_URL, "http://127.0.0.1:6100");
  assert.equal("DATABASE_URL" in web, false);
  assert.equal(
    readDesktopRuntimeConfig({ PLATFORM_DESKTOP_API_URL: "http://127.0.0.1:6100" }).PLATFORM_DESKTOP_API_URL,
    "http://127.0.0.1:6100",
  );
  assert.equal(
    readMobileRuntimeConfig({ PLATFORM_MOBILE_API_URL: "http://127.0.0.1:6100" }).PLATFORM_MOBILE_API_URL,
    "http://127.0.0.1:6100",
  );
  assert.throws(() => readWebRuntimeConfig({ PLATFORM_HOST: "", PLATFORM_WEB_PORT: "0" }));
});
