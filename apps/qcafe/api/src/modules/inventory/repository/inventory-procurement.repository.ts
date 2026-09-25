import { randomUUID } from "node:crypto";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type { InventoryScope } from "../contracts/inventory.contract.js";
import type { QcafeInventoryDatabase } from "../persistence/inventory.database.js";

export class InventoryProcurementRepository {
  constructor(private readonly db: Kysely<QcafeFoundationDatabase>) {}

  private tables() {
    return this.db as unknown as Kysely<QcafeInventoryDatabase>;
  }

  async lists(scope: InventoryScope) {
    const db = this.tables();
    const purchaseOrders = await db
      .selectFrom("qcafe_purchase_orders")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .orderBy("created_at", "desc")
      .execute();
    const poIds = purchaseOrders.map((po) => po.id);
    const purchaseOrderLines = poIds.length
      ? await db.selectFrom("qcafe_purchase_order_lines").selectAll().where("po_id", "in", poIds).execute()
      : [];
    const receipts = await db
      .selectFrom("qcafe_goods_receipts")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .orderBy("received_at", "desc")
      .execute();
    const receiptIds = receipts.map((receipt) => receipt.id);
    const receiptLines = receiptIds.length
      ? await db.selectFrom("qcafe_goods_receipt_lines").selectAll().where("receipt_id", "in", receiptIds).execute()
      : [];
    const lots = await db
      .selectFrom("qcafe_stock_lots")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .orderBy("lot_code")
      .execute();
    const counts = await db
      .selectFrom("qcafe_stock_counts")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .orderBy("counted_at", "desc")
      .execute();
    const countIds = counts.map((count) => count.id);
    const countLines = countIds.length
      ? await db.selectFrom("qcafe_stock_count_lines").selectAll().where("count_id", "in", countIds).execute()
      : [];
    const wasteEvents = await db
      .selectFrom("qcafe_waste_events")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .orderBy("occurred_at", "desc")
      .execute();
    const consumptions = await db
      .selectFrom("qcafe_consumptions")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .orderBy("occurred_at", "desc")
      .execute();
    return {
      consumptions,
      countLines,
      counts,
      lots,
      purchaseOrderLines,
      purchaseOrders,
      receiptLines,
      receipts,
      wasteEvents,
    };
  }

  async onHand(scope: InventoryScope) {
    const movements = await this.db
      .selectFrom("qcafe_stock_movements")
      .select(["stock_item_id", "quantity_milli"])
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .execute();
    const totals = new Map<string, number>();
    for (const movement of movements)
      totals.set(movement.stock_item_id, (totals.get(movement.stock_item_id) ?? 0) + movement.quantity_milli);
    return totals;
  }

  purchaseOrder(id: string) {
    return this.tables().selectFrom("qcafe_purchase_orders").selectAll().where("id", "=", id).executeTakeFirst();
  }

  poLines(poId: string) {
    return this.tables().selectFrom("qcafe_purchase_order_lines").selectAll().where("po_id", "=", poId).execute();
  }

  async createPurchaseOrder(
    scope: InventoryScope,
    input: {
      expectedAt?: string;
      lines: ReadonlyArray<{ note?: string; quantityMilli: number; stockItemId: string }>;
      supplierRef?: string;
    },
    actor: string,
    now: string,
  ) {
    return this.db.transaction().execute(async (tx) => {
      const db = tx as unknown as Kysely<QcafeInventoryDatabase>;
      const id = randomUUID();
      await db
        .insertInto("qcafe_purchase_orders")
        .values({
          business_id: scope.businessId,
          created_at: now,
          created_by: actor,
          expected_at: input.expectedAt ?? null,
          id,
          location_id: scope.locationId,
          status: "draft",
          supplier_ref: input.supplierRef ?? null,
          updated_at: now,
        })
        .execute();
      await db
        .insertInto("qcafe_purchase_order_lines")
        .values(
          input.lines.map((line) => ({
            created_at: now,
            id: randomUUID(),
            note: line.note ?? null,
            po_id: id,
            quantity_milli: line.quantityMilli,
            received_milli: 0,
            stock_item_id: line.stockItemId,
          })),
        )
        .execute();
      return id;
    });
  }

  async setPurchaseOrderStatus(id: string, status: "sent" | "partial" | "received" | "cancelled", now: string) {
    await this.tables()
      .updateTable("qcafe_purchase_orders")
      .set({ status, updated_at: now })
      .where("id", "=", id)
      .execute();
  }

