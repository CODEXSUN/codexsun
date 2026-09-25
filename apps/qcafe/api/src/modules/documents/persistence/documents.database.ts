import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";

export interface QcafeDocumentRow {
  business_id: string;
  checksum: string | null;
  created_at: string;
  created_by: string;
  id: string;
  kind: "receipt" | "kot" | "report" | "voucher" | "label";
  location_id: string;
  status: "draft" | "rendered";
  storage_object_ref: string | null;
  title: string;
  updated_at: string;
}

export interface QcafePrinterProfileRow {
  active: number;
  business_id: string;
  code: string;
  config_ref: string | null;
  created_at: string;
  id: string;
  kind: "browser" | "direct" | "gateway" | "bluetooth" | "network";
  location_id: string;
  name: string;
  updated_at: string;
}

export interface QcafePrinterRouteRow {
  active: number;
  created_at: string;
  document_kind: string;
  fallback_profile_id: string | null;
  id: string;
  location_id: string;
  printer_profile_id: string;
  priority: number;
}

export interface QcafePrintJobRow {
  attempt_count: number;
  business_id: string;
  created_at: string;
  created_by: string;
  document_id: string;
  id: string;
  idempotency_key: string | null;
  location_id: string;
  printer_profile_id: string;
  status: "pending" | "processing" | "acknowledged" | "failed" | "preview";
  updated_at: string;
}

export interface QcafePrintAttemptRow {
  attempt_number: number;
  error: string | null;
  id: string;
  job_id: string;
  requested_at: string;
  requested_by: string;
  route_ref: string | null;
  status: "queued" | "acknowledged" | "failed";
}

export interface QcafePrintPreviewRow {
  confirmed_at: string | null;
  confirmed_by: string | null;
  id: string;
  job_id: string;
  requested_at: string;
  requested_by: string;
  status: "pending" | "confirmed" | "expired";
}

export interface QcafePrintDispatchRow {
  adapter_kind: string;
  created_at: string;
  created_by: string;
  decision: "dispatched" | "unavailable" | "rerouted";
  detail: string | null;
  endpoint_ref: string | null;
  id: string;
  job_id: string;
}

export interface QcafeDeliveryConsentRow {
  business_id: string;
  channel: "email" | "whatsapp";
  created_at: string;
  customer_ref: string;
  granted_at: string;
  id: string;
  location_id: string;
  revoked_at: string | null;
  status: "granted" | "revoked";
}

export interface QcafeDeliveryRow {
  business_id: string;
  channel: "email" | "whatsapp";
  consent_id: string;
  created_at: string;
  created_by: string;
  destination: string;
  document_id: string;
  error: string | null;
  id: string;
  location_id: string;
  provider_reference: string | null;
  status: "queued" | "sent" | "failed";
  updated_at: string;
}

export interface QcafeDocumentsTables {
  qcafe_delivery_consents: QcafeDeliveryConsentRow;
  qcafe_deliveries: QcafeDeliveryRow;
  qcafe_documents: QcafeDocumentRow;
  qcafe_print_attempts: QcafePrintAttemptRow;
  qcafe_print_dispatches: QcafePrintDispatchRow;
  qcafe_print_jobs: QcafePrintJobRow;
  qcafe_print_previews: QcafePrintPreviewRow;
  qcafe_printer_profiles: QcafePrinterProfileRow;
  qcafe_printer_routes: QcafePrinterRouteRow;
}

export type QcafeDocumentsDatabase = QcafeFoundationDatabase & QcafeDocumentsTables;
