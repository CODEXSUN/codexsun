import type { ActivityRecorder, CommandContext } from "../../foundation/contracts/activity.contract.js";
import type {
  IntakeOrder,
  MapMenuItem,
  MarketplaceScope,
  RecordSettlement,
  RegisterPartner,
} from "../contracts/marketplace.contract.js";
import { MarketplaceRepository } from "../repository/marketplace.repository.js";

export class MarketplaceConflictError extends Error {}

const OFFICIAL_ADAPTER_PATTERN = /^(zomato|swiggy|ubereats|generic-webhook)\.v\d+$/;

export function isOfficialAdapterContract(contract: string): boolean {
  return OFFICIAL_ADAPTER_PATTERN.test(contract);
}

export class MarketplaceService {
  constructor(
    private readonly repo: MarketplaceRepository,
    private readonly activity: ActivityRecorder,
    private readonly now: () => Date = () => new Date(),
  ) {}

  read(scope: MarketplaceScope) {
    return this.repo.workspace(scope);
  }

  async registerPartner(input: RegisterPartner, context: CommandContext) {
    if (!isOfficialAdapterContract(input.adapterContract)) {
      throw new MarketplaceConflictError("Use an official adapter contract such as zomato.v1.");
    }
    const id = await this.repo.registerPartner(input, context.actorId, this.timestamp());
    await this.record(context, "partner.registered", id, "partner", {
      adapterContract: input.adapterContract,
      code: input.code,
    });
    return { id };
  }

  async suspendPartner(partnerId: string, context: CommandContext) {
    const partner = await this.repo.partner(partnerId);
    if (!partner) throw new MarketplaceConflictError("The partner is invalid.");
    await this.repo.setPartnerStatus(partnerId, "suspended", this.timestamp());
    await this.record(context, "partner.suspended", partnerId, "partner", {});
    return { id: partnerId };
  }

  async reactivatePartner(partnerId: string, context: CommandContext) {
    const partner = await this.repo.partner(partnerId);
    if (!partner) throw new MarketplaceConflictError("The partner is invalid.");
    await this.repo.setPartnerStatus(partnerId, "active", this.timestamp());
    await this.record(context, "partner.reactivated", partnerId, "partner", {});
    return { id: partnerId };
  }

  async mapMenuItem(input: MapMenuItem, context: CommandContext) {
    const scope = { businessId: input.businessId, locationId: input.locationId };
    if (!(await this.repo.location(scope)))
      throw new MarketplaceConflictError("The marketplace outlet scope is invalid.");
    const partner = await this.repo.partner(input.partnerId);
    if (!partner || partner.business_id !== input.businessId) {
      throw new MarketplaceConflictError("The marketplace partner is invalid.");
    }
    const item = await this.repo.menuItem(input.menuItemId);
    if (!item || item.business_id !== input.businessId || !item.active) {
      throw new MarketplaceConflictError("The menu item is invalid.");
    }
    if (input.menuVariantId) {
      const variant = await this.repo.menuVariant(input.menuVariantId);
      if (!variant || variant.item_id !== input.menuItemId || !variant.active) {
        throw new MarketplaceConflictError("The menu variant is invalid.");
      }
    }
    const id = await this.repo.mapMenuItem(input, this.timestamp());
    await this.record(context, "menu.mapped", id, "menu-mapping", { partnerItemRef: input.partnerItemRef });
    return { id };
  }

