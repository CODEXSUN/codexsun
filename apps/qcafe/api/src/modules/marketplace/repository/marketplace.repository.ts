import { randomUUID } from "node:crypto";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type {
  IntakeOrder,
  MapMenuItem,
  MarketplaceScope,
  RecordSettlement,
  RegisterPartner,
} from "../contracts/marketplace.contract.js";
import type { QcafeMarketplaceDatabase } from "../persistence/marketplace.database.js";

export class MarketplaceRepository {
  constructor(private readonly db: Kysely<QcafeFoundationDatabase>) {}

  private tables() {
    return this.db as unknown as Kysely<QcafeMarketplaceDatabase>;
  }

  location(scope: MarketplaceScope) {
    return this.db
      .selectFrom("qcafe_locations")
      .select("id")
      .where("id", "=", scope.locationId)
      .where("business_id", "=", scope.businessId)
      .executeTakeFirst();
  }

  partner(id: string) {
    return this.tables().selectFrom("qcafe_marketplace_partners").selectAll().where("id", "=", id).executeTakeFirst();
  }

  intake(id: string) {
    return this.tables().selectFrom("qcafe_marketplace_orders").selectAll().where("id", "=", id).executeTakeFirst();
  }

  settlement(id: string) {
    return this.tables()
      .selectFrom("qcafe_marketplace_settlements")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  }

  menuItem(id: string) {
    return this.db.selectFrom("qcafe_menu_items").selectAll().where("id", "=", id).executeTakeFirst();
  }

  menuVariant(id: string) {
    return this.db.selectFrom("qcafe_menu_variants").selectAll().where("id", "=", id).executeTakeFirst();
  }

  posOrder(id: string) {
    return this.db.selectFrom("qcafe_orders").selectAll().where("id", "=", id).executeTakeFirst();
  }

  billForOrder(orderId: string) {
    return this.db.selectFrom("qcafe_bills").selectAll().where("order_id", "=", orderId).executeTakeFirst();
  }

  async postedPaymentsTotal(billId: string) {
    const payments = await this.db
      .selectFrom("qcafe_payments")
      .select(["amount_minor", "direction"])
      .where("bill_id", "=", billId)
      .where("status", "=", "posted")
      .execute();
    return payments.reduce(
      (sum, payment) => sum + (payment.direction === "in" ? payment.amount_minor : -payment.amount_minor),
      0,
    );
  }

  async workspace(scope: MarketplaceScope) {
    const db = this.tables();
    const partners = await db
      .selectFrom("qcafe_marketplace_partners")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .orderBy("code")
      .execute();
    const partnerIds = partners.map((partner) => partner.id);
    const mappings = await db
      .selectFrom("qcafe_marketplace_menu_mappings")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .execute();
    const intakes = await db
      .selectFrom("qcafe_marketplace_orders")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .orderBy("received_at", "desc")
      .execute();
    const intakeIds = intakes.map((intake) => intake.id);
    const settlements = await db
      .selectFrom("qcafe_marketplace_settlements")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .orderBy("period_from", "desc")
      .execute();
    return {
      events: intakeIds.length
        ? await db.selectFrom("qcafe_marketplace_events").selectAll().where("intake_id", "in", intakeIds).execute()
        : [],
      fulfillments: intakeIds.length
        ? await db.selectFrom("qcafe_delivery_fulfillments").selectAll().where("intake_id", "in", intakeIds).execute()
        : [],
      intakeLines: intakeIds.length
        ? await db.selectFrom("qcafe_marketplace_order_lines").selectAll().where("intake_id", "in", intakeIds).execute()
        : [],
      intakes,
      mappings: partnerIds.length ? mappings.filter((mapping) => partnerIds.includes(mapping.partner_id)) : [],
      partners,
      settlements,
    };
  }

