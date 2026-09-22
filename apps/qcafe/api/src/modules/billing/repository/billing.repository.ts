import { randomUUID } from "node:crypto";
import type { Kysely, Transaction } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type { BillingScope, IssueVoucher, PostPayment } from "../contracts/billing.contract.js";
import { installBillingDefaults } from "../persistence/billing-lifecycle.js";

type Db = Kysely<QcafeFoundationDatabase> | Transaction<QcafeFoundationDatabase>;
type BillLine = Omit<QcafeFoundationDatabase["qcafe_bill_lines"], "bill_id" | "id">;

export class BillingRepository {
  constructor(private readonly db: Kysely<QcafeFoundationDatabase>) {}

  location(scope: BillingScope) {
    return this.db
      .selectFrom("qcafe_locations")
      .select("id")
      .where("id", "=", scope.locationId)
      .where("business_id", "=", scope.businessId)
      .executeTakeFirst();
  }

  installDefaults(locationId: string, now: string) {
    return installBillingDefaults(this.db, locationId, now);
  }

  async workspace(scope: BillingScope) {
    const bills = await this.db
      .selectFrom("qcafe_bills")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .orderBy("issued_at", "desc")
      .execute();
    const billIds = bills.map((bill) => bill.id);
    const paymentMethods = await this.db
      .selectFrom("qcafe_payment_methods")
      .selectAll()
      .where("location_id", "=", scope.locationId)
      .orderBy("name")
      .execute();
    const payments = await this.db
      .selectFrom("qcafe_payments")
      .selectAll()
      .where("location_id", "=", scope.locationId)
      .orderBy("received_at", "desc")
      .execute();
    const paymentIds = payments.map((payment) => payment.id);
    const vouchers = await this.db
      .selectFrom("qcafe_vouchers")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .orderBy("issued_at", "desc")
      .execute();
    const voucherIds = vouchers.map((voucher) => voucher.id);
    const drawers = await this.db
      .selectFrom("qcafe_cash_drawers")
      .selectAll()
      .where("location_id", "=", scope.locationId)
      .orderBy("code")
      .execute();
    const drawerIds = drawers.map((drawer) => drawer.id);
    const cashShifts = drawerIds.length
      ? await this.db.selectFrom("qcafe_cash_shifts").selectAll().where("drawer_id", "in", drawerIds).execute()
      : [];
    const shiftIds = cashShifts.map((shift) => shift.id);
    const days = await this.db
      .selectFrom("qcafe_business_days")
      .select("id")
      .where("location_id", "=", scope.locationId)
      .execute();
    const dayIds = days.map((day) => day.id);
    return {
      bills,
      billLines: billIds.length
        ? await this.db.selectFrom("qcafe_bill_lines").selectAll().where("bill_id", "in", billIds).execute()
        : [],
      billTaxes: billIds.length
        ? await this.db.selectFrom("qcafe_bill_taxes").selectAll().where("bill_id", "in", billIds).execute()
        : [],
      taxRates: await this.db
        .selectFrom("qcafe_tax_rates")
        .selectAll()
        .where("business_id", "=", scope.businessId)
        .orderBy("code")
        .execute(),
      paymentMethods,
      payments,
      tenderDetails: paymentIds.length
        ? await this.db
            .selectFrom("qcafe_payment_tender_details")
            .selectAll()
            .where("payment_id", "in", paymentIds)
            .execute()
        : [],
      receipts: paymentIds.length
        ? await this.db.selectFrom("qcafe_receipts").selectAll().where("payment_id", "in", paymentIds).execute()
        : [],
      vouchers,
      voucherApplications: voucherIds.length
        ? await this.db
            .selectFrom("qcafe_voucher_applications")
            .selectAll()
            .where("voucher_id", "in", voucherIds)
            .execute()
        : [],
      refunds: paymentIds.length
        ? await this.db.selectFrom("qcafe_refunds").selectAll().where("original_payment_id", "in", paymentIds).execute()
        : [],
      drawers,
      cashShifts,
      cashMovements: shiftIds.length
        ? await this.db.selectFrom("qcafe_cash_movements").selectAll().where("cash_shift_id", "in", shiftIds).execute()
        : [],
      settlements: shiftIds.length
        ? await this.db
            .selectFrom("qcafe_shift_settlements")
            .selectAll()
            .where("cash_shift_id", "in", shiftIds)
            .execute()
        : [],
      dayCloses: dayIds.length
        ? await this.db.selectFrom("qcafe_day_closes").selectAll().where("business_day_id", "in", dayIds).execute()
        : [],
    };
  }

