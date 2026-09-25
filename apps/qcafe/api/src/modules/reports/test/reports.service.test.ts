import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { ActivityRepository } from "../../foundation/repository/activity.repository.js";
import { createQcafePersistence } from "../../foundation/persistence/qcafe-persistence.js";
import { FoundationSetupRepository } from "../../foundation/repository/foundation-setup.repository.js";
import { FoundationSetupService } from "../../foundation/services/foundation-setup.service.js";
import { MenuAvailabilityRepository } from "../../menu/repository/menu-availability.repository.js";
import { MenuCampaignRepository } from "../../menu/repository/menu-campaign.repository.js";
import { MenuRepository } from "../../menu/repository/menu.repository.js";
import { MenuAvailabilityService } from "../../menu/services/menu-availability.service.js";
import { MenuCampaignService } from "../../menu/services/menu-campaign.service.js";
import { MenuSaleabilityRepository } from "../../menu/repository/menu-saleability.repository.js";
import { MenuSaleabilityService } from "../../menu/services/menu-saleability.service.js";
import { MenuService } from "../../menu/services/menu.service.js";
import { PosRepository } from "../../pos/repository/pos.repository.js";
import { PosService } from "../../pos/services/pos.service.js";
import { BillingRepository } from "../../billing/repository/billing.repository.js";
import { BillingService } from "../../billing/services/billing.service.js";
import { InventoryRepository } from "../../inventory/repository/inventory.repository.js";
import { InventoryService } from "../../inventory/services/inventory.service.js";
import { DocumentsRepository } from "../../documents/repository/documents.repository.js";
import { DocumentsService } from "../../documents/services/documents.service.js";
import { createQcafeLifecyclePlans } from "../../../qcafe-lifecycle-plans.js";
import { ReportsRepository } from "../repository/reports.repository.js";
import { ReportsService } from "../services/reports.service.js";

const context = { actorId: "manager-1", correlationId: "22222222-3333-4444-8444-666666666666" };
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
  let setupState = await foundation.createBusiness(
    {
      businessName: "Q Cafe",
      currency: "INR",
      locationCode: "MAIN",
      locationName: "Main outlet",
      timezone: "Asia/Calcutta",
    },
    context,
  );
  const business = setupState.businesses[0]!;
  const location = business.locations[0]!;
  setupState = await foundation.openBusinessDay(location.id, "2026-09-24", context);
  const businessDay = setupState.businesses[0]!.locations[0]!.businessDay!;
  await persistence.initialize();
  const menu = new MenuService(new MenuRepository(database), activity, now);
  let catalog = await menu.createCategory(
    { businessId: business.id, code: "FOOD", name: "Food", sortOrder: 1 },
    context,
  );
  catalog = await menu.createItem(
    {
      businessId: business.id,
      categoryId: catalog.categories[0]!.id,
      code: "MEAL",
      itemType: "food",
      name: "Meal",
      taxCode: "GST5",
    },
    context,
  );
  catalog = await menu.createPriceBook(
    { businessId: business.id, code: "STD", currency: "INR", name: "Standard" },
    context,
  );
  const item = catalog.items[0]!;
  const priceBook = catalog.priceBooks[0]!;
  await menu.setPrice(
    { amountMinor: 10_500, itemId: item.id, priceBookId: priceBook.id, validFrom: "2026-01-01" },
    business.id,
    context,
  );
  const availability = new MenuAvailabilityService(new MenuAvailabilityRepository(database), menu, activity, now);
  const campaigns = new MenuCampaignService(new MenuCampaignRepository(database), menu, activity);
  const saleability = new MenuSaleabilityService(new MenuSaleabilityRepository(database), availability, campaigns);
  const pos = new PosService(new PosRepository(database), menu, saleability, activity, now);
  const billing = new BillingService(new BillingRepository(database), pos, activity, now);
  const inventory = new InventoryService(new InventoryRepository(database), activity, now);
  const documents = new DocumentsService(new DocumentsRepository(database), activity, now);
  const reports = new ReportsService(new ReportsRepository(database), now);
  return {
    activity,
    billing,
    business,
    businessDay,
    database,
    documents,
    inventory,
    item,
    location,
    pos,
    priceBook,
    reports,
  };
}

