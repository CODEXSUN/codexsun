import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import { z } from "zod";
import type { EnquiryService } from "./enquiry.service.js";
import {
  enquiryListQuerySchema,
  enquiryListResponseSchema,
  enquiryPayloadSchema,
  enquiryRecordSchema,
  publicEnquirySubmissionSchema
} from "./enquiry.schema.js";

import { SPORTSCLUB_PUBLIC_ENQUIRY_PATH } from "../../sportsclub.contracts.js";

export { SPORTSCLUB_PUBLIC_ENQUIRY_PATH };

const uuidParamsSchema = z.strictObject({
  uuid: z.string().regex(/^[a-f0-9]{8}$/, "Enquiry UUID must be 8 hex characters.")
});

const submissionResponseSchema = z.strictObject({
  reference: z.string(),
  status: z.literal("received")
});

const emptyResponseSchema = z.strictObject({
  success: z.boolean()
});

export function registerEnquiryRoutes(
  app: FastifyInstance,
  resolveService: (request: FastifyRequest) => Promise<EnquiryService> | EnquiryService
) {
  registerContractRoute(app, {
    method: "POST",
    url: SPORTSCLUB_PUBLIC_ENQUIRY_PATH,
    schemas: {
      body: publicEnquirySubmissionSchema,
      response: submissionResponseSchema
    },
    handler: async ({ request, body }) => (await resolveService(request)).submit(body)
  });

  registerContractRoute(app, {
    method: "GET",
    url: "/sportsclub/enquiries",
    schemas: {
      querystring: enquiryListQuerySchema,
      response: enquiryListResponseSchema
    },
    handler: async ({ request, query }) => (await resolveService(request)).list(query)
  });

  registerContractRoute(app, {
    method: "POST",
    url: "/sportsclub/enquiries",
    schemas: { body: enquiryPayloadSchema, response: enquiryRecordSchema },
    handler: async ({ request, body }) => (await resolveService(request)).create(body)
  });

  registerContractRoute(app, {
    method: "GET",
    url: "/sportsclub/enquiries/:uuid",
    schemas: { params: uuidParamsSchema, response: enquiryRecordSchema },
    handler: async ({ request, params }) => (await resolveService(request)).get(params.uuid)
  });

  registerContractRoute(app, {
    method: "PUT",
    url: "/sportsclub/enquiries/:uuid",
    schemas: {
      params: uuidParamsSchema,
      body: enquiryPayloadSchema,
      response: enquiryRecordSchema
    },
    handler: async ({ request, params, body }) =>
      (await resolveService(request)).update(params.uuid, body)
  });

  registerContractRoute(app, {
    method: "DELETE",
    url: "/sportsclub/enquiries/:uuid/force",
    schemas: { params: uuidParamsSchema, response: emptyResponseSchema },
    handler: async ({ request, params }) => {
      await (await resolveService(request)).delete(params.uuid);
      return { success: true };
    }
  });
}
