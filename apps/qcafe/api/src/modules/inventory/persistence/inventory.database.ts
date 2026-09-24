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

export interface QcafeInventoryTables {
  qcafe_daily_plan_lines: QcafeDailyPlanLineRow;
  qcafe_daily_plans: QcafeDailyPlanRow;
  qcafe_recipe_components: QcafeRecipeComponentRow;
  qcafe_recipes: QcafeRecipeRow;
}

export type QcafeInventoryDatabase = QcafeFoundationDatabase & QcafeInventoryTables;
