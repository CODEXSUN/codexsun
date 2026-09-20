import assert from "node:assert/strict";
import test from "node:test";
import { ActivityRepository } from "../../foundation/repository/activity.repository.js";
import { FoundationSetupRepository } from "../../foundation/repository/foundation-setup.repository.js";
import { FoundationSetupService } from "../../foundation/services/foundation-setup.service.js";
import { createQcafePersistence } from "../../foundation/persistence/qcafe-persistence.js";
import { createQcafeLifecyclePlans } from "../../../qcafe-lifecycle-plans.js";
import { MenuRepository } from "../repository/menu.repository.js";
import { MenuAvailabilityRepository } from "../repository/menu-availability.repository.js";
import { MenuCampaignRepository } from "../repository/menu-campaign.repository.js";
import { MenuSaleabilityRepository } from "../repository/menu-saleability.repository.js";
import { MenuAvailabilityService } from "../services/menu-availability.service.js";
import { MenuCampaignService } from "../services/menu-campaign.service.js";
import { MenuSaleabilityService } from "../services/menu-saleability.service.js";
import { MenuConflictError, MenuService } from "../services/menu.service.js";

const context = { actorId: "menu-manager", correlationId: "22222222-2222-4222-8222-222222222222" };

test("treats menu price start and end dates as inclusive boundaries", async () => {
  const fixture = await createMenuFixture("2026-09-20T12:00:00.000Z");
  try {
    let catalog = await fixture.menu.createCategory(
      { businessId: fixture.business.id, code: "FOOD", name: "Food", sortOrder: 1 },
      context,
    );
    catalog = await fixture.menu.createItem(
      {
        businessId: fixture.business.id,
        categoryId: catalog.categories[0]!.id,
        code: "MEAL",
        itemType: "food",
        name: "Meal",
      },
      context,
    );
    catalog = await fixture.menu.createPriceBook(
      { businessId: fixture.business.id, code: "STANDARD", currency: "INR", name: "Standard" },
      context,
    );
    const item = catalog.items[0]!;
    const priceBook = catalog.priceBooks[0]!;

    await assert.rejects(
      fixture.menu.setPrice(
        {
          amountMinor: 9000,
          itemId: item.id,
          priceBookId: priceBook.id,
          validFrom: "2026-09-20",
          validTo: "2026-09-19",
        },
        fixture.business.id,
        context,
      ),
      MenuConflictError,
    );
    await fixture.menu.setPrice(
      {
        amountMinor: 10000,
        itemId: item.id,
        priceBookId: priceBook.id,
        validFrom: "2026-09-20",
        validTo: "2026-09-22",
      },
      fixture.business.id,
      context,
    );

    assert.equal(
      await fixture.menu.findEffectivePrice({ businessDate: "2026-09-19", itemId: item.id, priceBookId: priceBook.id }),
      null,
    );
    assert.equal(
      (
        await fixture.menu.findEffectivePrice({
          businessDate: "2026-09-20",
          itemId: item.id,
          priceBookId: priceBook.id,
        })
      )?.amountMinor,
      10000,
    );
    assert.equal(
      (
        await fixture.menu.findEffectivePrice({
          businessDate: "2026-09-22",
          itemId: item.id,
          priceBookId: priceBook.id,
        })
      )?.amountMinor,
      10000,
    );
    assert.equal(
      await fixture.menu.findEffectivePrice({ businessDate: "2026-09-23", itemId: item.id, priceBookId: priceBook.id }),
      null,
    );

    await fixture.menu.setPrice(
      {
        amountMinor: 11000,
        itemId: item.id,
        priceBookId: priceBook.id,
        validFrom: "2026-09-21",
        validTo: "2026-09-21",
      },
      fixture.business.id,
      context,
    );
    assert.equal(
      (
        await fixture.menu.findEffectivePrice({
          businessDate: "2026-09-21",
          itemId: item.id,
          priceBookId: priceBook.id,
        })
      )?.amountMinor,
      11000,
    );
  } finally {
    await fixture.persistence.destroy();
  }
});

