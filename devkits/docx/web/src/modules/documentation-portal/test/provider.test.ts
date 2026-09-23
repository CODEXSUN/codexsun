import assert from "node:assert/strict";
import test from "node:test";
import { docxDocumentationPortalProvider } from "../provider";

test("declares the DOCX documentation portal ownership and event contract", () => {
  assert.equal(docxDocumentationPortalProvider.owner, "devkits/docx/web/modules/documentation-portal");
  assert.deepEqual(docxDocumentationPortalProvider.events, { published: [], consumed: [] });
});
