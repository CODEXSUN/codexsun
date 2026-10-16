import { frappeRequest } from "../../frappe-request";
import type { FrappeContactPage } from "./contact-import.types";

export const getFrappeContacts = (page: number) =>
  frappeRequest<FrappeContactPage>("GET", `/frappe/contacts/remote?page=${page}`);
export const pullFrappeContact = (remoteName: string) =>
  frappeRequest<{ remoteName: string; localId: number; status: string }>(
    "POST",
    "/frappe/contacts/pull",
    { remoteName }
  );
