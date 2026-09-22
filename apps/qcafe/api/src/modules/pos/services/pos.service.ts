import type { ActivityRecorder, CommandContext } from "../../foundation/contracts/activity.contract.js";
import { MenuSaleabilityService } from "../../menu/services/menu-saleability.service.js";
import { MenuNotSaleableError } from "../../menu/services/menu-saleability.service.js";
import { MenuService } from "../../menu/services/menu.service.js";
import type { AddOrderLine, CreateOrder, PosScope } from "../contracts/pos.contract.js";
import { PosRepository } from "../repository/pos.repository.js";
export class PosConflictError extends Error {}
export class PosService {
  constructor(
    private repo: PosRepository,
    private menu: MenuService,
    private saleability: MenuSaleabilityService,
    private activity: ActivityRecorder,
    private now: () => Date = () => new Date(),
  ) {}
  read(scope: PosScope) {
    return this.repo.workspace(scope);
  }
  async create(input: CreateOrder, context: CommandContext) {
    const [business, location, channel, priceBook, tableSession] = await this.repo.scope(input);
    if (!business || !location || !channel || !priceBook)
      throw new PosConflictError("The business, outlet, channel, or price book is invalid.");
    if (input.tableSessionId && channel.kind !== "dine_in")
      throw new PosConflictError("Only dine-in orders can use a table session.");
    if (input.tableSessionId && !tableSession)
      throw new PosConflictError("The table session is not open at this outlet.");
    if (channel.kind === "takeaway" && !input.collectionName && !input.customerName)
      throw new PosConflictError("Takeaway orders require a collection name.");
    const now = this.now().toISOString(),
      id = await this.repo.create(input, business.currency, context.actorId, now);
    await this.repo.createFulfillment(id, channel.kind, input, now);
    await this.activity.record(context, { eventType: "qcafe.pos.order.opened", subjectId: id, subjectType: "order" });
    return this.read({ businessId: input.businessId, locationId: input.locationId });
  }
  async addLine(orderId: string, input: AddOrderLine, context: CommandContext) {
    const order = await this.mutable(orderId);
    let pricing;
    try {
      pricing = await this.saleability.assertSaleable({
        at: this.now().toISOString(),
        businessId: order.business_id,
        itemId: input.itemId,
        locationId: order.location_id,
        priceBookId: order.price_book_id,
        serviceChannelId: order.service_channel_id,
        variantId: input.variantId,
      });
    } catch (error) {
      if (error instanceof MenuNotSaleableError) throw new PosConflictError(error.message);
      throw error;
    }
    const catalog = await this.menu.read(order.business_id),
      item = catalog.items.find((x) => x.id === input.itemId),
      variant = item?.variants.find((x) => x.id === input.variantId);
    if (!item) throw new PosConflictError("The menu item is invalid.");
    const assignments = catalog.itemModifierGroups.filter(
      (a) => a.itemId === item.id && (a.variantId === null || a.variantId === (input.variantId ?? null)),
    );
    const allowedOptionIds = new Set(
      assignments.flatMap(
        (assignment) =>
          catalog.modifierGroups.find((group) => group.id === assignment.groupId)?.options.map((option) => option.id) ??
          [],
      ),
    );
    const chosen = input.modifiers.map((choice) => {
      const option = catalog.modifierGroups.flatMap((g) => g.options).find((x) => x.id === choice.optionId);
      if (!option || !option.active || !allowedOptionIds.has(option.id))
        throw new PosConflictError("A selected modifier is invalid for this item.");
      return {
        optionId: option.id,
        optionName: option.name,
        quantity: choice.quantity,
        priceAdjustmentMinor: option.priceAdjustmentMinor,
      };
    });
    for (const assignment of assignments) {
      const group = catalog.modifierGroups.find((g) => g.id === assignment.groupId && g.active);
      if (!group) continue;
      const count = chosen
        .filter((c) => group.options.some((o) => o.id === c.optionId))
        .reduce((s, c) => s + c.quantity, 0);
      if (count < group.minSelections || count > group.maxSelections)
        throw new PosConflictError(`${group.name} requires ${group.minSelections}-${group.maxSelections} selections.`);
    }
    const modifierTotal = chosen.reduce((s, m) => s + m.priceAdjustmentMinor * m.quantity, 0);
    const id = await this.repo.addLine(
      orderId,
      input,
      {
        itemCode: item.code,
        itemName: item.name,
        variantName: variant?.name ?? null,
        unitPriceMinor: pricing.effectiveAmountMinor!,
        modifierTotalMinor: modifierTotal,
        modifiers: chosen,
      },
      this.now().toISOString(),
    );
    await this.activity.record(context, {
      eventType: "qcafe.pos.order-line.added",
      subjectId: id,
      subjectType: "order-line",
    });
    return this.read({ businessId: order.business_id, locationId: order.location_id });
  }
  async action(
    orderId: string,
    action: "hold" | "resume" | "confirm" | "cancel" | "fulfill",
    reason: string | undefined,
    context: CommandContext,
  ) {
    const order = await this.repo.order(orderId);
    if (!order) throw new PosConflictError("Order not found.");
    if (action === "confirm" && order.status === "confirmed")
      return this.read({ businessId: order.business_id, locationId: order.location_id });
    const allowed = {
      hold: ["draft"],
      resume: ["held"],
      confirm: ["draft"],
      cancel: ["draft", "held", "confirmed"],
      fulfill: ["confirmed"],
    } as const;
    if (!(allowed[action] as readonly string[]).includes(order.status))
      throw new PosConflictError(`Cannot ${action} an order in ${order.status} state.`);
    if (action === "confirm" && order.total_minor <= 0)
      throw new PosConflictError("Add at least one priced item before confirmation.");
    const target = { hold: "held", resume: "draft", confirm: "confirmed", cancel: "cancelled", fulfill: "fulfilled" }[
      action
    ] as typeof order.status;
    await this.repo.transition(orderId, target, action, context.actorId, reason ?? null, this.now().toISOString());
    await this.activity.record(context, {
      eventType: `qcafe.pos.order.${action}`,
      subjectId: orderId,
      subjectType: "order",
    });
    return this.read({ businessId: order.business_id, locationId: order.location_id });
  }
  async adjust(
    orderId: string,
    input: { amountMinor: number; kind: "discount" | "service_recovery" | "rounding"; reason: string },
    context: CommandContext,
  ) {
    const order = await this.mutable(orderId);
    await this.repo.adjustment(orderId, input, context.actorId, this.now().toISOString());
    await this.activity.record(context, {
      eventType: "qcafe.pos.order.adjusted",
      subjectId: orderId,
      subjectType: "order",
      payload: { amountMinor: input.amountMinor, kind: input.kind },
    });
    return this.read({ businessId: order.business_id, locationId: order.location_id });
  }
  async changeLine(
    orderId: string,
    lineId: string,
    input: { note?: string | null; quantity: number },
    context: CommandContext,
  ) {
    const order = await this.mutable(orderId);
    if (!(await this.repo.changeLine(orderId, lineId, input, this.now().toISOString())))
      throw new PosConflictError("Active order line not found.");
    await this.activity.record(context, {
      eventType: "qcafe.pos.order-line.changed",
      subjectId: lineId,
      subjectType: "order-line",
    });
    return this.read({ businessId: order.business_id, locationId: order.location_id });
  }
  async removeLine(orderId: string, lineId: string, context: CommandContext) {
    const order = await this.mutable(orderId);
    if (!(await this.repo.voidLine(orderId, lineId, this.now().toISOString())))
      throw new PosConflictError("Active order line not found.");
    await this.activity.record(context, {
      eventType: "qcafe.pos.order-line.removed",
      subjectId: lineId,
      subjectType: "order-line",
    });
    return this.read({ businessId: order.business_id, locationId: order.location_id });
  }
  markReady(orderId: string) {
    return this.repo.markFulfillmentReady(orderId, this.now().toISOString());
  }
  async note(
    orderId: string,
    input: {
      content: string;
      lineId?: string;
      noteKind: "guest" | "internal" | "kitchen";
      visibility: "guest" | "internal" | "kitchen";
    },
    context: CommandContext,
  ) {
    const order = await this.mutable(orderId);
    await this.repo.note(orderId, input, this.now().toISOString());
    await this.activity.record(context, {
      eventType: "qcafe.pos.order.note-added",
      subjectId: orderId,
      subjectType: "order",
    });
    return this.read({ businessId: order.business_id, locationId: order.location_id });
  }
  snapshot(id: string) {
    return this.repo.confirmedSnapshot(id);
  }
  private async mutable(id: string) {
    const order = await this.repo.order(id);
    if (!order) throw new PosConflictError("Order not found.");
    if (order.status !== "draft") throw new PosConflictError("Confirmed or closed orders cannot be edited.");
    return order;
  }
}
