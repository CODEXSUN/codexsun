import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { ExportKind } from "../export/index.js";
import type { LiveSyncSettings } from "./live-sync.types.js";
const kind = z.enum(["contacts", "enquiries", "activities", "call-logs"]);
const settingsSchema = z.object({
  enabled: z.boolean(),
  paused: z.boolean(),
  scheduleMinutes: z.union([z.literal(5), z.literal(15), z.literal(30), z.literal(60)]),
  modules: z
    .object({
      contacts: z.boolean(),
      enquiries: z.boolean(),
      activities: z.boolean(),
      "call-logs": z.boolean()
    })
    .strict(),
  lastScheduledAt: z.string().nullable(),
  updatedAt: z.string(),
  updatedBy: z.string(),
  backgroundWorkerEnabled: z.boolean()
});
const jobSchema = z.object({
  id: z.number().int().positive(),
  kind,
  direction: z.enum(["inbound", "outbound"]),
  status: z.string(),
  createdAt: z.string(),
  errorMessage: z.string().nullable(),
  progress: z.unknown().nullable()
});
export type LiveSyncCallbacks = {
  settings(request: FastifyRequest): Promise<LiveSyncSettings>;
  save(
    request: FastifyRequest,
    input: Pick<LiveSyncSettings, "enabled" | "paused" | "scheduleMinutes" | "modules">
  ): Promise<LiveSyncSettings>;
  queue(request: FastifyRequest, kind: ExportKind): Promise<{ id: number }>;
  jobs(request: FastifyRequest): Promise<z.infer<typeof jobSchema>[]>;
};
export function registerFrappeLiveSyncRoutes(app: FastifyInstance, callbacks: LiveSyncCallbacks) {
  registerContractRoute(app, {
    method: "GET",
    url: "/frappe/live-sync",
    schemas: { response: settingsSchema },
    handler: ({ request }) => callbacks.settings(request)
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/frappe/live-sync",
    schemas: {
      body: settingsSchema
        .pick({ enabled: true, paused: true, scheduleMinutes: true, modules: true })
        .strict(),
      response: settingsSchema
    },
    handler: ({ request, body }) => callbacks.save(request, body)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/frappe/live-sync/:kind/resync",
    schemas: {
      params: z.object({ kind }),
      body: z.object({}).strict(),
      response: z.object({ id: z.number().int().positive() })
    },
    handler: ({ request, params }) => callbacks.queue(request, params.kind)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/frappe/live-sync/jobs",
    schemas: { response: z.array(jobSchema) },
    handler: ({ request }) => callbacks.jobs(request)
  });
}
