import assert from "node:assert/strict";
import test from "node:test";
import { ActivityRepository } from "../../foundation/repository/activity.repository.js";
import { createQcafePersistence } from "../../foundation/persistence/qcafe-persistence.js";
import { createQcafeLifecyclePlans } from "../../../qcafe-lifecycle-plans.js";
import { SettingsRepository } from "../repository/settings.repository.js";
import { SettingsConflictError, SettingsService } from "../services/settings.service.js";

const context = { actorId: "settings-manager", correlationId: "33333333-3333-4333-8333-333333333333" };

test("manages database status, cloud sync policy, and safe connector metadata", async () => {
  const configuration = {
    localDatabasePath: ":memory:",
    mode: "local" as const,
    syncCloudUrl: "https://cloud.example/qcafe/sync",
  };
  const persistence = createQcafePersistence(configuration, createQcafeLifecyclePlans());
  await persistence.initialize();
  const now = () => new Date("2026-09-20T09:00:00.000Z");
  const service = new SettingsService(
    new SettingsRepository(persistence.database()),
    new ActivityRepository(persistence.database(), now),
    configuration,
    () => persistence.verify(),
    now,
  );

  const database = await service.verifyDatabase(context);
  assert.equal(database.driver, "sqlite");
  assert.equal(database.status, "ready");
  assert.equal(database.lifecycleRecords, 15);

  let sync = await service.cloudSync();
  assert.equal(sync.available, true);
  assert.equal(sync.enabled, false);
  sync = await service.setCloudSync(true, context);
  assert.equal(sync.enabled, true);

  let connectors = await service.createConnector(
    { code: "SWIGGY", kind: "marketplace", name: "Swiggy orders" },
    context,
  );
  await assert.rejects(service.setConnectorEnabled(connectors.connectors[0]!.id, true, context), SettingsConflictError);
  connectors = await service.createConnector(
    {
      code: "ZOMATO",
      endpointLabel: "Production intake",
      kind: "marketplace",
      name: "Zomato orders",
      secretReference: "QCAFE_ZOMATO_SECRET",
    },
    context,
  );
  const configured = connectors.connectors.find((connector) => connector.code === "ZOMATO")!;
  connectors = await service.setConnectorEnabled(configured.id, true, context);
  assert.equal(connectors.connectors.find((connector) => connector.id === configured.id)?.enabled, true);

  const events = await persistence.database().selectFrom("qcafe_activity_events").selectAll().execute();
  assert.equal(events.length, 5);
  assert.ok(events.every((event) => event.actor_id === context.actorId));
  await persistence.destroy();
});

test("keeps sync disabled when no server target is configured", async () => {
  const configuration = { localDatabasePath: ":memory:", mode: "local" as const };
  const persistence = createQcafePersistence(configuration, createQcafeLifecyclePlans());
  await persistence.initialize();
  const service = new SettingsService(
    new SettingsRepository(persistence.database()),
    new ActivityRepository(persistence.database()),
    configuration,
    () => persistence.verify(),
  );
  await assert.rejects(service.setCloudSync(true, context), /QCAFE_SYNC_CLOUD_URL/u);
  assert.equal((await service.cloudSync()).enabled, false);
  await persistence.destroy();
});
