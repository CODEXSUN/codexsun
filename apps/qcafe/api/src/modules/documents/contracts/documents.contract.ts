import { z } from "zod";

export const documentsScopeSchema = z.object({
  businessId: z.string().uuid(),
  locationId: z.string().uuid(),
});

export const documentKindSchema = z.enum(["receipt", "kot", "report", "voucher", "label"]);

export const createDocumentSchema = documentsScopeSchema.extend({
  checksum: z.string().trim().min(8).max(128).optional(),
  kind: documentKindSchema,
  storageObjectRef: z.string().trim().min(1).max(240).optional(),
  title: z.string().trim().min(2).max(200),
});

export const documentIdSchema = z.object({ documentId: z.string().uuid() });

export const createPrinterProfileSchema = documentsScopeSchema.extend({
  code: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .transform((value) => value.toUpperCase()),
  configRef: z.string().trim().min(1).max(160).optional(),
  kind: z.enum(["browser", "direct", "gateway", "bluetooth", "network"]),
  name: z.string().trim().min(2).max(120),
});

export const createPrinterRouteSchema = z.object({
  documentKind: documentKindSchema,
  fallbackProfileId: z.string().uuid().optional(),
  locationId: z.string().uuid(),
  priority: z.number().int().min(0).max(10_000).default(0),
  printerProfileId: z.string().uuid(),
});

export const queuePrintJobSchema = documentsScopeSchema.extend({
  documentId: z.string().uuid(),
  idempotencyKey: z.string().trim().min(1).max(120).optional(),
  preview: z.boolean().default(false),
  printerProfileId: z.string().uuid().optional(),
  routeRef: z.string().trim().min(1).max(160).optional(),
});

export const printJobIdSchema = z.object({ jobId: z.string().uuid() });

export const recordPrintAttemptSchema = z.object({
  error: z.string().trim().min(3).max(500).optional(),
  status: z.enum(["acknowledged", "failed"]),
});

export const deliveryChannelSchema = z.enum(["email", "whatsapp"]);

export const grantConsentSchema = documentsScopeSchema.extend({
  channel: deliveryChannelSchema,
  customerRef: z.string().trim().min(1).max(160),
});

export const queueDeliverySchema = documentsScopeSchema.extend({
  channel: deliveryChannelSchema,
  customerRef: z.string().trim().min(1).max(160),
  destination: z.string().trim().min(3).max(200),
  documentId: z.string().uuid(),
});

export const deliveryIdSchema = z.object({ deliveryId: z.string().uuid() });

export const recordDeliveryResultSchema = z.object({
  error: z.string().trim().min(3).max(500).optional(),
  providerReference: z.string().trim().min(1).max(160).optional(),
  status: z.enum(["sent", "failed"]),
});

export const documentsWorkspaceSchema = z.object({
  attempts: z.array(z.record(z.unknown())),
  consents: z.array(z.record(z.unknown())),
  deliveries: z.array(z.record(z.unknown())),
  dispatches: z.array(z.record(z.unknown())),
  documents: z.array(z.record(z.unknown())),
  jobs: z.array(z.record(z.unknown())),
  previews: z.array(z.record(z.unknown())),
  printerProfiles: z.array(z.record(z.unknown())),
  printerRoutes: z.array(z.record(z.unknown())),
});

export type DocumentsScope = z.infer<typeof documentsScopeSchema>;
export type CreateDocument = z.infer<typeof createDocumentSchema>;
export type CreatePrinterProfile = z.infer<typeof createPrinterProfileSchema>;
export type CreatePrinterRoute = z.infer<typeof createPrinterRouteSchema>;
export type QueuePrintJob = z.infer<typeof queuePrintJobSchema>;