async function postedSale(fixture: Awaited<ReturnType<typeof setup>>) {
  const { billing, business, businessDay, item, location, pos, priceBook } = fixture;
  const takeaway = location.serviceChannels.find((channel) => channel.kind === "takeaway")!;
  const orders = await pos.create(
    {
      businessId: business.id,
      collectionName: "Ravi",
      locationId: location.id,
      priceBookId: priceBook.id,
      serviceChannelId: takeaway.id,
    },
    context,
  );
  const order = orders.orders[0]!;
  await pos.addLine(order.id, { itemId: item.id, modifiers: [], quantity: 1 }, context);
  await pos.action(order.id, "confirm", undefined, context);
  await billing.createTaxRate({ basisPoints: 500, businessId: business.id, code: "GST5", name: "GST 5%" }, context);
  const billed = await billing.postBill(order.id, context);
  const bill = billed.bills[0]!;
  const cash = billed.paymentMethods.find((method) => method.kind === "cash")!;
  const drawer = billed.drawers[0]!;
  const shiftId = await billing.openShift(
    { businessDayId: businessDay.id, drawerId: drawer.id, openingFloatMinor: 0 },
    context,
  );
  await billing.postPayment(
    bill.id,
    { amountMinor: bill.payable_minor, cashShiftId: shiftId, paymentMethodId: cash.id, status: "posted" },
    context,
  );
  await billing
    .postPayment(
      bill.id,
      { amountMinor: 100, paymentMethodId: cash.id, status: "failed", failureReason: "Declined" },
      context,
    )
    .catch(() => null);
  return { bill, order, shiftId };
}

test("sales, tax, payment, and item reports use posted records with day scope", async () => {
  const fixture = await setup();
  const { business, businessDay, inventory, item, location, reports } = fixture;
  const scope = { businessDayId: businessDay.id, businessId: business.id, locationId: location.id };
  const { bill } = await postedSale(fixture);
  const unit = await inventory.createUnit(
    { businessId: business.id, locationId: location.id, code: "KG", name: "Kilogram" },
    context,
  );
  const rice = await inventory.createItem(
    {
      businessId: business.id,
      locationId: location.id,
      code: "RICE",
      name: "Rice",
      reorderLevelMilli: 50_000,
      trackStock: true,
      unitId: unit.id,
    },
    context,
  );
  await inventory.adjust(
    {
      approvedBy: "owner-1",
      businessId: business.id,
      lines: [{ quantityMilli: 10_000, stockItemId: rice.id }],
      locationId: location.id,
      reason: "Opening",
    },
    context,
  );

  const sales = await reports.sales(scope);
  assert.equal(sales.scope.businessDayId, businessDay.id);
  assert.equal(sales.totals.bills, 1);
  assert.equal(sales.totals.payableMinor, bill.payable_minor);

  const taxes = await reports.taxes(scope);
  assert.equal(taxes.rows.length, 1);
  assert.equal(taxes.rows[0]!.taxCode, "GST5");
  assert.equal(taxes.rows[0]!.taxMinor, 500);

  const payments = await reports.payments(scope);
  assert.equal(payments.totals.payments, 1);
  assert.equal(payments.rows[0]!.methodKind, "cash");

  const items = await reports.items(scope);
  assert.equal(items.rows.length, 1);
  assert.equal(items.rows[0]!.itemCode, item.code);
  assert.equal(items.rows[0]!.totalMinor, bill.payable_minor);

  const stock = await reports.stock(scope);
  assert.equal(stock.totals.belowReorder, 1);
  assert.ok(stock.rows.some((row) => row.stockItemId === rice.id));
});

