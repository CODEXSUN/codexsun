import assert from "node:assert/strict";
import test from "node:test";
import { zetroAdminPages, zetroPageFromUrl } from "./sa-zetro-pages";

test("Zetro Super Admin links resolve to their own pages", () => {
  for (const section of zetroAdminPages) {
    assert.equal(zetroPageFromUrl(`/sa/zetro/${section}`), `zetro/${section}`);
  }
  assert.equal(zetroPageFromUrl("/sa/zetro"), "zetro/patterns");
  assert.equal(zetroPageFromUrl("/sa/zetro/unknown"), null);
  assert.equal(zetroPageFromUrl("/sa/zetro/patterns/extra"), null);
});
