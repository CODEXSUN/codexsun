import assert from "node:assert/strict";
import test from "node:test";
import { createQcafePersistence } from "../persistence/qcafe-persistence.js";
import { FoundationSetupRepository } from "../repository/foundation-setup.repository.js";
import { FoundationSetupService } from "../services/foundation-setup.service.js";
import { ActivityRepository } from "../repository/activity.repository.js";

const context = { actorId: "test-user", correlationId: "11111111-1111-4111-8111-111111111111" };

test("creates a business, multiple locations, defaults, and a business day", async () => {
  const persistence = createQcafePersistence({ localDatabasePath: ":memory:", mode: "local" });
  await persistence.initialize();
  const service = new FoundationSetupService(
    new FoundationSetupRepository(persistence.database()),
    { localDatabasePath: ":memory:", mode: "local", syncCloudUrl: "https://cloud.example/qcafe/sync" },
    new ActivityRepository(persistence.database(), () => new Date("2026-09-20T08:00:00.000Z")),
    () => new Date("2026-09-20T08:00:00.000Z"),
  );

  let setup = await service.createBusiness(
    {
      businessName: "Q Cafe Central",
      currency: "INR",
      locationCode: "MAIN",
      locationName: "Main Road",
      timezone: "Asia/Calcutta",
    },
    context,
  );
  const business = setup.businesses[0];
  assert.ok(business);
  assert.equal(business.locations[0]?.serviceChannels.length, 7);
  assert.equal(business.locations[0]?.numberSequences.length, 6);

  setup = await service.createLocation(
    {
      businessId: business.id,
      code: "AIRPORT",
      name: "Airport Outlet",
      timezone: "Asia/Calcutta",
    },
    context,
  );
  assert.equal(setup.businesses[0]?.locations.length, 2);

  const location = setup.businesses[0]?.locations[0];
  assert.ok(location);
  setup = await service.openBusinessDay(location.id, "2026-09-20", context);
  assert.equal(setup.businesses[0]?.locations[0]?.businessDay?.status, "open");
  assert.equal(setup.dataMode, "local");
  assert.equal(setup.syncConfigured, true);
  const events = await persistence.database().selectFrom("qcafe_activity_events").selectAll().execute();
  assert.equal(events.length, 3);
  assert.ok(
    events.every((event) => event.actor_id === context.actorId && event.correlation_id === context.correlationId),
  );
  await persistence.destroy();
});
