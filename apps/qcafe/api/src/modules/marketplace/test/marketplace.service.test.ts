import assert from "node:assert/strict";
import test from "node:test";
import { ActivityRepository } from "../../foundation/repository/activity.repository.js";
import { createQcafePersistence } from "../../foundation/persistence/qcafe-persistence.js";
import { FoundationSetupRepository } from "../../foundation/repository/foundation-setup.repository.js";
import { FoundationSetupService } from "../../foundation/services/foundation-setup.service.js";
import { MenuRepository } from "../../menu/repository/menu.repository.js";
import { MenuService } from "../../menu/services/menu.service.js";
import { createQcafeLifecyclePlans } from "../../../qcafe-lifecycle-plans.js";
import { MarketplaceRepository } from "../repository/marketplace.repository.js";
import { MarketplaceConflictError, MarketplaceService } from "../services/marketplace.service.js";

const context = { actorId: "manager-1", correlationId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee" };
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
  const created = await foundation.createBusiness(
    {
      businessName: "Q Cafe",
      currency: "INR",
      locationCode: "MAIN",
      locationName: "Main outlet",
      timezone: "Asia/Calcutta",
    },
    context,
  );
  const business = created.businesses[0]!;
  const location = business.locations[0]!;
  const menu = new MenuService(new MenuRepository(database), activity, now);
  let catalog = await menu.createCategory(
    { businessId: business.id, code: "FOOD", name: "Food", sortOrder: 1 },
    context,
  );
  catalog = await menu.createItem(
    { businessId: business.id, categoryId: catalog.categories[0]!.id, code: "MEAL", itemType: "food", name: "Meal" },
    context,
  );
  const item = catalog.items[0]!;
  const marketplace = new MarketplaceService(new MarketplaceRepository(database), activity, now);
  return { business, item, location, marketplace };
}

test("partner intake is idempotent and maps catalog items", async () => {
  const { business, item, location, marketplace } = await setup();
  const scope = { businessId: business.id, locationId: location.id };
  const partner = await marketplace.registerPartner(
    { adapterContract: "zomato.v1", businessId: business.id, code: "ZOMATO", name: "Zomato" },
    context,
  );
  await marketplace.mapMenuItem(
    { ...scope, menuItemId: item.id, partnerId: partner.id, partnerItemRef: "Z-MEAL" },
    context,
  );
  const order = {
    ...scope,
    currency: "INR",
    idempotencyKey: "zom-1",
    lines: [{ partnerItemRef: "Z-MEAL", quantity: 2, unitPriceMinor: 12_500 }],
    partnerId: partner.id,
    partnerOrderRef: "Z-1001",
    totalMinor: 25_000,
  };
  let state = await marketplace.intakeOrder(order, context);
  assert.equal(state.intakes.length, 1);
  assert.equal(state.intakeLines.length, 1);
  assert.ok(state.intakeLines[0]!.mapping_id);
  assert.equal(state.events.length, 1);
  assert.equal(state.events[0]!.event_type, "received");
  state = await marketplace.intakeOrder(order, context);
  assert.equal(state.intakes.length, 1);
  assert.equal(state.intakeLines.length, 1);
  state = await marketplace.acceptIntake(state.intakes[0]!.id, context);
  assert.equal(state.intakes[0]!.status, "accepted");
  await assert.rejects(marketplace.acceptIntake(state.intakes[0]!.id, context), MarketplaceConflictError);
});

test("unofficial adapters, suspended partners, and unbalanced settlements fail", async () => {
  const { business, item, location, marketplace } = await setup();
  const scope = { businessId: business.id, locationId: location.id };
  await assert.rejects(
    marketplace.registerPartner(
      { adapterContract: "random.v9", businessId: business.id, code: "RND", name: "Random" },
      context,
    ),
    Error,
  );
  const partner = await marketplace.registerPartner(
    { adapterContract: "swiggy.v1", businessId: business.id, code: "SWIGGY", name: "Swiggy" },
    context,
  );
  await marketplace.suspendPartner(partner.id, context);
  await assert.rejects(
    marketplace.intakeOrder(
      {
        ...scope,
        currency: "INR",
        lines: [{ partnerItemRef: "S-X", quantity: 1, unitPriceMinor: 100 }],
        partnerId: partner.id,
        partnerOrderRef: "S-1",
        totalMinor: 100,
      },
      context,
    ),
    MarketplaceConflictError,
  );
  await marketplace.reactivatePartner(partner.id, context);
  const state = await marketplace.intakeOrder(
    {
      ...scope,
      currency: "INR",
      lines: [{ partnerItemRef: "S-X", quantity: 1, unitPriceMinor: 100 }],
      partnerId: partner.id,
      partnerOrderRef: "S-1",
      totalMinor: 100,
    },
    context,
  );
  assert.equal(state.events[0]!.event_type, "received.unmapped-lines");
  await assert.rejects(
    marketplace.recordSettlement(
      {
        ...scope,
        feeMinor: 200,
        grossMinor: 100,
        partnerId: partner.id,
        periodFrom: "2026-09-01",
        periodTo: "2026-09-07",
      },
      context,
    ),
    MarketplaceConflictError,
  );
  const settlement = await marketplace.recordSettlement(
    {
      ...scope,
      feeMinor: 100,
      grossMinor: 1_000,
      partnerId: partner.id,
      periodFrom: "2026-09-01",
      periodTo: "2026-09-07",
    },
    context,
  );
  await marketplace.postSettlement(settlement.id, context);
  await assert.rejects(marketplace.postSettlement(settlement.id, context), MarketplaceConflictError);
  assert.equal(item.id.length, 36);
});
