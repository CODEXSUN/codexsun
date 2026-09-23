import test from "node:test";
import assert from "node:assert/strict";
import { DocxFoundationProvider } from "./modules/foundation/provider";

test("docx API declares its owned health contract", () => {
  const provider = new DocxFoundationProvider();
  assert.deepEqual(provider.manifest.contracts, ["docx.health"]);
  assert.equal(provider.manifest.owner, "devkits/docx/api/modules/foundation");
});
