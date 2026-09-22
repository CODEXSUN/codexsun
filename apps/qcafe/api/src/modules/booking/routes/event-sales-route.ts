import type { FastifyInstance, FastifyRequest } from "fastify";
import type { CommandContext } from "../../foundation/contracts/activity.contract.js";
import {
  completeEventFollowupSchema,
  createEventBookingSchema,
  createEventFollowupSchema,
  createEventLeadSchema,
  createEventQuoteSchema,
  createEventRequirementSchema,
  createEventScheduleSchema,
  createEventTaskSchema,
  eventAdvanceSchema,
  eventBookingActionSchema,
  eventBookingIdSchema,
  eventFollowupIdSchema,
  eventItemActionSchema,
  eventItemIdSchema,
  eventLeadIdSchema,
  eventQuoteActionSchema,
  eventQuoteIdSchema,
  eventSalesWorkspaceSchema,
  eventScopeSchema,
  linkEventOrderSchema,
} from "../contracts/event-sales.contract.js";
import { EventSalesConflictError, EventSalesService } from "../services/event-sales.service.js";

export async function registerEventSalesRoutes(
  app: FastifyInstance,
  service: EventSalesService,
  contextFor: (request: FastifyRequest) => CommandContext,
) {
  app.get(
    "/api/v1/qcafe/event-sales",
    { schema: { querystring: eventScopeSchema, response: { 200: eventSalesWorkspaceSchema }, tags: ["Event sales"] } },
    (request) => service.read(eventScopeSchema.parse(request.query)),
  );
  app.post("/api/v1/qcafe/event-sales/leads", async (request, reply) =>
    run(reply, () => service.lead(createEventLeadSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/event-sales/leads/:leadId/followups", async (request, reply) =>
    run(reply, () =>
      service.followup(
        eventLeadIdSchema.parse(request.params).leadId,
        createEventFollowupSchema.parse(request.body),
        contextFor(request),
      ),
    ),
  );
  app.post("/api/v1/qcafe/event-sales/followups/:followupId/complete", async (request, reply) =>
    run(reply, () =>
      service.completeFollowup(
        eventFollowupIdSchema.parse(request.params).followupId,
        completeEventFollowupSchema.parse(request.body).outcome,
        contextFor(request),
      ),
    ),
  );
  app.post("/api/v1/qcafe/event-sales/leads/:leadId/booking", async (request, reply) =>
    run(reply, () =>
      service.booking(
        eventLeadIdSchema.parse(request.params).leadId,
        createEventBookingSchema.parse(request.body),
        contextFor(request),
      ),
    ),
  );
  app.post("/api/v1/qcafe/event-sales/bookings/:eventBookingId/actions", async (request, reply) =>
    run(reply, () =>
      service.bookingAction(
        eventBookingIdSchema.parse(request.params).eventBookingId,
        eventBookingActionSchema.parse(request.body).action,
        contextFor(request),
      ),
    ),
  );
  app.post("/api/v1/qcafe/event-sales/bookings/:eventBookingId/requirements", async (request, reply) =>
    run(reply, () =>
      service.requirement(
        eventBookingIdSchema.parse(request.params).eventBookingId,
        createEventRequirementSchema.parse(request.body),
        contextFor(request),
      ),
    ),
  );
  app.post("/api/v1/qcafe/event-sales/bookings/:eventBookingId/quotes", async (request, reply) =>
    run(reply, () =>
      service.quote(
        eventBookingIdSchema.parse(request.params).eventBookingId,
        createEventQuoteSchema.parse(request.body),
        contextFor(request),
      ),
    ),
  );
  app.post("/api/v1/qcafe/event-sales/quotes/:quoteId/actions", async (request, reply) =>
    run(reply, () =>
      service.quoteAction(
        eventQuoteIdSchema.parse(request.params).quoteId,
        eventQuoteActionSchema.parse(request.body).action,
        contextFor(request),
      ),
    ),
  );
  app.post("/api/v1/qcafe/event-sales/bookings/:eventBookingId/tasks", async (request, reply) =>
    run(reply, () =>
      service.task(
        eventBookingIdSchema.parse(request.params).eventBookingId,
        createEventTaskSchema.parse(request.body),
        contextFor(request),
      ),
    ),
  );
  app.post("/api/v1/qcafe/event-sales/tasks/:itemId/complete", async (request, reply) =>
    run(reply, () => service.completeTask(eventItemIdSchema.parse(request.params).itemId, contextFor(request))),
  );
  app.post("/api/v1/qcafe/event-sales/bookings/:eventBookingId/schedule", async (request, reply) =>
    run(reply, () =>
      service.schedule(
        eventBookingIdSchema.parse(request.params).eventBookingId,
        createEventScheduleSchema.parse(request.body),
        contextFor(request),
      ),
    ),
  );
  app.post("/api/v1/qcafe/event-sales/schedule/:itemId/actions", async (request, reply) =>
    run(reply, () =>
      service.scheduleAction(
        eventItemIdSchema.parse(request.params).itemId,
        eventItemActionSchema.parse(request.body).action,
        contextFor(request),
      ),
    ),
  );
  app.post("/api/v1/qcafe/event-sales/bookings/:eventBookingId/orders", async (request, reply) =>
    run(reply, () => {
      const input = linkEventOrderSchema.parse(request.body);
      return service.linkOrder(
        eventBookingIdSchema.parse(request.params).eventBookingId,
        input.orderId,
        input.role,
        contextFor(request),
      );
    }),
  );
  app.post("/api/v1/qcafe/event-sales/bookings/:eventBookingId/advances", async (request, reply) =>
    run(reply, () =>
      service.advance(
        eventBookingIdSchema.parse(request.params).eventBookingId,
        eventAdvanceSchema.parse(request.body),
        contextFor(request),
      ),
    ),
  );
}

async function run(
  reply: { code(value: number): { send(body: unknown): unknown } },
  operation: () => Promise<unknown>,
) {
  try {
    return reply.code(201).send(await operation());
  } catch (error) {
    if (error instanceof EventSalesConflictError) return reply.code(409).send({ error: error.message });
    throw error;
  }
}
