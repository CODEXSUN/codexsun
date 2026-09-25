import assert from "node:assert/strict";
import Fastify from "fastify";
import test from "node:test";
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import type { Actor } from "@codexsun/platform-core";
import { ActivityRepository } from "../../foundation/repository/activity.repository.js";
import { createQcafePersistence } from "../../foundation/persistence/qcafe-persistence.js";
import { FoundationSetupRepository } from "../../foundation/repository/foundation-setup.repository.js";
import { FoundationSetupService } from "../../foundation/services/foundation-setup.service.js";
import { MenuRepository } from "../../menu/repository/menu.repository.js";
import { MenuService } from "../../menu/services/menu.service.js";
import { MenuAvailabilityRepository } from "../../menu/repository/menu-availability.repository.js";
import { MenuCampaignRepository } from "../../menu/repository/menu-campaign.repository.js";
import { MenuSaleabilityRepository } from "../../menu/repository/menu-saleability.repository.js";
import { MenuAvailabilityService } from "../../menu/services/menu-availability.service.js";
import { MenuCampaignService } from "../../menu/services/menu-campaign.service.js";
import { MenuSaleabilityService } from "../../menu/services/menu-saleability.service.js";
import { PosRepository } from "../../pos/repository/pos.repository.js";
import { PosService } from "../../pos/services/pos.service.js";
import { createQcafeLifecyclePlans } from "../../../qcafe-lifecycle-plans.js";
import { BillingRepository } from "../repository/billing.repository.js";
import { BillingService } from "../services/billing.service.js";
import { registerBillingRoutes } from "../routes/billing-route.js";

const context = { actorId: "tester-1", correlationId: "33333333-4444-4555-8555-666666666666" };
const now = () => new Date("2026-09-24T12:00:00.000Z");

function roleActor(roles: string[]): Actor {
  return { id: "tester-1", kind: "user", permissions: [], roles };
}

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
  await foundation.createBusiness(
    {
      businessName: "Q Cafe",
      currency: "INR",
      locationCode: "MAIN",
      locationName: "Main outlet",
      timezone: "Asia/Calcutta",
    },
    context,
  );
  const menu = new MenuService(new MenuRepository(database), activity, now);
  const availability = new MenuAvailabilityService(new MenuAvailabilityRepository(database), menu, activity, now);
  const campaigns = new MenuCampaignService(new MenuCampaignRepository(database), menu, activity);
  const saleability = new MenuSaleabilityService(new MenuSaleabilityRepository(database), availability, campaigns);
  const pos = new PosService(new PosRepository(database), menu, saleability, activity, now);
  return new BillingService(new BillingRepository(database), pos, activity, now);
}

test("restricted billing actions fail through API authorization checks", async () => {
  const billing = await setup();
  let current: Actor = roleActor(["waiter"]);
  const app = Fastify().withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  await registerBillingRoutes(
    app,
    billing,
    () => context,
    () => current,
  );
  const refund = {
    method: "POST" as const,
    payload: { amountMinor: 100, reason: "Guest complaint" },
    url: "/api/v1/qcafe/billing/payments/00000000-0000-4000-8000-000000000000/refunds",
  };

  current = roleActor(["waiter"]);
  assert.equal((await app.inject(refund)).statusCode, 403);

  current = roleActor(["cashier"]);
  assert.equal((await app.inject(refund)).statusCode, 403);

  current = roleActor(["manager"]);
  assert.equal((await app.inject(refund)).statusCode, 409);

  current = roleActor(["owner"]);
  assert.equal((await app.inject(refund)).statusCode, 409);

  current = roleActor(["cashier"]);
  const settle = {
    method: "POST" as const,
    payload: { countedMinor: 0 },
    url: "/api/v1/qcafe/billing/cash-shifts/00000000-0000-4000-8000-000000000000/settle",
  };
  assert.equal((await app.inject(settle)).statusCode, 403);
  await app.close();
});
