import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import {
  createContact,
  deleteContact,
  listContacts,
  updateContact,
} from "../../apps/core/src/services/contact-service.js"
import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../apps/framework/src/runtime/database/index.js"

test("core contacts normalize legacy contact-type parties into linked debtors and creditors ledgers", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-core-contacts-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const contacts = await listContacts(runtime.primary)
      const customer = contacts.items.find((contact) => contact.id === "contact:maya-rao")
      const supplier = contacts.items.find(
        (contact) => contact.id === "contact:northwind-textiles"
      )
      const logistics = contacts.items.find((contact) => contact.id === "contact:swift-drop")

      assert.equal(customer?.ledgerId, "ledger-sundry-debtors")
      assert.equal(customer?.ledgerName, "Sundry Debtors")
      assert.equal(supplier?.ledgerId, "ledger-sundry-creditors")
      assert.equal(supplier?.ledgerName, "Sundry Creditors")
      assert.equal(logistics?.ledgerId, null)
      assert.equal(logistics?.ledgerName, null)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("core contact service supports create update and delete CRUD with linked ledgers", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-core-contacts-crud-"))
  const adminUser = {
    id: "auth-user:platform-admin",
    email: "sundar@sundar.com",
    phoneNumber: "9999999999",
    displayName: "Sundar",
    actorType: "admin" as const,
    isSuperAdmin: true,
    avatarUrl: null,
    isActive: true,
    organizationName: "Codexsun",
    roles: [],
    permissions: [],
    createdAt: "2026-03-30T00:00:00.000Z",
    updatedAt: "2026-03-30T00:00:00.000Z",
  }

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const created = await createContact(runtime.primary, adminUser, {
        code: "",
        ledgerId: "ledger-sundry-debtors",
        ledgerName: "Sundry Debtors",
        name: "Lakshmi Stores",
        legalName: "Lakshmi Stores Private Limited",
        pan: "ABCDE1234F",
        gstin: "29ABCDE1234F1Z5",
        msmeType: "",
        msmeNo: "",
        openingBalance: 10000,
        balanceType: "debit",
        creditLimit: 50000,
        website: "https://lakshmi.example.com",
        description: "Retail customer master.",
        isActive: true,
        addresses: [
          {
            addressTypeId: null,
            addressLine1: "12 Market Street",
            addressLine2: "",
            cityId: null,
            districtId: null,
            stateId: null,
            countryId: null,
            pincodeId: null,
            latitude: null,
            longitude: null,
            isDefault: true,
          },
        ],
        emails: [
          {
            email: "accounts@lakshmi.example.com",
            emailType: "primary",
            isPrimary: true,
          },
        ],
        phones: [
          {
            phoneNumber: "+91 90000 12345",
            phoneType: "primary",
            isPrimary: true,
          },
        ],
        bankAccounts: [],
        gstDetails: [
          {
            gstin: "29ABCDE1234F1Z5",
            state: "Karnataka",
            isDefault: true,
          },
        ],
      })

      assert.equal(created.item.ledgerId, "ledger-sundry-debtors")
      assert.equal(created.item.primaryEmail, "accounts@lakshmi.example.com")
      assert.match(created.item.code, /^C\d{4}$/)

      const updated = await updateContact(runtime.primary, adminUser, created.item.id, {
        ...{
          code: created.item.code,
          ledgerId: "ledger-sundry-creditors",
          ledgerName: "Sundry Creditors",
          name: "Lakshmi Stores",
          legalName: "Lakshmi Stores Private Limited",
          pan: "ABCDE1234F",
          gstin: "29ABCDE1234F1Z5",
          msmeType: "",
          msmeNo: "",
          openingBalance: 15000,
          balanceType: "credit",
          creditLimit: 75000,
          website: "https://lakshmi.example.com",
          description: "Updated contact master.",
          isActive: true,
          addresses: [],
          emails: [
            {
              email: "owner@lakshmi.example.com",
              emailType: "primary",
              isPrimary: true,
            },
          ],
          phones: [
            {
              phoneNumber: "+91 90000 54321",
              phoneType: "primary",
              isPrimary: true,
            },
          ],
          bankAccounts: [],
          gstDetails: [],
        },
      })

      assert.equal(updated.item.ledgerId, "ledger-sundry-creditors")
      assert.equal(updated.item.creditLimit, 75000)
      assert.equal(updated.item.primaryPhone, "+91 90000 54321")

      const listed = await listContacts(runtime.primary)
      assert.equal(listed.items.some((item) => item.id === created.item.id), true)

      const deleted = await deleteContact(runtime.primary, adminUser, created.item.id)
      assert.equal(deleted.deleted, true)

      const listedAfterDelete = await listContacts(runtime.primary)
      assert.equal(listedAfterDelete.items.some((item) => item.id === created.item.id), false)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("core contact service allows repeated names but blocks duplicate gstin and phone", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-core-contacts-unique-"))
  const adminUser = {
    id: "auth-user:platform-admin",
    email: "sundar@sundar.com",
    phoneNumber: "9999999999",
    displayName: "Sundar",
    actorType: "admin" as const,
    isSuperAdmin: true,
    avatarUrl: null,
    isActive: true,
    organizationName: "Codexsun",
    roles: [],
    permissions: [],
    createdAt: "2026-03-30T00:00:00.000Z",
    updatedAt: "2026-03-30T00:00:00.000Z",
  }

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const first = await createContact(runtime.primary, adminUser, {
        code: "",
        contactTypeId: "contact-type:registered-customer-b2b",
        ledgerId: null,
        ledgerName: null,
        name: "Arun Traders",
        legalName: "",
        pan: "",
        gstin: "29ABCDE1234F1Z5",
        msmeType: "",
        msmeNo: "",
        openingBalance: 0,
        balanceType: "",
        creditLimit: 0,
        website: "",
        description: "",
        isActive: true,
        addresses: [],
        emails: [],
        phones: [{ phoneNumber: "+91 90000 12345", phoneType: "mobile", isPrimary: true }],
        bankAccounts: [],
        gstDetails: [],
      })

      const second = await createContact(runtime.primary, adminUser, {
        code: "",
        contactTypeId: "contact-type:unregistered-customer-b2c",
        ledgerId: null,
        ledgerName: null,
        name: "Arun Traders",
        legalName: "",
        pan: "",
        gstin: "",
        msmeType: "",
        msmeNo: "",
        openingBalance: 0,
        balanceType: "",
        creditLimit: 0,
        website: "",
        description: "",
        isActive: true,
        addresses: [],
        emails: [],
        phones: [{ phoneNumber: "+91 90000 54321", phoneType: "mobile", isPrimary: true }],
        bankAccounts: [],
        gstDetails: [],
      })

      assert.notEqual(first.item.id, second.item.id)

      await assert.rejects(
        () =>
          createContact(runtime.primary, adminUser, {
            code: "",
            contactTypeId: "contact-type:registered-customer-b2b",
            ledgerId: null,
            ledgerName: null,
            name: "Another Name",
            legalName: "",
            pan: "",
            gstin: "29ABCDE1234F1Z5",
            msmeType: "",
            msmeNo: "",
            openingBalance: 0,
            balanceType: "",
            creditLimit: 0,
            website: "",
            description: "",
            isActive: true,
            addresses: [],
            emails: [],
            phones: [],
            bankAccounts: [],
            gstDetails: [],
          }),
        /GSTIN already exists/i
      )

      await assert.rejects(
        () =>
          createContact(runtime.primary, adminUser, {
            code: "",
            contactTypeId: "contact-type:unregistered-customer-b2c",
            ledgerId: null,
            ledgerName: null,
            name: "Another Name",
            legalName: "",
            pan: "",
            gstin: "",
            msmeType: "",
            msmeNo: "",
            openingBalance: 0,
            balanceType: "",
            creditLimit: 0,
            website: "",
            description: "",
            isActive: true,
            addresses: [],
            emails: [],
            phones: [{ phoneNumber: "+91 90000 12345", phoneType: "mobile", isPrimary: true }],
            bankAccounts: [],
            gstDetails: [],
          }),
        /Mobile number already exists/i
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
