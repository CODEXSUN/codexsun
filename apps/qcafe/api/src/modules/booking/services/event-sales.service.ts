import type { ActivityRecorder, CommandContext } from "../../foundation/contracts/activity.contract.js";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type { BillingService } from "../../billing/services/billing.service.js";
import type { CreateEventLead, CreateEventQuote, EventScope } from "../contracts/event-sales.contract.js";
import { EventSalesRepository } from "../repository/event-sales.repository.js";

export class EventSalesConflictError extends Error {}

export class EventSalesService {
  constructor(
    private readonly repo: EventSalesRepository,
    private readonly billing: BillingService,
    private readonly activity: ActivityRecorder,
    private readonly now: () => Date = () => new Date(),
  ) {}
  read(scope: EventScope) {
    return this.repo.workspace(scope);
  }

  async lead(input: CreateEventLead, context: CommandContext) {
    if (input.customerId && !(await this.repo.customer(input.customerId, input.businessId)))
      throw new EventSalesConflictError("The event customer is outside this business.");
    const id = await this.repo.createLead(input, context.actorId, this.timestamp());
    await this.record(context, "event-lead.created", id, "event-lead");
    return { id };
  }
  async followup(
    leadId: string,
    input: { note: string; ownerRef: string; scheduledAt: string },
    context: CommandContext,
  ) {
    const lead = await this.requiredLead(leadId);
    if (["lost", "won"].includes(lead.status)) throw new EventSalesConflictError("The event lead is closed.");
    const id = await this.repo.followup(leadId, input, this.timestamp());
    await this.record(context, "event-followup.scheduled", id, "event-followup", { leadId });
    return this.readLead(lead);
  }
  async completeFollowup(id: string, outcome: string, context: CommandContext) {
    const followup = await this.repo.readFollowup(id);
    if (!followup || followup.completed_at) throw new EventSalesConflictError("Open follow-up not found.");
    const lead = await this.requiredLead(followup.lead_id);
    await this.repo.completeFollowup(id, lead.id, outcome, this.timestamp());
    await this.record(context, "event-followup.completed", id, "event-followup", { outcome });
    return this.readLead(lead);
  }
  async booking(
    leadId: string,
    input: { endsAt: string; locationId: string; startsAt: string },
    context: CommandContext,
  ) {
    const lead = await this.requiredLead(leadId);
    if (
      lead.status === "lost" ||
      input.startsAt >= input.endsAt ||
      !(await this.repo.location(input.locationId, lead.business_id))
    )
      throw new EventSalesConflictError("The event schedule, outlet, or lead is invalid.");
    const id = await this.repo.createBooking(lead, input, this.timestamp());
    await this.record(context, "event-booking.confirmed", id, "event-booking", { leadId });
    return this.read({ businessId: lead.business_id, locationId: input.locationId });
  }
  async bookingAction(id: string, action: "cancel" | "complete" | "plan" | "start", context: CommandContext) {
    const booking = await this.requiredBooking(id);
    const transition = {
      cancel: { from: ["confirmed", "planning"], to: "cancelled" },
      complete: { from: ["in_service"], to: "completed" },
      plan: { from: ["confirmed"], to: "planning" },
      start: { from: ["planning"], to: "in_service" },
    } as const;
    if (!(transition[action].from as readonly string[]).includes(booking.status))
      throw new EventSalesConflictError(`Cannot ${action} an event in ${booking.status} state.`);
    if (action === "complete") {
      const state = await this.repo.completionState(id);
      if (
        !state.orders.length ||
        state.bills.length !== state.orders.length ||
        state.bills.some((bill) => bill.status !== "paid")
      )
        throw new EventSalesConflictError("Every linked event order must have a fully paid bill before completion.");
      if (state.tasks.some((task) => task.status !== "done") || state.schedules.some((item) => item.status !== "done"))
        throw new EventSalesConflictError("Complete every event task and schedule item first.");
    }
    await this.repo.bookingStatus(id, transition[action].to, this.timestamp());
    await this.record(context, `event-booking.${action}`, id, "event-booking");
    return this.readBooking(booking);
  }
  async requirement(
    id: string,
    input: {
      category: "decoration" | "dietary" | "equipment" | "seating" | "venue";
      details: string;
      responsibleRef: string;
    },
    context: CommandContext,
  ) {
    const booking = await this.requiredBooking(id);
    const recordId = await this.repo.requirement(id, input, this.timestamp());
    await this.record(context, "event-requirement.created", recordId, "event-requirement", { eventBookingId: id });
    return this.readBooking(booking);
  }
  async quote(id: string, input: CreateEventQuote, context: CommandContext) {
    const booking = await this.requiredBooking(id);
    const quoteId = await this.repo.createQuote(booking, input, this.timestamp());
    await this.record(context, "event-quote.created", quoteId, "event-quote", { eventBookingId: id });
    return this.readBooking(booking);
  }
  async quoteAction(id: string, action: "accept" | "reject" | "send", context: CommandContext) {
    const quote = await this.repo.quote(id);
    if (!quote) throw new EventSalesConflictError("Event quote not found.");
    const allowed = { accept: ["draft", "sent"], reject: ["draft", "sent"], send: ["draft"] } as const;
    if (!(allowed[action] as readonly string[]).includes(quote.status))
      throw new EventSalesConflictError(`Cannot ${action} this quote.`);
    const status = { accept: "accepted", reject: "rejected", send: "sent" }[
      action
    ] as QcafeFoundationDatabase["qcafe_event_quotes"]["status"];
    await this.repo.quoteStatus(id, status, this.timestamp());
    await this.record(context, `event-quote.${action}`, id, "event-quote");
    return this.readBooking(await this.requiredBooking(quote.event_booking_id));
  }
  async task(id: string, input: { dueAt: string; ownerRef: string; task: string }, context: CommandContext) {
    const booking = await this.requiredBooking(id);
    const taskId = await this.repo.task(id, input, this.timestamp());
    await this.record(context, "event-task.created", taskId, "event-task", { eventBookingId: id });
    return this.readBooking(booking);
  }
  async completeTask(id: string, context: CommandContext) {
    const task = await this.repo.readTask(id);
    if (!task || task.status === "done") throw new EventSalesConflictError("Open event task not found.");
    await this.repo.completeTask(id, this.timestamp());
    await this.record(context, "event-task.completed", id, "event-task");
    return this.readBooking(await this.requiredBooking(task.event_booking_id));
  }
  async schedule(
    id: string,
    input: { activity: string; endsAt: string; ownerRef: string; startsAt: string },
    context: CommandContext,
  ) {
    const booking = await this.requiredBooking(id);
    if (input.startsAt >= input.endsAt) throw new EventSalesConflictError("Schedule end must be after its start.");
    const itemId = await this.repo.scheduleItem(id, input, this.timestamp());
    await this.record(context, "event-schedule.created", itemId, "event-schedule", { eventBookingId: id });
    return this.readBooking(booking);
  }
  async scheduleAction(id: string, action: "complete" | "start", context: CommandContext) {
    const item = await this.repo.schedule(id);
    if (
      !item ||
      (action === "start" && item.status !== "planned") ||
      (action === "complete" && !["planned", "running"].includes(item.status))
    )
      throw new EventSalesConflictError("The schedule item cannot make that transition.");
    await this.repo.scheduleStatus(id, action === "start" ? "running" : "done", this.timestamp());
    await this.record(context, `event-schedule.${action}`, id, "event-schedule");
    return this.readBooking(await this.requiredBooking(item.event_booking_id));
  }
  async linkOrder(
    id: string,
    orderId: string,
    role: "delivery" | "final" | "preparation" | "service",
    context: CommandContext,
  ) {
    const [booking, order] = await Promise.all([this.requiredBooking(id), this.repo.order(orderId)]);
    if (!order || order.location_id !== booking.location_id)
      throw new EventSalesConflictError("The event order must belong to the same outlet.");
    const linkId = await this.repo.linkOrder(id, orderId, role, this.timestamp());
    await this.record(context, "event-order.linked", linkId, "event-order", { eventBookingId: id, orderId });
    return this.readBooking(booking);
  }
  async advance(
    id: string,
    input: { amountMinor: number; paymentMethodId: string; providerReference?: string },
    context: CommandContext,
  ) {
    const booking = await this.requiredBooking(id);
    const lead = await this.requiredLead(booking.lead_id);
    await this.billing.issueVoucher(
      {
        amountMinor: input.amountMinor,
        businessId: lead.business_id,
        customerRef: booking.customer_id ?? undefined,
        eventRef: id,
        locationId: booking.location_id,
        paymentMethodId: input.paymentMethodId,
        providerReference: input.providerReference,
      },
      context,
    );
    await this.record(context, "event-advance.received", id, "event-booking", { amountMinor: input.amountMinor });
    return this.read({ businessId: lead.business_id, locationId: booking.location_id });
  }

  private async requiredLead(id: string) {
    const value = await this.repo.lead(id);
    if (!value) throw new EventSalesConflictError("Event lead not found.");
    return value;
  }
  private async requiredBooking(id: string) {
    const value = await this.repo.booking(id);
    if (!value) throw new EventSalesConflictError("Event booking not found.");
    return value;
  }
  private readLead(lead: QcafeFoundationDatabase["qcafe_event_leads"]) {
    return { id: lead.id };
  }
  private async readBooking(booking: QcafeFoundationDatabase["qcafe_event_bookings"]) {
    const lead = await this.requiredLead(booking.lead_id);
    return this.read({ businessId: lead.business_id, locationId: booking.location_id });
  }
  private timestamp() {
    return this.now().toISOString();
  }
  private record(
    context: CommandContext,
    eventType: string,
    subjectId: string,
    subjectType: string,
    payload?: Record<string, unknown>,
  ) {
    return this.activity.record(context, { eventType: `qcafe.booking.${eventType}`, payload, subjectId, subjectType });
  }
}
