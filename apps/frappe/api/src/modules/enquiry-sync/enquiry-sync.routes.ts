import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { EnquirySyncRepository } from "@codexsun/crm-api/enquiry-sync";
import { registerContractRoute } from "@codexsun/framework/http";
import { AppError } from "@codexsun/framework/errors";
import type {} from "@codexsun/framework/api";
import type { FrappeSettings } from "../connection/index.js";
import { FrappeEnquirySyncService } from "./enquiry-sync.service.js";
import type { EnquirySyncContext } from "./enquiry-sync.types.js";
import { withEnquiryImportLock } from "./enquiry-sync.lock.js";

const queueEventSchema = z.object({
  id: z.number().int().positive(),
  enquiryId: z.number().int().positive(),
  enquiryNo: z.number().int().positive(),
  title: z.string(),
  eventType: z.enum(["enquiry-upsert", "comment-add", "job-upsert", "estimate-upsert"]),
  status: z.enum(["pending", "processing", "retry", "failed", "synced"]),
  attempts: z.number().int().nonnegative(),
  remoteName: z.string().nullable(),
  lastError: z.string().nullable(),
  createdAt: z.string()
});
const importProgressSchema = z.object({
  scanned: z.number().int().nonnegative(),
  created: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  failures: z.array(z.object({ name: z.string(), message: z.string() }))
});
const importJobSchema = z.object({
  jobId: z.number().int().positive(),
  status: z.enum(["pending", "running", "completed", "failed", "cancelled"]),
  progress: importProgressSchema.nullable(),
  errorMessage: z.string().nullable()
});

export function registerFrappeEnquirySyncRoutes(
  app: FastifyInstance,
  context: (request: FastifyRequest) => Promise<EnquirySyncContext>,
  settings: FrappeSettings,
  encryptionSecret: string,
  backfill: {
    start: (request: FastifyRequest) => Promise<{ jobId: number; status: string }>;
    status: (
      request: FastifyRequest,
      jobId: number
    ) => Promise<{
      jobId: number;
      status: string;
      progress: import("./enquiry-sync.types.js").ImportProgress | null;
      errorMessage: string | null;
    }>;
    latest: (request: FastifyRequest) => Promise<z.infer<typeof importJobSchema> | null>;
  }
) {
  const service = async (request: FastifyRequest) =>
    new FrappeEnquirySyncService(await context(request), settings, encryptionSecret);

  registerContractRoute(app, {
    method: "GET",
    url: "/frappe/enquiries/remote",
    schemas: {
      querystring: z.object({
        page: z.coerce.number().int().positive().max(100_000).default(1),
        pageSize: z.coerce.number().int().min(1).max(500).default(50)
      }),
      response: z.object({
        hasMore: z.boolean(),
        items: z.array(
          z.object({
            name: z.string(),
            title: z.string(),
            mobile: z.string().nullable(),
            date: z.string().nullable(),
            status: z.string().nullable(),
            priority: z.string().nullable(),
            modifiedAt: z.string().nullable(),
            localEnquiryId: z.number().int().positive().nullable()
          })
        ),
        page: z.number().int().positive(),
        pageSize: z.number().int().positive(),
        total: z.number().int().nonnegative()
      })
    },
    handler: async ({ query, request }) =>
      (await service(request)).preview(query.page, query.pageSize)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/frappe/enquiries/pull",
    schemas: {
      body: z.object({ remoteName: z.string().trim().min(1).max(255) }).strict(),
      response: z.object({
        remoteName: z.string(),
        enquiryId: z.number().int().positive(),
        status: z.enum(["created", "updated", "linked"])
      })
    },
    handler: async ({ body, request }) => {
      const scope = await context(request);
      return withEnquiryImportLock(scope.database, () =>
        new FrappeEnquirySyncService(scope, settings, encryptionSecret).pull(body.remoteName)
      );
    }
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/frappe/enquiries/import",
    schemas: { response: importJobSchema.nullable() },
    handler: async ({ request }) => {
      await context(request);
      return backfill.latest(request);
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/frappe/enquiries/import",
    schemas: {
      body: z.object({}).strict(),
      response: z.object({
        jobId: z.number().int().positive(),
        status: z.string()
      })
    },
    handler: async ({ request }) => {
      await context(request);
      return backfill.start(request);
    }
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/frappe/enquiries/sync-queue",
    schemas: {
      querystring: z.object({
        status: z
          .enum(["all", "pending", "processing", "retry", "failed", "synced"])
          .default("all"),
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().min(1).max(200).default(200)
      }),
      response: z.object({
        items: z.array(queueEventSchema),
        page: z.number().int().positive(),
        pageSize: z.number().int().positive(),
        total: z.number().int().nonnegative()
      })
    },
    handler: async ({ query, request }) =>
      new EnquirySyncRepository((await context(request)).database).listQueue(
        query.status,
        query.page,
        query.pageSize
      )
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/frappe/enquiries/sync-queue/:eventId/retry",
    schemas: {
      params: z.object({ eventId: z.coerce.number().int().positive() }),
      body: z.object({}).strict(),
      response: z.object({ id: z.number().int().positive(), status: z.literal("pending") })
    },
    handler: async ({ params, request }) => {
      await context(request);
      void params;
      throw AppError.conflict("Sending CRM enquiries to Frappe is disabled.");
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/frappe/enquiries/backfill",
    schemas: {
      body: z.object({}).strict(),
      response: z.object({ jobId: z.number().int().positive(), status: z.string() })
    },
    handler: async ({ request }) => {
      await context(request);
      return backfill.start(request);
    }
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/frappe/enquiries/backfill/:jobId",
    schemas: {
      params: z.object({ jobId: z.coerce.number().int().positive() }),
      response: z.object({
        jobId: z.number().int().positive(),
        status: z.string(),
        progress: importProgressSchema.nullable(),
        errorMessage: z.string().nullable()
      })
    },
    handler: async ({ params, request }) => {
      await context(request);
      return backfill.status(request, params.jobId);
    }
  });
}
