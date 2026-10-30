export type Conversation = {
  uuid: string;
  buyerUuid: string;
  companyUuid: string;
  requirementUuid: string | null;
  inquiryUuid: string | null;
  sellerName: string;
  buyerBusiness: string;
  subject: string;
  updatedAt: string;
};
export type ConversationInput = { requirementUuid: string | null; inquiryUuid: string | null };
