export type FrappeContact = {
  name: string;
  customerId: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  localContactId: number | null;
  localContactCode: string | null;
  identityStatus: "new" | "matched" | "mismatch";
};

export type FrappeContactPage = {
  source: "mobile-contact-customer";
  items: FrappeContact[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};
