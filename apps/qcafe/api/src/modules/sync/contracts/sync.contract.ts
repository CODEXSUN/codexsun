import { z } from "zod";

export const syncScopeSchema = z.object({
  businessId: z.string().uuid(),
  locationId: z.string().uuid(),
});

export const registerDeviceSchema = syncScopeSchema.extend({
  deviceCode: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(120),
  platform: z.enum(["web", "desktop", "mobile"]),
});

export const deviceIdSchema = z.object({ deviceId: z.string().uuid() });

export const appendChangeSchema = syncScopeSchema.extend({
  actorRef: z.string().trim().min(1).max(120),
  changeKind: z.string().trim().min(2).max(40),
  deviceId: z.string().uuid().optional(),
  entityId: z.string().trim().min(1).max(120),
  entityType: z.string().trim().min(2).max(60),
});

export const advanceCursorSchema = z.object({
  lastSeq: z.number().int().min(0),
});

export const pushChangeSchema = z.object({
  actorRef: z.string().trim().min(1).max(120),
  changeKind: z.string().trim().min(2).max(40),
  entityId: z.string().trim().min(1).max(120),
  entityType: z.string().trim().min(2).max(60),
  id: z.string().uuid(),
});

export const pushChangesSchema = z.object({
  changes: z.array(pushChangeSchema).min(1).max(100),
});

export const reportConflictSchema = syncScopeSchema.extend({
  entityId: z.string().trim().min(1).max(120),
  entityType: z.string().trim().min(2).max(60),
  localChangeId: z.string().uuid().optional(),
  reason: z.string().trim().min(3).max(500),
  remoteChangeId: z.string().uuid().optional(),
});

export const conflictIdSchema = z.object({ conflictId: z.string().uuid() });

export const resolveConflictSchema = z.object({
  decidedBy: z.string().trim().min(1).max(120),
  reason: z.string().trim().min(3).max(500),
  resolution: z.enum(["keep-local", "keep-remote", "retry", "escalated"]),
});

export const syncWorkspaceSchema = z.object({
  changes: z.array(z.record(z.unknown())),
  conflicts: z.array(z.record(z.unknown())),
  cursors: z.array(z.record(z.unknown())),
  devices: z.array(z.record(z.unknown())),
});

export type SyncScope = z.infer<typeof syncScopeSchema>;
export type RegisterDevice = z.infer<typeof registerDeviceSchema>;
export type AppendChange = z.infer<typeof appendChangeSchema>;
export type ReportConflict = z.infer<typeof reportConflictSchema>;
