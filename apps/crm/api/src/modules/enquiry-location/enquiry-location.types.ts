import type { ColumnType, Generated } from "kysely";
import type { EnquiryDatabase } from "../enquiry/index.js";

export type EnquiryLocationRow = {
  id: Generated<number>;
  uuid: Generated<string>;
  enquiry_id: number;
  contact_id: number | null;
  latitude: string;
  longitude: string;
  accuracy_meters: string | null;
  captured_at: ColumnType<string, string | undefined, string>;
  created_by: string;
  created_at: ColumnType<string, string | undefined, never>;
  updated_at: ColumnType<string, string | undefined, string>;
};

export type EnquiryLocationDatabase = EnquiryDatabase & {
  crm_enquiry_locations: EnquiryLocationRow;
  core_contacts: { id: number };
};

export type EnquiryLocation = {
  id: number;
  uuid: string;
  enquiryId: number;
  contactId: number | null;
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  capturedAt: string;
  createdBy: string;
  createdAt: string;
};

export type CreateEnquiryLocation = {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  capturedAt: string;
};
