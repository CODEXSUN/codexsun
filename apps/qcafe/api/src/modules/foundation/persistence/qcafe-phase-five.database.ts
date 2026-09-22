export interface QcafePhaseFiveDatabase {
  qcafe_customers: {
    id: string;
    business_id: string;
    name: string;
    phone: string | null;
    email: string | null;
    email_consent: number;
    whatsapp_consent: number;
    marketing_consent: number;
    external_reference: string | null;
    created_at: string;
    updated_at: string;
  };
  qcafe_reservations: {
    id: string;
    customer_id: string;
    location_id: string;
    arrival_at: string;
    duration_minutes: number;
    party_size: number;
    status: "cancelled" | "completed" | "confirmed" | "no_show" | "requested" | "seated";
    source: "event" | "phone" | "qr" | "walk_in" | "web";
    notes: string | null;
    table_session_id: string | null;
    order_id: string | null;
    created_at: string;
    updated_at: string;
  };
  qcafe_reservation_tables: {
    id: string;
    reservation_id: string;
    table_id: string;
    assigned_at: string;
  };
  qcafe_reservation_events: {
    id: string;
    reservation_id: string;
    event_type: string;
    actor_ref: string;
    note: string | null;
    occurred_at: string;
  };
  qcafe_table_qr_tokens: {
    id: string;
    location_id: string;
    table_id: string;
    token_hash: string;
    version: number;
    valid_from: string;
    expires_at: string | null;
    revoked_at: string | null;
    created_by: string;
  };
  qcafe_scanner_profiles: {
    id: string;
    device_ref: string;
    location_id: string;
    scan_purpose: "inventory" | "order" | "table_entry";
    accepted_formats_json: string;
    active: number;
    created_at: string;
    updated_at: string;
  };
  qcafe_event_leads: {
    id: string;
    business_id: string;
    customer_id: string | null;
    source: string;
    occasion_type: string;
    event_date: string;
    guest_count: number;
    status: "contacted" | "lost" | "new" | "qualified" | "won";
    owner_ref: string;
    created_at: string;
    updated_at: string;
  };
  qcafe_event_followups: {
    id: string;
    lead_id: string;
    scheduled_at: string;
    outcome: string | null;
    note: string;
    owner_ref: string;
    completed_at: string | null;
    created_at: string;
  };
  qcafe_event_bookings: {
    id: string;
    lead_id: string;
    location_id: string;
    customer_id: string | null;
    status: "cancelled" | "completed" | "confirmed" | "in_service" | "planning";
    starts_at: string;
    ends_at: string;
    guest_count: number;
    created_at: string;
    updated_at: string;
  };
  qcafe_event_requirements: {
    id: string;
    event_booking_id: string;
    category: "decoration" | "dietary" | "equipment" | "seating" | "venue";
    details: string;
    responsible_ref: string;
    status: "done" | "open";
    created_at: string;
    updated_at: string;
  };
  qcafe_event_quotes: {
    id: string;
    event_booking_id: string;
    number: string;
    status: "accepted" | "draft" | "expired" | "rejected" | "sent";
    currency: string;
    valid_until: string;
    total_minor: number;
    created_at: string;
    updated_at: string;
  };
  qcafe_event_quote_lines: {
    id: string;
    quote_id: string;
    item_ref: string | null;
    description: string;
    quantity_milli: number;
    unit_amount_minor: number;
    total_minor: number;
    created_at: string;
  };
  qcafe_event_orders: {
    id: string;
    event_booking_id: string;
    order_id: string;
    role: "delivery" | "final" | "preparation" | "service";
    created_at: string;
  };
  qcafe_event_schedule_items: {
    id: string;
    event_booking_id: string;
    starts_at: string;
    ends_at: string;
    activity: string;
    owner_ref: string;
    status: "done" | "planned" | "running";
    created_at: string;
    updated_at: string;
  };
  qcafe_event_tasks: {
    id: string;
    event_booking_id: string;
    task: string;
    due_at: string;
    owner_ref: string;
    status: "done" | "open";
    created_at: string;
    updated_at: string;
  };
}
