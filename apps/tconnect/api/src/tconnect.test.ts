import { test } from "node:test";
import assert from "node:assert/strict";
import { createApiApp } from "@codexsun/framework/api";
import { AppError } from "@codexsun/framework/errors";
import { registerTconnect } from "./index.js";
import { inquiryInput } from "./modules/inquiry/inquiry.types.js";
import { companyInput } from "./modules/company/company.types.js";
import { CompanyService } from "./modules/company/company.service.js";

test("buyer enquiry rejects missing consent, invalid public identities and unrelated tenant fields", () => {
  const valid = {
    companyUuid: "b0000001",
    buyerName: "Demo buyer",
    email: "buyer@example.invalid",
    phone: "9000000000",
    quantity: "200 pieces",
    requirement: "Cotton garments for a sample delivery in Tirupur.",
    consent: true
  };
  assert.equal(inquiryInput.safeParse(valid).success, true);
  for (const invalid of [
    { ...valid, consent: false },
    { ...valid, companyUuid: "1" },
    { ...valid, tenantId: "other" },
    { ...valid, website: "https://bot.invalid" },
    { ...valid, requirement: "short" }
  ])
    assert.equal(inquiryInput.safeParse(invalid).success, false);
});
test("company branding rejects executable links and unsafe slug paths", () => {
  const input = {
    name: "Demo company",
    slug: "demo-company",
    tagline: "Local expertise",
    description: "A sample business profile for Tirupur.",
    industry: "Engineering",
    city: "Tirupur",
    color: "#285d4c",
    initials: "DC",
    role: "supplier",
    products: "Parts",
    capacity: "Small batches",
    established: 2020,
    associationUuid: null,
    website: "",
    status: "active"
  };
  assert.equal(companyInput.safeParse(input).success, true);
  for (const invalid of [
    { ...input, website: "javascript:alert(1)" },
    { ...input, slug: "../another-company" },
    { ...input, color: "url(evil)" },
    { ...input, role: "admin" }
  ])
    assert.equal(companyInput.safeParse(invalid).success, false);
});
test("company mutation checks live authorization before database access", async () => {
  const service = new CompanyService({
    database: null as never,
    actor: "denied",
    authorize: async () => {
      throw AppError.forbidden("Denied");
    }
  });
  await assert.rejects(() => service.save({}), /Denied/);
});
test("all staff routes reject a missing trusted context", async () => {
  const app = await createApiApp({
    appName: "codexsun-tconnect-test",
    cookieSecret: "codexsun-test-secret-only-32-characters",
    corsOrigins: [],
    environment: "test"
  });
  await registerTconnect(app, async () => {
    throw AppError.forbidden("Trusted tenant context required.");
  });
  try {
    for (const resource of ["company", "association", "community", "inquiry"]) {
      const reply = await app.inject({ method: "GET", url: `/tconnect/${resource}` });
      assert.equal(reply.statusCode, 403);
      assert.equal(reply.json().success, false);
    }
  } finally {
    await app.close();
  }
});
