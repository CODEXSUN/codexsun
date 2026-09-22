import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import type { CommandContext } from "../../foundation/contracts/activity.contract.js";
import {
  createCustomerSchema,
  createReservationSchema,
  guestBookingScopeSchema,
  guestBookingWorkspaceSchema,
  publicQrParamsSchema,
  publicQrResponseSchema,
  reservationActionSchema,
  reservationIdSchema,
  rotateTableQrSchema,
  scannerProfileSchema,
  seatReservationSchema,
} from "../contracts/guest-booking.contract.js";
import { GuestBookingConflictError, GuestBookingService } from "../services/guest-booking.service.js";

export async function registerGuestBookingRoutes(
  app: FastifyInstance,
  service: GuestBookingService,
  contextFor: (request: FastifyRequest) => CommandContext,
) {
  app.get(
    "/api/v1/qcafe/guest-booking",
    {
      schema: {
        querystring: guestBookingScopeSchema,
        response: { 200: guestBookingWorkspaceSchema },
        tags: ["Guest booking"],
      },
    },
    (request) => service.read(guestBookingScopeSchema.parse(request.query)),
  );
  app.post("/api/v1/qcafe/guest-booking/customers", async (request, reply) =>
    run(reply, () => service.customer(createCustomerSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/guest-booking/reservations", async (request, reply) =>
    run(reply, () => service.reserve(createReservationSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/guest-booking/reservations/:reservationId/actions", async (request, reply) =>
    run(reply, () => {
      const input = reservationActionSchema.parse(request.body);
      return service.action(
        reservationIdSchema.parse(request.params).reservationId,
        input.action,
        input.note,
        contextFor(request),
      );
    }),
  );
  app.post("/api/v1/qcafe/guest-booking/reservations/:reservationId/seat", async (request, reply) =>
    run(reply, () =>
      service.seat(
        reservationIdSchema.parse(request.params).reservationId,
        seatReservationSchema.parse(request.body),
        contextFor(request),
      ),
    ),
  );
  app.post("/api/v1/qcafe/guest-booking/table-qr/rotate", async (request, reply) =>
    run(reply, () => service.rotateQr(rotateTableQrSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/guest-booking/scanners", async (request, reply) =>
    run(reply, () => service.scanner(scannerProfileSchema.parse(request.body), contextFor(request))),
  );
  app.get(
    "/api/v1/qcafe/guest/qr/:token",
    {
      schema: {
        params: publicQrParamsSchema,
        response: { 200: publicQrResponseSchema, 404: z.object({ error: z.string() }) },
        tags: ["Guest QR"],
      },
    },
    async (request, reply) => {
      try {
        return await service.resolveQr(publicQrParamsSchema.parse(request.params).token);
      } catch (error) {
        if (error instanceof GuestBookingConflictError) return reply.code(404).send({ error: error.message });
        throw error;
      }
    },
  );
}

async function run(
  reply: { code(value: number): { send(body: unknown): unknown } },
  operation: () => Promise<unknown>,
) {
  try {
    return reply.code(201).send(await operation());
  } catch (error) {
    if (error instanceof GuestBookingConflictError) return reply.code(409).send({ error: error.message });
    throw error;
  }
}
