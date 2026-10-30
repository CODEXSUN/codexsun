import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { PosDependencies } from "./pos.types.js";
import { PosService } from "./pos.service.js";

const uuid = z.string().regex(/^[a-f0-9]{8}$/u);
const money = z.number().int().nonnegative().max(100_000_000);
const mode = z.enum(["cash", "card", "upi", "bank", "other"]);
const bill = z
  .object({
    uuid,
    number: z.string(),
    serviceContext: z
      .object({
        orderUuid: uuid,
        parcelToken: z.string().nullable().optional(),
        booking: z
          .object({
            token: z.string(),
            customerName: z.string(),
            mobile: z.string(),
            pickupAt: z.string()
          })
          .strict()
          .nullable()
          .optional(),
        mode: z.string(),
        tableName: z.string(),
        seats: z.array(z.number())
      })
      .strict()
      .nullable(),
    receiptContext: z
      .object({
        restaurantName: z.string(),
        branchName: z.string(),
        address: z.string(),
        contactNumber: z.string(),
        gstin: z.string(),
        fssai: z.string(),
        receiptHeader: z.string(),
        receiptFooter: z.string(),
        receiptLegalNote: z.string(),
        showReceiptContact: z.boolean(),
        receiptWidth: z.enum(["58mm", "80mm"]),
        gstRate: z.number(),
        taxAmount: money,
        netAmount: money
      })
      .strict()
      .nullable(),
    total: money,
    paid: money,
    status: z.enum(["open", "part-paid", "paid"]),
    createdAt: z.string(),
    lines: z.array(
      z
        .object({
          menuUuid: uuid,
          code: z.string(),
          name: z.string(),
          quantity: z.number(),
          rate: money,
          amount: money
        })
        .strict()
    ),
    payments: z.array(
      z.object({ uuid, amount: money, mode, reference: z.string(), createdAt: z.string() }).strict()
    )
  })
  .strict();

export function registerPosRoutes(app: FastifyInstance, dependencies: PosDependencies) {
  const service = new PosService(dependencies);
  registerContractRoute(app, {
    method: "GET",
    url: "/qcafe/pos",
    schemas: { response: z.array(bill) },
    handler: ({ request }) => service.list(request)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/qcafe/pos/:uuid",
    schemas: { params: z.object({ uuid }).strict(), response: bill },
    handler: ({ request, params }) => service.get(request, params.uuid)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/qcafe/pos",
    schemas: {
      body: z
        .object({
          requestId: z.uuid(),
          lines: z
            .array(
              z
                .object({
                  menuUuid: uuid,
                  quantity: z.number().positive().max(999).multipleOf(0.001)
                })
                .strict()
            )
            .min(1)
            .max(100)
        })
        .strict(),
      response: bill
    },
    handler: ({ request, body }) => service.create(request, body)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/qcafe/pos/:uuid/payments",
    schemas: {
      params: z.object({ uuid }).strict(),
      body: z
        .object({
          requestId: z.uuid(),
          amount: money.positive(),
          mode,
          reference: z.string().trim().max(120)
        })
        .strict(),
      response: bill
    },
    handler: ({ request, params, body }) => service.pay(request, params.uuid, body)
  });
}
