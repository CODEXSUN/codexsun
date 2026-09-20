import { z } from "zod";

export const connectorKindSchema = z.enum(["accounting", "delivery", "marketplace", "messaging", "payment", "storage"]);
export const createConnectorSchema = z.object({
  code: z.string().trim().min(2).max(40).transform((value) => value.toUpperCase()),
  endpointLabel: z.string().trim().max(160).optional(),
  kind: connectorKindSchema,
  name: z.string().trim().min(2).max(120),
  secretReference: z.string().trim().max(160).optional(),
});
export const updateConnectorSchema = z.object({ enabled: z.boolean() });
export const updateCloudSyncSchema = z.object({ enabled: z.boolean() });

export const databaseSettingsSchema = z.object({
  connectionSource: z.literal("environment"),
  driver: z.enum(["mariadb", "sqlite"]),
  engine: z.enum(["MariaDB", "SQLite"]),
  lifecycleRecords: z.number().int().nonnegative(),
  mode: z.enum(["cloud", "local"]),
  status: z.enum(["ready", "unavailable"]),
  storageLabel: z.string(),
  verifiedAt: z.string().datetime(),
});
export const cloudSyncSettingsSchema = z.object({
  available: z.boolean(),
  enabled: z.boolean(),
  reason: z.string().nullable(),
  targetLabel: z.string().nullable(),
  updatedAt: z.string().datetime().nullable(),
});
export const connectorSchema = z.object({
  code: z.string(), enabled: z.boolean(), endpointLabel: z.string().nullable(), id: z.string(),
  kind: connectorKindSchema, name: z.string(), secretReference: z.string().nullable(),
  status: z.enum(["configured", "not_configured"]), updatedAt: z.string().datetime(),
});
export const connectorsResponseSchema = z.object({ connectors: z.array(connectorSchema) });
export const settingsErrorSchema = z.object({ error: z.string() });

export type Connector = z.infer<typeof connectorSchema>;
export type CreateConnector = z.infer<typeof createConnectorSchema>;
export type DatabaseSettings = z.infer<typeof databaseSettingsSchema>;
