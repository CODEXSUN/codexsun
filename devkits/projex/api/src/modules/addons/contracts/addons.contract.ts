import { z } from "zod";

export const addonCatalogItemSchema = z.object({
  areas: z.array(z.string()),
  contracts: z.array(z.string()),
  dataLifecycle: z.object({
    compatibility: z.string(),
    migrations: z.array(z.string()),
    seeders: z.array(z.string()),
  }),
  dataRetention: z.string(),
  dependencies: z.array(z.string()),
  events: z.array(z.string()),
  id: z.string(),
  label: z.string(),
  owner: z.string(),
  package: z.string(),
  providerId: z.string(),
  purpose: z.string(),
  enabled: z.boolean(),
});

export const addonCatalogSnapshotSchema = z.object({
  addons: z.array(addonCatalogItemSchema),
  generatedAt: z.string(),
  summary: z.object({
    addonCount: z.number().int().nonnegative(),
    enabledCount: z.number().int().nonnegative(),
    dependencyCount: z.number().int().nonnegative(),
  }),
});

export type AddonCatalogSnapshot = z.infer<typeof addonCatalogSnapshotSchema>;
