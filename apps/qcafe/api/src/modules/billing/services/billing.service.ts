import type { ActivityRecorder, CommandContext } from "../../foundation/contracts/activity.contract.js";
import type { PosService } from "../../pos/services/pos.service.js";
import type { BillingScope, IssueVoucher, PostPayment } from "../contracts/billing.contract.js";
import { BillingRepository } from "../repository/billing.repository.js";

export class BillingConflictError extends Error {}

export class BillingService {
  constructor(
    private readonly repo: BillingRepository,
    private readonly pos: PosService,
    private readonly activity: ActivityRecorder,
    private readonly now: () => Date = () => new Date(),
  ) {}

  read(scope: BillingScope) {
    return this.repo.workspace(scope);
  }

  async installDefaults(scope: BillingScope, context: CommandContext) {
    if (!(await this.repo.location(scope))) throw new BillingConflictError("The billing outlet scope is invalid.");
    await this.repo.installDefaults(scope.locationId, this.timestamp());
    await this.record(context, "defaults.installed", scope.locationId, "location");
    return this.read(scope);
  }

  async createTaxRate(
    input: { basisPoints: number; businessId: string; code: string; name: string },
    context: CommandContext,
  ) {
    const id = await this.repo.createTaxRate(input, this.timestamp());
    await this.record(context, "tax-rate.configured", id, "tax-rate", { basisPoints: input.basisPoints });
    return { id };
  }

  async postBill(orderId: string, context: CommandContext) {
    const existing = await this.repo.billForOrder(orderId);
    if (existing) return this.read({ businessId: existing.business_id, locationId: existing.location_id });
    const snapshot = await this.pos.snapshot(orderId);
    if (!snapshot || !["confirmed", "fulfilled"].includes(snapshot.order.status))
      throw new BillingConflictError("Only a confirmed order can be billed.");
    if (!snapshot.lines.length || snapshot.order.total_minor <= 0)
      throw new BillingConflictError("The order has no payable lines.");
    const rates = new Map((await this.repo.taxRates(snapshot.order.business_id)).map((rate) => [rate.code, rate]));
    const codes = new Map(
      (await this.repo.itemTaxCodes(snapshot.lines.map((line) => line.item_id))).map((item) => [
        item.id,
        item.tax_code,
      ]),
    );
    let allocatedDiscount = 0;
    const lines = snapshot.lines.map((line, index) => {
      const last = index === snapshot.lines.length - 1;
      const discount = last
        ? snapshot.order.discount_minor - allocatedDiscount
        : Math.round((snapshot.order.discount_minor * line.line_total_minor) / snapshot.order.subtotal_minor);
      allocatedDiscount += discount;
      const total = Math.max(0, line.line_total_minor - discount);
      const taxCode = codes.get(line.item_id) ?? null;
      const basis = taxCode ? (rates.get(taxCode)?.basis_points ?? 0) : 0;
      const tax = basis ? Math.round((total * basis) / (10_000 + basis)) : 0;
      return {
        description: line.variant_name ? `${line.item_name} - ${line.variant_name}` : line.item_name,
        item_code: line.item_code,
        order_line_id: line.id,
        quantity_milli: line.quantity_milli,
        tax_basis_points: basis,
        tax_code: taxCode,
        tax_minor: tax,
        taxable_minor: total - tax,
        total_minor: total,
        unit_price_minor: line.unit_price_minor + line.modifier_total_minor,
      };
    });
    const id = await this.repo.postBill(snapshot.order, lines, context.actorId, this.timestamp());
    await this.record(context, "bill.posted", id, "bill", { orderId });
    return this.read({ businessId: snapshot.order.business_id, locationId: snapshot.order.location_id });
  }

