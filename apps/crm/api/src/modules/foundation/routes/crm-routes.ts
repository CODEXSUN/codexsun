import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { CampaignRepository } from "../../campaign/infrastructure/campaign-repository.js";
import { CustomerRepository } from "../../customer/infrastructure/customer-repository.js";
import { CommunicationRepository } from "../../enquiry/infrastructure/communication-repository.js";
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

const accountInput = z.object({
  name: z.string().trim().min(2).max(160),
  kind: z.enum(["person", "company"]).optional(),
  primaryPhone: z.string().trim().max(40).optional(),
  primaryEmail: z.string().email().optional(),
});

const contactInput = z.object({
  name: z.string().trim().min(2).max(160),
  phone: z.string().trim().max(40).optional(),
  email: z.string().email().optional(),
  role: z.string().trim().max(80).optional(),
  isPrimary: z.boolean().optional(),
});

const qualifyInput = z.object({ note: z.string().trim().max(4000).default(""), score: z.number().int().min(0).max(100) });
const convertInput = z.object({ subject: z.string().trim().min(2).max(200), description: z.string().trim().max(4000).optional() });
const communicationInput = z.object({
  enquiryId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  channel: z.enum(["whatsapp", "chat", "email", "sms", "call"]),
  direction: z.enum(["inbound", "outbound"]).optional(),
  subject: z.string().trim().max(200).optional(),
  body: z.string().trim().max(4000).optional(),
});
const activityInput = z.object({ kind: z.enum(["note", "task", "call", "visit"]), subject: z.string().trim().min(2).max(200), body: z.string().trim().max(4000).optional() });

export async function registerCrmRoutes(app: FastifyInstance, database: CrmDatabaseQuery): Promise<void> {
  const campaigns = new CampaignRepository(database);
  const customers = new CustomerRepository(database);
  const communications = new CommunicationRepository(database);
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
  app.patch("/api/v1/crm/leads/:leadId/qualify", { schema: { body: qualifyInput, tags: ["Leads"] } }, async (request, reply) => {
    const parsed = qualifyInput.safeParse(request.body);
    const leadId = z.string().uuid().safeParse((request.params as { leadId?: string }).leadId);
    if (!parsed.success || !leadId.success) return reply.code(400).send({ error: "Invalid lead qualification." });
    const lead = await leads.qualify(leadId.data, parsed.data.note, parsed.data.score);
    return lead ? lead : reply.code(404).send({ error: "Lead not found or cannot be qualified." });
  });
  app.post("/api/v1/crm/leads/:leadId/convert", { schema: { body: convertInput, tags: ["Leads"] } }, async (request, reply) => {
    const parsed = convertInput.safeParse(request.body);
    const leadId = z.string().uuid().safeParse((request.params as { leadId?: string }).leadId);
    if (!parsed.success || !leadId.success) return reply.code(400).send({ error: "Invalid lead conversion." });
    const enquiry = await leads.convertToEnquiry(leadId.data, parsed.data.subject, parsed.data.description);
    return enquiry ? reply.code(201).send(enquiry) : reply.code(409).send({ error: "Lead must be qualified and not already converted." });
  });

  app.get("/api/v1/crm/customers", { schema: { tags: ["Customers"] } }, async () => ({ items: await customers.listAccounts() }));
  app.post("/api/v1/crm/customers", { schema: { body: accountInput, tags: ["Customers"] } }, async (request, reply) => {
    const parsed = accountInput.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid customer." });
    return reply.code(201).send(await customers.createAccount(parsed.data));
  });
  app.get("/api/v1/crm/customers/:accountId", { schema: { tags: ["Customers"] } }, async (request, reply) => {
    const accountId = z.string().uuid().safeParse((request.params as { accountId?: string }).accountId);
    if (!accountId.success) return reply.code(400).send({ error: "Invalid customer id." });
    const customer = await customers.readAccount(accountId.data);
    return customer ? customer : reply.code(404).send({ error: "Customer not found." });
  });
  app.post("/api/v1/crm/customers/:accountId/contacts", { schema: { body: contactInput, tags: ["Customers"] } }, async (request, reply) => {
    const parsed = contactInput.safeParse(request.body);
    const accountId = z.string().uuid().safeParse((request.params as { accountId?: string }).accountId);
    if (!parsed.success || !accountId.success) return reply.code(400).send({ error: "Invalid contact." });
    return reply.code(201).send(await customers.addContact(accountId.data, parsed.data));
  });

  app.get("/api/v1/crm/enquiries", { schema: { tags: ["Enquiries"] } }, async () => ({ items: await enquiries.list() }));
  app.post("/api/v1/crm/enquiries", { schema: { body: enquiryInput, tags: ["Enquiries"] } }, async (request, reply) => {
    const parsed = enquiryInput.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid enquiry." });
    return reply.code(201).send(await enquiries.create({ ...parsed.data, ownerActorId: "local-user" }));
  });
  app.get("/api/v1/crm/enquiries/:enquiryId", { schema: { tags: ["Enquiries"] } }, async (request, reply) => {
    const enquiryId = z.string().uuid().safeParse((request.params as { enquiryId?: string }).enquiryId);
    if (!enquiryId.success) return reply.code(400).send({ error: "Invalid enquiry id." });
    const enquiry = await enquiries.read(enquiryId.data);
    const timeline = enquiry ? await communications.listForEnquiry(enquiryId.data) : undefined;
    return enquiry ? { ...enquiry, communications: timeline } : reply.code(404).send({ error: "Enquiry not found." });
  });
  app.post("/api/v1/crm/enquiries/:enquiryId/activities", { schema: { body: activityInput, tags: ["Enquiries"] } }, async (request, reply) => {
    const parsed = activityInput.safeParse(request.body);
    const enquiryId = z.string().uuid().safeParse((request.params as { enquiryId?: string }).enquiryId);
    if (!parsed.success || !enquiryId.success) return reply.code(400).send({ error: "Invalid activity." });
    return reply.code(201).send(await enquiries.addActivity(enquiryId.data, parsed.data.kind, parsed.data.subject, parsed.data.body));
  });
  app.post("/api/v1/crm/communications", { schema: { body: communicationInput, tags: ["Communications"] } }, async (request, reply) => {
    const parsed = communicationInput.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid communication." });
    return reply.code(201).send(await communications.create(parsed.data));
  });
}
