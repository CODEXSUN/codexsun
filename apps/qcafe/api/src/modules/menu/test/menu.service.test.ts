import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { StorageProvider } from "@codexsun/platform-core";
import { sql } from "kysely";
import { ActivityRepository } from "../../foundation/repository/activity.repository.js";
import { FoundationSetupRepository } from "../../foundation/repository/foundation-setup.repository.js";
import { FoundationSetupService } from "../../foundation/services/foundation-setup.service.js";
import { createQcafePersistence } from "../../foundation/persistence/qcafe-persistence.js";
import { createQcafeLifecyclePlans } from "../../../qcafe-lifecycle-plans.js";
import { MenuRepository } from "../repository/menu.repository.js";
import { MenuAvailabilityRepository } from "../repository/menu-availability.repository.js";
import { MenuCampaignRepository } from "../repository/menu-campaign.repository.js";
import { MenuCustomizationRepository } from "../repository/menu-customization.repository.js";
import { MenuSaleabilityRepository } from "../repository/menu-saleability.repository.js";
import { MenuMediaStorage } from "../persistence/menu-media.storage.js";
import { MenuAvailabilityService, MenuUnavailableError } from "../services/menu-availability.service.js";
import { MenuCampaignService } from "../services/menu-campaign.service.js";
import { MenuCustomizationService } from "../services/menu-customization.service.js";
import { MenuMediaService } from "../services/menu-media.service.js";
import { MenuNotSaleableError, MenuSaleabilityService } from "../services/menu-saleability.service.js";
import { MenuConflictError, MenuService } from "../services/menu.service.js";

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
  const persistence = createQcafePersistence(
    { localDatabasePath: ":memory:", mode: "local" },
    createQcafeLifecyclePlans(),
  );
  const applied = await persistence.initialize();
  assert.ok(applied.includes("qcafe.menu.002"));

  const result = await sql<{ name: string }>`
    select name from sqlite_master where type = 'table' and name like 'qcafe_%'
  `.execute(persistence.database());
  const names = result.rows.map((row) => row.name).sort();
  assert.deepEqual(
    names.filter((name) => menuTables.includes(name)),
    menuTables,
  );

  assert.deepEqual(await persistence.initialize(), []);
  const records = await persistence.verify();
  assert.equal(records.length, 7);
  assert.equal(records.find((record) => record.descriptorId === "qcafe.menu.002")?.kind, "migration");
  await persistence.destroy();
});

test("selects the most specific active menu price and records every command", async () => {
  const persistence = createQcafePersistence(
    { localDatabasePath: ":memory:", mode: "local" },
    createQcafeLifecyclePlans(),
  );
  await persistence.initialize();
  const now = () => new Date("2026-09-20T08:00:00.000Z");
  const activity = new ActivityRepository(persistence.database(), now);
  const foundation = new FoundationSetupService(
    new FoundationSetupRepository(persistence.database()),
    { localDatabasePath: ":memory:", mode: "local" },
    activity,
    now,
  );
  const setup = await foundation.createBusiness(
    {
      businessName: "Q Cafe",
      currency: "INR",
      locationCode: "MAIN",
      locationName: "Main Road",
      timezone: "Asia/Calcutta",
    },
    context,
  );
  const business = setup.businesses[0]!;
  const location = business.locations[0]!;
  const channel = location.serviceChannels.find((entry) => entry.kind === "takeaway")!;
  const menu = new MenuService(new MenuRepository(persistence.database()), activity, now);

  let catalog = await menu.createCategory(
    { businessId: business.id, code: "DRINKS", name: "Drinks", sortOrder: 1 },
    context,
  );
  catalog = await menu.createItem(
    {
      businessId: business.id,
      categoryId: catalog.categories[0]!.id,
      code: "COFFEE",
      itemType: "beverage",
      name: "Filter coffee",
    },
    context,
  );
  catalog = await menu.createVariant({ code: "LG", itemId: catalog.items[0]!.id, name: "Large" }, business.id, context);
  catalog = await menu.createPriceBook(
    { businessId: business.id, code: "STANDARD", currency: "INR", name: "Standard" },
    context,
  );
  const item = catalog.items[0]!;
  const priceBook = catalog.priceBooks[0]!;
  await menu.setPrice(
    { amountMinor: 5000, itemId: item.id, priceBookId: priceBook.id, validFrom: "2026-01-01" },
    business.id,
    context,
  );
  await menu.setPrice(
    {
      amountMinor: 5500,
      itemId: item.id,
      locationId: location.id,
      priceBookId: priceBook.id,
      serviceChannelId: channel.id,
      validFrom: "2026-09-01",
    },
    business.id,
    context,
  );

  const effective = await menu.findEffectivePrice({
    businessDate: "2026-09-20",
    itemId: item.id,
    locationId: location.id,
    priceBookId: priceBook.id,
    serviceChannelId: channel.id,
  });
  assert.equal(effective?.amountMinor, 5500);
  const fallback = await menu.findEffectivePrice({
    businessDate: "2026-09-20",
    itemId: item.id,
    priceBookId: priceBook.id,
  });
  assert.equal(fallback?.amountMinor, 5000);
  const events = await persistence.database().selectFrom("qcafe_activity_events").selectAll().execute();
  assert.equal(events.length, 7);
  assert.ok(
    events.every((event) => event.actor_id === context.actorId && event.correlation_id === context.correlationId),
  );
  await persistence.destroy();
});