  async postPayment(billId: string, input: PostPayment, context: CommandContext) {
    const [bill, method] = await Promise.all([
      this.repo.findBill(billId),
      this.repo.paymentMethod(input.paymentMethodId),
    ]);
    if (!bill || !method || method.location_id !== bill.location_id || !method.active)
      throw new BillingConflictError("The bill or payment method is invalid.");
    if (["voided", "refunded"].includes(bill.status))
      throw new BillingConflictError("This bill cannot accept payment.");
    if (input.amountMinor > bill.balance_minor)
      throw new BillingConflictError("Payment exceeds the outstanding balance.");
    if (input.status === "failed" && !input.failureReason)
      throw new BillingConflictError("A failed payment requires a failure reason.");
    if (method.kind === "cash") {
      if (!input.cashShiftId) throw new BillingConflictError("Cash payment requires an open cash shift.");
      const shift = await this.repo.cashShift(input.cashShiftId);
      if (!shift || shift.status !== "open") throw new BillingConflictError("The selected cash shift is not open.");
      if ((input.receivedMinor ?? input.amountMinor) < input.amountMinor)
        throw new BillingConflictError("Cash received cannot be less than the payment amount.");
    } else if (input.receivedMinor && input.receivedMinor !== input.amountMinor) {
      throw new BillingConflictError("Only cash tenders can record change.");
    }
    const id = await this.repo.recordPayment(bill, method, input, context.actorId, this.timestamp());
    await this.record(context, input.status === "posted" ? "payment.posted" : "payment.failed", id, "payment", {
      amountMinor: input.amountMinor,
      billId,
    });
    return this.read({ businessId: bill.business_id, locationId: bill.location_id });
  }

  async refund(paymentId: string, amount: number, reason: string, context: CommandContext) {
    const payment = await this.repo.payment(paymentId);
    if (!payment || payment.status !== "posted" || payment.direction !== "in" || payment.purpose !== "sale")
      throw new BillingConflictError("Only a posted sale payment can be refunded.");
    const refunded = await this.repo.refundedAmount(payment.id);
    if (amount > payment.amount_minor - refunded)
      throw new BillingConflictError("Refund exceeds the unreversed payment amount.");
    const id = await this.repo.refund(payment, amount, reason, context.actorId, this.timestamp());
    await this.record(context, "payment.refunded", id, "payment", {
      amountMinor: amount,
      originalPaymentId: payment.id,
    });
    const bill = payment.bill_id ? await this.repo.findBill(payment.bill_id) : undefined;
    if (!bill) throw new BillingConflictError("The payment bill is unavailable.");
    return this.read({ businessId: bill.business_id, locationId: bill.location_id });
  }

  async reverse(paymentId: string, reason: string, context: CommandContext) {
    const payment = await this.repo.payment(paymentId);
    if (!payment || payment.status !== "posted" || payment.direction !== "in" || payment.purpose !== "sale")
      throw new BillingConflictError("Only a posted sale payment can be reversed.");
    const remaining = payment.amount_minor - (await this.repo.refundedAmount(payment.id));
    if (remaining <= 0) throw new BillingConflictError("The payment is already fully reversed.");
    const id = await this.repo.refund(payment, remaining, reason, context.actorId, this.timestamp(), "reversal");
    await this.record(context, "payment.reversed", id, "payment", {
      amountMinor: remaining,
      originalPaymentId: payment.id,
    });
    const bill = payment.bill_id ? await this.repo.findBill(payment.bill_id) : undefined;
    if (!bill) throw new BillingConflictError("The payment bill is unavailable.");
    return this.read({ businessId: bill.business_id, locationId: bill.location_id });
  }

  async issueVoucher(input: IssueVoucher, context: CommandContext) {
    if (!input.customerRef && !input.eventRef)
      throw new BillingConflictError("An advance voucher requires a customer or event reference.");
    const method = await this.repo.paymentMethod(input.paymentMethodId);
    if (!method || method.location_id !== input.locationId || !method.active || method.kind === "voucher")
      throw new BillingConflictError("The advance payment method is invalid.");
    if (method.kind === "cash") throw new BillingConflictError("Cash advances require the cash-shift workflow.");
    const id = await this.repo.issueVoucher(input, context.actorId, this.timestamp());
    await this.record(context, "voucher.issued", id, "voucher", { amountMinor: input.amountMinor });
    return this.read({ businessId: input.businessId, locationId: input.locationId });
  }

  async applyVoucher(voucherId: string, billId: string, amount: number, context: CommandContext) {
    const [voucher, bill] = await Promise.all([this.repo.voucher(voucherId), this.repo.findBill(billId)]);
    if (!voucher || !bill || voucher.business_id !== bill.business_id || voucher.location_id !== bill.location_id)
      throw new BillingConflictError("The voucher and bill do not share the same outlet scope.");
    if (!["active", "part_used"].includes(voucher.status))
      throw new BillingConflictError("The voucher is not available.");
    if (voucher.expires_at && voucher.expires_at <= this.timestamp())
      throw new BillingConflictError("The voucher has expired.");
    if (amount > voucher.remaining_value_minor || amount > bill.balance_minor)
      throw new BillingConflictError("Voucher application exceeds the available value or bill balance.");
    await this.repo.applyVoucher(voucherId, billId, amount, context.actorId, this.timestamp());
    await this.record(context, "voucher.applied", voucherId, "voucher", { amountMinor: amount, billId });
    return this.read({ businessId: bill.business_id, locationId: bill.location_id });
  }

