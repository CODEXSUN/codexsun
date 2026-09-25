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
import { MarketplaceRepository } from "../repository/marketplace.repository.js";
import { MarketplaceConflictError, MarketplaceService } from "../services/marketplace.service.js";

const context = { actorId: "manager-1", correlationId: "ffffffff-ffff-4fff-8fff-ffffffffffff" };
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
    { businessId: business.id, categoryId: catalog.categories[0]!.id, code: "MEAL", itemType: "food", name: "Meal" },
    context,
  );
  catalog = await menu.createPriceBook(
    { businessId: business.id, code: "STD", currency: "INR", name: "Standard" },
    context,
  );
  const item = catalog.items[0]!;
  const priceBook = catalog.priceBooks[0]!;
  await menu.setPrice(
    { amountMinor: 10_000, itemId: item.id, priceBookId: priceBook.id, validFrom: "2026-01-01" },
    business.id,
    context,
  );
  const availability = new MenuAvailabilityService(new MenuAvailabilityRepository(database), menu, activity, now);
  const campaigns = new MenuCampaignService(new MenuCampaignRepository(database), menu, activity);
  const saleability = new MenuSaleabilityService(new MenuSaleabilityRepository(database), availability, campaigns);
  const pos = new PosService(new PosRepository(database), menu, saleability, activity, now);
  const marketplace = new MarketplaceService(new MarketplaceRepository(database), activity, now);
  return { business, businessDay, database, item, location, marketplace, menu, pos, priceBook };
}

async function paidOrder(fixture: Awaited<ReturnType<typeof setup>>) {
  const { business, location, pos, priceBook } = fixture;
  const database = fixture.database;
  const activity = new ActivityRepository(database, now);
  const billing = new BillingService(new BillingRepository(database), pos, activity, now);
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
  await pos.addLine(order.id, { itemId: fixture.item.id, modifiers: [], quantity: 1 }, context);
  await pos.action(order.id, "confirm", undefined, context);
  await billing.createTaxRate({ basisPoints: 0, businessId: business.id, code: "ZERO", name: "Zero" }, context);
  const billed = await billing.postBill(order.id, context);
  const bill = billed.bills[0]!;
  const cash = billed.paymentMethods.find((method) => method.kind === "cash")!;
  const drawer = billed.drawers[0]!;
  const shiftId = await billing.openShift(
    { businessDayId: fixture.businessDay.id, drawerId: drawer.id, openingFloatMinor: 0 },
    context,
  );
  await billing.postPayment(
    bill.id,
    { amountMinor: bill.payable_minor, cashShiftId: shiftId, paymentMethodId: cash.id, status: "posted" },
    context,
  );
  return { bill, order };
}

test("partner collection and fee reconcile with the order and payment records", async () => {
  const fixture = await setup();
  const { business, location, marketplace } = fixture;
  const scope = { businessId: business.id, locationId: location.id };
  const partner = await marketplace.registerPartner(
    { adapterContract: "zomato.v1", businessId: business.id, code: "ZOMATO", name: "Zomato" },
    context,
  );
  const { bill, order } = await paidOrder(fixture);
  let state = await marketplace.intakeOrder(
    {
      ...scope,
      currency: "INR",
      lines: [{ partnerItemRef: "Z-MEAL", quantity: 1, unitPriceMinor: bill.payable_minor }],
      partnerId: partner.id,
      partnerOrderRef: "Z-5001",
      totalMinor: bill.payable_minor,
    },
    context,
  );
  const intakeId = state.intakes[0]!.id;
  await assert.rejects(marketplace.linkOrder(intakeId, order.id, context), MarketplaceConflictError);
  state = await marketplace.acceptIntake(intakeId, context);
  await assert.rejects(
    marketplace.recordFulfillment(
      intakeId,
      { partnerCollectedMinor: bill.payable_minor, partnerFeeMinor: 1_000 },
      context,
    ),
    MarketplaceConflictError,
  );
  state = await marketplace.linkOrder(intakeId, order.id, context);
  state = await marketplace.recordFulfillment(
    intakeId,
    { partnerCollectedMinor: bill.payable_minor, partnerFeeMinor: 1_000, riderRef: "R-12" },
    context,
  );
  assert.equal(state.fulfillments.length, 1);
  state = await marketplace.markPicked(intakeId, context);
  assert.equal(state.fulfillments[0]!.status, "picked");
  state = await marketplace.markDelivered(intakeId, context);
  assert.equal(state.fulfillments[0]!.status, "delivered");
  const report = await marketplace.reconcileIntake(intakeId);
  assert.equal(report.balanced, true);
  assert.equal(report.billStatus, "paid");
  assert.equal(report.billPaidMinor, bill.payable_minor);
  assert.equal(report.collectionVarianceMinor, 0);
  assert.equal(report.netMinor, bill.payable_minor - 1_000);
});

test("short collection reports a variance instead of balancing", async () => {
  const fixture = await setup();
  const { business, location, marketplace } = fixture;
  const scope = { businessId: business.id, locationId: location.id };
  const partner = await marketplace.registerPartner(
    { adapterContract: "swiggy.v1", businessId: business.id, code: "SWIGGY", name: "Swiggy" },
    context,
  );
  const { bill, order } = await paidOrder(fixture);
  await marketplace.intakeOrder(
    {
      ...scope,
      currency: "INR",
      lines: [{ partnerItemRef: "S-MEAL", quantity: 1, unitPriceMinor: bill.payable_minor }],
      partnerId: partner.id,
      partnerOrderRef: "S-9001",
      totalMinor: bill.payable_minor,
    },
    context,
  );
  const intakeId = (await marketplace.read(scope)).intakes[0]!.id;
  await marketplace.acceptIntake(intakeId, context);
  await marketplace.linkOrder(intakeId, order.id, context);
  await assert.rejects(
    marketplace.recordFulfillment(intakeId, { partnerCollectedMinor: 100, partnerFeeMinor: 200 }, context),
    MarketplaceConflictError,
  );
  await marketplace.recordFulfillment(
    intakeId,
    { partnerCollectedMinor: bill.payable_minor - 500, partnerFeeMinor: 100 },
    context,
  );
  const report = await marketplace.reconcileIntake(intakeId);
  assert.equal(report.balanced, false);
  assert.equal(report.collectionVarianceMinor, -500);
});
