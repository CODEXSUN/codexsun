import type { ReportScope } from "../contracts/reports.contract.js";
import { ReportsRepository, ReportsScopeError, type ResolvedReportScope } from "../repository/reports.repository.js";

export class ReportsService {
  constructor(
    private readonly repo: ReportsRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async scope(input: ReportScope): Promise<ResolvedReportScope> {
    if (!(await this.repo.location({ businessId: input.businessId, locationId: input.locationId }))) {
      throw new ReportsScopeError("The report outlet scope is invalid.");
    }
    return this.repo.resolveScope(input, this.now().toISOString());
  }

  async sales(input: ReportScope) {
    const scope = await this.scope(input);
    const result = await this.repo.sales(scope);
    return { rows: result.rows, scope, totals: result.totals };
  }

  async taxes(input: ReportScope) {
    const scope = await this.scope(input);
    const { billIds } = await this.repo.sales(scope);
    const rows = await this.repo.taxes(billIds);
    return { rows, scope, totals: { codes: rows.length, taxMinor: rows.reduce((sum, row) => sum + row.taxMinor, 0) } };
  }

  async payments(input: ReportScope) {
    const scope = await this.scope(input);
    const { rows, tenderDetails, totals } = await this.repo.payments(scope);
    return {
      rows: rows.map((row) => ({
        ...row,
        tender: tenderDetails.find((detail) => detail.payment_id === row.id) ?? null,
      })),
      scope,
      totals,
    };
  }

  async items(input: ReportScope) {
    const scope = await this.scope(input);
    const { billIds } = await this.repo.sales(scope);
    const rows = await this.repo.items(scope, billIds);
    return {
      rows,
      scope,
      totals: {
        items: rows.length,
        quantityMilli: rows.reduce((sum, row) => sum + row.quantityMilli, 0),
        totalMinor: rows.reduce((sum, row) => sum + row.totalMinor, 0),
      },
    };
  }

  async tables(input: ReportScope) {
    const scope = await this.scope(input);
    const { links, orders, sessions } = await this.repo.tables(scope);
    return {
      rows: sessions.map((session) => ({
        ...session,
        order:
          orders.find((order) => order.table_session_id === session.id || order.id === session.primary_order_id) ??
          null,
        tables: links.filter((link) => link.session_id === session.id).map((link) => link.table_id),
      })),
      scope,
      totals: { open: sessions.filter((session) => session.status === "open").length, sessions: sessions.length },
    };
  }

  async kitchen(input: ReportScope) {
    const scope = await this.scope(input);
    const { lines, stations, tickets } = await this.repo.kitchen(scope);
    const stationById = new Map(stations.map((station) => [station.id, station]));
    return {
      rows: tickets.map((ticket) => ({
        ...ticket,
        lines: lines.filter((line) => line.ticket_id === ticket.id),
        station: stationById.get(ticket.station_id)?.code ?? null,
      })),
      scope,
      totals: {
        byStatus: [
          ...tickets.reduce(
            (map, ticket) => map.set(ticket.status, (map.get(ticket.status) ?? 0) + 1),
            new Map<string, number>(),
          ),
        ].map(([status, count]) => ({ count, status })),
        tickets: tickets.length,
      },
    };
  }

  async shifts(input: ReportScope) {
    const scope = await this.scope(input);
    const { cashMovements, dayCloses, days, drawers, settlements, shifts } = await this.repo.shifts(scope);
    return {
      rows: shifts.map((shift) => ({
        ...shift,
        movements: cashMovements.filter((movement) => movement.cash_shift_id === shift.id),
        settlement: settlements.find((settlement) => settlement.cash_shift_id === shift.id) ?? null,
      })),
      scope,
      totals: {
        dayCloses: dayCloses.length,
        days: days.length,
        drawers: drawers.length,
        open: shifts.filter((shift) => shift.status === "open").length,
        shifts: shifts.length,
        unsettled: shifts.filter(
          (shift) =>
            shift.status === "open" || !settlements.some((settlement) => settlement.cash_shift_id === shift.id),
        ).length,
      },
    };
  }

  async stock(input: ReportScope) {
    const scope = await this.scope(input);
    const { availability, items, movements } = await this.repo.stock(scope);
    const itemById = new Map(items.map((item) => [item.id, item]));
    return {
      rows: availability.map((entry) => ({ ...entry, ...itemById.get(entry.stockItemId) })),
      scope,
      totals: {
        belowReorder: availability.filter((entry) => {
          const item = itemById.get(entry.stockItemId);
          return item?.active === 1 && entry.quantityMilli < (item?.reorderLevelMilli ?? 0);
        }).length,
        items: availability.length,
        movements: movements.length,
      },
    };
  }

  async events(input: ReportScope) {
    const scope = await this.scope(input);
    const { bookings, orders, quotes, reservations } = await this.repo.events(scope);
    return {
      rows: [
        ...reservations.map((row) => ({ kind: "reservation", ...row })),
        ...bookings.map((row) => ({
          ...row,
          kind: "event-booking",
          orders: orders.filter((order) => order.event_booking_id === row.id),
          quotes: quotes.filter((quote) => quote.event_booking_id === row.id),
        })),
      ],
      scope,
      totals: { bookings: bookings.length, reservations: reservations.length },
    };
  }

  async alerts(input: ReportScope) {
    const scope = await this.scope(input);
    const alerts: Array<{ detail: string; subjectId: string; subjectType: string; type: string }> = [];
    const { tickets } = await this.repo.kitchen(scope);
    for (const ticket of tickets.filter((row) => ["fired", "accepted", "preparing"].includes(row.status))) {
      alerts.push({
        detail: `Ticket ${ticket.number} awaits the kitchen (${ticket.status}).`,
        subjectId: ticket.id,
        subjectType: "kitchen-ticket",
        type: "pending-kot",
      });
    }
    const stockReport = await this.stock(input);
    for (const row of stockReport.rows.filter((entry) => entry.quantityMilli < (entry.reorderLevelMilli ?? 0))) {
      alerts.push({
        detail: `Stock ${row.code} is below its reorder level.`,
        subjectId: row.stockItemId,
        subjectType: "stock-item",
        type: "stock-risk",
      });
    }
    const { reservations } = await this.repo.events(scope);
    const confirmed = reservations.filter((row) => row.status === "confirmed");
    for (let index = 0; index < confirmed.length; index += 1) {
      for (const other of confirmed.slice(index + 1)) {
        const current = confirmed[index]!;
        if (overlaps(current.arrival_at, current.duration_minutes, other.arrival_at, other.duration_minutes)) {
          alerts.push({
            detail: `Reservations ${current.id} and ${other.id} overlap.`,
            subjectId: current.id,
            subjectType: "reservation",
            type: "booking-conflict",
          });
        }
      }
    }
    const shiftsReport = await this.shifts(input);
    for (const shift of shiftsReport.rows.filter((row) => row.status === "open" && !row.settlement)) {
      alerts.push({
        detail: `Cash shift ${shift.id} is open without settlement.`,
        subjectId: shift.id,
        subjectType: "cash-shift",
        type: "unsettled-shift",
      });
    }
    const failedJobs = await this.repo.failedPrintJobs(scope);
    for (const job of failedJobs) {
      alerts.push({
        detail: `Print job ${job.id} failed and needs attention.`,
        subjectId: job.id,
        subjectType: "print-job",
        type: "failed-print",
      });
    }
    return { alerts, scope };
  }
}

function overlaps(startA: string, minutesA: number, startB: string, minutesB: number): boolean {
  const endA = Date.parse(startA) + minutesA * 60_000;
  const endB = Date.parse(startB) + minutesB * 60_000;
  return Date.parse(startA) < endB && Date.parse(startB) < endA;
}

export { ReportsScopeError };
