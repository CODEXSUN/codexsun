import test from "node:test";
import assert from "node:assert/strict";
import { ProjexWorkspaceProvider } from "../provider.js";

test("declares the projex workspace provider contract", () => {
  const provider = new ProjexWorkspaceProvider();
  assert.deepEqual(provider.manifest.contracts, ["projex.workspace.snapshot"]);
  assert.equal(provider.manifest.owner, "devkits/projex/api/modules/workspace");
});
