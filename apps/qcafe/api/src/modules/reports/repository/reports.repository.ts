import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type { QcafeDocumentsDatabase } from "../../documents/persistence/documents.database.js";
import type { ReportScope } from "../contracts/reports.contract.js";

export interface ResolvedReportScope {
  businessDayId: string | null;
  businessId: string;
  from: string;
  locationId: string;
  to: string;
}

const POSTED_BILL_STATUSES = ["posted", "part_paid", "paid", "refunded"] as const;

export class ReportsRepository {
  constructor(private readonly db: Kysely<QcafeFoundationDatabase>) {}

  location(scope: Pick<ReportScope, "businessId" | "locationId">) {
    return this.db
      .selectFrom("qcafe_locations")
      .select("id")
      .where("id", "=", scope.locationId)
      .where("business_id", "=", scope.businessId)
      .executeTakeFirst();
  }

  async resolveScope(input: ReportScope, now: string): Promise<ResolvedReportScope> {
    if (input.businessDayId) {
      const day = await this.db
        .selectFrom("qcafe_business_days")
        .selectAll()
        .where("id", "=", input.businessDayId)
        .where("location_id", "=", input.locationId)
        .executeTakeFirst();
      if (!day) throw new ReportsScopeError("The business day is invalid for this location.");
      return {
        businessDayId: day.id,
        businessId: input.businessId,
        from: day.opened_at,
        locationId: input.locationId,
        to: day.closed_at ?? now,
      };
    }
    if (!input.from || !input.to || input.to < input.from) {
      throw new ReportsScopeError("A report needs a business day or a valid from/to range.");
    }
    return {
      businessDayId: null,
      businessId: input.businessId,
      from: input.from,
      locationId: input.locationId,
      to: input.to,
    };
  }

  async sales(scope: ResolvedReportScope) {
    const bills = await this.db
      .selectFrom("qcafe_bills")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .where("issued_at", ">=", scope.from)
      .where("issued_at", "<=", scope.to)
      .where("status", "in", [...POSTED_BILL_STATUSES])
      .orderBy("issued_at")
      .execute();
    const billIds = bills.map((bill) => bill.id);
    return {
      rows: bills,
      totals: {
        balanceMinor: bills.reduce((sum, bill) => sum + bill.balance_minor, 0),
        bills: bills.length,
        discountMinor: bills.reduce((sum, bill) => sum + bill.discount_minor, 0),
        paidMinor: bills.reduce((sum, bill) => sum + bill.paid_minor, 0),
        payableMinor: bills.reduce((sum, bill) => sum + bill.payable_minor, 0),
        subtotalMinor: bills.reduce((sum, bill) => sum + bill.subtotal_minor, 0),
        taxMinor: bills.reduce((sum, bill) => sum + bill.tax_minor, 0),
      },
      billIds,
    };
  }

  async billLines(scope: ResolvedReportScope, billIds: string[]) {
    if (!billIds.length) return [];
    return this.db.selectFrom("qcafe_bill_lines").selectAll().where("bill_id", "in", billIds).execute();
  }

  async taxes(billIds: string[]) {
    const taxes = billIds.length
      ? await this.db.selectFrom("qcafe_bill_taxes").selectAll().where("bill_id", "in", billIds).execute()
      : [];
    const byCode = new Map<string, { taxableMinor: number; taxMinor: number }>();
    for (const tax of taxes) {
      const entry = byCode.get(tax.tax_code) ?? { taxableMinor: 0, taxMinor: 0 };
      entry.taxableMinor += tax.taxable_minor;
      entry.taxMinor += tax.tax_minor;
      byCode.set(tax.tax_code, entry);
    }
    return [...byCode].map(([taxCode, totals]) => ({ taxCode, ...totals }));
  }