  async findOrCreateLot(
    scope: InventoryScope,
    stockItemId: string,
    lotCode: string,
    expiresAt: string | undefined,
    actor: string,
    now: string,
  ) {
    const db = this.tables();
    const existing = await db
      .selectFrom("qcafe_stock_lots")
      .select("id")
      .where("stock_item_id", "=", stockItemId)
      .where("lot_code", "=", lotCode)
      .executeTakeFirst();
    if (existing) return existing.id;
    const id = randomUUID();
    await db
      .insertInto("qcafe_stock_lots")
      .values({
        business_id: scope.businessId,
        created_at: now,
        created_by: actor,
        expires_at: expiresAt ?? null,
        id,
        location_id: scope.locationId,
        lot_code: lotCode,
        stock_item_id: stockItemId,
      })
      .execute();
    return id;
  }

  lot(id: string) {
    return this.tables().selectFrom("qcafe_stock_lots").selectAll().where("id", "=", id).executeTakeFirst();
  }

  async createLot(
    scope: InventoryScope,
    input: { expiresAt?: string; lotCode: string; stockItemId: string },
    actor: string,
    now: string,
  ) {
    return this.findOrCreateLot(scope, input.stockItemId, input.lotCode, input.expiresAt, actor, now);
  }

  async receiveGoods(
    scope: InventoryScope,
    poId: string,
    lines: ReadonlyArray<{ lotId: string | null; poLineId: string; quantityMilli: number; stockItemId: string }>,
    note: string | undefined,
    actor: string,
    now: string,
  ) {
    return this.db.transaction().execute(async (tx) => {
      const db = tx as unknown as Kysely<QcafeInventoryDatabase>;
      const receiptId = randomUUID();
      await db
        .insertInto("qcafe_goods_receipts")
        .values({
          business_id: scope.businessId,
          id: receiptId,
          location_id: scope.locationId,
          note: note ?? null,
          po_id: poId,
          received_at: now,
          received_by: actor,
        })
        .execute();
      await db
        .insertInto("qcafe_goods_receipt_lines")
        .values(
          lines.map((line) => ({
            created_at: now,
            id: randomUUID(),
            lot_id: line.lotId,
            po_line_id: line.poLineId,
            quantity_milli: line.quantityMilli,
            receipt_id: receiptId,
            stock_item_id: line.stockItemId,
          })),
        )
        .execute();
      for (const line of lines) {
        const poLine = await db
          .selectFrom("qcafe_purchase_order_lines")
          .selectAll()
          .where("id", "=", line.poLineId)
          .executeTakeFirstOrThrow();
        await db
          .updateTable("qcafe_purchase_order_lines")
          .set({ received_milli: poLine.received_milli + line.quantityMilli })
          .where("id", "=", line.poLineId)
          .execute();
      }
      const remaining = await db
        .selectFrom("qcafe_purchase_order_lines")
        .selectAll()
        .where("po_id", "=", poId)
        .execute();
      const complete = remaining.every((row) => row.received_milli >= row.quantity_milli);
      await db
        .updateTable("qcafe_purchase_orders")
        .set({ status: complete ? "received" : "partial", updated_at: now })
        .where("id", "=", poId)
        .execute();
      await db
        .insertInto("qcafe_stock_movements")
        .values(
          lines.map((line) =>
            ledgerMovement(
              scope,
              line.stockItemId,
              line.quantityMilli,
              "purchase_in",
              "purchase",
              receiptId,
              note ?? "Goods receipt",
              actor,
              now,
            ),
          ),
        )
        .execute();
      return receiptId;
    });
  }

  async submitCount(
    scope: InventoryScope,
    input: {
      approvedBy?: string;
      lines: ReadonlyArray<{ countedMilli: number; expectedMilli: number; stockItemId: string }>;
      reason: string;
    },
    actor: string,
    now: string,
  ) {
    return this.db.transaction().execute(async (tx) => {
      const db = tx as unknown as Kysely<QcafeInventoryDatabase>;
      const id = randomUUID();
      await db
        .insertInto("qcafe_stock_counts")
        .values({
          approved_by: input.approvedBy ?? null,
          business_id: scope.businessId,
          counted_at: now,
          counted_by: actor,
          id,
          location_id: scope.locationId,
          reason: input.reason,
        })
        .execute();
      await db
        .insertInto("qcafe_stock_count_lines")
        .values(
          input.lines.map((line) => ({
            count_id: id,
            counted_milli: line.countedMilli,
            created_at: now,
            expected_milli: line.expectedMilli,
            id: randomUUID(),
            stock_item_id: line.stockItemId,
            variance_milli: line.countedMilli - line.expectedMilli,
          })),
        )
        .execute();
      const variances = input.lines
        .map((line) => ({ ...line, variance: line.countedMilli - line.expectedMilli }))
        .filter((line) => line.variance !== 0);
      if (variances.length) {
        await db
          .insertInto("qcafe_stock_movements")
          .values(
            variances.map((line) =>
              ledgerMovement(
                scope,
                line.stockItemId,
                line.variance,
                line.variance > 0 ? "count_in" : "count_out",
                "count",
                id,
                input.reason,
                actor,
                now,
              ),
            ),
          )
          .execute();
      }
      return id;
    });
  }