test("table, kitchen, shift, and event reports carry their scope", async () => {
  const fixture = await setup();
  const { business, database, documents, location, reports } = fixture;
  const scope = {
    businessId: business.id,
    from: "2026-09-24T00:00:00.000Z",
    locationId: location.id,
    to: "2026-09-24T23:59:59.999Z",
  };
  const { order } = await postedSale(fixture);

  const areaId = randomUUID();
  await database
    .insertInto("qcafe_dining_areas")
    .values({
      active: 1,
      created_at: now().toISOString(),
      id: areaId,
      kind: "dining",
      location_id: location.id,
      name: "Hall",
      sort_order: 1,
      updated_at: now().toISOString(),
    })
    .execute();
  const tableId = randomUUID();
  await database
    .insertInto("qcafe_dining_tables")
    .values({
      active: 1,
      area_id: areaId,
      capacity: 4,
      code: "T1",
      created_at: now().toISOString(),
      id: tableId,
      position_label: null,
      updated_at: now().toISOString(),
    })
    .execute();
  const sessionId = randomUUID();
  await database
    .insertInto("qcafe_table_sessions")
    .values({
      closed_at: null,
      closed_by: null,
      guest_count: 2,
      id: sessionId,
      location_id: location.id,
      opened_at: now().toISOString(),
      opened_by: "waiter-1",
      primary_order_id: order.id,
      status: "open",
    })
    .execute();
  await database
    .insertInto("qcafe_table_session_tables")
    .values({ created_at: now().toISOString(), id: randomUUID(), session_id: sessionId, table_id: tableId })
    .execute();
  const tables = await reports.tables(scope);
  assert.equal(tables.totals.sessions, 1);
  assert.deepEqual(tables.rows[0]!.tables, [tableId]);
  assert.equal(tables.rows[0]!.order?.id, order.id);

  const stationId = randomUUID();
  await database
    .insertInto("qcafe_kitchen_stations")
    .values({
      active: 1,
      code: "HOT",
      created_at: now().toISOString(),
      id: stationId,
      location_id: location.id,
      name: "Hot",
      updated_at: now().toISOString(),
    })
    .execute();
  const ticketId = randomUUID();
  await database
    .insertInto("qcafe_kitchen_tickets")
    .values({
      fired_at: now().toISOString(),
      id: ticketId,
      number: "KOT-1",
      order_id: order.id,
      ready_at: null,
      station_id: stationId,
      status: "fired",
      updated_at: now().toISOString(),
    })
    .execute();
  const kitchen = await reports.kitchen(scope);
  assert.equal(kitchen.totals.tickets, 1);
  assert.equal(kitchen.rows[0]!.station, "HOT");

  const shifts = await reports.shifts(scope);
  assert.equal(shifts.totals.open, 1);
  assert.equal(shifts.totals.unsettled, 1);

  const customerId = randomUUID();
  await database
    .insertInto("qcafe_customers")
    .values({
      business_id: business.id,
      created_at: now().toISOString(),
      email: null,
      email_consent: 0,
      external_reference: null,
      id: customerId,
      marketing_consent: 0,
      name: "Guest",
      phone: null,
      updated_at: now().toISOString(),
      whatsapp_consent: 0,
    })
    .execute();
  const firstId = randomUUID();
  await database
    .insertInto("qcafe_reservations")
    .values({
      arrival_at: "2026-09-24T08:00:00.000+05:30",
      created_at: now().toISOString(),
      customer_id: customerId,
      duration_minutes: 120,
      id: firstId,
      location_id: location.id,
      notes: null,
      order_id: null,
      party_size: 2,
      source: "phone",
      status: "confirmed",
      table_session_id: null,
      updated_at: now().toISOString(),
    })
    .execute();
  await database
    .insertInto("qcafe_reservations")
    .values({
      arrival_at: "2026-09-24T09:00:00.000+05:30",
      created_at: now().toISOString(),
      customer_id: customerId,
      duration_minutes: 120,
      id: randomUUID(),
      location_id: location.id,
      notes: null,
      order_id: null,
      party_size: 2,
      source: "web",
      status: "confirmed",
      table_session_id: null,
      updated_at: now().toISOString(),
    })
    .execute();
  const bookingId = randomUUID();
  const leadId = randomUUID();
  await database
    .insertInto("qcafe_event_leads")
    .values({
      business_id: business.id,
      created_at: now().toISOString(),
      customer_id: customerId,
      event_date: "2026-09-24",
      guest_count: 50,
      id: leadId,
      occasion_type: "birthday",
      owner_ref: "manager-1",
      source: "phone",
      status: "qualified",
      updated_at: now().toISOString(),
    })
    .execute();
  await database
    .insertInto("qcafe_event_bookings")
    .values({
      created_at: now().toISOString(),
      customer_id: customerId,
      ends_at: "2026-09-24T14:00:00.000+05:30",
      guest_count: 50,
      id: bookingId,
      lead_id: leadId,
      location_id: location.id,
      starts_at: "2026-09-24T10:00:00.000+05:30",
      status: "confirmed",
      updated_at: now().toISOString(),
    })
    .execute();
  const events = await reports.events(scope);
  assert.equal(events.totals.reservations, 2);
  assert.equal(events.totals.bookings, 1);

  const profile = await documents.createPrinterProfile(
    { businessId: business.id, code: "KOT", kind: "direct", locationId: location.id, name: "Kitchen" },
    context,
  );
  const draft = await documents.createDocument(
    { businessId: business.id, kind: "kot", locationId: location.id, title: "KOT 1" },
    context,
  );
  await documents.renderDocument(draft.id, context);
  const queued = await documents.queuePrintJob(
    {
      businessId: business.id,
      documentId: draft.id,
      locationId: location.id,
      preview: false,
      printerProfileId: profile.id,
    },
    context,
  );
  await documents.recordAttempt(queued.jobs[0]!.id, "failed", "Offline", context);

  const alerts = await reports.alerts(scope);
  const types = alerts.alerts.map((alert) => alert.type);
  assert.ok(types.includes("pending-kot"));
  assert.ok(types.includes("booking-conflict"));
  assert.ok(types.includes("unsettled-shift"));
  assert.ok(types.includes("failed-print"));
  for (const alert of alerts.alerts) {
    assert.ok(alert.subjectId.length > 0 && alert.subjectType.length > 0 && alert.detail.length > 0);
  }
});