test("stores menu image bytes privately and persists only media metadata", async () => {
  const directory = await mkdtemp(join(tmpdir(), "qcafe-menu-media-"));
  const persistence = createQcafePersistence(
    { localDatabasePath: ":memory:", mode: "local" },
    createQcafeLifecyclePlans(),
  );
  try {
    await persistence.initialize();
    const now = () => new Date("2026-09-20T09:00:00.000Z");
    const activity = new ActivityRepository(persistence.database(), now);
    const foundation = new FoundationSetupService(
      new FoundationSetupRepository(persistence.database()),
      { localDatabasePath: ":memory:", mode: "local" },
      activity,
      now,
    );
    const setup = await foundation.createBusiness(
      {
        businessName: "Q Cafe",
        currency: "INR",
        locationCode: "MAIN",
        locationName: "Main Road",
        timezone: "Asia/Calcutta",
      },
      context,
    );
    const business = setup.businesses[0]!;
    const repository = new MenuRepository(persistence.database());
    const menu = new MenuService(repository, activity, now);
    let catalog = await menu.createCategory(
      { businessId: business.id, code: "FOOD", name: "Food", sortOrder: 1 },
      context,
    );
    catalog = await menu.createItem(
      { businessId: business.id, categoryId: catalog.categories[0]!.id, code: "MEAL", itemType: "food", name: "Meal" },
      context,
    );
    const storage = new MenuMediaStorage(new StorageProvider(directory).forModule("qcafe", "menu"));
    const media = new MenuMediaService(repository, menu, storage, activity, now);
    const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    catalog = await media.upload(
      { businessId: business.id, height: 600, itemId: catalog.items[0]!.id, sortOrder: 0, usage: "menu", width: 800 },
      "image/png",
      bytes,
      context,
    );

    assert.equal(catalog.media.length, 1);
    assert.equal(catalog.media[0]?.checksum.length, 64);
    const asset = await persistence.database().selectFrom("qcafe_media_assets").selectAll().executeTakeFirstOrThrow();
    assert.match(asset.storage_object_ref, /^items\/.+\/[a-f0-9]{64}\.png$/u);
    assert.equal(asset.mime_type, "image/png");
    assert.deepEqual((await media.read(asset.id, business.id))?.bytes, bytes);
    const mediaEvent = await persistence
      .database()
      .selectFrom("qcafe_activity_events")
      .select("event_type")
      .where("event_type", "=", "qcafe.menu.media.attached")
      .executeTakeFirst();
    assert.ok(mediaEvent);
  } finally {
    await persistence.destroy();
    await rm(directory, { force: true, recursive: true });
  }
});