  async payments(scope: ResolvedReportScope) {
    const payments = await this.db
      .selectFrom("qcafe_payments")
      .selectAll()
      .where("location_id", "=", scope.locationId)
      .where("received_at", ">=", scope.from)
      .where("received_at", "<=", scope.to)
      .where("status", "=", "posted")
      .orderBy("received_at")
      .execute();
    const paymentIds = payments.map((payment) => payment.id);
    const methods = await this.db
      .selectFrom("qcafe_payment_methods")
      .selectAll()
      .where("location_id", "=", scope.locationId)
      .execute();
    const methodById = new Map(methods.map((method) => [method.id, method]));
    const byKind = new Map<string, number>();
    for (const payment of payments) {
      const kind = methodById.get(payment.payment_method_id)?.kind ?? "unknown";
      const signed = payment.direction === "in" ? payment.amount_minor : -payment.amount_minor;
      byKind.set(kind, (byKind.get(kind) ?? 0) + signed);
    }
    return {
      rows: payments.map((payment) => ({
        ...payment,
        methodKind: methodById.get(payment.payment_method_id)?.kind ?? "unknown",
      })),
      tenderDetails: paymentIds.length
        ? await this.db
            .selectFrom("qcafe_payment_tender_details")
            .selectAll()
            .where("payment_id", "in", paymentIds)
            .execute()
        : [],
      totals: {
        byMethodKind: [...byKind].map(([kind, totalMinor]) => ({ kind, totalMinor })),
        payments: payments.length,
      },
    };
  }

  async items(scope: ResolvedReportScope, billIds: string[]) {
    const lines = await this.billLines(scope, billIds);
    const byItem = new Map<
      string,
      { description: string; itemCode: string; quantityMilli: number; totalMinor: number }
    >();
    for (const line of lines) {
      const entry = byItem.get(line.item_code) ?? {
        description: line.description,
        itemCode: line.item_code,
        quantityMilli: 0,
        totalMinor: 0,
      };
      entry.quantityMilli += line.quantity_milli;
      entry.totalMinor += line.total_minor;
      byItem.set(line.item_code, entry);
    }
    return [...byItem.values()];
  }

  async tables(scope: ResolvedReportScope) {
    const sessions = await this.db
      .selectFrom("qcafe_table_sessions")
      .selectAll()
      .where("location_id", "=", scope.locationId)
      .where("opened_at", ">=", scope.from)
      .where("opened_at", "<=", scope.to)
      .orderBy("opened_at")
      .execute();
    const sessionIds = sessions.map((session) => session.id);
    const links = sessionIds.length
      ? await this.db
          .selectFrom("qcafe_table_session_tables")
          .selectAll()
          .where("session_id", "in", sessionIds)
          .execute()
      : [];
    const primaryOrderIds = sessions
      .map((session) => session.primary_order_id)
      .filter((id): id is string => id !== null);
    const orders = sessionIds.length
      ? await this.db
          .selectFrom("qcafe_orders")
          .select(["id", "number", "status", "total_minor", "table_session_id"])
          .where((eb) =>
            eb.or([
              eb("table_session_id", "in", sessionIds),
              ...(primaryOrderIds.length ? [eb("id", "in", primaryOrderIds)] : []),
            ]),
          )
          .execute()
      : [];
    return { links, orders, sessions };
  }

  async kitchen(scope: ResolvedReportScope) {
    const orderIds = (
      await this.db.selectFrom("qcafe_orders").select("id").where("location_id", "=", scope.locationId).execute()
    ).map((row) => row.id);
    if (!orderIds.length) return { lines: [], stations: [], tickets: [] };
    const tickets = await this.db
      .selectFrom("qcafe_kitchen_tickets")
      .selectAll()
      .where("order_id", "in", orderIds)
      .where("fired_at", ">=", scope.from)
      .where("fired_at", "<=", scope.to)
      .orderBy("fired_at")
      .execute();
    const ticketIds = tickets.map((ticket) => ticket.id);
    const stations = await this.db
      .selectFrom("qcafe_kitchen_stations")
      .selectAll()
      .where("location_id", "=", scope.locationId)
      .execute();
    return {
      lines: ticketIds.length
        ? await this.db
            .selectFrom("qcafe_kitchen_ticket_lines")
            .selectAll()
            .where("ticket_id", "in", ticketIds)
            .execute()
        : [],
      stations,
      tickets,
    };
  }

