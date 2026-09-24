import assert from "node:assert/strict";
import test from "node:test";
import { createDocumentCatalog, resolveDocumentLink } from "../repository-catalog";

test("groups applications before devkits and puts each application README first", () => {
  const items = createDocumentCatalog({
    "../../devkits/docx/README.md": "# DOCX",
    "../../apps/crm/api/README.md": "# CRM API",
    "../../apps/crm/README.md": "# CRM",
    "../../apps/crm/agent/notes.md": "Notes without a heading",
  });
  assert.deepEqual(items.map((item) => item.path), ["apps/crm/README.md", "apps/crm/agent/notes.md", "apps/crm/api/README.md", "devkits/docx/README.md"]);
  assert.equal(items[0].group, "Applications");
  assert.equal(items[2].title, "CRM API");
  assert.equal(items[1].title, "notes.md");
});

test("resolves sibling and parent documentation without intercepting external links", () => {
  assert.equal(resolveDocumentLink("apps/crm/api/README.md", "../README.md#setup"), "apps/crm/README.md");
  assert.equal(resolveDocumentLink("apps/crm/README.md", "api/README.md"), "apps/crm/api/README.md");
  assert.equal(resolveDocumentLink("apps/crm/README.md", "https://example.com"), undefined);
  assert.equal(resolveDocumentLink("apps/crm/README.md", "#setup"), undefined);
});
