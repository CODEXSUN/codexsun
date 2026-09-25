import type { FastifyInstance, FastifyRequest } from "fastify";
import type { CommandContext } from "../../foundation/contracts/activity.contract.js";
import {
  applyVoucherSchema,
  billIdSchema,
  billingScopeSchema,
  billingWorkspaceSchema,
  businessDayIdSchema,
  cashMovementSchema,
  cashShiftIdSchema,
  createTaxRateSchema,
  issueVoucherSchema,
  openCashShiftSchema,
  paymentIdSchema,
  postBillSchema,
  postPaymentSchema,
  refundPaymentSchema,
  reversePaymentSchema,
  settleCashShiftSchema,
  voucherIdSchema,
} from "../contracts/billing.contract.js";
import { BillingConflictError, BillingService } from "../services/billing.service.js";
import { PolicyDeniedError, assertPolicy, type QcafePermission } from "../../policies/services/policies.js";
import type { Actor } from "@codexsun/platform-core";

type Context = (request: FastifyRequest) => CommandContext;
type ActorFor = (request: FastifyRequest) => Actor | undefined;

export async function registerBillingRoutes(
  app: FastifyInstance,
  service: BillingService,
  contextFor: Context,
  actorFor?: ActorFor,
) {
  app.get(
    "/api/v1/qcafe/billing",
    { schema: { querystring: billingScopeSchema, response: { 200: billingWorkspaceSchema }, tags: ["Billing"] } },
    (request) => service.read(billingScopeSchema.parse(request.query)),
  );
  app.post("/api/v1/qcafe/billing/tax-rates", async (request, reply) =>
    run(reply, () => service.createTaxRate(createTaxRateSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/billing/defaults", async (request, reply) =>
    run(reply, () => service.installDefaults(billingScopeSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/billing/bills", async (request, reply) =>
    run(reply, () => service.postBill(postBillSchema.parse(request.body).orderId, contextFor(request))),
  );
  app.post("/api/v1/qcafe/billing/bills/:billId/payments", async (request, reply) =>
    run(reply, () =>
      service.postPayment(
        billIdSchema.parse(request.params).billId,
        postPaymentSchema.parse(request.body),
        contextFor(request),
      ),
    ),
  );
  app.post("/api/v1/qcafe/billing/payments/:paymentId/refunds", async (request, reply) =>
    run(reply, () => {
      authorize(request, "qcafe.billing.refund");
      const input = refundPaymentSchema.parse(request.body);
      return service.refund(
        paymentIdSchema.parse(request.params).paymentId,
        input.amountMinor,
        input.reason,
        contextFor(request),
      );
    }),
  );
  app.post("/api/v1/qcafe/billing/payments/:paymentId/reversals", async (request, reply) =>
    run(reply, () => {
      authorize(request, "qcafe.billing.refund");
      return service.reverse(
        paymentIdSchema.parse(request.params).paymentId,
        reversePaymentSchema.parse(request.body).reason,
        contextFor(request),
      );
    }),
  );
  app.post("/api/v1/qcafe/billing/vouchers", async (request, reply) =>
    run(reply, () => {
      authorize(request, "qcafe.billing.voucher");
      return service.issueVoucher(issueVoucherSchema.parse(request.body), contextFor(request));
    }),
  );
  app.post("/api/v1/qcafe/billing/vouchers/:voucherId/applications", async (request, reply) =>
    run(reply, () => {
      authorize(request, "qcafe.billing.voucher");
      const input = applyVoucherSchema.parse(request.body);
      return service.applyVoucher(
        voucherIdSchema.parse(request.params).voucherId,
        input.billId,
        input.amountMinor,
        contextFor(request),
      );
    }),
  );
  app.post("/api/v1/qcafe/billing/cash-shifts", async (request, reply) =>
    run(reply, () => service.openShift(openCashShiftSchema.parse(request.body), contextFor(request))),
  );
  app.post("/api/v1/qcafe/billing/cash-shifts/:cashShiftId/movements", async (request, reply) =>
    run(reply, () => {
      authorize(request, "qcafe.cash.move");
      return service.moveCash(
        cashShiftIdSchema.parse(request.params).cashShiftId,
        cashMovementSchema.parse(request.body),
        contextFor(request),
      );
    }),
  );
  app.post("/api/v1/qcafe/billing/cash-shifts/:cashShiftId/settle", async (request, reply) =>
    run(reply, () => {
      authorize(request, "qcafe.cash.settle");
      return service.settleShift(
        cashShiftIdSchema.parse(request.params).cashShiftId,
        settleCashShiftSchema.parse(request.body),
        contextFor(request),
      );
    }),
  );
  app.post("/api/v1/qcafe/billing/business-days/:businessDayId/close", async (request, reply) =>
    run(reply, () => {
      authorize(request, "qcafe.day.close");
      return service.closeDay(businessDayIdSchema.parse(request.params).businessDayId, contextFor(request));
    }),
  );

  function authorize(request: FastifyRequest, permission: QcafePermission) {
    if (actorFor) assertPolicy(actorFor(request), permission);
  }
}

async function run(
  reply: { code(value: number): { send(body: unknown): unknown } },
  operation: () => Promise<unknown>,
) {
  try {
    return reply.code(201).send(await operation());
  } catch (error) {
    if (error instanceof BillingConflictError) return reply.code(409).send({ error: error.message });
    if (error instanceof PolicyDeniedError) return reply.code(403).send({ error: error.message });
    throw error;
  }
}
