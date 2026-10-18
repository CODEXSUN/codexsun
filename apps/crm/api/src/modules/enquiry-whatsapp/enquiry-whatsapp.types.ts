import type { Generated, Kysely, Transaction } from "kysely";
export type WhatsAppRow = {
  id: Generated<number>;
  enquiry_id: number;
  recipient: string;
  message: string;
  request_id: string;
  created_by: string;
  created_at: Generated<Date>;
};
export type WhatsAppDatabase = {
  crm_enquiry_whatsapp_messages: WhatsAppRow;
  app_users: { email: string; name: string };
};
export type WhatsAppContext = {
  database: Kysely<WhatsAppDatabase>;
  actorEmail: string;
  recordHandoff?: (
    transaction: Transaction<WhatsAppDatabase>,
    enquiryId: number,
    message: string
  ) => Promise<void>;
  verifyEnquiry: (id: number) => Promise<{ mobile: string | null }>;
};
