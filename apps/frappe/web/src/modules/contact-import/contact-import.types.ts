export type FrappeContact = {
  name: string;
  customerId: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  localContactId: number | null;
};

export type FrappeContactPage = {
  source: "mobile-contact-customer";
  items: FrappeContact[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};
