import assert from "node:assert/strict";
import test from "node:test";
import { ActivityRepository } from "../../foundation/repository/activity.repository.js";
import { createQcafePersistence } from "../../foundation/persistence/qcafe-persistence.js";
import { FoundationSetupRepository } from "../../foundation/repository/foundation-setup.repository.js";
import { FoundationSetupService } from "../../foundation/services/foundation-setup.service.js";
import { createQcafeLifecyclePlans } from "../../../qcafe-lifecycle-plans.js";
import { InventoryRepository } from "../repository/inventory.repository.js";
import { InventoryConflictError, InventoryService } from "../services/inventory.service.js";

const context = { actorId: "manager-1", correlationId: "88888888-8888-4888-8888-888888888888" };
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
  await inventory.adjust(
    {
      ...scope,
      approvedBy: "owner-1",
      lines: [{ quantityMilli: 10_000, stockItemId: rice.id }],
      reason: "Opening stock",
    },
    context,
  );
  return { business, inventory, location, rice };
}

test("reservations reduce available planning stock without posting consumption", async () => {
  const { business, inventory, location, rice } = await setup();
  const scope = { businessId: business.id, locationId: location.id };
  let state = await inventory.reserve(
    { ...scope, quantityMilli: 4_000, sourceId: "EVT-101", sourceType: "event", stockItemId: rice.id },
    context,
  );
  assert.equal(state.movements.length, 1);
  assert.equal(state.reservations.length, 1);
  assert.equal(state.reservations[0]!.status, "active");
  assert.deepEqual(state.availability, [
    { availableMilli: 6_000, onHandMilli: 10_000, reservedMilli: 4_000, stockItemId: rice.id },
  ]);

  state = await inventory.releaseReservation(state.reservations[0]!.id, context);
  assert.equal(state.reservations[0]!.status, "released");
  assert.deepEqual(state.availability, [
    { availableMilli: 10_000, onHandMilli: 10_000, reservedMilli: 0, stockItemId: rice.id },
  ]);
  assert.equal(state.movements.length, 1);
});

test("consume resolves a reservation and rejects double resolution", async () => {
  const { business, inventory, location, rice } = await setup();
  const scope = { businessId: business.id, locationId: location.id };
  const reserved = await inventory.reserve(
    { ...scope, quantityMilli: 2_000, sourceId: "ORD-9", sourceType: "order", stockItemId: rice.id },
    context,
  );
  const id = reserved.reservations[0]!.id;
  const state = await inventory.consumeReservation(id, context);
  assert.equal(state.reservations[0]!.status, "consumed");
  assert.equal(state.movements.length, 1);
  await assert.rejects(inventory.releaseReservation(id, context), InventoryConflictError);
  await assert.rejects(inventory.consumeReservation(id, context), InventoryConflictError);
});
