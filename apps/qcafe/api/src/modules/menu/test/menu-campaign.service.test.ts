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

test("validates campaign scopes, schedules, and special price rules", async () => {
  const fixture = await createMenuFixture("2026-09-20T15:00:00.000Z");
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
    const baseCampaign = {
      businessId: fixture.business.id,
      endsAt: "2026-09-20T18:00:00.000Z",
      name: "Evening special",
      priority: 10,
      scope: "business" as const,
      startsAt: "2026-09-20T16:00:00.000Z",
      status: "active" as const,
    };

    await assert.rejects(
      fixture.campaigns.createCampaign({ ...baseCampaign, locationId: fixture.location.id }, context),
      MenuConflictError,
    );
    await assert.rejects(
      fixture.campaigns.createCampaign({ ...baseCampaign, endsAt: baseCampaign.startsAt }, context),
      MenuConflictError,
    );
    catalog = await fixture.campaigns.createCampaign(baseCampaign, context);
    const campaign = catalog.specialCampaigns[0]!;
    await assert.rejects(
      fixture.campaigns.createSpecialPrice(
        { businessId: fixture.business.id, campaignId: campaign.id, itemId: item.id },
        context,
      ),
      MenuConflictError,
    );
    await assert.rejects(
      fixture.campaigns.createSpecialPrice(
        {
          amountMinor: 5000,
          businessId: fixture.business.id,
          campaignId: campaign.id,
          discountBasisPoints: 500,
          itemId: item.id,
        },
        context,
      ),
      MenuConflictError,
    );
    catalog = await fixture.campaigns.createSpecialPrice(
      {
        businessId: fixture.business.id,
        campaignId: campaign.id,
        discountBasisPoints: 1000,
        itemId: item.id,
        usageLimit: 20,
      },
      context,
    );

    assert.equal(catalog.specialPrices[0]?.discountBasisPoints, 1000);
    await assert.rejects(
      fixture.campaigns.createSpecialPrice(
        { amountMinor: 8000, businessId: fixture.business.id, campaignId: campaign.id, itemId: item.id },
        context,
      ),
      MenuConflictError,
    );
    const events = await fixture.persistence
      .database()
      .selectFrom("qcafe_activity_events")
      .select("event_type")
      .where("event_type", "like", "qcafe.menu.special-%")
      .execute();
    assert.deepEqual(events.map((event) => event.event_type).sort(), [
      "qcafe.menu.special-campaign.created",
      "qcafe.menu.special-price.created",
    ]);
  } finally {
    await fixture.persistence.destroy();
  }
});

test("resolves campaign pricing by schedule, priority, outlet, variant, and usage limit", async () => {
  const fixture = await createMenuFixture("2026-09-20T15:30:00.000Z");
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
      {
        amountMinor: 10000,
        itemId: item.id,
        priceBookId: priceBook.id,
        validFrom: "2026-01-01",
        variantId: variant.id,
      },
      fixture.business.id,
      context,
    );
    catalog = await fixture.campaigns.createCampaign(
      {
        businessId: fixture.business.id,
        endsAt: "2026-09-20T18:00:00.000Z",
        name: "Festival discount",
        priority: 10,
        scope: "business",
        startsAt: "2026-09-20T16:00:00.000Z",
        status: "active",
      },
      context,
    );
    const businessCampaign = catalog.specialCampaigns.find((campaign) => campaign.name === "Festival discount")!;
    await fixture.campaigns.createSpecialPrice(
      {
        businessId: fixture.business.id,
        campaignId: businessCampaign.id,
        discountBasisPoints: 1000,
        itemId: item.id,
        variantId: variant.id,
      },
      context,
    );
    catalog = await fixture.campaigns.createCampaign(
      {
        businessId: fixture.business.id,
        endsAt: "2026-09-20T18:00:00.000Z",
        locationId: fixture.location.id,
        name: "Outlet flash price",
        priority: 20,
        scope: "location",
        startsAt: "2026-09-20T16:00:00.000Z",
        status: "active",
      },
      context,
    );
    const locationCampaign = catalog.specialCampaigns.find((campaign) => campaign.name === "Outlet flash price")!;
    catalog = await fixture.campaigns.createSpecialPrice(
      {
        amountMinor: 7000,
        businessId: fixture.business.id,
        campaignId: locationCampaign.id,
        itemId: item.id,
        usageLimit: 1,
        variantId: variant.id,
      },
      context,
    );
    const limitedPrice = catalog.specialPrices.find((price) => price.campaignId === locationCampaign.id)!;
    const input = {
      at: "2026-09-20T16:00:00.000Z",
      businessId: fixture.business.id,
      itemId: item.id,
      locationId: fixture.location.id,
      priceBookId: priceBook.id,
      variantId: variant.id,
    };

    assert.equal((await fixture.campaigns.effective({ ...input, at: "2026-09-20T15:59:59.999Z" })).source, "normal");
    const flashPrice = await fixture.campaigns.effective(input);
    assert.equal(flashPrice.amountMinor, 7000);
    assert.equal(flashPrice.campaign?.id, locationCampaign.id);
    const saleability = new MenuSaleabilityService(
      new MenuSaleabilityRepository(fixture.persistence.database()),
      fixture.availability,
      fixture.campaigns,
    );
    assert.equal((await saleability.assertSaleable(input)).effectiveAmountMinor, 7000);

    await fixture.persistence
      .database()
      .updateTable("qcafe_special_prices")
      .set({ used_count: 1 })
      .where("id", "=", limitedPrice.id)
      .execute();
    const fallback = await fixture.campaigns.effective(input);
    assert.equal(fallback.amountMinor, 9000);
    assert.equal(fallback.campaign?.id, businessCampaign.id);
    assert.equal((await fixture.campaigns.effective({ ...input, at: "2026-09-20T18:00:00.000Z" })).source, "normal");
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
