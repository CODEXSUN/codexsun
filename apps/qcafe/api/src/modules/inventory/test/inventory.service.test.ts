import assert from "node:assert/strict";
import test from "node:test";
import { ActivityRepository } from "../../foundation/repository/activity.repository.js";
import { createQcafePersistence } from "../../foundation/persistence/qcafe-persistence.js";
import { FoundationSetupRepository } from "../../foundation/repository/foundation-setup.repository.js";
import { FoundationSetupService } from "../../foundation/services/foundation-setup.service.js";
import { createQcafeLifecyclePlans } from "../../../qcafe-lifecycle-plans.js";
import { InventoryRepository } from "../repository/inventory.repository.js";
import { InventoryConflictError, InventoryService } from "../services/inventory.service.js";

const context = { actorId: "manager-1", correlationId: "55555555-5555-4555-8555-555555555555" };
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
  const inventory = new InventoryService(new InventoryRepository(database), activity, now);
  return { business, inventory, location, persistence };
}

test("posts a source-linked ledger movement for every accepted stock change", async () => {
  const { business, inventory, location } = await setup();
  const scope = { businessId: business.id, locationId: location.id };
  const unit = await inventory.createUnit({ ...scope, code: "KG", name: "Kilogram", symbol: "kg" }, context);
  const item = await inventory.createItem(
    { ...scope, code: "RICE", name: "Basmati rice", reorderLevelMilli: 5_000, trackStock: true, unitId: unit.id },
    context,
  );
  const state = await inventory.adjust(
    {
      ...scope,
      approvedBy: "owner-1",
      lines: [{ quantityMilli: 10_000, stockItemId: item.id }],
      reason: "Opening stock",
    },
    context,
  );
  assert.equal(state.movements.length, 1);
  assert.equal(state.movements[0]!.quantity_milli, 10_000);
  assert.equal(state.movements[0]!.source_type, "adjustment");
  assert.equal(state.movements[0]!.source_id, state.adjustments[0]!.id);
  assert.deepEqual(state.balances, [{ quantityMilli: 10_000, stockItemId: item.id }]);
});

test("requires an approver for stock reductions and rejects untracked items", async () => {
  const { business, inventory, location } = await setup();
  const scope = { businessId: business.id, locationId: location.id };
  const unit = await inventory.createUnit({ ...scope, code: "L", name: "Litre" }, context);
  const tracked = await inventory.createItem(
    { ...scope, code: "MILK", name: "Milk", reorderLevelMilli: 0, trackStock: true, unitId: unit.id },
    context,
  );
  const untracked = await inventory.createItem(
    { ...scope, code: "SALT-S", name: "Salt sachet", reorderLevelMilli: 0, trackStock: false, unitId: unit.id },
    context,
  );
  await assert.rejects(
    inventory.adjust({ ...scope, lines: [{ quantityMilli: -500, stockItemId: tracked.id }], reason: "Waste" }, context),
    InventoryConflictError,
  );
  await assert.rejects(
    inventory.adjust(
      { ...scope, approvedBy: "owner-1", lines: [{ quantityMilli: 100, stockItemId: untracked.id }], reason: "Top up" },
      context,
    ),
    InventoryConflictError,
  );
  await assert.rejects(
    inventory.adjust({ ...scope, approvedBy: "owner-1", lines: [], reason: "Empty" }, context),
    Error,
  );
});
