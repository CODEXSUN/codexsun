import assert from "node:assert/strict";
import test from "node:test";
import { ActivityRepository } from "../../foundation/repository/activity.repository.js";
import { createQcafePersistence } from "../../foundation/persistence/qcafe-persistence.js";
import { FoundationSetupRepository } from "../../foundation/repository/foundation-setup.repository.js";
import { FoundationSetupService } from "../../foundation/services/foundation-setup.service.js";
import { createQcafeLifecyclePlans } from "../../../qcafe-lifecycle-plans.js";
import { InventoryRepository } from "../repository/inventory.repository.js";
import { InventoryConflictError, InventoryService } from "../services/inventory.service.js";

const context = { actorId: "manager-1", correlationId: "99999999-9999-4999-8999-999999999999" };
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
  const scope = { businessId: business.id, locationId: location.id };
  const unit = await inventory.createUnit({ ...scope, code: "KG", name: "Kilogram" }, context);
  const rice = await inventory.createItem(
    { ...scope, code: "RICE", name: "Rice", reorderLevelMilli: 0, trackStock: true, unitId: unit.id },
    context,
  );
  return { business, inventory, location, rice };
}

test("receives purchase orders into traceable lots and ledger stock", async () => {
  const { business, inventory, location, rice } = await setup();
  const scope = { businessId: business.id, locationId: location.id };
  const order = await inventory.createPurchaseOrder(
    { ...scope, lines: [{ quantityMilli: 10_000, stockItemId: rice.id }], supplierRef: "SUP-1" },
    context,
  );
  await inventory.sendPurchaseOrder(order.id, context);
  const poLines = (await inventory.read(scope)).purchaseOrderLines;
  const state = await inventory.receiveGoods(
    order.id,
    { lines: [{ lotCode: "LOT-A", poLineId: poLines[0]!.id, quantityMilli: 6_000 }] },
    context,
  );
  assert.equal(state.receipts.length, 1);
  assert.equal(state.lots.length, 1);
  assert.equal(state.lots[0]!.lot_code, "LOT-A");
  assert.equal(state.receiptLines[0]!.lot_id, state.lots[0]!.id);
  const purchase = state.movements.find((movement) => (movement.source_type as string) === "purchase")!;
  assert.equal(purchase.quantity_milli, 6_000);
  assert.equal(purchase.source_id, state.receipts[0]!.id);
  assert.deepEqual(state.availability, [
    { availableMilli: 6_000, onHandMilli: 6_000, reservedMilli: 0, stockItemId: rice.id },
  ]);
  await assert.rejects(
    inventory.receiveGoods(order.id, { lines: [{ poLineId: poLines[0]!.id, quantityMilli: 5_000 }] }, context),
    InventoryConflictError,
  );
});

test("count variance and waste require a reason and approval", async () => {
  const { business, inventory, location, rice } = await setup();
  const scope = { businessId: business.id, locationId: location.id };
  await inventory.adjust(
    {
      ...scope,
      approvedBy: "owner-1",
      lines: [{ quantityMilli: 10_000, stockItemId: rice.id }],
      reason: "Opening stock",
    },
    context,
  );
  await assert.rejects(
    inventory.submitCount(
      { ...scope, lines: [{ countedMilli: 9_000, stockItemId: rice.id }], reason: "Cycle count" },
      context,
    ),
    InventoryConflictError,
  );
  let state = await inventory.submitCount(
    { ...scope, approvedBy: "owner-1", lines: [{ countedMilli: 9_000, stockItemId: rice.id }], reason: "Cycle count" },
    context,
  );
  assert.equal(state.counts.length, 1);
  assert.equal(state.countLines[0]!.variance_milli, -1_000);
  const countMovement = state.movements.find((movement) => (movement.source_type as string) === "count")!;
  assert.equal(countMovement.quantity_milli, -1_000);
  await assert.rejects(
    inventory.recordWaste(
      { ...scope, approvedBy: "", quantityMilli: 500, reason: "Spoiled", stockItemId: rice.id },
      context,
    ),
    Error,
  );
  state = await inventory.recordWaste(
    { ...scope, approvedBy: "owner-1", quantityMilli: 500, reason: "Spoiled", stockItemId: rice.id },
    context,
  );
  assert.equal(state.wasteEvents.length, 1);
  const waste = state.movements.find((movement) => (movement.source_type as string) === "waste")!;
  assert.equal(waste.quantity_milli, -500);
  assert.deepEqual(state.availability, [
    { availableMilli: 8_500, onHandMilli: 8_500, reservedMilli: 0, stockItemId: rice.id },
  ]);
});
