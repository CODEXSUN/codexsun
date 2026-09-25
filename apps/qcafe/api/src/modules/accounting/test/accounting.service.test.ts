import assert from "node:assert/strict";
import test from "node:test";
import { ActivityRepository } from "../../foundation/repository/activity.repository.js";
import { createQcafePersistence } from "../../foundation/persistence/qcafe-persistence.js";
import { FoundationSetupRepository } from "../../foundation/repository/foundation-setup.repository.js";
import { FoundationSetupService } from "../../foundation/services/foundation-setup.service.js";
import { MenuAvailabilityRepository } from "../../menu/repository/menu-availability.repository.js";
import { MenuCampaignRepository } from "../../menu/repository/menu-campaign.repository.js";
import { MenuRepository } from "../../menu/repository/menu.repository.js";
import { MenuAvailabilityService } from "../../menu/services/menu-availability.service.js";
import { MenuCampaignService } from "../../menu/services/menu-campaign.service.js";
import { MenuSaleabilityRepository } from "../../menu/repository/menu-saleability.repository.js";
import { MenuSaleabilityService } from "../../menu/services/menu-saleability.service.js";
import { MenuService } from "../../menu/services/menu.service.js";
import { PosRepository } from "../../pos/repository/pos.repository.js";
import { PosService } from "../../pos/services/pos.service.js";
import { BillingRepository } from "../../billing/repository/billing.repository.js";
import { BillingService } from "../../billing/services/billing.service.js";
import { createQcafeLifecyclePlans } from "../../../qcafe-lifecycle-plans.js";
import { AccountingRepository } from "../repository/accounting.repository.js";
import { AccountingConflictError, AccountingService } from "../services/accounting.service.js";

const context = { actorId: "manager-1", correlationId: "11111111-2222-4333-8444-555555555555" };
const now = () => new Date("2026-09-24T12:00:00.000Z");

async function setup() {
  const persistence = createQcafePersistence(
    { localDatabasePath: ":memory:", mode: "local" },
    createQcafeLifecyclePlans(),
  );
  await persistence.initialize();
  const database = persistence.database();
  const activity = new ActivityRepository(database, now);
  const foundation = new FoundationSetupService(
    new FoundationSetupRepository(database),
    { localDatabasePath: ":memory:", mode: "local" },
    activity,
    now,
  );
  let setupState = await foundation.createBusiness(
    {
      businessName: "Q Cafe",
      currency: "INR",
      locationCode: "MAIN",
      locationName: "Main outlet",
      timezone: "Asia/Calcutta",
    },
    context,
  );
  const business = setupState.businesses[0]!;
  const location = business.locations[0]!;
  setupState = await foundation.openBusinessDay(location.id, "2026-09-24", context);
  const businessDay = setupState.businesses[0]!.locations[0]!.businessDay!;
  await persistence.initialize();
  const menu = new MenuService(new MenuRepository(database), activity, now);
  let catalog = await menu.createCategory(
    { businessId: business.id, code: "FOOD", name: "Food", sortOrder: 1 },
    context,
  );
  catalog = await menu.createItem(
    {
      businessId: business.id,
      categoryId: catalog.categories[0]!.id,
      code: "MEAL",
      itemType: "food",
      name: "Meal",
      taxCode: "GST5",
    },
    context,
  );
  catalog = await menu.createPriceBook(
    { businessId: business.id, code: "STD", currency: "INR", name: "Standard" },
    context,
  );
  const item = catalog.items[0]!;
  const priceBook = catalog.priceBooks[0]!;
  await menu.setPrice(
    { amountMinor: 10_500, itemId: item.id, priceBookId: priceBook.id, validFrom: "2026-01-01" },
    business.id,
    context,
  );
  const availability = new MenuAvailabilityService(new MenuAvailabilityRepository(database), menu, activity, now);
  const campaigns = new MenuCampaignService(new MenuCampaignRepository(database), menu, activity);
  const saleability = new MenuSaleabilityService(new MenuSaleabilityRepository(database), availability, campaigns);
  const pos = new PosService(new PosRepository(database), menu, saleability, activity, now);
  const billing = new BillingService(new BillingRepository(database), pos, activity, now);
  const accounting = new AccountingService(new AccountingRepository(database), activity, now);
  return { accounting, billing, business, businessDay, item, location, pos, priceBook };
}

async function paidBill(fixture: Awaited<ReturnType<typeof setup>>) {
  const { billing, business, businessDay, item, location, pos, priceBook } = fixture;
  const takeaway = location.serviceChannels.find((channel) => channel.kind === "takeaway")!;
  const orders = await pos.create(
    {
      businessId: business.id,
      collectionName: "Partner",
      locationId: location.id,
      priceBookId: priceBook.id,
      serviceChannelId: takeaway.id,
    },
    context,
  );
  const order = orders.orders[0]!;
  await pos.addLine(order.id, { itemId: item.id, modifiers: [], quantity: 1 }, context);
  await pos.action(order.id, "confirm", undefined, context);
  await billing.createTaxRate({ basisPoints: 500, businessId: business.id, code: "GST5", name: "GST 5%" }, context);
  const billed = await billing.postBill(order.id, context);
  const bill = billed.bills[0]!;
  const cash = billed.paymentMethods.find((method) => method.kind === "cash")!;
  const drawer = billed.drawers[0]!;
  const shiftId = await billing.openShift(
    { businessDayId: businessDay.id, drawerId: drawer.id, openingFloatMinor: 0 },
    context,
  );
  await billing.postPayment(
    bill.id,
    { amountMinor: bill.payable_minor, cashShiftId: shiftId, paymentMethodId: cash.id, status: "posted" },
    context,
  );
  const paid = (await billing.read({ businessId: business.id, locationId: location.id })).payments.find(
    (payment) => payment.bill_id === bill.id && payment.direction === "in",
  )!;
  return { bill, payment: paid };
}

