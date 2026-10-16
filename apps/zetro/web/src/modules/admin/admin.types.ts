export type ZetroTenantOption = {
  uuid: string;
  tenantName: string;
  tenantCode: string;
  enabledModuleKeys: string[];
};

export type ZetroQueryPattern = {
  uuid: string;
  serial_no: number;
  intent_key: string | null;
  question_pattern: string;
  query_pattern: string;
  limitation: string;
  extra: string;
  status: "active" | "draft" | "retired";
};

export type ZetroInteractionLog = {
  id: number;
  uuid: string;
  pattern_uuid: string | null;
  actor_email: string;
  prompt_text: string;
  response_text: string | null;
  intent: string;
  skill_decision: string | null;
  outcome: string;
  created_at: string;
};

export type ZetroPatternDraft = {
  serialNo: number;
  questionPattern: string;
  queryPattern: string;
  limitation: string;
  extra: string;
};

export const zetroCapabilities = [
  "billing.customer-outstanding.read",
  "billing.daily-summary.read",
  "billing.monthly-summary.read",
  "billing.aged-sales.read",
  "crm.assigned-enquiries.read"
] as const;

export const zetroCapabilityLabels: Record<(typeof zetroCapabilities)[number], string> = {
  "billing.customer-outstanding.read": "Customer balance",
  "billing.daily-summary.read": "Today's report",
  "billing.monthly-summary.read": "This month's totals",
  "billing.aged-sales.read": "Long outstanding sales",
  "crm.assigned-enquiries.read": "My assigned CRM enquiries"
};

export type ZetroGrantChange = {
  roleKey: string;
  capabilityKey: (typeof zetroCapabilities)[number];
  status: "active" | "revoked";
  reason: string;
};

export type ZetroGrant = {
  role_key: string;
  capability_key: string;
  status: "active" | "revoked";
  approved_by: string;
  reason: string;
};

export type ZetroRole = { role_key: string; label: string };

export type ZetroReviewConversation = {
  id: number;
  owner_email: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type ZetroReviewDetail = {
  conversation: ZetroReviewConversation;
  messages: Array<{ id: number; role: string; content: string; created_at: string }>;
  notes: Array<{ id: number; reviewer_email: string; note: string; created_at: string }>;
  events: Array<{
    id: number;
    capability_key: string;
    decision: string;
    request_json: string;
    result_json: string | null;
    created_at: string;
  }>;
  interactions: ZetroInteractionLog[];
};

export type ZetroApproval = {
  id: number;
  actor_email: string;
  conversation_id: number | null;
  capability_key: string;
  status: "pending" | "approved" | "rejected";
  request_json: string;
  decision_note: string | null;
  created_at: string;
};

export type ZetroGrantEvent = {
  id: number;
  role_key: string;
  capability_key: string;
  status: string;
  decided_by: string;
  reason: string;
  created_at: string;
};
