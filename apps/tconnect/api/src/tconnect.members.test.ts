import { test } from "node:test";
import assert from "node:assert/strict";
import { memberRegistration } from "./modules/member/member.types.js";
import { CompanyService } from "./modules/company/company.service.js";
import { ProductService } from "./modules/product/product.service.js";
import { MemberService } from "./modules/member/member.service.js";
import { brandImage } from "./modules/company/company.branding.js";
import type { TconnectContext } from "./context.js";
import { CredentialService } from "./modules/credential/credential.service.js";
import { credentialInput } from "./modules/credential/credential.types.js";
const registration = {
  corporateId: "CODEXSUN",
  name: "Test Seller",
  email: "seller@example.invalid",
  password: "A-long-test-password!",
  companyName: "Test Company",
  industry: "Engineering",
  city: "Tirupur",
  accountType: "seller",
  associationUuid: null,
  consent: true
};
const context: TconnectContext = {
  database: null as never,
  actor: "seller@example.invalid",
  member: {
    uuid: "a1234567",
    companyUuid: "b1234567",
    associationUuid: null,
    membershipStatus: "pending"
  },
  authorize: async () => undefined
};
test("portal members cannot review credentials even with a permissive permission adapter", async () => {
  const service = new CredentialService(context);
  await assert.rejects(service.list(), /authorized staff/);
  await assert.rejects(service.save({}), /authorized staff/);
  const buyer = new CredentialService({
    ...context,
    member: null,
    buyer: {
      uuid: "b1234567",
      name: "Fixture buyer",
      email: "buyer@example.invalid",
      businessName: "Fixture business",
      city: "Tirupur",
      phone: "",
      status: "active"
    }
  });
  await assert.rejects(buyer.list(), /authorized staff/);
  await assert.rejects(buyer.save({}), /authorized staff/);
});
test("credential evidence rejects invalid dates, unsafe URLs and caller-selected review identity", () => {
  const input = {
    companyUuid: "b1234567",
    kind: "certification",
    standardName: "Fixture standard",
    issuer: "Fixture issuer",
    reference: "reference",
    scope: "Fixture evidence scope",
    publicEvidenceUrl: "https://example.invalid/evidence",
    expiresOn: "2099-12-31",
    privateNotes: "",
    status: "pending"
  };
  assert(credentialInput.safeParse(input).success);
  for (const patch of [
    { expiresOn: "2026-02-31" },
    { publicEvidenceUrl: "javascript:alert(1)" },
    { publicEvidenceUrl: "https://user:secret@example.invalid/evidence" },
    { reviewedBy: "forged" },
    { reviewedAt: "2099-01-01" }
  ])
    assert.equal(credentialInput.safeParse({ ...input, ...patch }).success, false);
});
const company = {
  name: "Test Company",
  slug: "test-company",
  tagline: "Test",
  description: "A company profile for ownership verification.",
  industry: "Engineering",
  city: "Tirupur",
  color: "#285d4c",
  initials: "TC",
  role: "supplier",
  products: "Parts",
  capacity: "",
  established: 2026,
  associationUuid: null,
  website: "",
  logoDataUrl: "",
  status: "active"
};
test("registration cannot choose an existing company, identity, role, or approval status", () => {
  assert.equal(memberRegistration.safeParse(registration).success, true);
  for (const extra of [
    { companyUuid: "b0000001" },
    { userUuid: "a0000001" },
    { roleId: 1 },
    { membershipStatus: "approved" },
    { tenantDb: "other" }
  ])
    assert.equal(memberRegistration.safeParse({ ...registration, ...extra }).success, false);
  assert.equal(
    memberRegistration.safeParse({ ...registration, associationUuid: "a0000001" }).success,
    false
  );
  assert.equal(
    memberRegistration.safeParse({ ...registration, accountType: "association-member" }).success,
    false
  );
  assert.equal(
    memberRegistration.safeParse({
      ...registration,
      accountType: "association-member",
      associationUuid: "a0000001"
    }).success,
    true
  );
});
test("company ownership and affiliation cannot be bypassed even with a permissive permission adapter", async () => {
  const service = new CompanyService(context);
  await assert.rejects(() => service.save(company, "b0000001"), /only your own company/);
  await assert.rejects(
    () => service.save({ ...company, associationUuid: "a0000001" }, "b1234567"),
    /approval/
  );
});
test("product ownership rejects foreign target companies before database writes", async () => {
  const service = new ProductService(context);
  await assert.rejects(() => service.list("b0000001"), /own products/);
  await assert.rejects(
    () =>
      service.save({
        companyUuid: "b0000001",
        name: "Parts",
        category: "Engineering",
        description: "A sample product for a test request.",
        price: 100,
        unit: "piece",
        minimumOrder: "100 pieces",
        imageDataUrl: "",
        status: "active"
      }),
    /own products/
  );
});
test("member cannot review other accounts even when an adapter grants a broad permission", async () => {
  const service = new MemberService(context);
  await assert.rejects(() => service.list(), /staff access/);
  await assert.rejects(() => service.review("a0000001", "approved", "active"), /staff access/);
});
test("branding excludes SVG, executable URLs, spoofed MIME types and oversized images", () => {
  for (const value of [
    "javascript:alert(1)",
    "https://example.invalid/logo.svg",
    "data:image/svg+xml;base64,PHN2Zy8+",
    "data:image/png;base64,PHN2Zy8+",
    `data:image/png;base64,${"A".repeat(220000)}`
  ])
    assert.equal(brandImage.safeParse(value).success, false);
  assert.equal(brandImage.safeParse("").success, true);
});
