import type { FastifyInstance, FastifyRequest } from "fastify";
import type { CommandContext } from "../../foundation/contracts/activity.contract.js";
import {
  accountingScopeSchema,
  accountingWorkspaceSchema,
  exportJournalsSchema,
  generateJournalSchema,
  journalIdSchema,
} from "../contracts/accounting.contract.js";
import { AccountingConflictError, AccountingService } from "../services/accounting.service.js";

type Context = (request: FastifyRequest) => CommandContext;

export async function registerAccountingRoutes(app: FastifyInstance, service: AccountingService, contextFor: Context) {
  app.get(
    "/api/v1/qcafe/accounting",
    {
      schema: {
        querystring: accountingScopeSchema,
        response: { 200: accountingWorkspaceSchema },
        tags: ["Accounting"],
      },
    },
    (request) => service.read(accountingScopeSchema.parse(request.query)),
  );
  app.post("/api/v1/qcafe/accounting/journals/generate", async (request, reply) =>
    run(reply, () => {
      const input = generateJournalSchema.parse(request.body);
      return service.generate(input.sourceType, input.sourceId, contextFor(request));
    }),
  );
  app.post("/api/v1/qcafe/accounting/journals/:journalId/post", async (request, reply) =>
    run(reply, () => service.postJournal(journalIdSchema.parse(request.params).journalId, contextFor(request))),
  );
  app.get("/api/v1/qcafe/accounting/export", async (request, reply) => {
    const input = exportJournalsSchema.parse(request.query);
    const result = await service.exportCsv(
      { businessId: input.businessId, locationId: input.locationId },
      input.status,
      input.fromDate,
      input.toDate,
    );
    return reply.type("text/csv").send(result.csv);
  });
}

async function run(
  reply: { code: (status: number) => { send: (body: unknown) => unknown } },
  work: () => Promise<unknown>,
) {
  try {
    return await work();
  } catch (error) {
    if (error instanceof AccountingConflictError) return reply.code(409).send({ error: error.message });
    throw error;
  }
}
