export type FrappeContact = {
  name: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  localContactId: number | null;
};

export type FrappeContactPage = {
  items: FrappeContact[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};
