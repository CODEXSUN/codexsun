import type { FastifyInstance, FastifyRequest } from "fastify";
import type { CommandContext } from "../../foundation/contracts/activity.contract.js";
import {
  createDocumentSchema,
  createPrinterProfileSchema,
  createPrinterRouteSchema,
  deliveryIdSchema,
  documentIdSchema,
  documentsScopeSchema,
  documentsWorkspaceSchema,
  grantConsentSchema,
  printJobIdSchema,
  queueDeliverySchema,
  queuePrintJobSchema,
  recordDeliveryResultSchema,
  recordPrintAttemptSchema,
} from "../contracts/documents.contract.js";
import { DocumentsConflictError, DocumentsService } from "../services/documents.service.js";

type Context = (request: FastifyRequest) => CommandContext;

export async function registerDocumentsRoutes(app: FastifyInstance, service: DocumentsService, contextFor: Context) {
  app.get(
    "/api/v1/qcafe/documents",
    { schema: { querystring: documentsScopeSchema, response: { 200: documentsWorkspaceSchema }, tags: ["Documents"] } },
    (request) => service.read(documentsScopeSchema.parse(request.query)),
  );
  app.post("/api/v1/qcafe/documents", async (request, reply) =>
    run(reply, () => service.createDocument(createDocumentSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/documents/:documentId/render", async (request, reply) =>
    run(reply, () => service.renderDocument(documentIdSchema.parse(request.params).documentId, contextFor(request))),
  );
  app.post("/api/v1/qcafe/documents/printers", async (request, reply) =>
    run(reply, () => service.createPrinterProfile(createPrinterProfileSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/documents/printer-routes", async (request, reply) =>
    run(reply, () => service.createPrinterRoute(createPrinterRouteSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/documents/print-jobs", async (request, reply) =>
    run(reply, () => service.queuePrintJob(queuePrintJobSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/documents/print-jobs/:jobId/attempts", async (request, reply) =>
    run(reply, () => {
      const input = recordPrintAttemptSchema.parse(request.body);
      return service.recordAttempt(
        printJobIdSchema.parse(request.params).jobId,
        input.status,
        input.error,
        contextFor(request),
      );
    }),
  );
  app.post("/api/v1/qcafe/documents/print-jobs/:jobId/reprints", async (request, reply) =>
    run(reply, () => service.reprint(printJobIdSchema.parse(request.params).jobId, contextFor(request))),
  );
  app.post("/api/v1/qcafe/documents/print-jobs/:jobId/preview-confirm", async (request, reply) =>
    run(reply, () => service.confirmPreview(printJobIdSchema.parse(request.params).jobId, contextFor(request))),
  );
  app.post("/api/v1/qcafe/documents/print-jobs/:jobId/dispatch", async (request, reply) =>
    run(reply, () => service.dispatchPrintJob(printJobIdSchema.parse(request.params).jobId, contextFor(request))),
  );
  app.post("/api/v1/qcafe/documents/delivery-consents", async (request, reply) =>
    run(reply, () => {
      const input = grantConsentSchema.parse(request.body);
      return service.grantConsent(
        input.businessId,
        input.locationId,
        input.customerRef,
        input.channel,
        contextFor(request),
      );
    }),
  );
  app.post("/api/v1/qcafe/documents/delivery-consents/revoke", async (request, reply) =>
    run(reply, () => {
      const input = grantConsentSchema.parse(request.body);
      return service.revokeConsent(
        input.businessId,
        input.locationId,
        input.customerRef,
        input.channel,
        contextFor(request),
      );
    }),
  );
  app.post("/api/v1/qcafe/documents/deliveries", async (request, reply) =>
    run(reply, () => service.queueDelivery(queueDeliverySchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/documents/deliveries/:deliveryId/result", async (request, reply) =>
    run(reply, () => {
      const input = recordDeliveryResultSchema.parse(request.body);
      return service.recordDeliveryResult(
        deliveryIdSchema.parse(request.params).deliveryId,
        input.status,
        input.providerReference,
        input.error,
        contextFor(request),
      );
    }),
  );
}

async function run(
  reply: { code: (status: number) => { send: (body: unknown) => unknown } },
  work: () => Promise<unknown>,
) {
  try {
    return await work();
  } catch (error) {
    if (error instanceof DocumentsConflictError) return reply.code(409).send({ error: error.message });
    throw error;
  }
}