  async registerPartner(input: RegisterPartner, actor: string, now: string) {
    const db = this.tables();
    const existing = await db
      .selectFrom("qcafe_marketplace_partners")
      .select("id")
      .where("business_id", "=", input.businessId)
      .where("code", "=", input.code)
      .executeTakeFirst();
    if (existing) return existing.id;
    const id = randomUUID();
    await db
      .insertInto("qcafe_marketplace_partners")
      .values({
        adapter_contract: input.adapterContract,
        business_id: input.businessId,
        code: input.code,
        created_at: now,
        created_by: actor,
        id,
        name: input.name,
        status: "active",
        updated_at: now,
      })
      .execute();
    return id;
  }

  async setPartnerStatus(id: string, status: "active" | "suspended", now: string) {
    await this.tables()
      .updateTable("qcafe_marketplace_partners")
      .set({ status, updated_at: now })
      .where("id", "=", id)
      .execute();
  }

  async mappingFor(partnerId: string, partnerItemRef: string) {
    return this.tables()
      .selectFrom("qcafe_marketplace_menu_mappings")
      .selectAll()
      .where("partner_id", "=", partnerId)
      .where("partner_item_ref", "=", partnerItemRef)
      .executeTakeFirst();
  }

  async mapMenuItem(input: MapMenuItem, now: string) {
    const existing = await this.mappingFor(input.partnerId, input.partnerItemRef);
    if (existing) return existing.id;
    const id = randomUUID();
    await this.tables()
      .insertInto("qcafe_marketplace_menu_mappings")
      .values({
        active: 1,
        business_id: input.businessId,
        created_at: now,
        id,
        location_id: input.locationId,
        menu_item_id: input.menuItemId,
        menu_variant_id: input.menuVariantId ?? null,
        partner_id: input.partnerId,
        partner_item_ref: input.partnerItemRef,
      })
      .execute();
    return id;
  }

  async intakeByPartnerRef(partnerId: string, partnerOrderRef: string) {
    return this.tables()
      .selectFrom("qcafe_marketplace_orders")
      .selectAll()
      .where("partner_id", "=", partnerId)
      .where("partner_order_ref", "=", partnerOrderRef)
      .executeTakeFirst();
  }

  async intakeByIdempotencyKey(locationId: string, key: string) {
    return this.tables()
      .selectFrom("qcafe_marketplace_orders")
      .selectAll()
      .where("location_id", "=", locationId)
      .where("idempotency_key", "=", key)
      .executeTakeFirst();
  }

  async intakeOrder(
    scope: MarketplaceScope,
    input: IntakeOrder,
    lines: ReadonlyArray<{
      mappingId: string | null;
      partnerItemRef: string;
      quantity: number;
      unitPriceMinor: number;
    }>,
    actor: string,
    now: string,
  ) {
    return this.db.transaction().execute(async (tx) => {
      const db = tx as unknown as Kysely<QcafeMarketplaceDatabase>;
      const id = randomUUID();
      await db
        .insertInto("qcafe_marketplace_orders")
        .values({
          business_id: scope.businessId,
          created_at: now,
          currency: input.currency,
          id,
          idempotency_key: input.idempotencyKey ?? null,
          location_id: scope.locationId,
          partner_id: input.partnerId,
          partner_order_ref: input.partnerOrderRef,
          received_at: now,
          status: "received",
          total_minor: input.totalMinor,
          updated_at: now,
        })
        .execute();
      await db
        .insertInto("qcafe_marketplace_order_lines")
        .values(
          lines.map((line) => ({
            created_at: now,
            id: randomUUID(),
            intake_id: id,
            mapping_id: line.mappingId,
            partner_item_ref: line.partnerItemRef,
            quantity: line.quantity,
            unit_price_minor: line.unitPriceMinor,
          })),
        )
        .execute();
      await db
        .insertInto("qcafe_marketplace_events")
        .values({
          actor_ref: actor,
          created_at: now,
          event_type: lines.some((line) => !line.mappingId) ? "received.unmapped-lines" : "received",
          id: randomUUID(),
          intake_id: id,
          occurred_at: now,
        })
        .execute();
      return id;
    });
  }

