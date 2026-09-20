export interface QcafeFoundationDatabase {
  qcafe_activity_events: {
    id: string;
    event_type: string;
    actor_id: string;
    subject_type: string;
    subject_id: string;
    correlation_id: string;
    outcome: "success" | "failure";
    payload_json: string | null;
    occurred_at: string;
  };
  qcafe_businesses: {
    id: string;
    name: string;
    legal_name: string | null;
    currency: string;
    timezone: string;
    created_at: string;
    updated_at: string;
  };
  qcafe_locations: {
    id: string;
    business_id: string;
    code: string;
    name: string;
    timezone: string;
    status: "active" | "inactive";
    created_at: string;
    updated_at: string;
  };
  qcafe_business_days: {
    id: string;
    location_id: string;
    business_date: string;
    status: "open" | "closed";
    opened_at: string;
    closed_at: string | null;
  };
  qcafe_service_channels: {
    id: string;
    location_id: string;
    code: string;
    name: string;
    kind: "counter" | "dine_in" | "takeaway";
    enabled: number;
    created_at: string;
  };
  qcafe_number_sequences: {
    id: string;
    location_id: string;
    document_kind: "bill" | "kot" | "order";
    prefix: string;
    next_value: number;
    updated_at: string;
  };
  qcafe_foundation_metadata: {
    key: string;
    value: string;
    updated_at: string;
  };
  qcafe_menu_categories: {
    id: string;
    business_id: string;
    code: string;
    name: string;
    sort_order: number;
    active: number;
    parent_id: string | null;
    version: number;
    created_at: string;
    updated_at: string;
  };
  qcafe_menu_items: {
    id: string;
    business_id: string;
    category_id: string;
    code: string;
    name: string;
    item_type: "food" | "beverage" | "packaged" | "service";
    tax_code: string | null;
    active: number;
    version: number;
    created_at: string;
    updated_at: string;
  };
  qcafe_menu_variants: {
    id: string;
    item_id: string;
    code: string;
    name: string;
    active: number;
    quantity_basis_milli: number;
    version: number;
    created_at: string;
    updated_at: string;
  };
  qcafe_price_books: {
    id: string;
    business_id: string;
    code: string;
    name: string;
    currency: string;
    active: number;
    location_id: string | null;
    service_channel_id: string | null;
    valid_from: string;
    valid_to: string | null;
    status: "active" | "draft" | "inactive";
    version: number;
    created_at: string;
    updated_at: string;
  };
  qcafe_menu_prices: {
    id: string;
    price_book_id: string;
    item_id: string;
    variant_id: string | null;
    location_id: string | null;
    service_channel_id: string | null;
    amount_minor: number;
    valid_from: string;
    valid_to: string | null;
    active: number;
    tax_included: number;
    version: number;
    created_at: string;
    updated_at: string;
  };
  qcafe_special_campaigns: {
    id: string; business_id: string; location_id: string | null; name: string; scope: "business" | "location";
    starts_at: string; ends_at: string; priority: number; status: "active" | "draft" | "inactive";
    version: number; created_at: string; updated_at: string;
  };
  qcafe_special_prices: {
    id: string; campaign_id: string; item_id: string; variant_id: string | null; amount_minor: number | null;
    discount_basis_points: number | null; usage_limit: number | null; used_count: number; version: number;
    created_at: string; updated_at: string;
  };
  qcafe_modifier_groups: {
    id: string; business_id: string; code: string; name: string; min_selections: number; max_selections: number;
    active: number; version: number; created_at: string; updated_at: string;
  };
  qcafe_modifier_options: {
    id: string; group_id: string; code: string; name: string; price_adjustment_minor: number;
    stock_item_ref: string | null; active: number; version: number; created_at: string; updated_at: string;
  };
  qcafe_item_modifier_groups: {
    id: string; item_id: string; variant_id: string | null; group_id: string; sort_order: number;
    version: number; created_at: string; updated_at: string;
  };
  qcafe_media_assets: {
    id: string; business_id: string; storage_object_ref: string; checksum: string; mime_type: string;
    width: number | null; height: number | null; status: "active" | "processing" | "rejected";
    version: number; created_at: string; updated_at: string;
  };
  qcafe_menu_item_media: {
    id: string; item_id: string; variant_id: string | null; media_asset_id: string;
    usage: "delivery" | "menu" | "qr"; sort_order: number; version: number; created_at: string; updated_at: string;
  };
  qcafe_item_availability: {
    id: string; item_id: string; variant_id: string | null; location_id: string; service_channel_id: string | null;
    starts_at: string; ends_at: string | null; status: "available" | "unavailable"; reason: string | null;
    version: number; created_at: string; updated_at: string;
  };
  qcafe_allergen_tags: {
    id: string; business_id: string; code: string; name: string; severity: "high" | "low" | "medium";
    version: number; created_at: string; updated_at: string;
  };
  qcafe_item_allergens: {
    id: string; item_id: string; variant_id: string | null; allergen_tag_id: string; note: string | null;
    version: number; created_at: string; updated_at: string;
  };
  qcafe_runtime_settings: {
    key: string;
    value_json: string;
    updated_by: string;
    updated_at: string;
  };
  qcafe_connectors: {
    id: string;
    kind: "accounting" | "delivery" | "marketplace" | "messaging" | "payment" | "storage";
    code: string;
    name: string;
    endpoint_label: string | null;
    secret_reference: string | null;
    enabled: number;
    status: "configured" | "not_configured";
    created_at: string;
    updated_at: string;
  };
}