  async openShift(
    input: { businessDayId: string; drawerId: string; openingFloatMinor: number },
    context: CommandContext,
  ) {
    const [day, drawer, existing] = await Promise.all([
      this.repo.businessDay(input.businessDayId),
      this.repo.drawer(input.drawerId),
      this.repo.openShiftForDrawer(input.drawerId),
    ]);
    if (!day || day.status !== "open" || !drawer || drawer.location_id !== day.location_id || !drawer.active)
      throw new BillingConflictError("The drawer and open business day are invalid.");
    if (existing) throw new BillingConflictError("This drawer already has an open shift.");
    const id = await this.repo.openShift(
      input.drawerId,
      input.businessDayId,
      input.openingFloatMinor,
      context.actorId,
      this.timestamp(),
    );
    await this.record(context, "cash-shift.opened", id, "cash-shift", { openingFloatMinor: input.openingFloatMinor });
    return id;
  }

  async moveCash(
    shiftId: string,
    input: { amountMinor: number; approvedBy?: string; kind: "cash_in" | "cash_out" | "safe_drop"; reason: string },
    context: CommandContext,
  ) {
    const shift = await this.repo.cashShift(shiftId);
    if (!shift || shift.status !== "open") throw new BillingConflictError("The cash shift is not open.");
    if (["cash_out", "safe_drop"].includes(input.kind) && !input.approvedBy)
      throw new BillingConflictError("Cash out and safe drop require an approver.");
    await this.repo.cashMovement(
      shiftId,
      input.kind,
      input.amountMinor,
      input.reason,
      context.actorId,
      input.approvedBy,
      this.timestamp(),
    );
    await this.record(context, "cash.moved", shiftId, "cash-shift", {
      amountMinor: input.amountMinor,
      kind: input.kind,
    });
    return shiftId;
  }

  async settleShift(
    shiftId: string,
    input: { approvedBy?: string; countedMinor: number; varianceReason?: string },
    context: CommandContext,
  ) {
    const shift = await this.repo.cashShift(shiftId);
    if (!shift || shift.status !== "open" || (await this.repo.settlement(shiftId)))
      throw new BillingConflictError("The cash shift is not available for settlement.");
    const expected = await this.repo.expectedCash(shift),
      variance = input.countedMinor - expected;
    if (variance !== 0 && (!input.varianceReason || !input.approvedBy))
      throw new BillingConflictError("A cash variance requires a reason and approver.");
    await this.repo.settleShift(
      shiftId,
      expected,
      input.countedMinor,
      input.varianceReason,
      input.approvedBy,
      this.timestamp(),
    );
    await this.record(context, "cash-shift.settled", shiftId, "cash-shift", {
      expectedMinor: expected,
      varianceMinor: variance,
    });
    return shiftId;
  }

  async closeDay(businessDayId: string, context: CommandContext) {
    const day = await this.repo.dayContext(businessDayId);
    if (!day || day.day.status !== "open") throw new BillingConflictError("The business day is not open.");
    if (day.openShifts.length) throw new BillingConflictError("Settle every cash shift before day close.");
    if (day.bills.some((bill) => bill.balance_minor > 0))
      throw new BillingConflictError("Settle every posted bill before day close.");
    await this.repo.closeDay(day, context.actorId, this.timestamp());
    await this.record(context, "business-day.closed", businessDayId, "business-day", { bills: day.bills.length });
    return businessDayId;
  }

  async assertOrderSettled(orderId: string) {
    const bill = await this.repo.billForOrder(orderId);
    if (!bill || bill.status !== "paid" || bill.balance_minor !== 0)
      throw new BillingConflictError("Post and fully settle the bill before handover.");
  }

  private timestamp() {
    return this.now().toISOString();
  }
  private record(
    context: CommandContext,
    event: string,
    subjectId: string,
    subjectType: string,
    payload?: Record<string, unknown>,
  ) {
    return this.activity.record(context, { eventType: `qcafe.billing.${event}`, payload, subjectId, subjectType });
  }
}