test("rejects duplicate catalog codes within their owner scope", async () => {
  const fixture = await createMenuFixture("2026-09-20T12:30:00.000Z");
  try {
    let catalog = await fixture.menu.createCategory(
      { businessId: fixture.business.id, code: "FOOD", name: "Food", sortOrder: 1 },
      context,
    );
    await assert.rejects(
      fixture.menu.createCategory(
        { businessId: fixture.business.id, code: "FOOD", name: "Second food", sortOrder: 2 },
        context,
      ),
      MenuConflictError,
    );
    catalog = await fixture.menu.createItem(
      {
        businessId: fixture.business.id,
        categoryId: catalog.categories[0]!.id,
        code: "MEAL",
        itemType: "food",
        name: "Meal",
      },
      context,
    );
    await assert.rejects(
      fixture.menu.createItem(
        {
          businessId: fixture.business.id,
          categoryId: catalog.categories[0]!.id,
          code: "MEAL",
          itemType: "food",
          name: "Other meal",
        },
        context,
      ),
      MenuConflictError,
    );
    catalog = await fixture.menu.createVariant(
      { code: "LG", itemId: catalog.items[0]!.id, name: "Large" },
      fixture.business.id,
      context,
    );
    await assert.rejects(
      fixture.menu.createVariant(
        { code: "LG", itemId: catalog.items[0]!.id, name: "Larger" },
        fixture.business.id,
        context,
      ),
      MenuConflictError,
    );
    await fixture.menu.createPriceBook(
      { businessId: fixture.business.id, code: "STANDARD", currency: "INR", name: "Standard" },
      context,
    );
    await assert.rejects(
      fixture.menu.createPriceBook(
        { businessId: fixture.business.id, code: "STANDARD", currency: "INR", name: "Second standard" },
        context,
      ),
      MenuConflictError,
    );

    const setup = await fixture.foundation.createBusiness(
      {
        businessName: "Q Cafe Annex",
        currency: "INR",
        locationCode: "MAIN",
        locationName: "Annex",
        timezone: "Asia/Calcutta",
      },
      context,
    );
    const annex = setup.businesses.find((business) => business.name === "Q Cafe Annex")!;
    const annexCatalog = await fixture.menu.createCategory(
      { businessId: annex.id, code: "FOOD", name: "Food", sortOrder: 1 },
      context,
    );
    assert.equal(annexCatalog.categories.length, 1);
  } finally {
    await fixture.persistence.destroy();
  }
});

test("reports each inactive catalog level through saleability", async () => {
  const fixture = await createMenuFixture("2026-09-20T13:00:00.000Z");
  try {
    let catalog = await fixture.menu.createCategory(
      { businessId: fixture.business.id, code: "DRINKS", name: "Drinks", sortOrder: 1 },
      context,
    );
    const category = catalog.categories[0]!;
    catalog = await fixture.menu.createItem(
      {
        businessId: fixture.business.id,
        categoryId: category.id,
        code: "COFFEE",
        itemType: "beverage",
        name: "Coffee",
      },
      context,
    );
    const item = catalog.items[0]!;
    catalog = await fixture.menu.createVariant(
      { code: "LG", itemId: item.id, name: "Large" },
      fixture.business.id,
      context,
    );
    const variant = catalog.items[0]!.variants[0]!;
    catalog = await fixture.menu.createPriceBook(
      { businessId: fixture.business.id, code: "STANDARD", currency: "INR", name: "Standard" },
      context,
    );
    const priceBook = catalog.priceBooks[0]!;
    await fixture.menu.setPrice(
      { amountMinor: 6500, itemId: item.id, priceBookId: priceBook.id, validFrom: "2026-01-01", variantId: variant.id },
      fixture.business.id,
      context,
    );
    const saleability = new MenuSaleabilityService(
      new MenuSaleabilityRepository(fixture.persistence.database()),
      fixture.availability,
      fixture.campaigns,
    );
    const input = {
      at: "2026-09-20T13:00:00.000Z",
      businessId: fixture.business.id,
      itemId: item.id,
      locationId: fixture.location.id,
      priceBookId: priceBook.id,
      variantId: variant.id,
    };
    assert.equal((await saleability.effective(input)).saleable, true);

    await fixture.persistence
      .database()
      .updateTable("qcafe_menu_categories")
      .set({ active: 0 })
      .where("id", "=", category.id)
      .execute();
    assert.deepEqual((await saleability.effective(input)).reasons, ["category_inactive"]);
    await fixture.persistence
      .database()
      .updateTable("qcafe_menu_categories")
      .set({ active: 1 })
      .where("id", "=", category.id)
      .execute();
    await fixture.persistence
      .database()
      .updateTable("qcafe_menu_items")
      .set({ active: 0 })
      .where("id", "=", item.id)
      .execute();
    assert.deepEqual((await saleability.effective(input)).reasons, ["item_inactive"]);
    await fixture.persistence
      .database()
      .updateTable("qcafe_menu_items")
      .set({ active: 1 })
      .where("id", "=", item.id)
      .execute();
    await fixture.persistence
      .database()
      .updateTable("qcafe_menu_variants")
      .set({ active: 0 })
      .where("id", "=", variant.id)
      .execute();
    assert.deepEqual((await saleability.effective(input)).reasons, ["variant_inactive"]);
    await fixture.persistence
      .database()
      .updateTable("qcafe_menu_variants")
      .set({ active: 1 })
      .where("id", "=", variant.id)
      .execute();
    await fixture.persistence
      .database()
      .updateTable("qcafe_price_books")
      .set({ active: 0 })
      .where("id", "=", priceBook.id)
      .execute();
    assert.deepEqual((await saleability.effective(input)).reasons, ["price_book_ineligible"]);
  } finally {
    await fixture.persistence.destroy();
  }
});

