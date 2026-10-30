import { test } from "node:test";
import assert from "node:assert/strict";
import { buyerRegistration } from "./modules/buyer/buyer.types.js";
import { buyerInquiryInput } from "./modules/inquiry/inquiry.types.js";
import { requirementInput } from "./modules/requirement/requirement.types.js";
import { CompanyService } from "./modules/company/company.service.js";
import { ProductService } from "./modules/product/product.service.js";
import { InquiryService } from "./modules/inquiry/inquiry.service.js";
import { MemberService } from "./modules/member/member.service.js";
import { RequirementService } from "./modules/requirement/requirement.service.js";
import { BuyerService } from "./modules/buyer/buyer.service.js";
import type { TconnectContext } from "./context.js";
const buyer = {
  uuid: "b0000001",
  name: "Test Buyer",
  email: "buyer@example.invalid",
  businessName: "Test Sourcing",
  city: "Tirupur",
  phone: "9999999999",
  status: "active" as const
};
const context: TconnectContext = {
  database: null as never,
  actor: buyer.email,
  buyer,
  authorize: async () => undefined
};
test("buyer registration rejects role, owner, seller and tenant injection", () => {
  const input = {
    corporateId: "CODEXSUN",
    name: buyer.name,
    email: buyer.email,
    password: "A-long-test-password!",
    businessName: buyer.businessName,
    city: buyer.city,
    phone: buyer.phone,
    consent: true
  };
  assert.ok(buyerRegistration.safeParse(input).success);
  for (const extra of [
    { roleId: 1 },
    { userUuid: "a0000001" },
    { companyUuid: "c0000001" },
    { buyerUuid: "b0000002" },
    { tenantDb: "foreign" },
    { accountType: "seller" }
  ])
    assert.equal(buyerRegistration.safeParse({ ...input, ...extra }).success, false);
});
test("buyers cannot use seller or staff capabilities even with a permissive adapter", async () => {
  await assert.rejects(() => new CompanyService(context).save({}), /Seller access/);
  await assert.rejects(() => new CompanyService(context).list(false), /Seller access/);
  await assert.rejects(() => new ProductService(context).save({}), /Seller access/);
  await assert.rejects(() => new ProductService(context).list(), /Seller access/);
  await assert.rejects(() => new InquiryService(context).list(), /Seller inbox/);
  await assert.rejects(
    () => new InquiryService(context).setStatus("a0000001", "closed"),
    /Seller inbox/
  );
  await assert.rejects(
    () => new MemberService(context).review("a0000001", "approved", "active"),
    /staff access/
  );
  await assert.rejects(() => new RequirementService(context).board(), /Seller access/);
});
test("seller or staff cannot use buyer workspace without a buyer mapping", async () => {
  const staff = { ...context, buyer: null };
  await assert.rejects(() => new BuyerService(staff).session(), /buyer account/);
  await assert.rejects(() => new RequirementService(staff).save({}), /buyer account/);
  await assert.rejects(() => new InquiryService(staff).sent(), /buyer account/);
  await assert.rejects(() => new ProductService(staff).search("cotton"), /Buyer access/);
});
test("buyer enquiry derives identity and ownership from session", () => {
  const input = {
    companyUuid: "c0000001",
    phone: buyer.phone,
    requirement: "Please provide a quote for organic cotton fabric.",
    quantity: "500 kg",
    consent: true
  };
  assert.ok(buyerInquiryInput.safeParse(input).success);
  for (const extra of [
    { buyerUuid: buyer.uuid },
    { email: "spoof@example.invalid" },
    { buyerName: "Spoof" },
    { status: "closed" },
    { productUuid: "invalid" },
    { requirementUuid: "invalid" }
  ])
    assert.equal(buyerInquiryInput.safeParse({ ...input, ...extra }).success, false);
});
test("requirements accept visibility states but reject caller-selected ownership", () => {
  const input = {
    title: "Organic cotton fabric",
    category: "Textiles",
    description: "Need certified organic cotton fabric with consistent colour.",
    quantity: "500 kg",
    deliveryCity: "Tirupur",
    budget: 100000,
    status: "open"
  };
  assert.ok(requirementInput.safeParse(input).success);
  assert.equal(requirementInput.safeParse({ ...input, buyerUuid: "b0000002" }).success, false);
  assert.equal(requirementInput.safeParse({ ...input, status: "approved" }).success, false);
});
