import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerEnquiryRoutes } from "./enquiry.routes.js";
import type { EnquiryService } from "./enquiry.service.js";

export const enquiryModule = {
  key: "sportsclub.enquiry",
  label: "Enquiries",
  register(
    app: FastifyInstance,
    resolveService: (request: FastifyRequest) => Promise<EnquiryService> | EnquiryService
  ) {
    return registerEnquiryRoutes(app, resolveService);
  }
};