test("applies availability start inclusively, end exclusively, and rejects invalid windows", async () => {
  const fixture = await createMenuFixture("2026-09-20T14:00:00.000Z");
  try {
    let catalog = await fixture.menu.createCategory(
      { businessId: fixture.business.id, code: "FOOD", name: "Food", sortOrder: 1 },
      context,
    );
    catalog = await fixture.menu.createItem(
      {
        businessId: fixture.business.id,
        categoryId: catalog.categories[0]!.id,
        code: "MEAL",
        itemType: "food",
        name: "Meal",
      },
      context,
    );
    const item = catalog.items[0]!;
    await assert.rejects(
      fixture.availability.create(
        {
          businessId: fixture.business.id,
          endsAt: "2026-09-20T10:00:00.000Z",
          itemId: item.id,
          locationId: fixture.location.id,
          startsAt: "2026-09-20T10:00:00.000Z",
          status: "unavailable",
        },
        context,
      ),
      MenuConflictError,
    );
    await fixture.availability.create(
      {
        businessId: fixture.business.id,
        endsAt: "2026-09-20T11:00:00.000Z",
        itemId: item.id,
        locationId: fixture.location.id,
        reason: "Breakfast pause",
        startsAt: "2026-09-20T10:00:00.000Z",
        status: "unavailable",
      },
      context,
    );

    assert.equal(
      (
        await fixture.availability.effective({
          at: "2026-09-20T09:59:59.999Z",
          itemId: item.id,
          locationId: fixture.location.id,
        })
      ).available,
      true,
    );
    assert.equal(
      (
        await fixture.availability.effective({
          at: "2026-09-20T10:00:00.000Z",
          itemId: item.id,
          locationId: fixture.location.id,
        })
      ).available,
      false,
    );
    assert.equal(
      (
        await fixture.availability.effective({
          at: "2026-09-20T10:59:59.999Z",
          itemId: item.id,
          locationId: fixture.location.id,
        })
      ).available,
      false,
    );
    assert.equal(
      (
        await fixture.availability.effective({
          at: "2026-09-20T11:00:00.000Z",
          itemId: item.id,
          locationId: fixture.location.id,
        })
      ).available,
      true,
    );

    const setup = await fixture.foundation.createLocation(
      { businessId: fixture.business.id, code: "SECOND", name: "Second Outlet", timezone: "Asia/Calcutta" },
      context,
    );
    const secondLocation = setup.businesses[0]!.locations.find((location) => location.code === "SECOND")!;
    await assert.rejects(
      fixture.availability.create(
        {
          businessId: fixture.business.id,
          itemId: item.id,
          locationId: fixture.location.id,
          serviceChannelId: secondLocation.serviceChannels[0]!.id,
          startsAt: "2026-09-20T12:00:00.000Z",
          status: "unavailable",
        },
        context,
      ),
      MenuConflictError,
    );
  } finally {
    await fixture.persistence.destroy();
  }
});

async function createMenuFixture(instant: string) {
  const persistence = createQcafePersistence(
    { localDatabasePath: ":memory:", mode: "local" },
    createQcafeLifecyclePlans(),
  );
  await persistence.initialize();
  const now = () => new Date(instant);
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
  const menu = new MenuService(new MenuRepository(persistence.database()), activity, now);
  const availability = new MenuAvailabilityService(
    new MenuAvailabilityRepository(persistence.database()),
    menu,
    activity,
    now,
  );
  const campaigns = new MenuCampaignService(new MenuCampaignRepository(persistence.database()), menu, activity, now);
  return { activity, availability, business, campaigns, foundation, location, menu, persistence };
}
