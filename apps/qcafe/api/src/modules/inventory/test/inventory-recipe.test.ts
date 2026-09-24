import assert from "node:assert/strict";
import test from "node:test";
import { ActivityRepository } from "../../foundation/repository/activity.repository.js";
import { createQcafePersistence } from "../../foundation/persistence/qcafe-persistence.js";
import { FoundationSetupRepository } from "../../foundation/repository/foundation-setup.repository.js";
import { FoundationSetupService } from "../../foundation/services/foundation-setup.service.js";
import { MenuRepository } from "../../menu/repository/menu.repository.js";
import { MenuService } from "../../menu/services/menu.service.js";
import { createQcafeLifecyclePlans } from "../../../qcafe-lifecycle-plans.js";
import { InventoryRepository } from "../repository/inventory.repository.js";
import { InventoryConflictError, InventoryService } from "../services/inventory.service.js";

const context = { actorId: "manager-1", correlationId: "66666666-6666-4666-8666-666666666666" };
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
  const menu = new MenuService(new MenuRepository(database), activity, now);
  let catalog = await menu.createCategory(
    { businessId: business.id, code: "FOOD", name: "Food", sortOrder: 1 },
    context,
  );
  catalog = await menu.createItem(
    { businessId: business.id, categoryId: catalog.categories[0]!.id, code: "MEAL", itemType: "food", name: "Meal" },
    context,
  );
  const item = catalog.items[0]!;
  catalog = await menu.createVariant({ code: "REG", itemId: item.id, name: "Regular" }, business.id, context);
  const variant = catalog.items.find((entry) => entry.id === item.id)!.variants[0]!;
  const inventory = new InventoryService(new InventoryRepository(database), activity, now);
  const scope = { businessId: business.id, locationId: location.id };
  const unit = await inventory.createUnit({ ...scope, code: "KG", name: "Kilogram" }, context);
  const rice = await inventory.createItem(
    { ...scope, code: "RICE", name: "Rice", reorderLevelMilli: 0, trackStock: true, unitId: unit.id },
    context,
  );
  const dal = await inventory.createItem(
    { ...scope, code: "DAL", name: "Dal", reorderLevelMilli: 0, trackStock: true, unitId: unit.id },
    context,
  );
  return { business, inventory, item, location, rice, dal, variant };
}

test("keeps effective dates and source history across recipe revisions", async () => {
  const { business, inventory, item, location, rice, dal, variant } = await setup();
  const scope = { businessId: business.id, locationId: location.id };
  const created = await inventory.createRecipe(
    {
      ...scope,
      code: "MEAL-STD",
      components: [{ quantityMilli: 200, stockItemId: rice.id }],
      effectiveFrom: "2026-09-01",
      menuItemId: item.id,
      menuVariantId: variant.id,
      name: "Standard meal",
    },
    context,
  );
  let state = await inventory.read(scope);
  assert.equal(state.recipes.length, 1);
  assert.equal(state.recipes[0]!.revision_no, 1);
  assert.equal(state.recipes[0]!.effective_from, "2026-09-01");
  assert.equal(state.recipes[0]!.source_recipe_id, null);
  assert.equal(state.recipeComponents.length, 1);

  const revised = await inventory.reviseRecipe(
    created.id,
    {
      changeReason: "Add dal portion",
      components: [
        { quantityMilli: 200, stockItemId: rice.id },
        { quantityMilli: 100, stockItemId: dal.id },
      ],
      effectiveFrom: "2026-10-01",
    },
    context,
  );
  state = await inventory.read(scope);
  assert.equal(state.recipes.length, 2);
  const next = state.recipes.find((recipe) => recipe.id === revised.id)!;
  const prior = state.recipes.find((recipe) => recipe.id === created.id)!;
  assert.equal(next.revision_no, 2);
  assert.equal(next.effective_from, "2026-10-01");
  assert.equal(next.source_recipe_id, created.id);
  assert.equal(next.change_reason, "Add dal portion");
  assert.equal(prior.status, "superseded");
  assert.equal(state.recipeComponents.filter((row) => row.recipe_id === revised.id).length, 2);
});

test("rejects duplicate components, untracked items, and backward revisions", async () => {
  const { business, inventory, item, location, rice } = await setup();
  const scope = { businessId: business.id, locationId: location.id };
  const created = await inventory.createRecipe(
    {
      ...scope,
      code: "MEAL-STD",
      components: [{ quantityMilli: 200, stockItemId: rice.id }],
      effectiveFrom: "2026-09-01",
      menuItemId: item.id,
      name: "Standard meal",
    },
    context,
  );
  await assert.rejects(
    inventory.createRecipe(
      {
        ...scope,
        code: "MEAL-STD",
        components: [{ quantityMilli: 100, stockItemId: rice.id }],
        effectiveFrom: "2026-10-01",
        menuItemId: item.id,
        name: "Duplicate code",
      },
      context,
    ),
    InventoryConflictError,
  );
  await assert.rejects(
    inventory.createRecipe(
      {
        ...scope,
        code: "MEAL-BAD",
        components: [
          { quantityMilli: 100, stockItemId: rice.id },
          { quantityMilli: 50, stockItemId: rice.id },
        ],
        effectiveFrom: "2026-09-01",
        menuItemId: item.id,
        name: "Duplicated component",
      },
      context,
    ),
    InventoryConflictError,
  );
  await assert.rejects(
    inventory.reviseRecipe(created.id, { changeReason: "Backdate", effectiveFrom: "2026-08-01" }, context),
    InventoryConflictError,
  );
});
