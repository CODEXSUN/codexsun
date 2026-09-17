import assert from "node:assert/strict";
import test from "node:test";
import { ProviderEngine } from "@codexsun/framework";
import { PlatformProvider } from "@codexsun/platform-core";
import { DocsCatalogProvider } from "../provider.js";

test("registers the Docs catalog through the shared framework", () => {
  const engine = new ProviderEngine();
  engine.register(new PlatformProvider());
  engine.register(new DocsCatalogProvider());

  engine.start();
  assert.equal(engine.require<{ name: string }>("docs.catalog").name, "Docs Catalog");
  engine.stop();
});