  findBill(id: string) {
    return this.db.selectFrom("qcafe_bills").selectAll().where("id", "=", id).executeTakeFirst();
  }
  billForOrder(orderId: string) {
    return this.db.selectFrom("qcafe_bills").selectAll().where("order_id", "=", orderId).executeTakeFirst();
  }
  payment(id: string) {
    return this.db.selectFrom("qcafe_payments").selectAll().where("id", "=", id).executeTakeFirst();
  }
  paymentMethod(id: string) {
    return this.db.selectFrom("qcafe_payment_methods").selectAll().where("id", "=", id).executeTakeFirst();
  }
  voucher(id: string) {
    return this.db.selectFrom("qcafe_vouchers").selectAll().where("id", "=", id).executeTakeFirst();
  }
  cashShift(id: string) {
    return this.db.selectFrom("qcafe_cash_shifts").selectAll().where("id", "=", id).executeTakeFirst();
  }
  drawer(id: string) {
    return this.db.selectFrom("qcafe_cash_drawers").selectAll().where("id", "=", id).executeTakeFirst();
  }
  businessDay(id: string) {
    return this.db.selectFrom("qcafe_business_days").selectAll().where("id", "=", id).executeTakeFirst();
  }
  openShiftForDrawer(drawerId: string) {
    return this.db
      .selectFrom("qcafe_cash_shifts")
      .select("id")
      .where("drawer_id", "=", drawerId)
      .where("status", "=", "open")
      .executeTakeFirst();
  }
  settlement(shiftId: string) {
    return this.db
      .selectFrom("qcafe_shift_settlements")
      .select("id")
      .where("cash_shift_id", "=", shiftId)
      .executeTakeFirst();
  }
  async refundedAmount(paymentId: string) {
    const refunds = await this.db
      .selectFrom("qcafe_payments")
      .select("amount_minor")
      .where("parent_payment_id", "=", paymentId)
      .where("direction", "=", "out")
      .where("status", "=", "posted")
      .execute();
    return refunds.reduce((sum, refund) => sum + refund.amount_minor, 0);
  }
  taxRates(businessId: string) {
    return this.db
      .selectFrom("qcafe_tax_rates")
      .selectAll()
      .where("business_id", "=", businessId)
      .where("active", "=", 1)
      .execute();
  }
  itemTaxCodes(itemIds: string[]) {
    return this.db.selectFrom("qcafe_menu_items").select(["id", "tax_code"]).where("id", "in", itemIds).execute();
  }

  async createTaxRate(input: { basisPoints: number; businessId: string; code: string; name: string }, now: string) {
    const existing = await this.db
      .selectFrom("qcafe_tax_rates")
      .selectAll()
      .where("business_id", "=", input.businessId)
      .where("code", "=", input.code)
      .executeTakeFirst();
    if (existing) {
      await this.db
        .updateTable("qcafe_tax_rates")
        .set({ active: 1, basis_points: input.basisPoints, name: input.name, updated_at: now })
        .where("id", "=", existing.id)
        .execute();
      return existing.id;
    }
    const id = randomUUID();
    await this.db
      .insertInto("qcafe_tax_rates")
      .values({
        active: 1,
        basis_points: input.basisPoints,
        business_id: input.businessId,
        code: input.code,
        created_at: now,
        id,
        name: input.name,
        updated_at: now,
      })
      .execute();
    return id;
  }

  async postBill(order: QcafeFoundationDatabase["qcafe_orders"], lines: BillLine[], actor: string, now: string) {
    return this.db.transaction().execute(async (tx) => {
      const id = randomUUID(),
        number = await nextNumber(tx, order.location_id, "bill", now),
        taxMinor = lines.reduce((sum, line) => sum + line.tax_minor, 0);
      await tx
        .insertInto("qcafe_bills")
        .values({
          balance_minor: order.total_minor,
          business_id: order.business_id,
          currency: order.currency,
          discount_minor: order.discount_minor,
          id,
          issued_at: now,
          location_id: order.location_id,
          number,
          order_id: order.id,
          paid_minor: 0,
          payable_minor: order.total_minor,
          posted_by: actor,
          status: "posted",
          subtotal_minor: order.subtotal_minor,
          tax_minor: taxMinor,
          updated_at: now,
        })
        .execute();
      if (lines.length)
        await tx
          .insertInto("qcafe_bill_lines")
          .values(lines.map((line) => ({ ...line, bill_id: id, id: randomUUID() })))
          .execute();
      const grouped = new Map<string, { basis: number; tax: number; taxable: number }>();
      for (const line of lines) {
        if (!line.tax_code) continue;
        const value = grouped.get(line.tax_code) ?? { basis: line.tax_basis_points, tax: 0, taxable: 0 };
        value.tax += line.tax_minor;
        value.taxable += line.taxable_minor;
        grouped.set(line.tax_code, value);
      }
      if (grouped.size)
        await tx
          .insertInto("qcafe_bill_taxes")
          .values(
            [...grouped].map(([code, value]) => ({
              bill_id: id,
              id: randomUUID(),
              tax_basis_points: value.basis,
              tax_code: code,
              tax_minor: value.tax,
              taxable_minor: value.taxable,
            })),
          )
          .execute();
      return id;
    });
  }