  async intakeOrder(input: IntakeOrder, context: CommandContext) {
    const scope = { businessId: input.businessId, locationId: input.locationId };
    if (!(await this.repo.location(scope)))
      throw new MarketplaceConflictError("The marketplace outlet scope is invalid.");
    const partner = await this.repo.partner(input.partnerId);
    if (!partner || partner.business_id !== input.businessId || partner.status !== "active") {
      throw new MarketplaceConflictError("The marketplace partner is unavailable.");
    }
    const byRef = await this.repo.intakeByPartnerRef(input.partnerId, input.partnerOrderRef);
    if (byRef) {
      await this.record(context, "intake.replayed", byRef.id, "intake", { partnerOrderRef: input.partnerOrderRef });
      return this.read(scope);
    }
    if (input.idempotencyKey) {
      const byKey = await this.repo.intakeByIdempotencyKey(input.locationId, input.idempotencyKey);
      if (byKey) {
        await this.record(context, "intake.replayed", byKey.id, "intake", { idempotencyKey: input.idempotencyKey });
        return this.read(scope);
      }
    }
    const lines = [];
    for (const line of input.lines) {
      const mapping = await this.repo.mappingFor(input.partnerId, line.partnerItemRef);
      lines.push({
        mappingId: mapping?.id ?? null,
        partnerItemRef: line.partnerItemRef,
        quantity: line.quantity,
        unitPriceMinor: line.unitPriceMinor,
      });
    }
    const id = await this.repo.intakeOrder(scope, input, lines, context.actorId, this.timestamp());
    await this.record(context, "intake.received", id, "intake", {
      lines: lines.length,
      partnerOrderRef: input.partnerOrderRef,
    });
    return this.read(scope);
  }

  async acceptIntake(intakeId: string, context: CommandContext) {
    const intake = await this.repo.intake(intakeId);
    if (!intake || intake.status !== "received")
      throw new MarketplaceConflictError("Only a received intake can be accepted.");
    await this.repo.setIntakeStatus(intakeId, "accepted", this.timestamp());
    await this.repo.recordIntakeEvent(intakeId, "accepted", context.actorId, this.timestamp());
    await this.record(context, "intake.accepted", intakeId, "intake", {});
    return this.read({ businessId: intake.business_id, locationId: intake.location_id });
  }

  async rejectIntake(intakeId: string, reason: string, context: CommandContext) {
    const intake = await this.repo.intake(intakeId);
    if (!intake || intake.status !== "received")
      throw new MarketplaceConflictError("Only a received intake can be rejected.");
    await this.repo.setIntakeStatus(intakeId, "rejected", this.timestamp());
    await this.repo.recordIntakeEvent(intakeId, `rejected:${reason}`, context.actorId, this.timestamp());
    await this.record(context, "intake.rejected", intakeId, "intake", { reason });
    return this.read({ businessId: intake.business_id, locationId: intake.location_id });
  }

  async recordSettlement(input: RecordSettlement, context: CommandContext) {
    const scope = { businessId: input.businessId, locationId: input.locationId };
    if (!(await this.repo.location(scope)))
      throw new MarketplaceConflictError("The marketplace outlet scope is invalid.");
    const partner = await this.repo.partner(input.partnerId);
    if (!partner || partner.business_id !== input.businessId) {
      throw new MarketplaceConflictError("The marketplace partner is invalid.");
    }
    if (input.periodTo < input.periodFrom) throw new MarketplaceConflictError("The settlement period is invalid.");
    const netMinor = input.grossMinor - input.feeMinor;
    if (netMinor < 0) throw new MarketplaceConflictError("The settlement net cannot be negative.");
    const id = await this.repo.recordSettlement(scope, input, netMinor, context.actorId, this.timestamp());
    await this.record(context, "settlement.recorded", id, "settlement", { netMinor });
    return { id };
  }

  async postSettlement(settlementId: string, context: CommandContext) {
    const settlement = await this.repo.settlement(settlementId);
    if (!settlement || settlement.status !== "pending") {
      throw new MarketplaceConflictError("Only a pending settlement can be posted.");
    }
    await this.repo.postSettlement(settlementId);
    await this.record(context, "settlement.posted", settlementId, "settlement", { netMinor: settlement.net_minor });
    return { id: settlementId };
  }

  async linkOrder(intakeId: string, orderId: string, context: CommandContext) {
    const intake = await this.repo.intake(intakeId);
    if (!intake || !["accepted", "fulfilled"].includes(intake.status)) {
      throw new MarketplaceConflictError("Only an accepted intake can link a POS order.");
    }
    const order = await this.repo.posOrder(orderId);
    if (!order || order.business_id !== intake.business_id || order.location_id !== intake.location_id) {
      throw new MarketplaceConflictError("The POS order is invalid for this intake.");
    }
    await this.repo.linkOrder(intakeId, orderId, this.timestamp());
    await this.repo.recordIntakeEvent(intakeId, `order-linked:${orderId}`, context.actorId, this.timestamp());
    await this.record(context, "intake.order-linked", intakeId, "intake", { orderId });
    return this.read({ businessId: intake.business_id, locationId: intake.location_id });
  }

