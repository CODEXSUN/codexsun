import assert from "node:assert/strict";
import test from "node:test";
import { validateSeoMetadata } from "./seo-validation";

test("accepts complete client metadata", () => {
  assert.deepEqual(validateSeoMetadata({ canonical: "https://sites.example/clients/codexsun", description: "A useful platform studio description.", h1: "Systems that feel clear.", schemaType: "WebPage", title: "Codexsun | Platform studio" }), []);
});

test("reports missing and invalid SEO fields", () => {
  const errors = validateSeoMetadata({ canonical: "/clients/codexsun", description: "", h1: "", title: "" });
  assert.ok(errors.includes("title is required"));
  assert.ok(errors.includes("description is required"));
  assert.ok(errors.includes("one H1 is required"));
  assert.ok(errors.includes("canonical must be an absolute URL"));
  assert.ok(errors.includes("schema type is required"));
});
