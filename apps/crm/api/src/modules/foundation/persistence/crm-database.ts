import type { Kysely } from "kysely";

export interface CrmCampaignTable {
  id: string;
  name: string;
  status: string;
  source: string | null;
  owner_actor_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmAccountTable {
  id: string;
  name: string;
  kind: string;
  primary_phone: string | null;
  primary_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmContactTable {
  id: string;
  account_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: string | null;
  is_primary: number;
  created_at: string;
  updated_at: string;
}

export interface CrmAddressTable {
  id: string;
  account_id: string;
  label: string;
  address_text: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface CrmLeadTable {
  id: string;
  campaign_id: string | null;
  account_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  score: number;
  owner_actor_id: string | null;
  qualification_note: string | null;
  qualified_at: string | null;
  converted_enquiry_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmEnquiryTable {
  id: string;
  lead_id: string | null;
  account_id: string | null;
  subject: string;
  description: string | null;
  priority: string;
  status: string;
  owner_actor_id: string | null;
  due_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmActivityTable {
  id: string;
  enquiry_id: string | null;
  kind: string;
  subject: string;
  body: string | null;
  actor_id: string | null;
  occurred_at: string;
}

export interface CrmCommunicationTable {
  id: string;
  enquiry_id: string | null;
  account_id: string | null;
  channel: string;
  direction: string;
  subject: string | null;
  body: string | null;
  status: string;
  actor_id: string | null;
  occurred_at: string;
}

export interface CrmConsentTable {
  id: string;
  account_id: string;
  channel: string;
  status: string;
  captured_at: string;
  captured_by_actor_id: string | null;
}

export interface CrmAssignmentTable {
  id: string;
  enquiry_id: string;
  assigner_actor_id: string;
  assignee_actor_id: string | null;
  status: string;
  due_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmWorkOrderTable {
  id: string;
  enquiry_id: string;
  assignment_id: string | null;
  status: string;
  scheduled_start_at: string | null;
  scheduled_end_at: string | null;
  check_in_at: string | null;
  check_out_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmCollectionPlanTable {
  id: string;
  enquiry_id: string;
  expected_amount: number;
  currency: string;
  status: string;
  due_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmVerificationTable {
  id: string;
  enquiry_id: string;
  status: string;
  verifier_actor_id: string | null;
  outcome_note: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmFoundationMetadataTable {
  key: string;
  value: string;
  updated_at: string;
}

export interface CrmDatabase {
  crm_accounts: CrmAccountTable;
  crm_activities: CrmActivityTable;
  crm_addresses: CrmAddressTable;
  crm_assignments: CrmAssignmentTable;
  crm_campaigns: CrmCampaignTable;
  crm_collection_plans: CrmCollectionPlanTable;
  crm_communications: CrmCommunicationTable;
  crm_consents: CrmConsentTable;
  crm_contacts: CrmContactTable;
  crm_enquiries: CrmEnquiryTable;
  crm_foundation_metadata: CrmFoundationMetadataTable;
  crm_leads: CrmLeadTable;
  crm_verifications: CrmVerificationTable;
  crm_work_orders: CrmWorkOrderTable;
}

export type CrmDatabaseQuery = Kysely<CrmDatabase>;