  async recordIntakeEvent(intakeId: string, eventType: string, actor: string, now: string) {
    await this.tables()
      .insertInto("qcafe_marketplace_events")
      .values({
        actor_ref: actor,
        created_at: now,
        event_type: eventType,
        id: randomUUID(),
        intake_id: intakeId,
        occurred_at: now,
      })
      .execute();
  }

  async setIntakeStatus(id: string, status: "accepted" | "rejected" | "cancelled" | "fulfilled", now: string) {
    await this.tables()
      .updateTable("qcafe_marketplace_orders")
      .set({ status, updated_at: now })
      .where("id", "=", id)
      .execute();
  }

  async recordSettlement(
    scope: MarketplaceScope,
    input: RecordSettlement,
    netMinor: number,
    actor: string,
    now: string,
  ) {
    const id = randomUUID();
    await this.tables()
      .insertInto("qcafe_marketplace_settlements")
      .values({
        business_id: scope.businessId,
        created_at: now,
        created_by: actor,
        fee_minor: input.feeMinor,
        gross_minor: input.grossMinor,
        id,
        location_id: scope.locationId,
        net_minor: netMinor,
        partner_id: input.partnerId,
        period_from: input.periodFrom,
        period_to: input.periodTo,
        status: "pending",
      })
      .execute();
    return id;
  }

  async postSettlement(id: string) {
    await this.tables()
      .updateTable("qcafe_marketplace_settlements")
      .set({ status: "posted" })
      .where("id", "=", id)
      .where("status", "=", "pending")
      .execute();
  }

  fulfillmentForIntake(intakeId: string) {
    return this.tables()
      .selectFrom("qcafe_delivery_fulfillments")
      .selectAll()
      .where("intake_id", "=", intakeId)
      .executeTakeFirst();
  }

  async linkOrder(intakeId: string, orderId: string, now: string) {
    await this.tables()
      .updateTable("qcafe_marketplace_orders")
      .set({ pos_order_id: orderId, updated_at: now })
      .where("id", "=", intakeId)
      .execute();
  }

  async recordFulfillment(
    intakeId: string,
    input: { partnerCollectedMinor: number; partnerFeeMinor: number; riderRef?: string },
    actor: string,
    now: string,
  ) {
    const existing = await this.fulfillmentForIntake(intakeId);
    if (existing) {
      if (existing.status === "delivered" || existing.status === "cancelled") return existing.id;
      await this.tables()
        .updateTable("qcafe_delivery_fulfillments")
        .set({
          partner_collected_minor: input.partnerCollectedMinor,
          partner_fee_minor: input.partnerFeeMinor,
          rider_ref: input.riderRef ?? existing.rider_ref,
          status: "assigned",
          updated_at: now,
        })
        .where("id", "=", existing.id)
        .execute();
      return existing.id;
    }
    const id = randomUUID();
    await this.tables()
      .insertInto("qcafe_delivery_fulfillments")
      .values({
        created_at: now,
        created_by: actor,
        delivered_at: null,
        id,
        intake_id: intakeId,
        partner_collected_minor: input.partnerCollectedMinor,
        partner_fee_minor: input.partnerFeeMinor,
        picked_at: null,
        rider_ref: input.riderRef ?? null,
        status: "assigned",
        updated_at: now,
      })
      .execute();
    return id;
  }

  async markFulfillment(id: string, status: "picked" | "delivered" | "cancelled", now: string) {
    await this.tables()
      .updateTable("qcafe_delivery_fulfillments")
      .set({
        ...(status === "picked" ? { picked_at: now } : {}),
        ...(status === "delivered" ? { delivered_at: now } : {}),
        status,
        updated_at: now,
      })
      .where("id", "=", id)
      .execute();
  }
}
