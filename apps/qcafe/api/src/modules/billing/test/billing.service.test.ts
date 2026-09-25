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
import { createQcafeLifecyclePlans, lifecycleDescriptorTotal } from "../../../qcafe-lifecycle-plans.js";
import { postPaymentSchema } from "../contracts/billing.contract.js";
import { BillingRepository } from "../repository/billing.repository.js";
import { BillingConflictError, BillingService } from "../services/billing.service.js";

const context = { actorId: "cashier-1", correlationId: "44444444-4444-4444-8444-444444444444" };
const now = () => new Date("2026-09-20T12:00:00.000Z");

test("reconciles a paid parcel, failed tender recovery, voucher, refund, and cash settlement", async () => {
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
  let setup = await foundation.createBusiness(
    {
      businessName: "Q Cafe",
      currency: "INR",
      locationCode: "MAIN",
      locationName: "Main outlet",
      timezone: "Asia/Calcutta",
    },
    context,
  );
  const business = setup.businesses[0]!;
  const location = business.locations[0]!;
  setup = await foundation.openBusinessDay(location.id, "2026-09-20", context);
  const businessDay = setup.businesses[0]!.locations[0]!.businessDay!;
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
      code: "PARCEL",
      itemType: "food",
      name: "Parcel meal",
      taxCode: "GST5",
    },
    context,
  );
  catalog = await menu.createPriceBook(
    { businessId: business.id, code: "STANDARD", currency: "INR", name: "Standard" },
    context,
  );
  const item = catalog.items[0]!;
  const priceBook = catalog.priceBooks[0]!;
  await menu.setPrice(
    { amountMinor: 12_500, itemId: item.id, priceBookId: priceBook.id, validFrom: "2026-01-01" },
    business.id,
    context,
  );
  const availability = new MenuAvailabilityService(new MenuAvailabilityRepository(database), menu, activity, now);
  const campaigns = new MenuCampaignService(new MenuCampaignRepository(database), menu, activity);
  const saleability = new MenuSaleabilityService(new MenuSaleabilityRepository(database), availability, campaigns);
  const pos = new PosService(new PosRepository(database), menu, saleability, activity, now);
  const takeaway = location.serviceChannels.find((channel) => channel.kind === "takeaway")!;
  const orders = await pos.create(
    {
      businessId: business.id,
      collectionName: "Ravi",
      locationId: location.id,
      priceBookId: priceBook.id,
      serviceChannelId: takeaway.id,
    },
    context,
  );
  const order = orders.orders[0]!;
  await pos.addLine(order.id, { itemId: item.id, modifiers: [], quantity: 1 }, context);
  await pos.adjust(order.id, { amountMinor: 500, kind: "discount", reason: "Approved offer" }, context);
  await pos.action(order.id, "confirm", undefined, context);

  const repository = new BillingRepository(database);
  const billing = new BillingService(repository, pos, activity, now);
  await billing.createTaxRate({ basisPoints: 500, businessId: business.id, code: "GST5", name: "GST 5%" }, context);
  let state = await billing.postBill(order.id, context);
  const bill = state.bills[0]!;
  assert.equal(bill.payable_minor, 12_000);
  assert.equal(state.billLines[0]!.tax_minor, 571);
  assert.equal(state.billLines[0]!.total_minor, 12_000);

  const cash = state.paymentMethods.find((method) => method.kind === "cash")!;
  const card = state.paymentMethods.find((method) => method.kind === "card")!;
  const drawer = state.drawers[0]!;
  const shiftId = await billing.openShift(
    { businessDayId: businessDay.id, drawerId: drawer.id, openingFloatMinor: 1_000 },
    context,
  );
  state = await billing.postPayment(
    bill.id,
    {
      amountMinor: 2_000,
      failureReason: "Issuer declined",
      paymentMethodId: card.id,
      status: "failed",
    },
    context,
  );
  assert.equal(state.bills[0]!.balance_minor, 12_000);
  assert.equal(state.receipts.length, 0);
  state = await billing.postPayment(
    bill.id,
    { amountMinor: 5_000, cashShiftId: shiftId, paymentMethodId: cash.id, receivedMinor: 6_000, status: "posted" },
    context,
  );
  state = await billing.postPayment(
    bill.id,
    { amountMinor: 7_000, maskedReference: "****4242", paymentMethodId: card.id, status: "posted" },
    context,
  );
  assert.equal(state.bills[0]!.status, "paid");
  assert.equal(state.bills[0]!.balance_minor, 0);
  assert.equal(state.receipts.length, 2);
  assert.equal(
    state.tenderDetails.find(
      (detail) =>
        detail.payment_id ===
        state.payments.find((payment) => payment.payment_method_id === cash.id && payment.status === "posted")!.id,
    )!.change_minor,
    1_000,
  );
  await billing.assertOrderSettled(order.id);

  state = await billing.issueVoucher(
    {
      amountMinor: 2_000,
      businessId: business.id,
      customerRef: "customer-ravi",
      locationId: location.id,
      paymentMethodId: card.id,
      providerReference: "advance-001",
    },
    context,
  );
  const voucher = state.vouchers[0]!;
  const cardSale = state.payments.find(
    (payment) => payment.bill_id === bill.id && payment.payment_method_id === card.id && payment.status === "posted",
  )!;
  state = await billing.refund(cardSale.id, 1_000, "Price correction", context);
  assert.equal(state.bills[0]!.status, "part_paid");
  state = await billing.applyVoucher(voucher.id, bill.id, 1_000, context);
  assert.equal(state.bills[0]!.status, "paid");
  assert.equal(state.vouchers[0]!.remaining_value_minor, 1_000);
  assert.equal(state.refunds.length, 1);
  assert.equal((await repository.payment(cardSale.id))!.amount_minor, 7_000);
  state = await billing.reverse(cardSale.id, "Void remaining card tender", context);
  assert.equal(state.bills[0]!.balance_minor, 6_000);
  assert.equal(state.payments.find((payment) => payment.purpose === "reversal")!.amount_minor, 6_000);
  state = await billing.postPayment(
    bill.id,
    { amountMinor: 6_000, maskedReference: "****9191", paymentMethodId: card.id, status: "posted" },
    context,
  );
  assert.equal(state.bills[0]!.status, "paid");

  await assert.rejects(
    () => billing.settleShift(shiftId, { countedMinor: 5_900 }, context),
    (error: unknown) => error instanceof BillingConflictError && /variance/.test(error.message),
  );
  await assert.rejects(
    () => billing.closeDay(businessDay.id, context),
    (error: unknown) => error instanceof BillingConflictError && /cash shift/.test(error.message),
  );
  await billing.settleShift(
    shiftId,
    { approvedBy: "manager-1", countedMinor: 5_900, varianceReason: "Till count short" },
    context,
  );
  await billing.closeDay(businessDay.id, context);
  state = await billing.read({ businessId: business.id, locationId: location.id });
  assert.equal(state.settlements[0]!.expected_minor, 6_000);
  assert.equal(state.settlements[0]!.variance_minor, -100);
  assert.equal(state.dayCloses[0]!.sales_minor, 12_000);
  assert.equal(state.dayCloses[0]!.payments_minor, 18_000);
  assert.equal(state.dayCloses[0]!.refunds_minor, 7_000);
  assert.throws(() =>
    postPaymentSchema.parse({ amountMinor: 100, maskedReference: "4242424242424242", paymentMethodId: card.id }),
  );
  assert.equal((await persistence.verify()).length, lifecycleDescriptorTotal());
  await persistence.destroy();
});
