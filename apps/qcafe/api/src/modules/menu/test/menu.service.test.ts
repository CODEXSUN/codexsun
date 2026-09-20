import assert from "node:assert/strict";
import test from "node:test";
import { sql } from "kysely";
import { ActivityRepository } from "../../foundation/repository/activity.repository.js";
import { FoundationSetupRepository } from "../../foundation/repository/foundation-setup.repository.js";
import { FoundationSetupService } from "../../foundation/services/foundation-setup.service.js";
import { createQcafePersistence } from "../../foundation/persistence/qcafe-persistence.js";
import { createQcafeLifecyclePlans } from "../../../qcafe-lifecycle-plans.js";
import { MenuRepository } from "../repository/menu.repository.js";
import { MenuService } from "../services/menu.service.js";

const context = { actorId: "menu-manager", correlationId: "22222222-2222-4222-8222-222222222222" };

const menuTables = [
  "qcafe_allergen_tags",
  "qcafe_item_allergens",
  "qcafe_item_availability",
  "qcafe_item_modifier_groups",
  "qcafe_media_assets",
  "qcafe_menu_categories",
  "qcafe_menu_item_media",
  "qcafe_menu_items",
  "qcafe_menu_prices",
  "qcafe_menu_variants",
  "qcafe_modifier_groups",
  "qcafe_modifier_options",
  "qcafe_price_books",
  "qcafe_special_campaigns",
  "qcafe_special_prices",
];

test("applies the complete M01-M15 menu schema once", async () => {
  const persistence = createQcafePersistence({ localDatabasePath: ":memory:", mode: "local" }, createQcafeLifecyclePlans());
  const applied = await persistence.initialize();
  assert.ok(applied.includes("qcafe.menu.002"));

  const result = await sql<{ name: string }>`
    select name from sqlite_master where type = 'table' and name like 'qcafe_%'
  `.execute(persistence.database());
  const names = result.rows.map((row) => row.name).sort();
  assert.deepEqual(names.filter((name) => menuTables.includes(name)), menuTables);

  assert.deepEqual(await persistence.initialize(), []);
  const records = await persistence.verify();
  assert.equal(records.length, 7);
  assert.equal(records.find((record) => record.descriptorId === "qcafe.menu.002")?.kind, "migration");
  await persistence.destroy();
});

test("selects the most specific active menu price and records every command", async () => {
  const persistence = createQcafePersistence({ localDatabasePath: ":memory:", mode: "local" }, createQcafeLifecyclePlans());
  await persistence.initialize();
  const now = () => new Date("2026-09-20T08:00:00.000Z");
  const activity = new ActivityRepository(persistence.database(), now);
  const foundation = new FoundationSetupService(
    new FoundationSetupRepository(persistence.database()),
    { localDatabasePath: ":memory:", mode: "local" },
    activity,
    now,
  );
  const setup = await foundation.createBusiness({ businessName: "Q Cafe", currency: "INR", locationCode: "MAIN", locationName: "Main Road", timezone: "Asia/Calcutta" }, context);
  const business = setup.businesses[0]!;
  const location = business.locations[0]!;
  const channel = location.serviceChannels.find((entry) => entry.kind === "takeaway")!;
  const menu = new MenuService(new MenuRepository(persistence.database()), activity, now);

  let catalog = await menu.createCategory({ businessId: business.id, code: "DRINKS", name: "Drinks", sortOrder: 1 }, context);
  catalog = await menu.createItem({ businessId: business.id, categoryId: catalog.categories[0]!.id, code: "COFFEE", itemType: "beverage", name: "Filter coffee" }, context);
  catalog = await menu.createVariant({ code: "LG", itemId: catalog.items[0]!.id, name: "Large" }, business.id, context);
  catalog = await menu.createPriceBook({ businessId: business.id, code: "STANDARD", currency: "INR", name: "Standard" }, context);
  const item = catalog.items[0]!;
  const priceBook = catalog.priceBooks[0]!;
  await menu.setPrice({ amountMinor: 5000, itemId: item.id, priceBookId: priceBook.id, validFrom: "2026-01-01" }, business.id, context);
  await menu.setPrice({ amountMinor: 5500, itemId: item.id, locationId: location.id, priceBookId: priceBook.id, serviceChannelId: channel.id, validFrom: "2026-09-01" }, business.id, context);

  const effective = await menu.findEffectivePrice({ businessDate: "2026-09-20", itemId: item.id, locationId: location.id, priceBookId: priceBook.id, serviceChannelId: channel.id });
  assert.equal(effective?.amountMinor, 5500);
  const fallback = await menu.findEffectivePrice({ businessDate: "2026-09-20", itemId: item.id, priceBookId: priceBook.id });
  assert.equal(fallback?.amountMinor, 5000);
  const events = await persistence.database().selectFrom("qcafe_activity_events").selectAll().execute();
  assert.equal(events.length, 7);
  assert.ok(events.every((event) => event.actor_id === context.actorId && event.correlation_id === context.correlationId));
  await persistence.destroy();
});
