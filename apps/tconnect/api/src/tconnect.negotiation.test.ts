import { MessageService } from "./modules/message/message.service.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import { quotationInput, quotationTotals } from "./modules/quotation/quotation.types.js";
import { conversationInput } from "./modules/conversation/conversation.types.js";
import { messageInput } from "./modules/message/message.types.js";
import { QuotationService } from "./modules/quotation/quotation.service.js";
import { ConversationService } from "./modules/conversation/conversation.service.js";
import type { TconnectContext } from "./context.js";
const input = {
  conversationUuid: "c0000001",
  quantity: 500,
  unit: "piece",
  unitPrice: 120.25,
  taxPercent: 5,
  shipping: 1000,
  deliveryDays: 14,
  validUntil: "2099-12-31",
  paymentTerms: "30% advance, balance before dispatch",
  notes: "180 GSM cotton"
};
const context: TconnectContext = {
  database: null as never,
  actor: "buyer@example.invalid",
  buyer: {
    uuid: "b0000001",
    name: "Buyer",
    email: "buyer@example.invalid",
    businessName: "Sourcing",
    city: "Tirupur",
    phone: "9999999999",
    status: "active"
  },
  authorize: async () => undefined
};
test("quotations reject forged prices, parties, source references and states", () => {
  assert.ok(quotationInput.safeParse(input).success);
  for (const extra of [
    { total: 1 },
    { currency: "USD" },
    { sellerUuid: "a0000001" },
    { buyerUuid: "a0000001" },
    { status: "accepted" },
    { requirementUuid: "a0000001" }
  ])
    assert.equal(quotationInput.safeParse({ ...input, ...extra }).success, false);
  for (const extra of [
    { quantity: 0 },
    { quantity: 1.0001 },
    { unitPrice: -1 },
    { unitPrice: 1.001 },
    { taxPercent: 101 },
    { shipping: 0.001 },
    { validUntil: "2026-02-30" },
    { deliveryDays: 1.5 }
  ])
    assert.equal(quotationInput.safeParse({ ...input, ...extra }).success, false);
});
test("server quotation totals use minor-unit rounding and bounded values", () => {
  assert.deepEqual(quotationTotals(input), {
    subtotal: 60125,
    taxAmount: 3006.25,
    total: 64131.25
  });
  assert.deepEqual(
    quotationTotals({ ...input, quantity: 0.333, unitPrice: 1, taxPercent: 5, shipping: 0 }),
    { subtotal: 0.33, taxAmount: 0.02, total: 0.35 }
  );
  assert.deepEqual(
    quotationTotals({ ...input, quantity: 0.5, unitPrice: 0.01, taxPercent: 0, shipping: 0 }),
    { subtotal: 0.01, taxAmount: 0, total: 0.01 }
  );
  assert.throws(
    () => quotationTotals({ ...input, quantity: 1000000, unitPrice: 1000000000 }),
    /must not exceed/
  );
});
test("only sellers can issue or withdraw quotations even with broad grants", async () => {
  await assert.rejects(
    () => new QuotationService(context).create(input),
    /Only a registered seller/
  );
  await assert.rejects(
    () => new QuotationService(context).withdraw("a0000001"),
    /Only a registered seller/
  );
  const staff = { ...context, buyer: null };
  await assert.rejects(() => new QuotationService(staff).list(), /registered buyer or seller/);
  await assert.rejects(() => new ConversationService(staff).list(), /registered buyer or seller/);
  await assert.rejects(
    () => new MessageService(staff).messages("c0000001"),
    /registered buyer or seller/
  );
  const dual = {
    ...context,
    member: {
      uuid: "a0000001",
      companyUuid: "c0000001",
      associationUuid: null,
      membershipStatus: "none"
    }
  };
  await assert.rejects(() => new ConversationService(dual).list(), /registered buyer or seller/);
});
test("conversation and message inputs cannot choose parties or impersonate sender", () => {
  assert.ok(conversationInput.safeParse({ requirementUuid: "a0000001" }).success);
  assert.equal(conversationInput.safeParse({}).success, false);
  assert.equal(
    conversationInput.safeParse({ requirementUuid: "a0000001", inquiryUuid: "b0000001" }).success,
    false
  );
  assert.equal(
    conversationInput.safeParse({ requirementUuid: "a0000001", companyUuid: "c0000001" }).success,
    false
  );
  assert.ok(messageInput.safeParse({ body: "Please confirm the delivery date." }).success);
  assert.equal(messageInput.safeParse({ body: " " }).success, false);
  assert.equal(messageInput.safeParse({ body: "x".repeat(4001) }).success, false);
  assert.equal(messageInput.safeParse({ body: "Hello", senderSide: "seller" }).success, false);
});
test("buyers cannot introduce arbitrary sellers into requirement conversations", async () => {
  await assert.rejects(
    () => new ConversationService(context).open({ requirementUuid: "a0000001" }),
    /seller starts/
  );
});
