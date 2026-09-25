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

const context = { actorId: "cashier-1", correlationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" };
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
  const inventory = new InventoryService(new InventoryRepository(database), activity, now);
  const scope = { businessId: business.id, locationId: location.id };
  const unit = await inventory.createUnit({ ...scope, code: "KG", name: "Kilogram" }, context);
  const rice = await inventory.createItem(
    { ...scope, code: "RICE", name: "Rice", reorderLevelMilli: 0, trackStock: true, unitId: unit.id },
    context,
  );
  const dal = await inventory.createItem(
    { ...scope, code: "DAL", name: "Dal", reorderLevelMilli: 0, trackStock: true, unitId: unit.id },
    context,
  );
  await inventory.adjust(
    {
      ...scope,
      approvedBy: "owner-1",
      lines: [{ quantityMilli: 10_000, stockItemId: rice.id }],
      reason: "Opening stock",
    },
    context,
  );
  await inventory.adjust(
    {
      ...scope,
      approvedBy: "owner-1",
      lines: [{ quantityMilli: 5_000, stockItemId: dal.id }],
      reason: "Opening stock",
    },
    context,
  );
  await inventory.createRecipe(
    {
      ...scope,
      code: "MEAL-STD",
      components: [
        { quantityMilli: 200, stockItemId: rice.id },
        { quantityMilli: 100, stockItemId: dal.id },
      ],
      effectiveFrom: "2026-09-01",
      menuItemId: item.id,
      name: "Standard meal",
    },
    context,
  );
  return { business, inventory, item, location, rice, dal };
}

test("a final sale posts traceable recipe consumption to the ledger", async () => {
  const { business, inventory, item, location, rice, dal } = await setup();
  const scope = { businessId: business.id, locationId: location.id };
  const state = await inventory.consumeForSale(
    { ...scope, menuItemId: item.id, portions: 2, sourceId: "ORD-101", sourceType: "sale" },
    context,
  );
  assert.equal(state.consumptions.length, 1);
  assert.equal(state.consumptions[0]!.source_type, "sale");
  assert.equal(state.consumptions[0]!.source_id, "ORD-101");
  assert.equal(state.consumptions[0]!.portions, 2);
  const linked = state.movements.filter((movement) => (movement.source_type as string) === "consumption");
  assert.equal(linked.length, 2);
  for (const movement of linked) assert.equal(movement.source_id, state.consumptions[0]!.id);
  const riceOut = linked.find((movement) => movement.stock_item_id === rice.id)!;
  const dalOut = linked.find((movement) => movement.stock_item_id === dal.id)!;
  assert.equal(riceOut.quantity_milli, -400);
  assert.equal(dalOut.quantity_milli, -200);
  assert.deepEqual(state.availability, [
    { availableMilli: 9_600, onHandMilli: 9_600, reservedMilli: 0, stockItemId: rice.id },
    { availableMilli: 4_800, onHandMilli: 4_800, reservedMilli: 0, stockItemId: dal.id },
  ]);
});

test("an event plan consumes against reserved ledger stock", async () => {
  const { business, inventory, item, location, rice } = await setup();
  const scope = { businessId: business.id, locationId: location.id };
  await inventory.reserve(
    { ...scope, quantityMilli: 1_000, sourceId: "EVT-101", sourceType: "event", stockItemId: rice.id },
    context,
  );
  const state = await inventory.consumeForSale(
    { ...scope, menuItemId: item.id, portions: 3, sourceId: "EVT-101", sourceType: "event" },
    context,
  );
  const eventConsumption = state.consumptions.find((row) => row.source_id === "EVT-101")!;
  assert.equal(eventConsumption.source_type, "event");
  const riceOut = state.movements
    .filter((movement) => (movement.source_type as string) === "consumption")
    .find((movement) => movement.stock_item_id === rice.id)!;
  assert.equal(riceOut.quantity_milli, -600);
  assert.equal(riceOut.source_id, eventConsumption.id);
});

test("consumption fails without an active recipe or sufficient stock", async () => {
  const { business, inventory, item, location, rice } = await setup();
  const scope = { businessId: business.id, locationId: location.id };
  await assert.rejects(
    inventory.consumeForSale(
      { ...scope, menuItemId: item.id, portions: 1_000, sourceId: "ORD-9", sourceType: "sale" },
      context,
    ),
    InventoryConflictError,
  );
  await assert.rejects(
    inventory.consumeForSale(
      {
        ...scope,
        menuItemId: "00000000-0000-4000-8000-000000000000",
        portions: 1,
        sourceId: "ORD-9",
        sourceType: "sale",
      },
      context,
    ),
    InventoryConflictError,
  );
  assert.equal(rice.id.length, 36);
});