  async recordPayment(
    bill: QcafeFoundationDatabase["qcafe_bills"],
    method: QcafeFoundationDatabase["qcafe_payment_methods"],
    input: PostPayment,
    actor: string,
    now: string,
  ) {
    return this.db.transaction().execute(async (tx) => {
      const id = randomUUID();
      const received = input.receivedMinor ?? input.amountMinor;
      await tx
        .insertInto("qcafe_payments")
        .values({
          amount_minor: input.amountMinor,
          bill_id: bill.id,
          cash_shift_id: input.cashShiftId ?? null,
          direction: "in",
          failure_reason: input.status === "failed" ? (input.failureReason ?? "Provider declined") : null,
          id,
          location_id: bill.location_id,
          parent_payment_id: null,
          payment_method_id: method.id,
          posted_by: actor,
          provider_reference: input.providerReference ?? null,
          purpose: "sale",
          received_at: now,
          status: input.status,
        })
        .execute();
      await tx
        .insertInto("qcafe_payment_tender_details")
        .values({
          approval_code: input.approvalCode ?? null,
          change_minor: input.status === "posted" ? Math.max(0, received - input.amountMinor) : 0,
          id: randomUUID(),
          masked_reference: input.maskedReference ?? null,
          payment_id: id,
          received_minor: received,
          tender_kind: method.kind,
        })
        .execute();
      if (input.status === "posted") {
        await issueReceipt(tx, bill.location_id, bill.id, id, now);
        await recalculateBill(tx, bill.id, now);
      }
      return id;
    });
  }

  async refund(
    original: QcafeFoundationDatabase["qcafe_payments"],
    amount: number,
    reason: string,
    actor: string,
    now: string,
    purpose: "refund" | "reversal" = "refund",
  ) {
    return this.db.transaction().execute(async (tx) => {
      const id = randomUUID();
      await tx
        .insertInto("qcafe_payments")
        .values({
          ...original,
          amount_minor: amount,
          direction: "out",
          failure_reason: null,
          id,
          parent_payment_id: original.id,
          posted_by: actor,
          provider_reference: null,
          purpose,
          received_at: now,
          status: "posted",
        })
        .execute();
      await tx
        .insertInto("qcafe_refunds")
        .values({
          approved_by: actor,
          created_at: now,
          id: randomUUID(),
          original_payment_id: original.id,
          reason,
          refund_payment_id: id,
          status: "posted",
        })
        .execute();
      if (original.bill_id) {
        await issueReceipt(tx, original.location_id, original.bill_id, id, now);
        await recalculateBill(tx, original.bill_id, now);
      }
      return id;
    });
  }

  async issueVoucher(input: IssueVoucher, actor: string, now: string) {
    return this.db.transaction().execute(async (tx) => {
      const paymentId = randomUUID();
      await tx
        .insertInto("qcafe_payments")
        .values({
          amount_minor: input.amountMinor,
          bill_id: null,
          cash_shift_id: null,
          direction: "in",
          failure_reason: null,
          id: paymentId,
          location_id: input.locationId,
          parent_payment_id: null,
          payment_method_id: input.paymentMethodId,
          posted_by: actor,
          provider_reference: input.providerReference ?? null,
          purpose: "advance",
          received_at: now,
          status: "posted",
        })
        .execute();
      await issueReceipt(tx, input.locationId, null, paymentId, now);
      const id = randomUUID();
      await tx
        .insertInto("qcafe_vouchers")
        .values({
          business_id: input.businessId,
          customer_ref: input.customerRef ?? null,
          event_ref: input.eventRef ?? null,
          expires_at: input.expiresAt ?? null,
          id,
          issued_at: now,
          issued_payment_id: paymentId,
          kind: "advance",
          location_id: input.locationId,
          number: await nextNumber(tx, input.locationId, "voucher", now),
          original_value_minor: input.amountMinor,
          remaining_value_minor: input.amountMinor,
          status: "active",
        })
        .execute();
      return id;
    });
  }

