import assert from "node:assert/strict";
import test from "node:test";
import { ActivityRepository } from "../../foundation/repository/activity.repository.js";
import { createQcafePersistence } from "../../foundation/persistence/qcafe-persistence.js";
import { FoundationSetupRepository } from "../../foundation/repository/foundation-setup.repository.js";
import { FoundationSetupService } from "../../foundation/services/foundation-setup.service.js";
import { MenuRepository } from "../../menu/repository/menu.repository.js";
import { MenuService } from "../../menu/services/menu.service.js";
import { createQcafeLifecyclePlans } from "../../../qcafe-lifecycle-plans.js";
import { InventoryRepository } from "../repository/inventory.repository.js";
import { InventoryConflictError, InventoryService } from "../services/inventory.service.js";

const context = { actorId: "manager-1", correlationId: "77777777-7777-4777-8777-777777777777" };
const now = () => new Date("2026-09-24T12:00:00.000Z");

async function setup() {
  const persistence = createQcafePersistence({ localDatabasePath: ":memory:", mode: "local" }, createQcafeLifecyclePlans());
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
  let catalog = await menu.createCategory({ businessId: business.id, code: "FOOD", name: "Food", sortOrder: 1 }, context);
  catalog = await menu.createItem(
    { businessId: business.id, categoryId: catalog.categories[0]!.id, code: "MEAL", itemType: "food", name: "Meal" },
    context,
  );
  const item = catalog.items[0]!;
  const inventory = new InventoryService(new InventoryRepository(database), activity, now);
  return { business, inventory, item, location };
}

test("plans daily lines with an identified demand source", async () => {
  const { business, inventory, item, location } = await setup();
  const scope = { businessId: business.id, locationId: location.id };
  const plan = await inventory.createDailyPlan({ ...scope, note: "Weekday service", planDate: "2026-10-01" }, context);
  let state = await inventory.addDailyPlanLine(
    plan.id,
    { demandSource: "regular", menuItemId: item.id, quantityMilli: 50_000 },
    context,
  );
  state = await inventory.addDailyPlanLine(
    plan.id,
    { demandRef: "EVT-101", demandSource: "event", menuItemId: item.id, quantityMilli: 20_000 },
    context,
  );
  state = await inventory.addDailyPlanLine(
    plan.id,
    { demandRef: "BK-77", demandSource: "booking", menuItemId: item.id, quantityMilli: 5_000 },
    context,
  );
  state = await inventory.addDailyPlanLine(
    plan.id,
    { demandRef: "CMP-DIWALI", demandSource: "special", menuItemId: item.id, quantityMilli: 10_000 },
    context,
  );
  assert.equal(state.planLines.length, 4);
  assert.deepEqual(
    state.planLines.map((line) => line.demand_source).sort(),
    ["booking", "event", "regular", "special"],
  );
  state = await inventory.confirmDailyPlan(plan.id, context);
  assert.equal(state.plans[0]!.status, "confirmed");
});

test("rejects duplicate plans and lines on confirmed plans", async () => {
  const { business, inventory, item, location } = await setup();
  const scope = { businessId: business.id, locationId: location.id };
  const plan = await inventory.createDailyPlan({ ...scope, planDate: "2026-10-01" }, context);
  await assert.rejects(inventory.createDailyPlan({ ...scope, planDate: "2026-10-01" }, context), InventoryConflictError);
  await inventory.addDailyPlanLine(plan.id, { demandSource: "regular", menuItemId: item.id, quantityMilli: 1_000 }, context);
  await inventory.confirmDailyPlan(plan.id, context);
  await assert.rejects(
    inventory.addDailyPlanLine(plan.id, { demandSource: "regular", menuItemId: item.id, quantityMilli: 1_000 }, context),
    InventoryConflictError,
  );
  await assert.rejects(inventory.confirmDailyPlan(plan.id, context), InventoryConflictError);
});