  async recordFulfillment(
    intakeId: string,
    input: { partnerCollectedMinor: number; partnerFeeMinor: number; riderRef?: string },
    context: CommandContext,
  ) {
    const intake = await this.repo.intake(intakeId);
    if (!intake || !intake.pos_order_id) {
      throw new MarketplaceConflictError("Link a POS order before recording fulfillment.");
    }
    if (input.partnerFeeMinor > input.partnerCollectedMinor) {
      throw new MarketplaceConflictError("The partner fee cannot exceed the collected amount.");
    }
    const id = await this.repo.recordFulfillment(intakeId, input, context.actorId, this.timestamp());
    await this.record(context, "fulfillment.recorded", id, "fulfillment", { intakeId });
    return this.read({ businessId: intake.business_id, locationId: intake.location_id });
  }

  async markPicked(intakeId: string, context: CommandContext) {
    return this.moveFulfillment(intakeId, "picked", "fulfillment.picked", context);
  }

  async markDelivered(intakeId: string, context: CommandContext) {
    return this.moveFulfillment(intakeId, "delivered", "fulfillment.delivered", context);
  }

  async cancelFulfillment(intakeId: string, context: CommandContext) {
    return this.moveFulfillment(intakeId, "cancelled", "fulfillment.cancelled", context);
  }

  private async moveFulfillment(
    intakeId: string,
    status: "picked" | "delivered" | "cancelled",
    event: string,
    context: CommandContext,
  ) {
    const intake = await this.repo.intake(intakeId);
    if (!intake) throw new MarketplaceConflictError("The intake is invalid.");
    const fulfillment = await this.repo.fulfillmentForIntake(intakeId);
    if (!fulfillment) throw new MarketplaceConflictError("Record fulfillment before moving it.");
    const allowed = {
      assigned: ["picked", "cancelled"],
      cancelled: [],
      delivered: [],
      picked: ["delivered", "cancelled"],
    } as const;
    if (!(allowed[fulfillment.status as keyof typeof allowed] as readonly string[]).includes(status)) {
      throw new MarketplaceConflictError(`Fulfillment cannot move from ${fulfillment.status} to ${status}.`);
    }
    await this.repo.markFulfillment(fulfillment.id, status, this.timestamp());
    await this.record(context, event, fulfillment.id, "fulfillment", { intakeId });
    return this.read({ businessId: intake.business_id, locationId: intake.location_id });
  }

  async reconcileIntake(intakeId: string) {
    const intake = await this.repo.intake(intakeId);
    if (!intake) throw new MarketplaceConflictError("The intake is invalid.");
    if (!intake.pos_order_id) throw new MarketplaceConflictError("Link a POS order before reconciling.");
    const bill = await this.repo.billForOrder(intake.pos_order_id);
    const fulfillment = await this.repo.fulfillmentForIntake(intakeId);
    if (!fulfillment) throw new MarketplaceConflictError("Record fulfillment before reconciling.");
    const paidMinor = bill ? await this.repo.postedPaymentsTotal(bill.id) : 0;
    const collectionVariance = fulfillment.partner_collected_minor - (bill?.payable_minor ?? intake.total_minor);
    return {
      balanced: collectionVariance === 0,
      billId: bill?.id ?? null,
      billPaidMinor: paidMinor,
      billPayableMinor: bill?.payable_minor ?? null,
      billStatus: bill?.status ?? null,
      collectionVarianceMinor: collectionVariance,
      fulfillmentStatus: fulfillment.status,
      intakeTotalMinor: intake.total_minor,
      netMinor: fulfillment.partner_collected_minor - fulfillment.partner_fee_minor,
      partnerCollectedMinor: fulfillment.partner_collected_minor,
      partnerFeeMinor: fulfillment.partner_fee_minor,
    };
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
    return this.activity.record(context, {
      eventType: `qcafe.marketplace.${event}`,
      payload,
      subjectId,
      subjectType,
    });
  }
}
