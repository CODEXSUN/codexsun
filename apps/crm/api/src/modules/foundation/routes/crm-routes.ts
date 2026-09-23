import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { CampaignRepository } from "../../campaign/infrastructure/campaign-repository.js";
import { EnquiryRepository } from "../../enquiry/infrastructure/enquiry-repository.js";
import { LeadRepository } from "../../lead/infrastructure/lead-repository.js";
import type { CrmDatabaseQuery } from "../persistence/crm-database.js";
import { OverviewService } from "../application/overview-service.js";

const campaignInput = z.object({
  name: z.string().trim().min(2).max(160),
  source: z.string().trim().max(80).optional(),
});

const leadInput = z.object({
  name: z.string().trim().min(2).max(160),
  campaignId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().email().optional(),
  score: z.number().int().min(0).max(100).optional(),
});

const enquiryInput = z.object({
  subject: z.string().trim().min(2).max(200),
  description: z.string().trim().max(4000).optional(),
  leadId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  dueAt: z.string().datetime().optional(),
});

export async function registerCrmRoutes(app: FastifyInstance, database: CrmDatabaseQuery): Promise<void> {
  const campaigns = new CampaignRepository(database);
  const leads = new LeadRepository(database);
  const enquiries = new EnquiryRepository(database);
  const overview = new OverviewService(database);

  app.get("/api/v1/crm/overview", { schema: { tags: ["CRM Overview"] } }, async () => overview.read());

  app.get("/api/v1/crm/campaigns", { schema: { tags: ["Campaigns"] } }, async () => ({ items: await campaigns.list() }));
  app.post("/api/v1/crm/campaigns", { schema: { body: campaignInput, tags: ["Campaigns"] } }, async (request, reply) => {
    const parsed = campaignInput.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid campaign." });
    return reply.code(201).send(await campaigns.create({ ...parsed.data, ownerActorId: "local-user" }));
  });

  app.get("/api/v1/crm/leads", { schema: { tags: ["Leads"] } }, async () => ({ items: await leads.list() }));
  app.post("/api/v1/crm/leads", { schema: { body: leadInput, tags: ["Leads"] } }, async (request, reply) => {
    const parsed = leadInput.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid lead." });
    return reply.code(201).send(await leads.create({ ...parsed.data, ownerActorId: "local-user" }));
  });

  app.get("/api/v1/crm/enquiries", { schema: { tags: ["Enquiries"] } }, async () => ({ items: await enquiries.list() }));
  app.post("/api/v1/crm/enquiries", { schema: { body: enquiryInput, tags: ["Enquiries"] } }, async (request, reply) => {
    const parsed = enquiryInput.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid enquiry." });
    return reply.code(201).send(await enquiries.create({ ...parsed.data, ownerActorId: "local-user" }));
  });
}
