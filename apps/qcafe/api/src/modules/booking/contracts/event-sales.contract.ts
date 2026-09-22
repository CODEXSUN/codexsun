import { z } from "zod";
import { guestBookingScopeSchema } from "./guest-booking.contract.js";

export const eventScopeSchema = guestBookingScopeSchema;
export const createEventLeadSchema = z.object({
  businessId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  eventDate: z.string().date(),
  guestCount: z.number().int().positive().max(100_000),
  occasionType: z.string().trim().min(2).max(80),
  ownerRef: z.string().trim().min(2).max(120),
  source: z.string().trim().min(2).max(40),
});
export const eventLeadIdSchema = z.object({ leadId: z.string().uuid() });
export const eventBookingIdSchema = z.object({ eventBookingId: z.string().uuid() });
export const eventFollowupIdSchema = z.object({ followupId: z.string().uuid() });
export const createEventFollowupSchema = z.object({
  note: z.string().trim().min(2).max(2_000),
  ownerRef: z.string().trim().min(2).max(120),
  scheduledAt: z.string().datetime({ offset: true }),
});
export const completeEventFollowupSchema = z.object({ outcome: z.string().trim().min(2).max(160) });
export const createEventBookingSchema = z.object({
  endsAt: z.string().datetime({ offset: true }),
  locationId: z.string().uuid(),
  startsAt: z.string().datetime({ offset: true }),
});
export const eventBookingActionSchema = z.object({
  action: z.enum(["cancel", "complete", "plan", "start"]),
});
export const createEventRequirementSchema = z.object({
  category: z.enum(["decoration", "dietary", "equipment", "seating", "venue"]),
  details: z.string().trim().min(2).max(2_000),
  responsibleRef: z.string().trim().min(2).max(120),
});
const quoteLine = z.object({
  description: z.string().trim().min(2).max(260),
  itemRef: z.string().trim().max(160).optional(),
  quantity: z.number().positive().max(100_000),
  unitAmountMinor: z.number().int().nonnegative(),
});
export const createEventQuoteSchema = z.object({
  currency: z
    .string()
    .trim()
    .length(3)
    .transform((value) => value.toUpperCase()),
  lines: z.array(quoteLine).min(1),
  validUntil: z.string().date(),
});
export const eventQuoteIdSchema = z.object({ quoteId: z.string().uuid() });
export const eventQuoteActionSchema = z.object({ action: z.enum(["accept", "reject", "send"]) });
export const createEventTaskSchema = z.object({
  dueAt: z.string().datetime({ offset: true }),
  ownerRef: z.string().trim().min(2).max(120),
  task: z.string().trim().min(2).max(260),
});
export const createEventScheduleSchema = z.object({
  activity: z.string().trim().min(2).max(260),
  endsAt: z.string().datetime({ offset: true }),
  ownerRef: z.string().trim().min(2).max(120),
  startsAt: z.string().datetime({ offset: true }),
});
export const eventItemIdSchema = z.object({ itemId: z.string().uuid() });
export const eventItemActionSchema = z.object({ action: z.enum(["complete", "start"]) });
export const linkEventOrderSchema = z.object({
  orderId: z.string().uuid(),
  role: z.enum(["delivery", "final", "preparation", "service"]),
});
export const eventAdvanceSchema = z.object({
  amountMinor: z.number().int().positive(),
  paymentMethodId: z.string().uuid(),
  providerReference: z.string().trim().max(160).optional(),
});
export const eventSalesWorkspaceSchema = z.object({
  leads: z.array(z.record(z.unknown())),
  followups: z.array(z.record(z.unknown())),
  bookings: z.array(z.record(z.unknown())),
  requirements: z.array(z.record(z.unknown())),
  quotes: z.array(z.record(z.unknown())),
  quoteLines: z.array(z.record(z.unknown())),
  orders: z.array(z.record(z.unknown())),
  schedules: z.array(z.record(z.unknown())),
  tasks: z.array(z.record(z.unknown())),
  advances: z.array(z.record(z.unknown())),
  collections: z.array(z.record(z.unknown())),
});

export type EventScope = z.infer<typeof eventScopeSchema>;
export type CreateEventLead = z.infer<typeof createEventLeadSchema>;
export type CreateEventQuote = z.infer<typeof createEventQuoteSchema>;
