import assert from "node:assert/strict";
import test from "node:test";
import { ActivityRepository } from "../../foundation/repository/activity.repository.js";
import { createQcafePersistence } from "../../foundation/persistence/qcafe-persistence.js";
import { FoundationSetupRepository } from "../../foundation/repository/foundation-setup.repository.js";
import { FoundationSetupService } from "../../foundation/services/foundation-setup.service.js";
import { createQcafeLifecyclePlans } from "../../../qcafe-lifecycle-plans.js";
import { SyncRepository } from "../repository/sync.repository.js";
import { SyncConflictError, SyncService, isFinancialEntityType } from "../services/sync.service.js";

const context = { actorId: "owner-1", correlationId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd" };
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
  const sync = new SyncService(new SyncRepository(database), activity, now);
  return { business, location, sync };
}

test("registers devices once and orders the change log per device cursor", async () => {
  const { business, location, sync } = await setup();
  const scope = { businessId: business.id, locationId: location.id };
  const first = await sync.registerDevice(
    { ...scope, deviceCode: "POS-1", name: "Counter POS", platform: "desktop" },
    context,
  );
  const replay = await sync.registerDevice(
    { ...scope, deviceCode: "POS-1", name: "Counter POS", platform: "desktop" },
    context,
  );
  assert.equal(first.id, replay.id);
  await sync.appendChange(
    {
      ...scope,
      actorRef: "cashier-1",
      changeKind: "created",
      deviceId: first.id,
      entityId: "ORD-1",
      entityType: "order",
    },
    context,
  );
  await sync.appendChange(
    {
      ...scope,
      actorRef: "cashier-1",
      changeKind: "confirmed",
      deviceId: first.id,
      entityId: "ORD-1",
      entityType: "order",
    },
    context,
  );
  let pending = await sync.pendingChanges(first.id);
  assert.equal(pending.changes.length, 2);
  assert.ok(pending.changes[0]!.seq < pending.changes[1]!.seq);
  await sync.advanceCursor(first.id, pending.lastSeq, context);
  pending = await sync.pendingChanges(first.id);
  assert.equal(pending.changes.length, 0);
  await assert.rejects(sync.advanceCursor(first.id, pending.lastSeq, context), SyncConflictError);
  assert.ok(isFinancialEntityType("payment"));
  assert.ok(!isFinancialEntityType("order"));
});

test("financial conflicts never resolve silently", async () => {
  const { business, location, sync } = await setup();
  const scope = { businessId: business.id, locationId: location.id };
  const conflict = await sync.reportConflict(
    { ...scope, entityId: "PAY-1", entityType: "payment", reason: "Counter and cloud both posted payment" },
    context,
  );
  await assert.rejects(
    sync.resolveConflict(
      conflict.id,
      { decidedBy: " ", reason: "Auto keep-remote", resolution: "keep-remote" },
      context,
    ),
    SyncConflictError,
  );
  await assert.rejects(
    sync.resolveConflict(conflict.id, { decidedBy: "owner-1", reason: " ", resolution: "keep-remote" }, context),
    SyncConflictError,
  );
  const state = await sync.resolveConflict(
    conflict.id,
    {
      decidedBy: "owner-1",
      reason: "Verified against the bank statement; counter tender stands",
      resolution: "keep-local",
    },
    context,
  );
  const resolved = state.conflicts.find((row) => row.id === conflict.id)!;
  assert.equal(resolved.status, "resolved");
  assert.equal(resolved.decided_by, "owner-1");
  await assert.rejects(
    sync.resolveConflict(
      conflict.id,
      { decidedBy: "owner-1", reason: "Second decision", resolution: "retry" },
      context,
    ),
    SyncConflictError,
  );
});

test("an offline change, a retry, and a conflict each record an outcome", async () => {
  const { business, location, sync } = await setup();
  const scope = { businessId: business.id, locationId: location.id };
  const counter = await sync.registerDevice(
    { ...scope, deviceCode: "POS-1", name: "Counter", platform: "desktop" },
    context,
  );
  const mobile = await sync.registerDevice(
    { ...scope, deviceCode: "MOB-1", name: "Runner", platform: "mobile" },
    context,
  );

  const offline = await sync.pushChanges(
    counter.id,
    [
      {
        actorRef: "cashier-1",
        changeKind: "created",
        entityId: "ORD-7",
        entityType: "order",
        id: "11111111-1111-4111-8111-111111111111",
      },
    ],
    context,
  );
  assert.deepEqual(offline.accepted, ["11111111-1111-4111-8111-111111111111"]);
  assert.deepEqual(offline.duplicates, []);
  assert.deepEqual(offline.conflicts, []);

  const replay = await sync.pushChanges(
    counter.id,
    [
      {
        actorRef: "cashier-1",
        changeKind: "created",
        entityId: "ORD-7",
        entityType: "order",
        id: "11111111-1111-4111-8111-111111111111",
      },
    ],
    context,
  );
  assert.deepEqual(replay.accepted, []);
  assert.deepEqual(replay.duplicates, ["11111111-1111-4111-8111-111111111111"]);

  const competing = await sync.pushChanges(
    mobile.id,
    [
      {
        actorRef: "runner-1",
        changeKind: "updated",
        entityId: "ORD-7",
        entityType: "order",
        id: "22222222-2222-4222-8222-222222222222",
      },
    ],
    context,
  );
  assert.deepEqual(competing.accepted, []);
  assert.equal(competing.conflicts.length, 1);
  const conflictId = competing.conflicts[0]!;

  const pending = await sync.pendingChanges(mobile.id);
  await sync.advanceCursor(mobile.id, pending.lastSeq, context);
  const retry = await sync.pushChanges(
    mobile.id,
    [
      {
        actorRef: "runner-1",
        changeKind: "updated",
        entityId: "ORD-7",
        entityType: "order",
        id: "22222222-2222-4222-8222-222222222222",
      },
    ],
    context,
  );
  assert.deepEqual(retry.accepted, ["22222222-2222-4222-8222-222222222222"]);

  const state = await sync.resolveConflict(
    conflictId,
    {
      decidedBy: "manager-1",
      reason: "Counter creation stands; runner update merged on retry",
      resolution: "keep-local",
    },
    context,
  );
  assert.equal(state.conflicts.find((row) => row.id === conflictId)!.status, "resolved");
});
