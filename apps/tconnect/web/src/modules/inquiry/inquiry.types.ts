export type Inquiry = {
  uuid: string;
  companyUuid: string;
  buyerName: string;
  email: string;
  phone: string;
  requirement: string;
  quantity: string;
  status: "new" | "contacted" | "closed";
  canReply: boolean;
  createdAt: string;
};
export type InquiryInput = Omit<Inquiry, "uuid" | "status" | "createdAt" | "canReply"> & {
  consent: true;
  website: string;
};