function balanceOf(lines: ReadonlyArray<{ credit_minor: number; debit_minor: number }>) {
  const debit = lines.reduce((sum, line) => sum + line.debit_minor, 0);
  const credit = lines.reduce((sum, line) => sum + line.credit_minor, 0);
  return { credit, debit };
}

test("bill and payment journals balance and link their source documents", async () => {
  const fixture = await setup();
  const { accounting, business, location } = fixture;
  const scope = { businessId: business.id, locationId: location.id };
  const { bill, payment } = await paidBill(fixture);
  const billJournal = await accounting.generate("bill", bill.id, context);
  let state = await accounting.read(scope);
  assert.equal(state.accounts.length, 8);
  assert.deepEqual(state.accounts.map((account) => account.code).sort(), [
    "1000",
    "1010",
    "1020",
    "1030",
    "1100",
    "2000",
    "4000",
    "4010",
  ]);
  const billLines = state.journalLines.filter((line) => line.journal_id === billJournal.id);
  const billBalance = balanceOf(billLines);
  assert.ok(billBalance.debit > 0 && billBalance.debit === billBalance.credit);
  assert.ok(billLines.some((line) => line.tax_code === null));
  assert.equal(state.journals.find((journal) => journal.id === billJournal.id)!.status, "draft");
  assert.equal(state.journals.find((journal) => journal.id === billJournal.id)!.number, "J-000001");

  const paymentJournal = await accounting.generate("payment", payment.id, context);
  state = await accounting.read(scope);
  const paymentLines = state.journalLines.filter((line) => line.journal_id === paymentJournal.id);
  const paymentBalance = balanceOf(paymentLines);
  assert.ok(paymentBalance.debit === bill.payable_minor && paymentBalance.debit === paymentBalance.credit);
  assert.equal(state.journals.find((journal) => journal.id === paymentJournal.id)!.number, "J-000002");

  const replay = await accounting.generate("bill", bill.id, context);
  assert.equal(replay.id, billJournal.id);

  await accounting.postJournal(billJournal.id, context);
  await accounting.postJournal(paymentJournal.id, context);
  await assert.rejects(accounting.postJournal(billJournal.id, context), AccountingConflictError);
  const exported = await accounting.exportCsv(scope, "posted", undefined, undefined);
  assert.equal(exported.journals, 2);
  assert.ok(exported.csv.includes("J-000001") && exported.csv.includes("J-000002"));
  assert.ok(exported.csv.includes("4000") && exported.csv.includes("2000") && exported.csv.includes("1000"));
});

test("refunds, advances, and voucher applications journal without silent postings", async () => {
  const fixture = await setup();
  const { accounting, billing, business, location, pos, priceBook, item } = fixture;
  const scope = { businessId: business.id, locationId: location.id };
  const { payment } = await paidBill(fixture);
  await billing.refund(payment.id, 1_000, "Guest complaint", context);
  const refundPayment = (await billing.read(scope)).payments.find((row) => row.direction === "out")!;
  const refundJournal = await accounting.generate("refund", refundPayment.id, context);
  let state = await accounting.read(scope);
  const refundBalance = balanceOf(state.journalLines.filter((line) => line.journal_id === refundJournal.id));
  assert.ok(refundBalance.debit === 1_000 && refundBalance.debit === refundBalance.credit);

  const card = (await billing.read(scope)).paymentMethods.find((method) => method.kind === "card")!;
  const voucherState = await billing.issueVoucher(
    {
      amountMinor: 2_000,
      businessId: business.id,
      customerRef: "C-1",
      locationId: location.id,
      paymentMethodId: card.id,
    },
    context,
  );
  const advance = voucherState.payments.find((row) => row.purpose === "advance")!;
  const issueJournal = await accounting.generate("voucher-issue", advance.id, context);
  state = await accounting.read(scope);
  assert.ok(balanceOf(state.journalLines.filter((line) => line.journal_id === issueJournal.id)).debit === 2_000);

  const takeaway = location.serviceChannels.find((channel) => channel.kind === "takeaway")!;
  const beforeIds = new Set(
    (await pos.read({ businessId: business.id, locationId: location.id })).orders.map((row) => row.id),
  );
  await pos.create(
    {
      businessId: business.id,
      collectionName: "Voucher",
      locationId: location.id,
      priceBookId: priceBook.id,
      serviceChannelId: takeaway.id,
    },
    context,
  );
  const secondOrder = (await pos.read({ businessId: business.id, locationId: location.id })).orders.find(
    (row) => !beforeIds.has(row.id),
  )!;
  await pos.addLine(secondOrder.id, { itemId: item.id, modifiers: [], quantity: 1 }, context);
  await pos.action(secondOrder.id, "confirm", undefined, context);
  const secondBill = (await billing.postBill(secondOrder.id, context)).bills.find(
    (row) => row.order_id === secondOrder.id,
  )!;
  await billing.applyVoucher(voucherState.vouchers[0]!.id, secondBill.id, 2_000, context);
  const applyRow = (await billing.read(scope)).voucherApplications[0]!;
  const applyJournal = await accounting.generate("voucher-apply", applyRow.id, context);
  state = await accounting.read(scope);
  const applyLines = state.journalLines.filter((line) => line.journal_id === applyJournal.id);
  const applyBalance = balanceOf(applyLines);
  assert.ok(applyBalance.debit === 2_000 && applyBalance.debit === applyBalance.credit);

  await assert.rejects(accounting.generate("payment", advance.id, context), AccountingConflictError);
  await assert.rejects(
    accounting.generate("bill", "00000000-0000-4000-8000-000000000000", context),
    AccountingConflictError,
  );
});
