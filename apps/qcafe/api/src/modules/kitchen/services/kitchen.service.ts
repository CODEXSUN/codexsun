import type { ActivityRecorder, CommandContext } from "../../foundation/contracts/activity.contract.js";
import type { PosService } from "../../pos/services/pos.service.js";
import { KitchenRepository } from "../repository/kitchen.repository.js";
export class KitchenConflictError extends Error {}
export class KitchenService {
  constructor(
    private repo: KitchenRepository,
    private pos: PosService,
    private activity: ActivityRecorder,
    private now: () => Date = () => new Date(),
  ) {}
  read(businessId: string, locationId: string) {
    return this.repo.workspace(businessId, locationId);
  }
  async station(
    input: { businessId: string; locationId: string; code: string; name: string },
    context: CommandContext,
  ) {
    if (!(await this.repo.location(input.businessId, input.locationId)))
      throw new KitchenConflictError("The outlet is invalid.");
    try {
      const id = await this.repo.station(input.locationId, input.code, input.name, this.now().toISOString());
      await this.activity.record(context, {
        eventType: "qcafe.kitchen.station.created",
        subjectId: id,
        subjectType: "kitchen-station",
      });
      return this.read(input.businessId, input.locationId);
    } catch {
      throw new KitchenConflictError("The station code already exists for this outlet.");
    }
  }
  async route(
    input: {
      businessId: string;
      locationId: string;
      itemId: string;
      variantId?: string;
      stationId: string;
      priority: number;
    },
    context: CommandContext,
  ) {
    const [item, station] = await this.repo.routeScope(input);
    if (!item || !station) throw new KitchenConflictError("The item or station is invalid for this outlet.");
    const id = await this.repo.route(input, this.now().toISOString());
    await this.activity.record(context, {
      eventType: "qcafe.kitchen.item-route.created",
      subjectId: id,
      subjectType: "item-station-route",
    });
    return this.read(input.businessId, input.locationId);
  }
  async fireOrder(orderId: string, context: CommandContext) {
    const snapshot = await this.pos.snapshot(orderId);
    if (!snapshot || snapshot.order.status !== "confirmed")
      throw new KitchenConflictError("Confirmed order not found.");
    const count = await this.repo.fire(snapshot.order, snapshot.lines, context.actorId, this.now().toISOString());
    await this.activity.record(context, {
      eventType: "qcafe.kitchen.order.fired",
      subjectId: orderId,
      subjectType: "order",
      payload: { ticketCount: count },
    });
  }
  async action(
    id: string,
    action: "accept" | "prepare" | "ready" | "serve" | "recall" | "void",
    note: string | undefined,
    context: CommandContext,
  ) {
    const ticket = await this.repo.ticket(id);
    if (!ticket) throw new KitchenConflictError("Kitchen ticket not found.");
    const targets = {
        accept: "accepted",
        prepare: "preparing",
        ready: "ready",
        serve: "served",
        recall: "recalled",
        void: "voided",
      } as const,
      allowed = {
        accept: ["fired"],
        prepare: ["accepted", "recalled"],
        ready: ["preparing", "accepted"],
        serve: ["ready"],
        recall: ["ready"],
        void: ["fired", "accepted", "preparing", "recalled"],
      } as const;
    if (!(allowed[action] as readonly string[]).includes(ticket.status))
      throw new KitchenConflictError(`Cannot ${action} a ${ticket.status} ticket.`);
    if (["recall", "void"].includes(action) && !note)
      throw new KitchenConflictError(`A reason is required to ${action} a kitchen ticket.`);
    await this.repo.transition(id, targets[action], action, context.actorId, note ?? null, this.now().toISOString());
    if (action === "ready" && (await this.repo.orderReady(ticket.order_id))) await this.pos.markReady(ticket.order_id);
    await this.activity.record(context, {
      eventType: `qcafe.kitchen.ticket.${action}`,
      subjectId: id,
      subjectType: "kitchen-ticket",
    });
  }
  async print(id: string, routeRef: string, context: CommandContext) {
    if (!(await this.repo.ticket(id))) throw new KitchenConflictError("Kitchen ticket not found.");
    const attempt = await this.repo.print(id, routeRef, context.actorId, this.now().toISOString());
    await this.activity.record(context, {
      eventType: "qcafe.kitchen.ticket.print-requested",
      subjectId: attempt,
      subjectType: "kitchen-print-attempt",
    });
  }
  async assertOrderReady(orderId: string) {
    if (!(await this.repo.orderReady(orderId)))
      throw new KitchenConflictError("All kitchen tickets must be ready, served, or voided before fulfillment.");
  }
}
