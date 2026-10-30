import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { OrderDependencies } from "./order.types.js";
import { OrderService } from "./order.service.js";
const uuid = z.string().regex(/^[a-f0-9]{8}$/u);
const booking = z
  .object({
    customerName: z.string().trim().min(1).max(120),
    mobile: z
      .string()
      .trim()
      .regex(/^\+?[0-9]{7,15}$/u, "Enter a mobile number with 7 to 15 digits."),
    pickupAt: z.iso.datetime({ offset: true })
  })
  .strict();
const line = z
  .object({
    menuUuid: uuid,
    code: z.string(),
    name: z.string(),
    quantity: z.number(),
    rate: z.number(),
    amount: z.number()
  })
  .strict();
const ticket = z
  .object({
    uuid,
    number: z.string(),
    kind: z.enum(["send", "cancel"]),
    createdAt: z.string(),
    lines: z.array(line)
  })
  .strict();
const order = z
  .object({
    parcelToken: z.string().nullable(),
    booking: booking.nullable(),
    bookingToken: z.string().nullable(),
    uuid,
    name: z.string(),
    revision: z.number(),
    status: z.enum(["draft", "billed", "cancelled"]),
    mode: z.enum(["POS", "KOT", "TAKE AWAY"]),
    tableUuid: uuid.nullable(),
    tableName: z.string(),
    seats: z.array(z.number()),
    lines: z.array(line),
    tickets: z.array(ticket),
    billUuid: uuid.nullable()
  })
  .strict();
const input = z
  .object({
    requestId: z.uuid(),
    booking: booking.nullable().optional(),
    revision: z.number().int().nonnegative(),
    action: z.enum(["save", "kitchen", "bill", "cancel"]),
    name: z.string().trim().min(1).max(40),
    mode: z.enum(["POS", "KOT", "TAKE AWAY"]),
    tableUuid: uuid.nullable(),
    seats: z.array(z.number().int().min(1).max(50)).max(50),
    lines: z
      .array(
        z
          .object({ menuUuid: uuid, quantity: z.number().positive().max(999).multipleOf(0.001) })
          .strict()
      )
      .max(100)
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.booking && v.mode !== "TAKE AWAY")
      ctx.addIssue({ code: "custom", message: "Pickup bookings cannot use a table or seats." });
    if (new Set(v.seats).size !== v.seats.length)
      ctx.addIssue({ code: "custom", message: "Choose each seat only once." });
    if (
      v.mode === "TAKE AWAY"
        ? v.tableUuid !== null || v.seats.length > 0
        : !v.tableUuid || !v.seats.length
    )
      ctx.addIssue({ code: "custom", message: "Choose a table and seats, or use Take Away." });
  });
export function registerOrderRoutes(app: FastifyInstance, deps: OrderDependencies) {
  const service = new OrderService(deps);
  registerContractRoute(app, {
    method: "GET",
    url: "/qcafe/orders/floor-bills",
    schemas: {
      response: z.array(
        z.object({ uuid, name: z.string(), tableUuid: uuid, billUuid: uuid }).strict()
      )
    },
    handler: ({ request }) => service.floorBills(request)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/qcafe/kitchen/printers",
    schemas: {
      response: z.array(
        z.object({ name: z.string(), isDefault: z.boolean(), interactive: z.boolean() }).strict()
      )
    },
    handler: ({ request }) => service.printers(request)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/qcafe/kitchen/dispatch",
    schemas: {
      body: z.object({}).strict(),
      response: z.object({ accepted: z.boolean() }).strict()
    },
    handler: ({ request }) => service.dispatch(request)
  });

  const job = z
    .object({
      uuid,
      number: z.string(),
      orderUuid: uuid,
      orderName: z.string(),
      tableName: z.string(),
      seats: z.array(z.number()),
      status: z.enum(["queued", "ready", "delivered"]),
      waiterUuid: uuid.nullable(),
      printStatus: z.string(),
      printError: z.string(),
      lines: z.array(line)
    })
    .strict();
  registerContractRoute(app, {
    method: "GET",
    url: "/qcafe/kitchen",
    schemas: { response: z.array(job) },
    handler: ({ request }) => service.kitchenQueue(request)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/qcafe/kitchen/confirm",
    schemas: {
      body: z
        .object({
          token: z.string().trim().min(1).max(32),
          action: z.enum(["ready", "delivered"]),
          waiterUuid: uuid.nullable()
        })
        .strict(),
      response: z.array(job)
    },
    handler: ({ request, body }) =>
      service.confirmKitchen(request, body.token, body.action, body.waiterUuid)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/qcafe/orders",
    schemas: { response: z.array(order) },
    handler: ({ request }) => service.list(request)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/qcafe/orders/occupied-seats",
    schemas: {
      response: z.array(z.object({ tableUuid: uuid, seat: z.number(), orderUuid: uuid }).strict())
    },
    handler: ({ request }) => service.occupied(request)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/qcafe/orders/:uuid",
    schemas: { params: z.object({ uuid }).strict(), response: order },
    handler: ({ request, params }) => service.get(request, params.uuid)
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/qcafe/orders/:uuid",
    schemas: { params: z.object({ uuid }).strict(), body: input, response: order },
    handler: ({ request, params, body }) => service.mutate(request, params.uuid, body)
  });
}
