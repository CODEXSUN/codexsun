import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import { AppError } from "@codexsun/framework/errors";
import { TaskRepository } from "./task.repository.js";
import { TaskService } from "./task.service.js";
import type { TaskContext } from "./task.types.js";

const id = z.object({ id: z.coerce.number().int().positive() });
const input = z
  .object({
    contactId: z.number().int().positive().nullable().optional(),
    capturedName: z.string().trim().max(191).nullable().optional(),
    capturedPhone: z
      .string()
      .trim()
      .regex(/^\d{10}$/, "Enter a 10-digit mobile number.")
      .or(z.literal(""))
      .nullable()
      .optional(),
    title: z.string().trim().min(1).max(255),
    description: z.string().trim().max(10000).default(""),
    listInId: z.number().int().positive().nullable().default(null),
    priorityId: z.number().int().positive(),
    statusId: z.number().int().positive(),
    assignedUserId: z.number().int().positive().nullable().default(null),
    dueDate: z.iso.date().nullable().default(null)
  })
  .strict();
const record = z.object({
  contactId: z.number().nullable(),
  contactName: z.string().nullable(),
  contactPhone: z.string().nullable(),
  id: z.number(),
  uuid: z.string(),
  title: z.string(),
  description: z.string(),
  listInId: z.number().nullable(),
  listIn: z.string().nullable(),
  priorityId: z.number(),
  priority: z.string(),
  priorityName: z.string(),
  statusId: z.number(),
  status: z.string(),
  statusName: z.string(),
  assignedUserId: z.number().nullable(),
  assignedTo: z.string().nullable(),
  dueDate: z.string().nullable(),
  createdBy: z.string(),
  creatorName: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  closurePending: z.boolean(),
  runningJobStartedAt: z.string().nullable()
});
const comment = z.object({
  id: z.number(),
  uuid: z.string(),
  taskId: z.number(),
  parentId: z.number().nullable(),
  body: z.string(),
  createdBy: z.string(),
  createdByName: z.string().nullable().optional(),
  createdAt: z.union([z.string(), z.date()])
});
const closure = z.object({
  id: z.number(),
  uuid: z.string(),
  taskId: z.number(),
  requestedBy: z.string(),
  reason: z.string(),
  status: z.string(),
  reviewedBy: z.string().nullable(),
  reviewNote: z.string().nullable(),
  createdAt: z.union([z.string(), z.date()])
});
const service = async (ctx: TaskContext) => {
  const repo = new TaskRepository(ctx.database, ctx.workEvent);
  return { ctx, repo, work: new TaskService(repo, ctx) };
};
async function permissionAvailable(ctx: TaskContext, permission: string) {
  try {
    await ctx.authorize(permission);
    return true;
  } catch (error) {
    if (error instanceof AppError && error.code === "FORBIDDEN") return false;
    throw error;
  }
}
export function registerTaskRoutes(
  app: FastifyInstance,
  context: (request: FastifyRequest) => Promise<TaskContext>
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/tasks/options",
    schemas: {
      response: z.object({
        lists: z.array(z.object({ id: z.number(), name: z.string() })),
        statuses: z.array(z.object({ id: z.number(), name: z.string(), code: z.string() })),
        priorities: z.array(z.object({ id: z.number(), name: z.string(), code: z.string() })),
        users: z.array(z.object({ id: z.number(), name: z.string(), email: z.string() })),
        capabilities: z.object({
          create: z.boolean(),
          update: z.boolean(),
          respond: z.boolean(),
          reopenClosed: z.boolean(),
          work: z.boolean(),
          reviewClosure: z.boolean()
        })
      })
    },
    handler: async ({ request }) => {
      const { ctx, repo } = await service(await context(request));
      await ctx.authorize("crm.task.view");
      const capabilities = {
        create: await permissionAvailable(ctx, "crm.task.create"),
        update: await permissionAvailable(ctx, "crm.task.update"),
        respond: await permissionAvailable(ctx, "crm.task.respond"),
        reopenClosed: ctx.canViewAll,
        work: await permissionAvailable(ctx, "crm.task.work"),
        reviewClosure: await permissionAvailable(ctx, "crm.task.closure.review")
      };
      const options = await repo.options(capabilities.create || capabilities.update);
      return {
        lists: options.lists,
        statuses: options.statuses,
        priorities: options.priorities,
        users: options.users,
        capabilities
      };
    }
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/tasks",
    schemas: {
      querystring: z.object({
        scope: z.enum(["visible", "mine"]).default("visible"),
        search: z.string().trim().max(191).default(""),
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(100),
        fromAt: z.iso.datetime({ offset: true }).optional(),
        toAt: z.iso.datetime({ offset: true }).optional(),
        contactId: z.coerce.number().int().positive().optional(),
        filter: z.string().trim().max(64).default("all"),
        title: z.string().trim().max(191).default(""),
        listIn: z.string().trim().max(191).default(""),
        dueDate: z.string().trim().max(32).default(""),
        priority: z.string().trim().max(64).default(""),
        creator: z.string().trim().max(191).default(""),
        assignedTo: z.string().trim().max(191).default(""),
        status: z.string().trim().max(64).default("")
      }),
      response: z.object({
        items: z.array(record),
        total: z.number(),
        statusCounts: z.array(z.object({ code: z.string(), count: z.number() }))
      })
    },
    handler: async ({ request, query }) => {
      const { ctx, work } = await service(await context(request));
      await ctx.authorize("crm.task.view");
      return work.list(
        query.search,
        query.page,
        query.pageSize,
        query.filter,
        {
          title: query.title,
          listIn: query.listIn,
          dueDate: query.dueDate,
          priority: query.priority,
          creator: query.creator,
          assignedTo: query.assignedTo,
          status: query.status
        },
        query.contactId,
        query.scope,
        { fromAt: query.fromAt, toAt: query.toAt }
      );
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/crm/tasks",
    schemas: { body: input, response: record },
    handler: async ({ body, request }) => {
      const { ctx, work } = await service(await context(request));
      await ctx.authorize("crm.task.create");
      return work.save(body);
    }
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/tasks/:id",
    schemas: { params: id, response: record },
    handler: async ({ params, request }) => {
      const { ctx, work } = await service(await context(request));
      await ctx.authorize("crm.task.view");
      return work.get(params.id);
    }
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/crm/tasks/:id",
    schemas: { params: id, body: input, response: record },
    handler: async ({ params, body, request }) => {
      const { ctx, work } = await service(await context(request));
      await ctx.authorize("crm.task.update");
      return work.save(body, params.id);
    }
  });
  registerContractRoute(app, {
    method: "PATCH",
    url: "/crm/tasks/:id/properties",
    schemas: {
      params: id,
      body: z
        .object({
          listInId: z.number().int().positive().nullable().optional(),
          priorityId: z.number().int().positive().optional(),
          statusId: z.number().int().positive().optional(),
          assignedUserId: z.number().int().positive().nullable().optional(),
          dueDate: z.iso.date().nullable().optional()
        })
        .strict()
        .refine((value) => Object.keys(value).length > 0),
      response: record
    },
    handler: async ({ params, body, request }) => {
      const { ctx, work } = await service(await context(request));
      await ctx.authorize("crm.task.respond");
      return work.updateProperties(params.id, {
        ...(body.listInId !== undefined ? { listInId: body.listInId } : {}),
        ...(body.priorityId !== undefined ? { priorityId: body.priorityId } : {}),
        ...(body.statusId !== undefined ? { statusId: body.statusId } : {}),
        ...(body.assignedUserId !== undefined ? { assignedUserId: body.assignedUserId } : {}),
        ...(body.dueDate !== undefined ? { dueDate: body.dueDate } : {})
      });
    }
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/tasks/:id/comments",
    schemas: { params: id, response: z.array(comment) },
    handler: async ({ params, request }) => {
      const { ctx, repo, work } = await service(await context(request));
      await ctx.authorize("crm.task.view");
      await work.get(params.id);
      return repo.comments(params.id);
    }
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/tasks/:id/activity",
    schemas: {
      params: id,
      response: z.array(
        z.object({
          id: z.number(),
          uuid: z.string(),
          taskId: z.number(),
          eventType: z.string(),
          description: z.string(),
          actor: z.string(),
          createdAt: z.union([z.string(), z.date()])
        })
      )
    },
    handler: async ({ params, request }) => {
      const { ctx, repo, work } = await service(await context(request));
      await ctx.authorize("crm.task.view");
      await work.get(params.id);
      return repo.activity(params.id);
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/crm/tasks/:id/comments",
    schemas: {
      params: id,
      body: z
        .object({
          body: z.string().trim().min(1).max(10000),
          parentId: z.number().int().positive().nullable().default(null)
        })
        .strict(),
      response: comment
    },
    handler: async ({ params, body, request }) => {
      const { ctx, work } = await service(await context(request));
      await ctx.authorize("crm.task.respond");
      return work.addComment(params.id, body.body, body.parentId);
    }
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/tasks/:id/jobs",
    schemas: {
      params: id,
      response: z.array(
        z.object({
          id: z.number(),
          uuid: z.string(),
          taskId: z.number(),
          startedBy: z.string(),
          startedAt: z.union([z.string(), z.date()]),
          stoppedAt: z.union([z.string(), z.date()]).nullable(),
          canStop: z.boolean()
        })
      )
    },
    handler: async ({ params, request }) => {
      const { ctx, repo, work } = await service(await context(request));
      await ctx.authorize("crm.task.view");
      await work.assertParticipant(params.id);
      const jobs = await repo.jobs(params.id);
      return jobs.map((job) => ({
        ...job,
        canStop: ctx.canViewAll || job.startedBy.toLowerCase() === ctx.actorEmail.toLowerCase()
      }));
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/crm/tasks/:id/jobs/start",
    schemas: {
      params: id,
      response: z.object({
        id: z.number(),
        uuid: z.string(),
        taskId: z.number(),
        startedBy: z.string(),
        startedAt: z.union([z.string(), z.date()]),
        stoppedAt: z.union([z.string(), z.date()]).nullable(),
        canStop: z.boolean()
      })
    },
    handler: async ({ params, request }) => {
      const { ctx, repo, work } = await service(await context(request));
      await ctx.authorize("crm.task.work");
      const task = await work.assertParticipant(params.id);
      if (task.status === "closed") throw AppError.conflict("A closed task cannot be started.");
      const job = await repo.startJob(params.id, ctx.actorEmail);
      return { ...job, canStop: true };
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/crm/tasks/:id/jobs/stop",
    schemas: { params: id, response: z.object({ stopped: z.boolean() }) },
    handler: async ({ params, request }) => {
      const { ctx, repo, work } = await service(await context(request));
      await ctx.authorize("crm.task.work");
      await work.assertParticipant(params.id);
      await repo.stopJob(params.id, ctx.actorEmail, ctx.canViewAll);
      return { stopped: true };
    }
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/tasks/:id/closure-requests",
    schemas: { params: id, response: z.array(closure) },
    handler: async ({ params, request }) => {
      const { ctx, repo, work } = await service(await context(request));
      await ctx.authorize("crm.task.view");
      await work.get(params.id);
      return repo.closureRequests(params.id);
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/crm/tasks/:id/closure-requests",
    schemas: {
      params: id,
      body: z.object({ reason: z.string().trim().min(1).max(2000) }).strict(),
      response: closure
    },
    handler: async ({ params, body, request }) => {
      const { ctx, repo, work } = await service(await context(request));
      await ctx.authorize("crm.task.respond");
      const task = await work.assertParticipant(params.id);
      if (task.status === "closed")
        throw AppError.conflict("A closure request is not needed for a closed task.");
      return repo.requestClosure(params.id, ctx.actorEmail, body.reason);
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/crm/tasks/closure-requests/:id/review",
    schemas: {
      params: id,
      body: z
        .object({
          decision: z.enum(["approved", "rejected"]),
          note: z.string().trim().max(2000).default("")
        })
        .strict(),
      response: z.object({ reviewed: z.boolean() })
    },
    handler: async ({ params, body, request }) => {
      const { ctx, repo } = await service(await context(request));
      await ctx.authorize("crm.task.closure.review");
      return {
        reviewed: await repo.reviewClosure(params.id, ctx.actorEmail, body.decision, body.note, ctx)
      };
    }
  });
}
