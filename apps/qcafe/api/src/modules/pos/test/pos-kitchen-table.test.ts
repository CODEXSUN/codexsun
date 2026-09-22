import assert from "node:assert/strict";
import test from "node:test";
import { ActivityRepository } from "../../foundation/repository/activity.repository.js";
import { FoundationSetupRepository } from "../../foundation/repository/foundation-setup.repository.js";
import { FoundationSetupService } from "../../foundation/services/foundation-setup.service.js";
import { createQcafePersistence } from "../../foundation/persistence/qcafe-persistence.js";
import { MenuRepository } from "../../menu/repository/menu.repository.js";
import { MenuAvailabilityRepository } from "../../menu/repository/menu-availability.repository.js";
import { MenuCampaignRepository } from "../../menu/repository/menu-campaign.repository.js";
import { MenuSaleabilityRepository } from "../../menu/repository/menu-saleability.repository.js";
import { MenuAvailabilityService } from "../../menu/services/menu-availability.service.js";
import { MenuCampaignService } from "../../menu/services/menu-campaign.service.js";
import { MenuSaleabilityService } from "../../menu/services/menu-saleability.service.js";
import { MenuService } from "../../menu/services/menu.service.js";
import { TableServiceRepository } from "../../booking/repository/table-service.repository.js";
import { TableServiceService } from "../../booking/services/table-service.service.js";
import { KitchenRepository } from "../../kitchen/repository/kitchen.repository.js";
import { KitchenService } from "../../kitchen/services/kitchen.service.js";
import { createQcafeLifecyclePlans } from "../../../qcafe-lifecycle-plans.js";
import { PosRepository } from "../repository/pos.repository.js";
import { PosService } from "../services/pos.service.js";

const context = { actorId: "floor-manager", correlationId: "33333333-3333-4333-8333-333333333333" };
const now = () => new Date("2026-09-20T08:00:00.000Z");

