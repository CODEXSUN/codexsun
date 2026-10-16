import type { EnquiryDatabase } from "@codexsun/crm-api/enquiry-sync";
import type { ColumnType } from "kysely";

export type FrappeSettings = {
  baseUrl: string;
  apiKey: string;
  apiSecret: string;
  enabled: boolean;
};

export type FrappeConnectionInput = {
  connectionName: string;
  baseUrl: string;
  apiKey: string;
  apiSecret: string;
  enabled: boolean;
};

export type FrappeConnectionRow = {
  id: number;
  connection_name: string;
  base_url: string;
  api_key_ciphertext: string | null;
  api_secret_ciphertext: string | null;
  enabled: number | boolean;
  verification_status: "unverified" | "verified" | "failed";
  last_checked_at: string | Date | null;
  last_verified_at: string | Date | null;
  updated_at: ColumnType<string | Date, string | undefined, string>;
};

export type FrappeSyncRow = {
  enquiry_id: number;
  remote_name: string;
  synced_at: ColumnType<string, string | undefined, string>;
};

export type FrappeDataSourceRow = {
  module_key: string;
  provider: "local" | "frappe";
  updated_by: string;
  updated_at: ColumnType<string | Date, string | undefined, string>;
};

export type FrappeDatabase = EnquiryDatabase & {
  frappe_contact_imports: {
    id: number;
    remote_name: string;
    local_contact_id: number;
    created_at: string;
    updated_at: string;
  };
  frappe_activity_imports: {
    id: number;
    remote_name: string;
    local_activity_id: number;
    created_at: string;
    updated_at: string;
  };
  frappe_import_state: {
    id: number;
    completed_at: string | Date | null;
    completed_by: string | null;
    updated_at: string | Date;
  };
  frappe_connection_settings: FrappeConnectionRow;
  frappe_data_sources: FrappeDataSourceRow;
  frappe_enquiry_sync: FrappeSyncRow;
  frappe_live_sync_settings: {
    id: number;
    enabled: number | boolean;
    paused: number | boolean;
    schedule_minutes: number;
    contacts_enabled: number | boolean;
    enquiries_enabled: number | boolean;
    activities_enabled: number | boolean;
    call_logs_enabled: number | boolean;
    last_scheduled_at: string | Date | null;
    updated_by: string;
    updated_at: string | Date;
  };
};