test("selects specific availability rules and rejects unavailable sale items", async () => {
  const persistence = createQcafePersistence(
    { localDatabasePath: ":memory:", mode: "local" },
    createQcafeLifecyclePlans(),
  );
  try {
    await persistence.initialize();
    const now = () => new Date("2026-09-20T09:00:00.000Z");
    const activity = new ActivityRepository(persistence.database(), now);
    const foundation = new FoundationSetupService(
      new FoundationSetupRepository(persistence.database()),
      { localDatabasePath: ":memory:", mode: "local" },
      activity,
      now,
    );
    const setup = await foundation.createBusiness(
      {
        businessName: "Q Cafe",
        currency: "INR",
        locationCode: "MAIN",
        locationName: "Main Road",
        timezone: "Asia/Calcutta",
      },
      context,
    );
    const business = setup.businesses[0]!;
    const location = business.locations[0]!;
    const takeaway = location.serviceChannels.find((entry) => entry.kind === "takeaway")!;
    const dineIn = location.serviceChannels.find((entry) => entry.kind === "dine_in")!;
    const menuRepository = new MenuRepository(persistence.database());
    const menu = new MenuService(menuRepository, activity, now);
    let catalog = await menu.createCategory(
      { businessId: business.id, code: "FOOD", name: "Food", sortOrder: 1 },
      context,
    );
    catalog = await menu.createItem(
      { businessId: business.id, categoryId: catalog.categories[0]!.id, code: "MEAL", itemType: "food", name: "Meal" },
      context,
    );
    const item = catalog.items[0]!;
    const availability = new MenuAvailabilityService(
      new MenuAvailabilityRepository(persistence.database()),
      menu,
      activity,
      now,
    );

    assert.equal(
      (await availability.effective({ at: "2026-09-20T08:30:00.000Z", itemId: item.id, locationId: location.id }))
        .available,
      true,
    );
    await availability.create(
      {
        businessId: business.id,
        endsAt: "2026-09-20T20:00:00.000Z",
        itemId: item.id,
        locationId: location.id,
        reason: "Sold out",
        startsAt: "2026-09-20T08:00:00.000Z",
        status: "unavailable",
      },
      context,
    );
    catalog = await availability.create(
      {
        businessId: business.id,
        endsAt: "2026-09-20T10:00:00.000Z",
        itemId: item.id,
        locationId: location.id,
        serviceChannelId: takeaway.id,
        startsAt: "2026-09-20T09:00:00.000Z",
        status: "available",
      },
      context,
    );

    assert.equal(catalog.availability.length, 2);
    assert.equal(
      (
        await availability.effective({
          at: "2026-09-20T09:30:00.000Z",
          itemId: item.id,
          locationId: location.id,
          serviceChannelId: takeaway.id,
        })
      ).available,
      true,
    );
    assert.equal(
      (
        await availability.effective({
          at: "2026-09-20T09:30:00.000Z",
          itemId: item.id,
          locationId: location.id,
          serviceChannelId: dineIn.id,
        })
      ).available,
      false,
    );
    assert.equal(
      (await availability.effective({ at: "2026-09-20T21:00:00.000Z", itemId: item.id, locationId: location.id }))
        .available,
      true,
    );
    await assert.rejects(
      availability.assertAvailable({
        at: "2026-09-20T09:30:00.000Z",
        itemId: item.id,
        locationId: location.id,
        serviceChannelId: dineIn.id,
      }),
      MenuUnavailableError,
    );
    const events = await persistence
      .database()
      .selectFrom("qcafe_activity_events")
      .select("event_type")
      .where("event_type", "=", "qcafe.menu.availability.created")
      .execute();
    assert.equal(events.length, 2);
  } finally {
    await persistence.destroy();
  }
});

