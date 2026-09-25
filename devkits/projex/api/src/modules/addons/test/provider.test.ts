import test from "node:test";
import assert from "node:assert/strict";
import { ProjexAddonsProvider } from "../provider.js";

test("declares the projex add-ons catalog provider contract", () => {
  const provider = new ProjexAddonsProvider();
  assert.deepEqual(provider.manifest.contracts, ["projex.addons.catalog"]);
  assert.equal(provider.manifest.owner, "devkits/projex/api/modules/addons");
});
