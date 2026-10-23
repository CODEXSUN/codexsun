import assert from "node:assert/strict";
import { test } from "node:test";
import { marketingPageFromPath } from "./marketing-navigation";

test("Marketing menu and direct paths select their own workspace", () => {
  assert.equal(marketingPageFromPath("/app/marketing"), "marketing.brands");
  for (const page of ["brands", "campaigns", "captures", "submissions", "connections", "consents"])
    assert.equal(marketingPageFromPath("/app/marketing/" + page), "marketing." + page);
  assert.equal(marketingPageFromPath("/app/marketing/unknown"), null);
  assert.equal(marketingPageFromPath("/app/crm/leads"), null);
  assert.equal(marketingPageFromPath("/app/marketing/brands/another-tenant"), null);
});
