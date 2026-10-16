import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerFrappeEnquirySyncRoutes } from "./enquiry-sync.routes.js";
import type { FrappeSettings } from "../connection/index.js";
import type { EnquirySyncContext } from "./enquiry-sync.types.js";

export const frappeEnquirySyncModule = {
  key: "frappe.enquiry-sync",
  register(
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
      latest: (request: FastifyRequest) => Promise<{
        jobId: number;
        status: "pending" | "running" | "completed" | "failed" | "cancelled";
        progress: import("./enquiry-sync.types.js").ImportProgress | null;
        errorMessage: string | null;
      } | null>;
    }
  ) {
    registerFrappeEnquirySyncRoutes(app, context, settings, encryptionSecret, backfill);
  }
};
