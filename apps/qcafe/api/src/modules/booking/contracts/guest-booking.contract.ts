import { z } from "zod";
import { tableScopeSchema } from "./table-service.contract.js";

export const guestBookingScopeSchema = tableScopeSchema;
export const createCustomerSchema = z.object({
  businessId: z.string().uuid(),
  email: z.string().trim().email().max(254).optional(),
  emailConsent: z.boolean().default(false),
  externalReference: z.string().trim().max(160).optional(),
  marketingConsent: z.boolean().default(false),
  name: z.string().trim().min(2).max(160),
  phone: z.string().trim().min(5).max(40).optional(),
  whatsappConsent: z.boolean().default(false),
});
export const createReservationSchema = guestBookingScopeSchema.extend({
  arrivalAt: z.string().datetime({ offset: true }),
  customerId: z.string().uuid(),
  durationMinutes: z.number().int().min(15).max(1_440),
  notes: z.string().trim().max(2_000).optional(),
  partySize: z.number().int().positive().max(500),
  source: z.enum(["event", "phone", "qr", "walk_in", "web"]),
  tableIds: z.array(z.string().uuid()).min(1),
});
export const reservationIdSchema = z.object({ reservationId: z.string().uuid() });
export const reservationActionSchema = z.object({
  action: z.enum(["cancel", "complete", "confirm", "no_show"]),
  note: z.string().trim().max(500).optional(),
});
export const seatReservationSchema = z.object({
  priceBookId: z.string().uuid(),
  serviceChannelId: z.string().uuid(),
});
export const rotateTableQrSchema = guestBookingScopeSchema.extend({
  expiresAt: z.string().datetime({ offset: true }).optional(),
  tableId: z.string().uuid(),
});
export const publicQrParamsSchema = z.object({ token: z.string().min(32).max(200) });
export const scannerProfileSchema = z.object({
  acceptedFormats: z.array(z.enum(["code128", "data_matrix", "qr"])).min(1),
  deviceRef: z.string().trim().min(2).max(160),
  locationId: z.string().uuid(),
  scanPurpose: z.enum(["inventory", "order", "table_entry"]),
});
export const guestBookingWorkspaceSchema = z.object({
  customers: z.array(z.record(z.unknown())),
  reservations: z.array(z.record(z.unknown())),
  reservationTables: z.array(z.record(z.unknown())),
  reservationEvents: z.array(z.record(z.unknown())),
  reservationBills: z.array(z.record(z.unknown())),
  qrTokens: z.array(z.record(z.unknown())),
  scannerProfiles: z.array(z.record(z.unknown())),
});
export const publicQrResponseSchema = z.object({
  locationName: z.string(),
  sessionOpen: z.boolean(),
  status: z.literal("valid"),
  tableCode: z.string(),
});

export type GuestBookingScope = z.infer<typeof guestBookingScopeSchema>;
export type CreateCustomer = z.infer<typeof createCustomerSchema>;
export type CreateReservation = z.infer<typeof createReservationSchema>;