test("manages modifier and allergen masters with idempotent item assignments", async () => {
  const persistence = createQcafePersistence(
    { localDatabasePath: ":memory:", mode: "local" },
    createQcafeLifecyclePlans(),
  );
  try {
    await persistence.initialize();
    const now = () => new Date("2026-09-20T10:00:00.000Z");
    const activity = new ActivityRepository(persistence.database(), now);
    const foundation = new FoundationSetupService(
      new FoundationSetupRepository(persistence.database()),
      { localDatabasePath: ":memory:", mode: "local" },
      activity,
      now,
    );
    const setup = await foundation.createBusiness(
      {
        businessName: "Q Cafe",
        currency: "INR",
        locationCode: "MAIN",
        locationName: "Main Road",
        timezone: "Asia/Calcutta",
      },
      context,
    );
    const business = setup.businesses[0]!;
    const menuRepository = new MenuRepository(persistence.database());
    const menu = new MenuService(menuRepository, activity, now);
    let catalog = await menu.createCategory(
      { businessId: business.id, code: "DRINKS", name: "Drinks", sortOrder: 1 },
      context,
    );
    catalog = await menu.createItem(
      {
        businessId: business.id,
        categoryId: catalog.categories[0]!.id,
        code: "COFFEE",
        itemType: "beverage",
        name: "Coffee",
      },
      context,
    );
    const item = catalog.items[0]!;
    const customization = new MenuCustomizationService(
      new MenuCustomizationRepository(persistence.database()),
      menu,
      activity,
      now,
    );

    await assert.rejects(
      customization.createModifierGroup(
        { businessId: business.id, code: "BAD", maxSelections: 1, minSelections: 2, name: "Invalid" },
        context,
      ),
      MenuConflictError,
    );
    catalog = await customization.createModifierGroup(
      { businessId: business.id, code: "MILK", maxSelections: 1, minSelections: 0, name: "Milk choice" },
      context,
    );
    const group = catalog.modifierGroups[0]!;
    catalog = await customization.createModifierOption(
      { businessId: business.id, code: "OAT", groupId: group.id, name: "Oat milk", priceAdjustmentMinor: 500 },
      context,
    );
    await customization.assignModifierGroup(
      { businessId: business.id, groupId: group.id, itemId: item.id, sortOrder: 1 },
      context,
    );
    catalog = await customization.assignModifierGroup(
      { businessId: business.id, groupId: group.id, itemId: item.id, sortOrder: 1 },
      context,
    );

    assert.equal(catalog.modifierGroups[0]?.options[0]?.priceAdjustmentMinor, 500);
    assert.equal(catalog.itemModifierGroups.length, 1);
    catalog = await customization.createAllergenTag(
      { businessId: business.id, code: "MILK", name: "Milk", severity: "medium" },
      context,
    );
    const allergen = catalog.allergenTags[0]!;
    await customization.assignAllergen(
      { allergenTagId: allergen.id, businessId: business.id, itemId: item.id, note: "Optional milk" },
      context,
    );
    catalog = await customization.assignAllergen(
      { allergenTagId: allergen.id, businessId: business.id, itemId: item.id, note: "Optional milk" },
      context,
    );

    assert.equal(catalog.itemAllergens.length, 1);
    const customizationEvents = await persistence
      .database()
      .selectFrom("qcafe_activity_events")
      .select("event_type")
      .where("event_type", "like", "qcafe.menu.%")
      .execute();
    assert.ok(customizationEvents.some((event) => event.event_type === "qcafe.menu.modifier-option.created"));
    assert.ok(customizationEvents.some((event) => event.event_type === "qcafe.menu.allergen.assigned"));
  } finally {
    await persistence.destroy();
  }
});

