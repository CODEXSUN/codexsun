import assert from "node:assert/strict";
import test from "node:test";
import { BillingRepository } from "../../billing/repository/billing.repository.js";
import { BillingService } from "../../billing/services/billing.service.js";
import { ActivityRepository } from "../../foundation/repository/activity.repository.js";
import { createQcafePersistence } from "../../foundation/persistence/qcafe-persistence.js";
import { FoundationSetupRepository } from "../../foundation/repository/foundation-setup.repository.js";
import { FoundationSetupService } from "../../foundation/services/foundation-setup.service.js";
import { MenuAvailabilityRepository } from "../../menu/repository/menu-availability.repository.js";
import { MenuCampaignRepository } from "../../menu/repository/menu-campaign.repository.js";
import { MenuRepository } from "../../menu/repository/menu.repository.js";
import { MenuSaleabilityRepository } from "../../menu/repository/menu-saleability.repository.js";
import { MenuAvailabilityService } from "../../menu/services/menu-availability.service.js";
import { MenuCampaignService } from "../../menu/services/menu-campaign.service.js";
import { MenuSaleabilityService } from "../../menu/services/menu-saleability.service.js";
import { MenuService } from "../../menu/services/menu.service.js";
import { PosRepository } from "../../pos/repository/pos.repository.js";
import { PosService } from "../../pos/services/pos.service.js";
import { createQcafeLifecyclePlans } from "../../../qcafe-lifecycle-plans.js";
import { EventSalesRepository } from "../repository/event-sales.repository.js";
import { GuestBookingRepository } from "../repository/guest-booking.repository.js";
import { TableServiceRepository } from "../repository/table-service.repository.js";
import { EventSalesService } from "../services/event-sales.service.js";
import { GuestBookingConflictError, GuestBookingService } from "../services/guest-booking.service.js";
import { TableServiceService } from "../services/table-service.service.js";

const context = { actorId: "booking-manager", correlationId: "55555555-5555-4555-8555-555555555555" };
const now = () => new Date("2026-09-20T09:00:00.000Z");

