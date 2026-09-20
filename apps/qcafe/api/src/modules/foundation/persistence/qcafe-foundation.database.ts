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
    kind: "counter" | "dine_in" | "takeaway" | "qr" | "delivery" | "event" | "marketplace";
    enabled: number;
    created_at: string;
  };
  qcafe_orders: { id: string; business_id: string; location_id: string; service_channel_id: string; price_book_id: string; table_session_id: string | null; number: string; status: "draft" | "held" | "confirmed" | "cancelled" | "fulfilled"; currency: string; customer_name: string | null; contact_ref: string | null; subtotal_minor: number; discount_minor: number; total_minor: number; note: string | null; opened_by: string; confirmed_at: string | null; closed_at: string | null; version: number; created_at: string; updated_at: string };
  qcafe_order_lines: { id: string; order_id: string; item_id: string; variant_id: string | null; item_code: string; item_name: string; variant_name: string | null; quantity_milli: number; unit_price_minor: number; modifier_total_minor: number; line_total_minor: number; note: string | null; status: "active" | "voided"; version: number; created_at: string; updated_at: string };
  qcafe_order_line_modifiers: { id: string; order_line_id: string; option_id: string; option_name: string; quantity: number; price_adjustment_minor: number; created_at: string };
  qcafe_order_events: { id: string; order_id: string; event_type: string; actor_id: string; reason: string | null; occurred_at: string };
  qcafe_fulfillment_jobs: { id: string; order_id: string; kind: "counter" | "dine_in" | "takeaway" | "qr" | "delivery" | "event" | "marketplace"; status: "pending" | "preparing" | "ready" | "handed_over" | "cancelled"; promised_at: string | null; ready_at: string | null; handover_at: string | null; handler_ref: string | null; created_at: string; updated_at: string };
  qcafe_takeaway_details: { id: string; fulfillment_job_id: string; collection_name: string; contact_ref: string | null; pickup_code: string; pickup_window: string | null; created_at: string; updated_at: string };
  qcafe_order_adjustments: { id: string; order_id: string; kind: "discount" | "service_recovery" | "rounding"; amount_minor: number; reason: string; approved_by: string; created_at: string };
  qcafe_order_notes: { id: string; order_id: string; order_line_id: string | null; note_kind: "guest" | "internal" | "kitchen"; content: string; visibility: "guest" | "internal" | "kitchen"; created_at: string };
  qcafe_dining_areas: { id: string; location_id: string; name: string; kind: "dining" | "bar" | "terrace" | "private"; sort_order: number; active: number; created_at: string; updated_at: string };
  qcafe_dining_tables: { id: string; area_id: string; code: string; capacity: number; position_label: string | null; active: number; created_at: string; updated_at: string };
  qcafe_table_sessions: { id: string; location_id: string; status: "open" | "closed"; guest_count: number; primary_order_id: string | null; opened_at: string; closed_at: string | null; opened_by: string; closed_by: string | null };
  qcafe_table_session_tables: { id: string; session_id: string; table_id: string; created_at: string };
  qcafe_kitchen_stations: { id: string; location_id: string; code: string; name: string; active: number; created_at: string; updated_at: string };
  qcafe_item_station_routes: { id: string; item_id: string; variant_id: string | null; station_id: string; priority: number; active: number; created_at: string; updated_at: string };
  qcafe_kitchen_tickets: { id: string; number: string; order_id: string; station_id: string; status: "fired" | "accepted" | "preparing" | "ready" | "served" | "recalled" | "voided"; fired_at: string; ready_at: string | null; updated_at: string };
  qcafe_kitchen_ticket_lines: { id: string; ticket_id: string; order_line_id: string; quantity_milli: number; status: "fired" | "preparing" | "ready" | "served" | "voided"; preparation_note: string | null; updated_at: string };
  qcafe_kitchen_ticket_events: { id: string; ticket_id: string; line_id: string | null; event_type: string; actor_ref: string; note: string | null; occurred_at: string };
  qcafe_kitchen_print_attempts: { id: string; ticket_id: string; attempt_number: number; route_ref: string; status: "queued" | "acknowledged" | "failed"; error: string | null; requested_by: string; requested_at: string };
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