  async shifts(scope: ResolvedReportScope) {
    const drawers = await this.db
      .selectFrom("qcafe_cash_drawers")
      .selectAll()
      .where("location_id", "=", scope.locationId)
      .execute();
    const drawerIds = drawers.map((drawer) => drawer.id);
    const shifts = drawerIds.length
      ? await this.db
          .selectFrom("qcafe_cash_shifts")
          .selectAll()
          .where("drawer_id", "in", drawerIds)
          .where("opened_at", ">=", scope.from)
          .where("opened_at", "<=", scope.to)
          .orderBy("opened_at")
          .execute()
      : [];
    const shiftIds = shifts.map((shift) => shift.id);
    const days = await this.db
      .selectFrom("qcafe_business_days")
      .selectAll()
      .where("location_id", "=", scope.locationId)
      .where("opened_at", ">=", scope.from)
      .where("opened_at", "<=", scope.to)
      .execute();
    const dayIds = days.map((day) => day.id);
    return {
      cashMovements: shiftIds.length
        ? await this.db.selectFrom("qcafe_cash_movements").selectAll().where("cash_shift_id", "in", shiftIds).execute()
        : [],
      dayCloses: dayIds.length
        ? await this.db.selectFrom("qcafe_day_closes").selectAll().where("business_day_id", "in", dayIds).execute()
        : [],
      days,
      drawers,
      settlements: shiftIds.length
        ? await this.db
            .selectFrom("qcafe_shift_settlements")
            .selectAll()
            .where("cash_shift_id", "in", shiftIds)
            .execute()
        : [],
      shifts,
    };
  }

  async stock(scope: ResolvedReportScope) {
    const movements = await this.db
      .selectFrom("qcafe_stock_movements")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .where("occurred_at", ">=", scope.from)
      .where("occurred_at", "<=", scope.to)
      .orderBy("occurred_at")
      .execute();
    const items = await this.db
      .selectFrom("qcafe_stock_items")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .execute();
    const onHand = new Map<string, number>();
    for (const movement of movements) {
      onHand.set(movement.stock_item_id, (onHand.get(movement.stock_item_id) ?? 0) + movement.quantity_milli);
    }
    return {
      availability: [...onHand].map(([stockItemId, quantityMilli]) => ({ quantityMilli, stockItemId })),
      items: items.map((item) => ({
        active: item.active,
        code: item.code,
        id: item.id,
        name: item.name,
        reorderLevelMilli: item.reorder_level_milli,
      })),
      movements,
    };
  }

  async events(scope: ResolvedReportScope) {
    const reservations = await this.db
      .selectFrom("qcafe_reservations")
      .selectAll()
      .where("location_id", "=", scope.locationId)
      .where("arrival_at", ">=", scope.from)
      .where("arrival_at", "<=", scope.to)
      .orderBy("arrival_at")
      .execute();
    const bookings = await this.db
      .selectFrom("qcafe_event_bookings")
      .selectAll()
      .where("location_id", "=", scope.locationId)
      .where("starts_at", ">=", scope.from)
      .where("starts_at", "<=", scope.to)
      .orderBy("starts_at")
      .execute();
    const bookingIds = bookings.map((booking) => booking.id);
    return {
      bookings,
      orders: bookingIds.length
        ? await this.db
            .selectFrom("qcafe_event_orders")
            .selectAll()
            .where("event_booking_id", "in", bookingIds)
            .execute()
        : [],
      quotes: bookingIds.length
        ? await this.db
            .selectFrom("qcafe_event_quotes")
            .selectAll()
            .where("event_booking_id", "in", bookingIds)
            .execute()
        : [],
      reservations,
    };
  }

  async failedPrintJobs(scope: ResolvedReportScope) {
    const db = this.db as unknown as Kysely<QcafeDocumentsDatabase>;
    return db
      .selectFrom("qcafe_print_jobs")
      .selectAll()
      .where("location_id", "=", scope.locationId)
      .where("status", "=", "failed")
      .where("updated_at", ">=", scope.from)
      .where("updated_at", "<=", scope.to)
      .execute();
  }
}

export class ReportsScopeError extends Error {}