test("runs dine-in KOT and takeaway flows through durable records", async () => {
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
  assert.equal(location.serviceChannels.length, 7);

  const menu = new MenuService(new MenuRepository(database), activity, now);
  let catalog = await menu.createCategory(
    { businessId: business.id, code: "FOOD", name: "Food", sortOrder: 1 },
    context,
  );
  catalog = await menu.createItem(
    {
      businessId: business.id,
      categoryId: catalog.categories[0]!.id,
      code: "DOSA",
      itemType: "food",
      name: "Masala dosa",
    },
    context,
  );
  catalog = await menu.createPriceBook(
    { businessId: business.id, code: "STANDARD", currency: "INR", name: "Standard" },
    context,
  );
  const item = catalog.items[0]!;
  const priceBook = catalog.priceBooks[0]!;
  await menu.setPrice(
    { amountMinor: 12500, itemId: item.id, priceBookId: priceBook.id, validFrom: "2026-01-01" },
    business.id,
    context,
  );
  const availability = new MenuAvailabilityService(new MenuAvailabilityRepository(database), menu, activity, now);
  const campaigns = new MenuCampaignService(new MenuCampaignRepository(database), menu, activity);
  const saleability = new MenuSaleabilityService(new MenuSaleabilityRepository(database), availability, campaigns);
  const pos = new PosService(new PosRepository(database), menu, saleability, activity, now);
  const kitchen = new KitchenService(new KitchenRepository(database), pos, activity, now);
  const tables = new TableServiceService(
    new TableServiceRepository(database),
    activity,
    async (orderId) => {
      const snapshot = await pos.snapshot(orderId);
      return Boolean(snapshot && ["cancelled", "fulfilled"].includes(snapshot.order.status));
    },
    now,
  );

  let tableState = await tables.area(
    { businessId: business.id, kind: "dining", locationId: location.id, name: "Main dining", sortOrder: 1 },
    context,
  );
  tableState = await tables.table(
    {
      areaId: tableState.areas[0]!.id,
      businessId: business.id,
      capacity: 4,
      code: "T01",
      locationId: location.id,
    },
    context,
  );
  tableState = await tables.open(
    {
      businessId: business.id,
      guestCount: 3,
      locationId: location.id,
      tableIds: [tableState.tables[0]!.id],
    },
    context,
  );
  const session = tableState.sessions[0]!;
  let kitchenState = await kitchen.station(
    { businessId: business.id, code: "HOT", locationId: location.id, name: "Hot kitchen" },
    context,
  );
  kitchenState = await kitchen.route(
    {
      businessId: business.id,
      itemId: item.id,
      locationId: location.id,
      priority: 10,
      stationId: kitchenState.stations[0]!.id,
    },
    context,
  );

  const dineIn = location.serviceChannels.find((channel) => channel.kind === "dine_in")!;
  let orders = await pos.create(
    {
      businessId: business.id,
      customerName: "Asha",
      locationId: location.id,
      priceBookId: priceBook.id,
      serviceChannelId: dineIn.id,
      tableSessionId: session.id,
    },
    context,
  );
  const order = orders.orders[0]!;
  orders = await pos.addLine(order.id, { itemId: item.id, modifiers: [], note: "Crisp", quantity: 1 }, context);
  const line = orders.lines[0]!;
  orders = await pos.changeLine(order.id, line.id, { quantity: 2 }, context);
  assert.equal(orders.orders[0]!.total_minor, 25000);
  await pos.action(order.id, "hold", undefined, context);
  await pos.action(order.id, "resume", undefined, context);
  await pos.adjust(order.id, { amountMinor: 1000, kind: "discount", reason: "Manager approval" }, context);
  await pos.note(order.id, { content: "Anniversary table", noteKind: "internal", visibility: "internal" }, context);
  await pos.action(order.id, "confirm", undefined, context);
  await kitchen.fireOrder(order.id, context);

  kitchenState = await kitchen.read(business.id, location.id);
  const ticket = kitchenState.tickets[0]!;
  assert.equal(kitchenState.lines.length, 1);
  await kitchen.print(ticket.id, "windows:HOT", context);
  await kitchen.print(ticket.id, "windows:HOT", context);
  await kitchen.action(ticket.id, "accept", undefined, context);
  await kitchen.action(ticket.id, "prepare", undefined, context);
  await kitchen.action(ticket.id, "ready", undefined, context);
  await kitchen.action(ticket.id, "recall", "Needs another minute", context);
  await kitchen.action(ticket.id, "prepare", undefined, context);
  await kitchen.action(ticket.id, "ready", undefined, context);
  await kitchen.assertOrderReady(order.id);
  await kitchen.action(ticket.id, "serve", undefined, context);
  await pos.action(order.id, "fulfill", undefined, context);
  tableState = await tables.close(session.id, context);
  assert.equal(tableState.sessions[0]!.status, "closed");

  const takeaway = location.serviceChannels.find((channel) => channel.kind === "takeaway")!;
  orders = await pos.create(
    {
      businessId: business.id,
      collectionName: "Ravi",
      contactRef: "+91 90000 00000",
      locationId: location.id,
      priceBookId: priceBook.id,
      serviceChannelId: takeaway.id,
    },
    context,
  );
  assert.equal(orders.takeawayDetails[0]!.collection_name, "Ravi");
  assert.match(orders.takeawayDetails[0]!.pickup_code, /^\d{4}$/);
  const takeawayOrder = orders.orders.find(
    (entry) => entry.service_channel_id === takeaway.id && entry.status === "draft",
  )!;
  await pos.addLine(takeawayOrder.id, { itemId: item.id, modifiers: [], quantity: 1 }, context);
  await pos.action(takeawayOrder.id, "confirm", undefined, context);
  await kitchen.fireOrder(takeawayOrder.id, context);
  kitchenState = await kitchen.read(business.id, location.id);
  const takeawayTicket = kitchenState.tickets.find((entry) => entry.order_id === takeawayOrder.id)!;
  await kitchen.action(takeawayTicket.id, "accept", undefined, context);
  await kitchen.action(takeawayTicket.id, "void", "Guest canceled item", context);
  await kitchen.assertOrderReady(takeawayOrder.id);
  assert.equal((await persistence.verify()).length, 15);
  assert.deepEqual(await persistence.initialize(), []);
  await persistence.destroy();
});
