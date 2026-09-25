import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";

export interface QcafeRecipeRow {
  business_id: string;
  change_reason: string | null;
  code: string;
  created_at: string;
  created_by: string;
  effective_from: string;
  effective_to: string | null;
  id: string;
  menu_item_id: string;
  menu_variant_id: string | null;
  name: string;
  revision_no: number;
  source_recipe_id: string | null;
  status: "active" | "superseded" | "draft";
  updated_at: string;
}

export interface QcafeRecipeComponentRow {
  created_at: string;
  id: string;
  note: string | null;
  quantity_milli: number;
  recipe_id: string;
  stock_item_id: string;
}

export interface QcafeDailyPlanRow {
  business_id: string;
  created_at: string;
  created_by: string;
  id: string;
  location_id: string;
  note: string | null;
  plan_date: string;
  status: "draft" | "confirmed" | "closed";
  updated_at: string;
}

export interface QcafeDailyPlanLineRow {
  created_at: string;
  demand_ref: string | null;
  demand_source: "regular" | "special" | "booking" | "event";
  id: string;
  menu_item_id: string;
  menu_variant_id: string | null;
  note: string | null;
  plan_id: string;
  quantity_milli: number;
}

export interface QcafeStockReservationRow {
  business_id: string;
  created_at: string;
  created_by: string;
  id: string;
  location_id: string;
  quantity_milli: number;
  reason: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  source_id: string;
  source_type: "event" | "daily_plan" | "special" | "order";
  status: "active" | "released" | "consumed";
  stock_item_id: string;
}

export interface QcafePurchaseOrderRow {
  business_id: string;
  created_at: string;
  created_by: string;
  expected_at: string | null;
  id: string;
  location_id: string;
  status: "draft" | "sent" | "partial" | "received" | "cancelled";
  supplier_ref: string | null;
  updated_at: string;
}

export interface QcafePurchaseOrderLineRow {
  created_at: string;
  id: string;
  note: string | null;
  po_id: string;
  quantity_milli: number;
  received_milli: number;
  stock_item_id: string;
  unit_price_minor: number;
}

export interface QcafeGoodsReceiptRow {
  business_id: string;
  id: string;
  location_id: string;
  note: string | null;
  po_id: string;
  received_at: string;
  received_by: string;
}

export interface QcafeGoodsReceiptLineRow {
  created_at: string;
  id: string;
  lot_id: string | null;
  po_line_id: string;
  quantity_milli: number;
  receipt_id: string;
  stock_item_id: string;
  unit_price_minor: number;
}

export interface QcafeStockLotRow {
  business_id: string;
  created_at: string;
  created_by: string;
  expires_at: string | null;
  id: string;
  location_id: string;
  lot_code: string;
  stock_item_id: string;
}

export interface QcafeStockCountRow {
  approved_by: string | null;
  business_id: string;
  counted_at: string;
  counted_by: string;
  id: string;
  location_id: string;
  reason: string;
}

export interface QcafeStockCountLineRow {
  count_id: string;
  counted_milli: number;
  created_at: string;
  expected_milli: number;
  id: string;
  stock_item_id: string;
  variance_milli: number;
}

export interface QcafeWasteEventRow {
  approved_by: string;
  business_id: string;
  id: string;
  location_id: string;
  occurred_at: string;
  quantity_milli: number;
  reason: string;
  recorded_by: string;
  stock_item_id: string;
}

export interface QcafeConsumptionRow {
  business_id: string;
  created_at: string;
  created_by: string;
  id: string;
  location_id: string;
  occurred_at: string;
  portions: number;
  recipe_id: string;
  source_id: string;
  source_type: "sale" | "event";
}

export interface QcafeInventoryTables {
  qcafe_consumptions: QcafeConsumptionRow;
  qcafe_daily_plan_lines: QcafeDailyPlanLineRow;
  qcafe_daily_plans: QcafeDailyPlanRow;
  qcafe_goods_receipt_lines: QcafeGoodsReceiptLineRow;
  qcafe_goods_receipts: QcafeGoodsReceiptRow;
  qcafe_purchase_order_lines: QcafePurchaseOrderLineRow;
  qcafe_purchase_orders: QcafePurchaseOrderRow;
  qcafe_recipe_components: QcafeRecipeComponentRow;
  qcafe_recipes: QcafeRecipeRow;
  qcafe_stock_count_lines: QcafeStockCountLineRow;
  qcafe_stock_counts: QcafeStockCountRow;
  qcafe_stock_lots: QcafeStockLotRow;
  qcafe_stock_reservations: QcafeStockReservationRow;
  qcafe_waste_events: QcafeWasteEventRow;
}

export type QcafeInventoryDatabase = QcafeFoundationDatabase & QcafeInventoryTables;