test("blocks saleability until every catalog, price, availability, and modifier condition passes", async () => {
  const persistence = createQcafePersistence(
    { localDatabasePath: ":memory:", mode: "local" },
    createQcafeLifecyclePlans(),
  );
  try {
    await persistence.initialize();
    const now = () => new Date("2026-09-20T11:00:00.000Z");
    const activity = new ActivityRepository(persistence.database(), now);
    const foundation = new FoundationSetupService(
      new FoundationSetupRepository(persistence.database()),
      { localDatabasePath: ":memory:", mode: "local" },
      activity,
      now,
    );
    const setup = await foundation.createBusiness(
      {
        businessName: "Q Cafe",
        currency: "INR",
        locationCode: "MAIN",
        locationName: "Main Road",
        timezone: "Asia/Calcutta",
      },
      context,
    );
    const business = setup.businesses[0]!;
    const location = business.locations[0]!;
    const channel = location.serviceChannels.find((entry) => entry.kind === "counter")!;
    const menuRepository = new MenuRepository(persistence.database());
    const menu = new MenuService(menuRepository, activity, now);
    const availability = new MenuAvailabilityService(
      new MenuAvailabilityRepository(persistence.database()),
      menu,
      activity,
      now,
    );
    const customization = new MenuCustomizationService(
      new MenuCustomizationRepository(persistence.database()),
      menu,
      activity,
      now,
    );
    const campaigns = new MenuCampaignService(new MenuCampaignRepository(persistence.database()), menu, activity, now);
    const saleability = new MenuSaleabilityService(
      new MenuSaleabilityRepository(persistence.database()),
      availability,
      campaigns,
    );

    let catalog = await menu.createCategory(
      { businessId: business.id, code: "FOOD", name: "Food", sortOrder: 1 },
      context,
    );
    catalog = await menu.createItem(
      { businessId: business.id, categoryId: catalog.categories[0]!.id, code: "MEAL", itemType: "food", name: "Meal" },
      context,
    );
    catalog = await menu.createPriceBook(
      { businessId: business.id, code: "STANDARD", currency: "INR", name: "Standard" },
      context,
    );
    const item = catalog.items[0]!;
    const priceBook = catalog.priceBooks[0]!;
    const input = {
      at: "2026-09-20T11:00:00.000Z",
      businessId: business.id,
      itemId: item.id,
      locationId: location.id,
      priceBookId: priceBook.id,
      serviceChannelId: channel.id,
    };

    assert.deepEqual((await saleability.effective(input)).reasons, ["price_missing"]);
    await menu.setPrice(
      { amountMinor: 12500, itemId: item.id, priceBookId: priceBook.id, validFrom: "2026-01-01" },
      business.id,
      context,
    );
    assert.equal((await saleability.assertSaleable(input)).price?.amountMinor, 12500);

    catalog = await customization.createModifierGroup(
      { businessId: business.id, code: "SIDE", maxSelections: 1, minSelections: 1, name: "Required side" },
      context,
    );
    const group = catalog.modifierGroups[0]!;
    await customization.assignModifierGroup(
      { businessId: business.id, groupId: group.id, itemId: item.id, sortOrder: 1 },
      context,
    );
    const invalidModifiers = await saleability.effective(input);
    assert.deepEqual(invalidModifiers.reasons, ["modifier_configuration_invalid"]);
    assert.deepEqual(invalidModifiers.invalidModifierGroupIds, [group.id]);

    await customization.createModifierOption(
      { businessId: business.id, code: "SALAD", groupId: group.id, name: "Salad", priceAdjustmentMinor: 0 },
      context,
    );
    assert.equal((await saleability.effective(input)).saleable, true);

    await availability.create(
      {
        businessId: business.id,
        itemId: item.id,
        locationId: location.id,
        reason: "Sold out",
        startsAt: "2026-09-20T10:00:00.000Z",
        status: "unavailable",
      },
      context,
    );
    assert.deepEqual((await saleability.effective(input)).reasons, ["item_unavailable"]);
    await assert.rejects(saleability.assertSaleable(input), MenuNotSaleableError);

    await persistence.database().updateTable("qcafe_menu_items").set({ active: 0 }).where("id", "=", item.id).execute();
    assert.deepEqual((await saleability.effective(input)).reasons, ["item_inactive", "item_unavailable"]);
  } finally {
    await persistence.destroy();
  }
});