  async applyVoucher(voucherId: string, billId: string, amount: number, actor: string, now: string) {
    await this.db.transaction().execute(async (tx) => {
      const voucher = await tx
        .selectFrom("qcafe_vouchers")
        .selectAll()
        .where("id", "=", voucherId)
        .executeTakeFirstOrThrow();
      const remaining = voucher.remaining_value_minor - amount;
      await tx
        .insertInto("qcafe_voucher_applications")
        .values({
          applied_at: now,
          applied_by: actor,
          applied_minor: amount,
          bill_id: billId,
          id: randomUUID(),
          voucher_id: voucherId,
        })
        .execute();
      await tx
        .updateTable("qcafe_vouchers")
        .set({ remaining_value_minor: remaining, status: remaining === 0 ? "used" : "part_used" })
        .where("id", "=", voucherId)
        .execute();
      await recalculateBill(tx, billId, now);
    });
  }

  async openShift(drawerId: string, businessDayId: string, opening: number, cashier: string, now: string) {
    const id = randomUUID();
    await this.db.transaction().execute(async (tx) => {
      await tx
        .insertInto("qcafe_cash_shifts")
        .values({
          business_day_id: businessDayId,
          cashier_ref: cashier,
          closed_at: null,
          drawer_id: drawerId,
          id,
          opened_at: now,
          opening_float_minor: opening,
          status: "open",
        })
        .execute();
      await tx
        .insertInto("qcafe_cash_movements")
        .values({
          actor_ref: cashier,
          amount_minor: opening,
          approved_by: null,
          cash_shift_id: id,
          id: randomUUID(),
          kind: "float",
          occurred_at: now,
          reason: "Opening float",
        })
        .execute();
    });
    return id;
  }

  async cashMovement(
    shiftId: string,
    kind: "cash_in" | "cash_out" | "safe_drop",
    amount: number,
    reason: string,
    actor: string,
    approvedBy: string | undefined,
    now: string,
  ) {
    await this.db
      .insertInto("qcafe_cash_movements")
      .values({
        actor_ref: actor,
        amount_minor: amount,
        approved_by: approvedBy ?? null,
        cash_shift_id: shiftId,
        id: randomUUID(),
        kind,
        occurred_at: now,
        reason,
      })
      .execute();
  }

  async expectedCash(shift: QcafeFoundationDatabase["qcafe_cash_shifts"]) {
    const payments = await this.db
      .selectFrom("qcafe_payments")
      .innerJoin("qcafe_payment_methods", "qcafe_payment_methods.id", "qcafe_payments.payment_method_id")
      .select(["qcafe_payments.amount_minor", "qcafe_payments.direction", "qcafe_payments.status"])
      .where("qcafe_payments.cash_shift_id", "=", shift.id)
      .where("qcafe_payment_methods.kind", "=", "cash")
      .execute();
    const movements = await this.db
      .selectFrom("qcafe_cash_movements")
      .selectAll()
      .where("cash_shift_id", "=", shift.id)
      .execute();
    const tender = payments
      .filter((p) => p.status === "posted")
      .reduce((sum, p) => sum + (p.direction === "in" ? p.amount_minor : -p.amount_minor), 0);
    const movement = movements.reduce(
      (sum, item) => sum + (["float", "cash_in"].includes(item.kind) ? item.amount_minor : -item.amount_minor),
      0,
    );
    return tender + movement;
  }

  async settleShift(
    shiftId: string,
    expected: number,
    counted: number,
    reason: string | undefined,
    approver: string | undefined,
    now: string,
  ) {
    await this.db.transaction().execute(async (tx) => {
      await tx
        .insertInto("qcafe_shift_settlements")
        .values({
          approved_by: approver ?? null,
          cash_shift_id: shiftId,
          counted_minor: counted,
          expected_minor: expected,
          id: randomUUID(),
          settled_at: now,
          status: "posted",
          variance_minor: counted - expected,
          variance_reason: reason ?? null,
        })
        .execute();
      await tx
        .updateTable("qcafe_cash_shifts")
        .set({ closed_at: now, status: "closed" })
        .where("id", "=", shiftId)
        .execute();
    });
  }

