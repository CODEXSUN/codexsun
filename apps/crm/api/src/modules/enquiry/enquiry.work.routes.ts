import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import { EnquiryRepository } from "./enquiry.repository.js";
import { EnquiryService } from "./enquiry.service.js";
import { EnquiryWorkRepository } from "./enquiry.work.repository.js";
import { EnquiryWorkService } from "./enquiry.work.service.js";
import { resolveEnquiryWorkTarget } from "./enquiry.work-target.js";
import type { EnquiryRequestContext } from "./enquiry.routes.js";
import { localViewChild } from "./enquiry.view-model.js";

const id = z.coerce.number().int().positive();
const reference = z.string().trim().min(1).max(191);
const enquiryParams = z.object({ id: reference });
const childParams = z.object({ id: reference, childId: reference });
const localId = (value: string) => id.parse(value);
const jobInput = z.object({
  employeeUserId: reference,
  startAt: z.iso.datetime({ offset: true }),
  stopAt: z.iso.datetime({ offset: true }).nullable(),
  ratePerHour: z.number().finite().nonnegative().max(10000000),
  status: z.enum(["running", "completed", "cancelled"])
});
const jobRecord = jobInput.omit({ employeeUserId: true }).extend({
  id: reference,
  uuid: z.string(),
  enquiryId: reference,
  employeeUserId: reference.nullable(),
  employee: z.string(),
  durationSeconds: z.number().int().nonnegative(),
  totalCost: z.number().nonnegative(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});
const estimateInput = z.object({
  date: z.iso.date(),
  itemName: z.string().trim().min(1).max(255),
  supplierContactId: reference,
  price: z.number().finite().positive().max(999999999999.99)
});
const estimateRecord = estimateInput.extend({
  id: reference,
  uuid: z.string(),
  enquiryId: reference,
  supplierName: z.string(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});
const activityRecord = z.object({
  id: reference,
  uuid: z.string(),
  enquiryId: reference,
  action: z.string(),
  details: z.string(),
  createdBy: z.string(),
  createdAt: z.string()
});

export function registerEnquiryWorkRoutes(
  app: FastifyInstance,
  context: (request: FastifyRequest) => Promise<EnquiryRequestContext>
) {
  const service = async (request: FastifyRequest) => {
    const scope = await context(request);
    return {
      scope,
      work: new EnquiryWorkService(
        new EnquiryService(
          new EnquiryRepository(scope.database, scope.workEvent),
          scope.relations,
          scope
        ),
        new EnquiryWorkRepository(scope.database, scope.workEvent),
        scope.relations
      )
    };
  };
  const enquiryId = async (scope: EnquiryRequestContext, reference: string) =>
    (await resolveEnquiryWorkTarget(scope, reference)).id;
  const viewJob = (job: Awaited<ReturnType<EnquiryWorkService["startJob"]>>) => ({
    ...localViewChild(job),
    employeeUserId: job.employeeUserId === null ? null : String(job.employeeUserId)
  });
  const viewEstimate = (estimate: Awaited<ReturnType<EnquiryWorkService["saveEstimate"]>>) => ({
    ...localViewChild(estimate),
    supplierContactId: String(estimate.supplierContactId)
  });

  registerContractRoute(app, {
    method: "GET",
    url: "/crm/enquiries/:id/jobs",
    schemas: { params: enquiryParams, response: z.array(jobRecord) },
    handler: async ({ params, request }) => {
      const { scope, work } = await service(request);
      return (await work.listJobs(await enquiryId(scope, params.id))).map(viewJob);
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/crm/enquiries/:id/jobs/start",
    schemas: { params: enquiryParams, response: jobRecord },
    handler: async ({ params, request }) => {
      const { scope, work } = await service(request);
      return viewJob(await work.startJob(await enquiryId(scope, params.id), scope.actorEmail));
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/crm/enquiries/:id/jobs",
    schemas: { params: enquiryParams, body: jobInput, response: jobRecord },
    handler: async ({ params, body, request }) => {
      const { scope, work } = await service(request);
      return viewJob(
        await work.saveJob(
          await enquiryId(scope, params.id),
          { ...body, employeeUserId: localId(body.employeeUserId) },
          scope.actorEmail
        )
      );
    }
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/crm/enquiries/:id/jobs/:childId",
    schemas: { params: childParams, body: jobInput, response: jobRecord },
    handler: async ({ params, body, request }) => {
      const { scope, work } = await service(request);
      return viewJob(
        await work.saveJob(
          await enquiryId(scope, params.id),
          { ...body, employeeUserId: localId(body.employeeUserId) },
          scope.actorEmail,
          localId(params.childId)
        )
      );
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/crm/enquiries/:id/jobs/:childId/stop",
    schemas: { params: childParams, response: jobRecord },
    handler: async ({ params, request }) => {
      const { scope, work } = await service(request);
      return viewJob(
        await work.stopJob(
          await enquiryId(scope, params.id),
          localId(params.childId),
          scope.actorEmail
        )
      );
    }
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/enquiries/:id/estimates",
    schemas: { params: enquiryParams, response: z.array(estimateRecord) },
    handler: async ({ params, request }) => {
      const { scope, work } = await service(request);
      return (await work.listEstimates(await enquiryId(scope, params.id))).map(viewEstimate);
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/crm/enquiries/:id/estimates",
    schemas: { params: enquiryParams, body: estimateInput, response: estimateRecord },
    handler: async ({ params, body, request }) => {
      const { scope, work } = await service(request);
      return viewEstimate(
        await work.saveEstimate(
          await enquiryId(scope, params.id),
          { ...body, supplierContactId: localId(body.supplierContactId) },
          scope.actorEmail
        )
      );
    }
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/crm/enquiries/:id/estimates/:childId",
    schemas: { params: childParams, body: estimateInput, response: estimateRecord },
    handler: async ({ params, body, request }) => {
      const { scope, work } = await service(request);
      return viewEstimate(
        await work.saveEstimate(
          await enquiryId(scope, params.id),
          { ...body, supplierContactId: localId(body.supplierContactId) },
          scope.actorEmail,
          localId(params.childId)
        )
      );
    }
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/crm/enquiries/:id/activity",
    schemas: { params: enquiryParams, response: z.array(activityRecord) },
    handler: async ({ params, request }) => {
      const { scope, work } = await service(request);
      return (await work.listActivity(await enquiryId(scope, params.id))).map(localViewChild);
    }
  });
}