  async recordWaste(
    scope: InventoryScope,
    input: { approvedBy: string; quantityMilli: number; reason: string; stockItemId: string },
    actor: string,
    now: string,
  ) {
    return this.db.transaction().execute(async (tx) => {
      const db = tx as unknown as Kysely<QcafeInventoryDatabase>;
      const id = randomUUID();
      await db
        .insertInto("qcafe_waste_events")
        .values({
          approved_by: input.approvedBy,
          business_id: scope.businessId,
          id,
          location_id: scope.locationId,
          occurred_at: now,
          quantity_milli: input.quantityMilli,
          reason: input.reason,
          recorded_by: actor,
          stock_item_id: input.stockItemId,
        })
        .execute();
      await db
        .insertInto("qcafe_stock_movements")
        .values([
          ledgerMovement(
            scope,
            input.stockItemId,
            -input.quantityMilli,
            "waste_out",
            "waste",
            id,
            input.reason,
            actor,
            now,
          ),
        ])
        .execute();
      return id;
    });
  }

  async activeRecipe(businessId: string, menuItemId: string, menuVariantId: string | undefined, onDate: string) {
    const recipes = await this.tables()
      .selectFrom("qcafe_recipes")
      .selectAll()
      .where("business_id", "=", businessId)
      .where("menu_item_id", "=", menuItemId)
      .where("status", "=", "active")
      .where("effective_from", "<=", onDate)
      .orderBy("effective_from", "desc")
      .execute();
    const match = recipes.find(
      (recipe) =>
        (recipe.menu_variant_id ?? undefined) === menuVariantId &&
        (!recipe.effective_to || recipe.effective_to >= onDate),
    );
    if (!match) return undefined;
    const components = await this.tables()
      .selectFrom("qcafe_recipe_components")
      .selectAll()
      .where("recipe_id", "=", match.id)
      .execute();
    return { components, recipe: match };
  }

  async createConsumption(
    scope: InventoryScope,
    input: {
      lines: ReadonlyArray<{ quantityMilli: number; stockItemId: string }>;
      portions: number;
      recipeId: string;
      sourceId: string;
      sourceType: "sale" | "event";
    },
    actor: string,
    now: string,
  ) {
    return this.db.transaction().execute(async (tx) => {
      const db = tx as unknown as Kysely<QcafeInventoryDatabase>;
      const id = randomUUID();
      await db
        .insertInto("qcafe_consumptions")
        .values({
          business_id: scope.businessId,
          created_at: now,
          created_by: actor,
          id,
          location_id: scope.locationId,
          occurred_at: now,
          portions: input.portions,
          recipe_id: input.recipeId,
          source_id: input.sourceId,
          source_type: input.sourceType,
        })
        .execute();
      await db
        .insertInto("qcafe_stock_movements")
        .values(
          input.lines.map((line) =>
            ledgerMovement(
              scope,
              line.stockItemId,
              -line.quantityMilli,
              "consumption_out",
              "consumption",
              id,
              `Recipe consumption for ${input.sourceType} ${input.sourceId}`,
              actor,
              now,
            ),
          ),
        )
        .execute();
      return id;
    });
  }
}

export function ledgerMovement(
  scope: InventoryScope,
  stockItemId: string,
  quantityMilli: number,
  movementType: string,
  sourceType: string,
  sourceId: string,
  reason: string,
  actor: string,
  now: string,
) {
  return {
    actor_ref: actor,
    business_id: scope.businessId,
    id: randomUUID(),
    location_id: scope.locationId,
    movement_type: movementType,
    occurred_at: now,
    quantity_milli: quantityMilli,
    reason,
    source_id: sourceId,
    source_type: sourceType,
    stock_item_id: stockItemId,
  } as unknown as QcafeFoundationDatabase["qcafe_stock_movements"];
}