  async dayContext(businessDayId: string) {
    const day = await this.db
      .selectFrom("qcafe_business_days")
      .selectAll()
      .where("id", "=", businessDayId)
      .executeTakeFirst();
    if (!day) return null;
    const openShifts = await this.db
      .selectFrom("qcafe_cash_shifts")
      .select("id")
      .where("business_day_id", "=", businessDayId)
      .where("status", "=", "open")
      .execute();
    const bills = await this.db
      .selectFrom("qcafe_bills")
      .selectAll()
      .where("location_id", "=", day.location_id)
      .where("issued_at", ">=", day.opened_at)
      .execute();
    const billIds = bills.map((bill) => bill.id);
    const payments = billIds.length
      ? await this.db
          .selectFrom("qcafe_payments")
          .selectAll()
          .where("bill_id", "in", billIds)
          .where("status", "=", "posted")
          .execute()
      : [];
    return { bills, day, openShifts, payments };
  }

  async closeDay(
    context: NonNullable<Awaited<ReturnType<BillingRepository["dayContext"]>>>,
    actor: string,
    now: string,
  ) {
    const incoming = context.payments.filter((p) => p.direction === "in").reduce((sum, p) => sum + p.amount_minor, 0);
    const refunds = context.payments.filter((p) => p.direction === "out").reduce((sum, p) => sum + p.amount_minor, 0);
    const totals: Record<string, number> = {};
    for (const payment of context.payments)
      totals[payment.payment_method_id] =
        (totals[payment.payment_method_id] ?? 0) +
        (payment.direction === "in" ? payment.amount_minor : -payment.amount_minor);
    await this.db.transaction().execute(async (tx) => {
      await tx
        .insertInto("qcafe_day_closes")
        .values({
          business_day_id: context.day.id,
          closed_at: now,
          closed_by: actor,
          id: randomUUID(),
          payment_totals_json: JSON.stringify(totals),
          payments_minor: incoming,
          refunds_minor: refunds,
          sales_minor: context.bills.reduce((sum, bill) => sum + bill.payable_minor, 0),
          status: "posted",
          tax_minor: context.bills.reduce((sum, bill) => sum + bill.tax_minor, 0),
        })
        .execute();
      await tx
        .updateTable("qcafe_business_days")
        .set({ closed_at: now, status: "closed" })
        .where("id", "=", context.day.id)
        .execute();
    });
  }
}

async function nextNumber(
  db: Db,
  locationId: string,
  kind: QcafeFoundationDatabase["qcafe_number_sequences"]["document_kind"],
  now: string,
) {
  const sequence = await db
    .selectFrom("qcafe_number_sequences")
    .selectAll()
    .where("location_id", "=", locationId)
    .where("document_kind", "=", kind)
    .executeTakeFirstOrThrow();
  await db
    .updateTable("qcafe_number_sequences")
    .set({ next_value: sequence.next_value + 1, updated_at: now })
    .where("id", "=", sequence.id)
    .execute();
  return `${sequence.prefix}-${String(sequence.next_value).padStart(6, "0")}`;
}

async function issueReceipt(db: Db, locationId: string, billId: string | null, paymentId: string, now: string) {
  await db
    .insertInto("qcafe_receipts")
    .values({
      bill_id: billId,
      id: randomUUID(),
      issued_at: now,
      number: await nextNumber(db, locationId, "receipt", now),
      payment_id: paymentId,
      rendered_document_ref: null,
      status: "issued",
    })
    .execute();
}

async function recalculateBill(db: Db, billId: string, now: string) {
  const bill = await db.selectFrom("qcafe_bills").selectAll().where("id", "=", billId).executeTakeFirstOrThrow();
  const payments = await db
    .selectFrom("qcafe_payments")
    .select(["amount_minor", "direction"])
    .where("bill_id", "=", billId)
    .where("status", "=", "posted")
    .execute();
  const vouchers = await db
    .selectFrom("qcafe_voucher_applications")
    .select("applied_minor")
    .where("bill_id", "=", billId)
    .execute();
  const paid =
    payments.reduce(
      (sum, payment) => sum + (payment.direction === "in" ? payment.amount_minor : -payment.amount_minor),
      0,
    ) + vouchers.reduce((sum, voucher) => sum + voucher.applied_minor, 0);
  const balance = Math.max(0, bill.payable_minor - paid);
  const hasCompensation = payments.some((payment) => payment.direction === "out");
  const status =
    paid <= 0 && hasCompensation
      ? "refunded"
      : paid <= 0
        ? "posted"
        : balance > 0
          ? "part_paid"
          : paid < bill.payable_minor
            ? "part_paid"
            : "paid";
  await db
    .updateTable("qcafe_bills")
    .set({ balance_minor: balance, paid_minor: paid, status, updated_at: now })
    .where("id", "=", billId)
    .execute();
}
