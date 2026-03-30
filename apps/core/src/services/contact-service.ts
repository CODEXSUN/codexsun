import {
  contactListResponseSchema,
  type ContactListResponse,
} from "../../shared/index.js"

import { contacts } from "../data/core-seed.js"

export function listContacts(): ContactListResponse {
  return contactListResponseSchema.parse({
    items: contacts,
  })
}
