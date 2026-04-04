import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"
import {
  listJsonStorePayloads,
  replaceJsonStoreRecords,
} from "../../../framework/src/runtime/database/process/json-store.js"

import type { Contact } from "../../shared/index.js"
import { coreTableNames } from "../table-names.js"

function inferContactCodePrefix(contact: Contact) {
  if (contact.contactTypeId === "contact-type:partner") {
    return "P"
  }

  if (contact.contactTypeId === "contact-type:supplier") {
    return "S"
  }

  return "C"
}

function buildNextContactCode(prefix: string, sequence: number) {
  return `${prefix}${String(sequence).padStart(4, "0")}`
}

export const coreContactCodeBackfillMigration = defineDatabaseMigration({
  id: "core:contacts:10-contact-code-backfill",
  appId: "core",
  moduleKey: "contacts",
  name: "Backfill contact codes for existing contact records",
  order: 100,
  up: async ({ database }) => {
    const contacts = await listJsonStorePayloads<Contact>(database, coreTableNames.contacts)

    if (contacts.length === 0) {
      return
    }

    const nextSequenceByPrefix = new Map<string, number>()
    const updatedContacts = contacts.map((contact) => {
      const existingCode =
        typeof (contact as { code?: unknown }).code === "string"
          ? (contact as { code?: string }).code?.trim().toUpperCase()
          : ""

      if (existingCode) {
        const prefix = existingCode[0] ?? "C"
        const numericPart = Number.parseInt(existingCode.slice(1), 10)
        if (Number.isFinite(numericPart)) {
          nextSequenceByPrefix.set(prefix, Math.max(nextSequenceByPrefix.get(prefix) ?? 1, numericPart + 1))
        }

        return {
          ...contact,
          code: existingCode,
        }
      }

      const prefix = inferContactCodePrefix(contact)
      const nextSequence = nextSequenceByPrefix.get(prefix) ?? 1
      nextSequenceByPrefix.set(prefix, nextSequence + 1)

      return {
        ...contact,
        code: buildNextContactCode(prefix, nextSequence),
      }
    })

    await replaceJsonStoreRecords(
      database,
      coreTableNames.contacts,
      updatedContacts.map((contact, index) => ({
        id: contact.id,
        moduleKey: "contacts",
        sortOrder: index + 1,
        payload: contact,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      }))
    )
  },
})
