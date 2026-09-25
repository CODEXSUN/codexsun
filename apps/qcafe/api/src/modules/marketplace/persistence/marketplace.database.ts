import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";

export interface QcafeMarketplacePartnerRow {
  adapter_contract: string;
  business_id: string;
  code: string;
  created_at: string;
  created_by: string;
  id: string;
  name: string;
  status: "active" | "suspended";
  updated_at: string;
}

export interface QcafeMarketplaceMenuMappingRow {
  active: number;
  business_id: string;
  created_at: string;
  id: string;
  location_id: string;
  menu_item_id: string;
  menu_variant_id: string | null;
  partner_id: string;
  partner_item_ref: string;
}

export interface QcafeMarketplaceOrderRow {
  business_id: string;
  created_at: string;
  currency: string;
  id: string;
  idempotency_key: string | null;
  location_id: string;
  partner_id: string;
  partner_order_ref: string;
  pos_order_id: string | null;
  received_at: string;
  status: "received" | "accepted" | "rejected" | "cancelled" | "fulfilled";
  total_minor: number;
  updated_at: string;
}

export interface QcafeMarketplaceOrderLineRow {
  created_at: string;
  id: string;
  intake_id: string;
  mapping_id: string | null;
  partner_item_ref: string;
  quantity: number;
  unit_price_minor: number;
}

export interface QcafeMarketplaceEventRow {
  actor_ref: string;
  created_at: string;
  event_type: string;
  id: string;
  intake_id: string;
  occurred_at: string;
}

export interface QcafeMarketplaceSettlementRow {
  business_id: string;
  created_at: string;
  created_by: string;
  fee_minor: number;
  gross_minor: number;
  id: string;
  location_id: string;
  net_minor: number;
  partner_id: string;
  period_from: string;
  period_to: string;
  status: "pending" | "posted";
}

export interface QcafeDeliveryFulfillmentRow {
  created_at: string;
  created_by: string;
  delivered_at: string | null;
  id: string;
  intake_id: string;
  partner_collected_minor: number;
  partner_fee_minor: number;
  picked_at: string | null;
  rider_ref: string | null;
  status: "assigned" | "picked" | "delivered" | "cancelled";
  updated_at: string;
}

export interface QcafeMarketplaceTables {
  qcafe_delivery_fulfillments: QcafeDeliveryFulfillmentRow;
  qcafe_marketplace_events: QcafeMarketplaceEventRow;
  qcafe_marketplace_menu_mappings: QcafeMarketplaceMenuMappingRow;
  qcafe_marketplace_order_lines: QcafeMarketplaceOrderLineRow;
  qcafe_marketplace_orders: QcafeMarketplaceOrderRow;
  qcafe_marketplace_partners: QcafeMarketplacePartnerRow;
  qcafe_marketplace_settlements: QcafeMarketplaceSettlementRow;
}

export type QcafeMarketplaceDatabase = QcafeFoundationDatabase & QcafeMarketplaceTables;
