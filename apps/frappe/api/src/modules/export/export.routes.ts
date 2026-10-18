import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { ExportKind, ExportPage, ExportProgress } from "./export.types.js";

const kindSchema = z.enum(["contacts", "enquiries", "activities", "call-logs"]);
const rowSchema = z.object({
  id: z.number().int().positive(),
  label: z.string(),
  detail: z.string().nullable(),
  remoteName: z.string().nullable(),
  code: z.string().nullable(),
  dependency: z.string().nullable()
});
const progressSchema = z.object({
  scanned: z.number().int().nonnegative(),
  exported: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  failures: z.array(z.object({ id: z.number().int().positive(), message: z.string() })),
  results: z.array(
    z.object({
      id: z.number().int().positive(),
      outcome: z.enum(["linked", "matched", "mismatch", "new", "blocked", "exported"]),
      remoteName: z.string().nullable(),
      message: z.string().nullable()
    })
  )
});

export type ExportRouteCallbacks = {
  preview: (request: FastifyRequest, kind: ExportKind, page: number) => Promise<ExportPage>;
  enqueue: (
    request: FastifyRequest,
    kind: ExportKind,
    ids: number[],
    mode: "verify" | "export",
    verifiedJobId: number | undefined
  ) => Promise<{ jobId: number; status: string }>;
  status: (
    request: FastifyRequest,
    jobId: number
  ) => Promise<{
    jobId: number;
    status: string;
    progress: ExportProgress | null;
    errorMessage: string | null;
  }>;
};

export function registerFrappeExportRoutes(app: FastifyInstance, callbacks: ExportRouteCallbacks) {
  registerContractRoute(app, {
    method: "GET",
    url: "/frappe/export/:kind",
    schemas: {
      params: z.object({ kind: kindSchema }),
      querystring: z.object({ page: z.coerce.number().int().positive().max(100_000).default(1) }),
      response: z.object({
        items: z.array(rowSchema),
        page: z.number().int().positive(),
        pageSize: z.number().int().positive(),
        total: z.number().int().nonnegative()
      })
    },
    handler: async ({ request, params, query }) =>
      callbacks.preview(request, params.kind, query.page)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/frappe/export/:kind",
    schemas: {
      params: z.object({ kind: kindSchema }),
      body: z
        .object({
          ids: z.array(z.number().int().positive()).min(1).max(50),
          mode: z.enum(["verify", "export"]),
          verifiedJobId: z.number().int().positive().optional()
        })
        .strict()
        .refine((value) => value.mode !== "export" || !!value.verifiedJobId, {
          message: "Verify the selected records before exporting."
        }),
      response: z.object({ jobId: z.number().int().positive(), status: z.string() })
    },
    handler: async ({ request, params, body }) =>
      callbacks.enqueue(request, params.kind, body.ids, body.mode, body.verifiedJobId)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/frappe/export/jobs/:jobId",
    schemas: {
      params: z.object({ jobId: z.coerce.number().int().positive() }),
      response: z.object({
        jobId: z.number().int().positive(),
        status: z.string(),
        progress: progressSchema.nullable(),
        errorMessage: z.string().nullable()
      })
    },
    handler: async ({ request, params }) => callbacks.status(request, params.jobId)
  });
}