test("protects reservations, rotates guest QR, and runs a function through final collection", async () => {
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
      locationName: "Main outlet",
      timezone: "Asia/Calcutta",
    },
    context,
  );
  const business = setup.businesses[0]!;
  const location = business.locations[0]!;
  await persistence.initialize();
  const menu = new MenuService(new MenuRepository(database), activity, now);
  let catalog = await menu.createCategory(
    { businessId: business.id, code: "EVENT", name: "Event menu", sortOrder: 1 },
    context,
  );
  catalog = await menu.createItem(
    {
      businessId: business.id,
      categoryId: catalog.categories[0]!.id,
      code: "BUFFET",
      itemType: "food",
      name: "Buffet package",
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
    { amountMinor: 50_000, itemId: item.id, priceBookId: priceBook.id, validFrom: "2026-01-01" },
    business.id,
    context,
  );
  const availability = new MenuAvailabilityService(new MenuAvailabilityRepository(database), menu, activity, now);
  const campaigns = new MenuCampaignService(new MenuCampaignRepository(database), menu, activity);
  const saleability = new MenuSaleabilityService(new MenuSaleabilityRepository(database), availability, campaigns);
  const pos = new PosService(new PosRepository(database), menu, saleability, activity, now);
  const billing = new BillingService(new BillingRepository(database), pos, activity, now);
  const tables = new TableServiceService(
    new TableServiceRepository(database),
    activity,
    async (orderId) => {
      const snapshot = await pos.snapshot(orderId);
      return Boolean(snapshot && ["cancelled", "fulfilled"].includes(snapshot.order.status));
    },
    now,
  );
  const guests = new GuestBookingService(new GuestBookingRepository(database), tables, pos, activity, now);
  const events = new EventSalesService(new EventSalesRepository(database), billing, activity, now);

  let floor = await tables.area(
    { businessId: business.id, kind: "dining", locationId: location.id, name: "Main floor", sortOrder: 1 },
    context,
  );
  floor = await tables.table(
    {
      areaId: floor.areas[0]!.id,
      businessId: business.id,
      capacity: 6,
      code: "T01",
      locationId: location.id,
    },
    context,
  );
  const table = floor.tables[0]!;
  const customer = await guests.customer(
    {
      businessId: business.id,
      emailConsent: false,
      marketingConsent: false,
      name: "Asha Rao",
      phone: "+91 90000 00000",
      whatsappConsent: true,
    },
    context,
  );
  const reservationInput = {
    arrivalAt: "2026-09-21T13:00:00.000Z",
    businessId: business.id,
    customerId: customer.id,
    durationMinutes: 120,
    locationId: location.id,
    partySize: 4,
    source: "phone" as const,
    tableIds: [table.id],
  };
  let guestState = await guests.reserve(reservationInput, context);
  const firstReservation = guestState.reservations[0]!;
  await guests.action(firstReservation.id, "confirm", undefined, context);
  guestState = await guests.reserve({ ...reservationInput, arrivalAt: "2026-09-21T14:00:00.000Z" }, context);
  const secondReservation = guestState.reservations.find((item) => item.id !== firstReservation.id)!;
  await assert.rejects(
    () => guests.action(secondReservation.id, "confirm", undefined, context),
    (error: unknown) => error instanceof GuestBookingConflictError && /overlapping/.test(error.message),
  );

  const dineIn = location.serviceChannels.find((channel) => channel.kind === "dine_in")!;
  guestState = await guests.seat(
    firstReservation.id,
    { priceBookId: priceBook.id, serviceChannelId: dineIn.id },
    context,
  );
  const seated = guestState.reservations.find((item) => item.id === firstReservation.id)!;
  assert.equal(seated.status, "seated");
  assert.ok(seated.table_session_id);
  assert.ok(seated.order_id);

  const firstQr = await guests.rotateQr(
    { businessId: business.id, locationId: location.id, tableId: table.id },
    context,
  );
  assert.equal((await guests.resolveQr(firstQr.token)).tableCode, "T01");
  const secondQr = await guests.rotateQr(
    { businessId: business.id, locationId: location.id, tableId: table.id },
    context,
  );
  await assert.rejects(() => guests.resolveQr(firstQr.token), GuestBookingConflictError);
  assert.deepEqual(Object.keys(await guests.resolveQr(secondQr.token)).sort(), [
    "locationName",
    "sessionOpen",
    "status",
    "tableCode",
  ]);
  await guests.scanner(
    {
      acceptedFormats: ["qr", "code128"],
      deviceRef: "front-desk-1",
      locationId: location.id,
      scanPurpose: "table_entry",
    },
    context,
  );

  const lead = await events.lead(
    {
      businessId: business.id,
      customerId: customer.id,
      eventDate: "2026-10-10",
      guestCount: 80,
      occasionType: "Festival dinner",
      ownerRef: "sales-1",
      source: "phone",
    },
    context,
  );
  await events.followup(
    lead.id,
    { note: "Confirm menu", ownerRef: "sales-1", scheduledAt: "2026-09-22T10:00:00.000Z" },
    context,
  );
  let eventState = await events.booking(
    lead.id,
    { endsAt: "2026-10-10T18:00:00.000Z", locationId: location.id, startsAt: "2026-10-10T12:00:00.000Z" },
    context,
  );
  const eventBooking = eventState.bookings[0]!;
  await events.requirement(
    eventBooking.id,
    { category: "dietary", details: "Ten vegan meals", responsibleRef: "chef-1" },
    context,
  );
  eventState = await events.quote(
    eventBooking.id,
    {
      currency: "INR",
      lines: [{ description: "Festival buffet", quantity: 80, unitAmountMinor: 50_000 }],
      validUntil: "2026-09-30",
    },
    context,
  );
  const quote = eventState.quotes[0]!;
  await events.quoteAction(quote.id, "send", context);
  await events.quoteAction(quote.id, "accept", context);
  const taskState = await events.task(
    eventBooking.id,
    { dueAt: "2026-10-09T12:00:00.000Z", ownerRef: "ops-1", task: "Prepare venue" },
    context,
  );
  const eventTask = taskState.tasks[0]!;
  const scheduleState = await events.schedule(
    eventBooking.id,
    {
      activity: "Lunch service",
      endsAt: "2026-10-10T16:00:00.000Z",
      ownerRef: "floor-1",
      startsAt: "2026-10-10T12:00:00.000Z",
    },
    context,
  );
  const schedule = scheduleState.schedules[0]!;
  const billingState = await billing.read({ businessId: business.id, locationId: location.id });
  const card = billingState.paymentMethods.find((method) => method.kind === "card")!;
  eventState = await events.advance(
    eventBooking.id,
    { amountMinor: 100_000, paymentMethodId: card.id, providerReference: "advance-001" },
    context,
  );
  assert.equal(eventState.advances[0]!.event_ref, eventBooking.id);

  const eventChannel = location.serviceChannels.find((channel) => channel.kind === "event")!;
  let orderState = await pos.create(
    {
      businessId: business.id,
      customerName: "Asha Rao",
      locationId: location.id,
      priceBookId: priceBook.id,
      serviceChannelId: eventChannel.id,
    },
    context,
  );
  const eventOrder = orderState.orders.find((item) => item.service_channel_id === eventChannel.id)!;
  orderState = await pos.addLine(eventOrder.id, { itemId: item.id, modifiers: [], quantity: 1 }, context);
  await pos.action(eventOrder.id, "confirm", undefined, context);
  await events.linkOrder(eventBooking.id, eventOrder.id, "service", context);
  let collection = await billing.postBill(eventOrder.id, context);
  const bill = collection.bills.find((item) => item.order_id === eventOrder.id)!;
  collection = await billing.postPayment(
    bill.id,
    {
      amountMinor: orderState.orders.find((item) => item.id === eventOrder.id)!.total_minor,
      paymentMethodId: card.id,
      status: "posted",
    },
    context,
  );
  assert.equal(collection.bills.find((item) => item.id === bill.id)!.status, "paid");
  await events.completeTask(eventTask.id, context);
  await events.scheduleAction(schedule.id, "complete", context);
  await events.bookingAction(eventBooking.id, "plan", context);
  await events.bookingAction(eventBooking.id, "start", context);
  eventState = await events.bookingAction(eventBooking.id, "complete", context);
  assert.equal(eventState.bookings.find((item) => item.id === eventBooking.id)!.status, "completed");

  const recordedEvents = await database
    .selectFrom("qcafe_activity_events")
    .select("event_type")
    .where("event_type", "like", "qcafe.booking.%")
    .execute();
  assert.ok(recordedEvents.some((item) => item.event_type === "qcafe.booking.reservation.seated"));
  assert.ok(recordedEvents.some((item) => item.event_type === "qcafe.booking.event-advance.received"));
  assert.equal((await persistence.verify()).length, 15);
  await persistence.destroy();
});
