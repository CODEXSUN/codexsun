import assert from "node:assert/strict";
import test from "node:test";
import { OrshipInfrasProvider } from "../provider.js";

test("declares the Orship infras provider contract", () => {
  const provider = new OrshipInfrasProvider();
  assert.equal(provider.manifest.id, "orship.infras");
  assert.deepEqual(provider.manifest.contracts, ["orship.infras"]);
});
