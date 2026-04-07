
import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import { billingTableNames } from "../../../billing/database/table-names.js"
import { coreTableNames } from "../../../core/database/table-names.js"
import type { CommonModuleItem, CommonModuleKey, Contact, Product } from "../../../core/shared/index.js"
import { listCommonModuleDefinitions, toCommonModuleMetadata } from "../../../core/src/common-modules/definitions.js"
import { asQueryDatabase } from "../../../core/src/data/query-database.js"
import { cxappTableNames } from "../../../cxapp/database/table-names.js"
import type { CustomerAccount } from "../../../ecommerce/shared/index.js"
import { ecommerceTableNames } from "../../../ecommerce/database/table-names.js"
import { frappeTableNames } from "../../../frappe/database/table-names.js"
import {
  ensureJsonStoreTable,
  listJsonStorePayloads,
  replaceJsonStoreRecords,
} from "../../../framework/src/runtime/database/index.js"

import {
  demoInstallJobPayloadSchema,
  demoInstallJobResponseSchema,
  demoInstallJobSchema,
  demoInstallResponseSchema,
  demoInstallPayloadSchema,
  demoSummaryResponseSchema,
  type DemoInstallJob,
  type DemoInstallJobPayload,
  type DemoInstallVariant,
  type DemoModuleMetric,
  type DemoModuleSummary,
  type DemoProfile,
  type DemoProfileId,
  type DemoSummaryResponse,
} from "../../shared/index.js"
import { demoProfiles } from "../data/demo-profiles.js"
import { buildDefaultDemoData, buildDemoProfileData, type DemoDataBundle } from "../data/demo-seed.js"

type DynamicDatabase = Record<string, Record<string, unknown>>
type CommonChoices = Record<CommonModuleKey, CommonModuleItem[]>
type ModuleCountRow = { id: string; label: string; currentCount: number }

const demoJobs = new Map<string, DemoInstallJob>()
let demoJobQueue = Promise.resolve()

function clone<T>(value: T): T {
  return structuredClone(value)
}

function getProfile(profileId: DemoProfileId): DemoProfile {
  return demoProfiles.find((profile) => profile.id === profileId) ?? demoProfiles[0]!
}

function getProfileBundle(profileId: DemoProfileId) {
  return profileId === "demo" ? buildDemoProfileData() : buildDefaultDemoData()
}

function toStoredValue(value: unknown) {
  if (typeof value === "boolean") {
    return value ? 1 : 0
  }

  return value ?? null
}

function createJsonStoreRow(record: {
  id: string
  moduleKey?: string | null
  sortOrder?: number
  payload: unknown
  createdAt?: string
  updatedAt?: string
}) {
  const timestamp = new Date().toISOString()

  return {
    id: record.id,
    module_key: record.moduleKey ?? null,
    sort_order: record.sortOrder ?? 0,
    payload: JSON.stringify(record.payload),
    created_at: record.createdAt ?? timestamp,
    updated_at: record.updatedAt ?? timestamp,
  }
}

async function countJsonRows(database: Kysely<unknown>, tableName: string) {
  const row = await asQueryDatabase(database)
    .selectFrom(tableName)
    .select((expressionBuilder) => expressionBuilder.fn.countAll<number>().as("count"))
    .executeTakeFirst()

  return Number(row?.count ?? 0)
}

async function countPhysicalRows(database: Kysely<unknown>, tableName: string) {
  const row = await (database as Kysely<DynamicDatabase>)
    .selectFrom(tableName)
    .select((expressionBuilder) => expressionBuilder.fn.countAll<number>().as("count"))
    .executeTakeFirst()

  return Number(row?.count ?? 0)
}

async function countCommonModuleRows(database: Kysely<unknown>) {
  const definitions = listCommonModuleDefinitions()

  return Promise.all(
    definitions.map(async (definition) => ({
      id: definition.key,
      label: definition.label,
      currentCount: await countPhysicalRows(database, definition.tableName),
    }))
  )
}
function createProjectedModuleSummaries() {
  const defaultBundle = buildDefaultDemoData()
  const demoBundle = buildDemoProfileData()

  return {
    companies: {
      defaultCount: defaultBundle.companies.length,
      demoCount: demoBundle.companies.length,
    },
    common: {
      defaultCount: Object.values(defaultBundle.commonModuleItemsByKey).reduce((sum, items) => sum + items.length, 0),
      demoCount: Object.values(demoBundle.commonModuleItemsByKey).reduce((sum, items) => sum + items.length, 0),
      items: listCommonModuleDefinitions().map((definition) => ({
        id: definition.key,
        label: definition.label,
        defaultCount: defaultBundle.commonModuleItemsByKey[definition.key].length,
        demoCount: demoBundle.commonModuleItemsByKey[definition.key].length,
      })),
    },
    contacts: { defaultCount: defaultBundle.contacts.length, demoCount: demoBundle.contacts.length },
    products: { defaultCount: defaultBundle.products.length, demoCount: demoBundle.products.length },
    categories: {
      defaultCount: defaultBundle.commonModuleItemsByKey.productCategories.length,
      demoCount: demoBundle.commonModuleItemsByKey.productCategories.length,
    },
    customers: { defaultCount: defaultBundle.customerAccounts.length, demoCount: demoBundle.customerAccounts.length },
    orders: { defaultCount: defaultBundle.orders.length, demoCount: demoBundle.orders.length },
    billing: {
      defaultCount: defaultBundle.billing.categories.length + defaultBundle.billing.ledgers.length + defaultBundle.billing.voucherGroups.length + defaultBundle.billing.voucherTypes.length + defaultBundle.billing.vouchers.length,
      demoCount: demoBundle.billing.categories.length + demoBundle.billing.ledgers.length + demoBundle.billing.voucherGroups.length + demoBundle.billing.voucherTypes.length + demoBundle.billing.vouchers.length,
      items: [
        { id: "categories", label: "Categories", defaultCount: defaultBundle.billing.categories.length, demoCount: demoBundle.billing.categories.length },
        { id: "ledgers", label: "Ledgers", defaultCount: defaultBundle.billing.ledgers.length, demoCount: demoBundle.billing.ledgers.length },
        { id: "voucher-groups", label: "Voucher Groups", defaultCount: defaultBundle.billing.voucherGroups.length, demoCount: demoBundle.billing.voucherGroups.length },
        { id: "voucher-types", label: "Voucher Types", defaultCount: defaultBundle.billing.voucherTypes.length, demoCount: demoBundle.billing.voucherTypes.length },
        { id: "vouchers", label: "Vouchers", defaultCount: defaultBundle.billing.vouchers.length, demoCount: demoBundle.billing.vouchers.length },
      ],
    },
    frappe: {
      defaultCount: 1 + defaultBundle.frappe.todos.length + defaultBundle.frappe.items.length + defaultBundle.frappe.purchaseReceipts.length + defaultBundle.frappe.itemProductSyncLogs.length,
      demoCount: 1 + demoBundle.frappe.todos.length + demoBundle.frappe.items.length + demoBundle.frappe.purchaseReceipts.length + demoBundle.frappe.itemProductSyncLogs.length,
      items: [
        { id: "settings", label: "Settings", defaultCount: 1, demoCount: 1 },
        { id: "todos", label: "Todos", defaultCount: defaultBundle.frappe.todos.length, demoCount: demoBundle.frappe.todos.length },
        { id: "items", label: "Items", defaultCount: defaultBundle.frappe.items.length, demoCount: demoBundle.frappe.items.length },
        { id: "purchase-receipts", label: "Purchase Receipts", defaultCount: defaultBundle.frappe.purchaseReceipts.length, demoCount: demoBundle.frappe.purchaseReceipts.length },
        { id: "sync-logs", label: "Sync Logs", defaultCount: defaultBundle.frappe.itemProductSyncLogs.length, demoCount: demoBundle.frappe.itemProductSyncLogs.length },
      ],
    },
  }
}

const projectedSummaries = createProjectedModuleSummaries()

function attachProjectedItems(items: ModuleCountRow[], projectedItems: Array<{ id: string; label: string; defaultCount: number; demoCount: number }>): DemoModuleMetric[] {
  return projectedItems.map((projectedItem) => ({
    id: projectedItem.id,
    label: projectedItem.label,
    currentCount: items.find((item) => item.id === projectedItem.id)?.currentCount ?? 0,
    defaultCount: projectedItem.defaultCount,
    demoCount: projectedItem.demoCount,
  }))
}

async function buildCurrentModuleMetrics(database: Kysely<unknown>) {
  const commonItems = await countCommonModuleRows(database)
  const billingItems: ModuleCountRow[] = [
    { id: "categories", label: "Categories", currentCount: await countJsonRows(database, billingTableNames.categories) },
    { id: "ledgers", label: "Ledgers", currentCount: await countJsonRows(database, billingTableNames.ledgers) },
    { id: "voucher-groups", label: "Voucher Groups", currentCount: await countJsonRows(database, billingTableNames.voucherGroups) },
    { id: "voucher-types", label: "Voucher Types", currentCount: await countJsonRows(database, billingTableNames.voucherTypes) },
    { id: "vouchers", label: "Vouchers", currentCount: await countJsonRows(database, billingTableNames.vouchers) },
  ]
  const frappeItems: ModuleCountRow[] = [
    { id: "settings", label: "Settings", currentCount: await countJsonRows(database, frappeTableNames.settings) },
    { id: "todos", label: "Todos", currentCount: await countJsonRows(database, frappeTableNames.todos) },
    { id: "items", label: "Items", currentCount: await countJsonRows(database, frappeTableNames.items) },
    { id: "purchase-receipts", label: "Purchase Receipts", currentCount: await countJsonRows(database, frappeTableNames.purchaseReceipts) },
    { id: "sync-logs", label: "Sync Logs", currentCount: await countJsonRows(database, frappeTableNames.itemProductSyncLogs) },
  ]

  return {
    companies: await countJsonRows(database, cxappTableNames.companies),
    common: commonItems.reduce((sum, item) => sum + item.currentCount, 0),
    commonItems,
    contacts: await countJsonRows(database, coreTableNames.contacts),
    products: await countJsonRows(database, coreTableNames.products),
    categories: commonItems.find((item) => item.id === "productCategories")?.currentCount ?? 0,
    customers: await countJsonRows(database, ecommerceTableNames.customerAccounts),
    orders: await countJsonRows(database, ecommerceTableNames.orders),
    billing: billingItems.reduce((sum, item) => sum + item.currentCount, 0),
    billingItems,
    frappe: frappeItems.reduce((sum, item) => sum + item.currentCount, 0),
    frappeItems,
  }
}

function toModuleSummaries(current: Awaited<ReturnType<typeof buildCurrentModuleMetrics>>): DemoModuleSummary[] {
  return [
    { id: "companies", name: "Companies", summary: "Suite company records in cxapp for shell branding, operator setup, and tenant walkthroughs.", currentCount: current.companies, defaultCount: projectedSummaries.companies.defaultCount, demoCount: projectedSummaries.companies.demoCount, supportsDemo: projectedSummaries.companies.demoCount !== projectedSummaries.companies.defaultCount, items: [] },
    { id: "common", name: "Common", summary: "Shared common-module masters from core used by contacts, products, billing, and storefront discovery.", currentCount: current.common, defaultCount: projectedSummaries.common.defaultCount, demoCount: projectedSummaries.common.demoCount, supportsDemo: projectedSummaries.common.demoCount !== projectedSummaries.common.defaultCount, items: attachProjectedItems(current.commonItems, projectedSummaries.common.items) },
    { id: "contacts", name: "Contacts", summary: "Shared contact masters for customers, suppliers, logistics partners, and demo stakeholders.", currentCount: current.contacts, defaultCount: projectedSummaries.contacts.defaultCount, demoCount: projectedSummaries.contacts.demoCount, supportsDemo: projectedSummaries.contacts.demoCount !== projectedSummaries.contacts.defaultCount, items: [] },
    { id: "products", name: "Products", summary: "Shared core products reused by ecommerce, billing references, and future showcase apps.", currentCount: current.products, defaultCount: projectedSummaries.products.defaultCount, demoCount: projectedSummaries.products.demoCount, supportsDemo: projectedSummaries.products.demoCount !== projectedSummaries.products.defaultCount, items: [] },
    { id: "categories", name: "Categories", summary: "Storefront-facing product categories and top-menu masters coming from core common modules.", currentCount: current.categories, defaultCount: projectedSummaries.categories.defaultCount, demoCount: projectedSummaries.categories.demoCount, supportsDemo: projectedSummaries.categories.demoCount !== projectedSummaries.categories.defaultCount, items: [] },
    { id: "customers", name: "Customers", summary: "Ecommerce-owned customer account records linked to core contacts for demo storefront journeys.", currentCount: current.customers, defaultCount: projectedSummaries.customers.defaultCount, demoCount: projectedSummaries.customers.demoCount, supportsDemo: projectedSummaries.customers.demoCount !== projectedSummaries.customers.defaultCount, items: [] },
    { id: "orders", name: "Orders", summary: "Ecommerce-owned storefront orders used to demonstrate tracking, status timelines, and customer history.", currentCount: current.orders, defaultCount: projectedSummaries.orders.defaultCount, demoCount: projectedSummaries.orders.demoCount, supportsDemo: projectedSummaries.orders.demoCount !== projectedSummaries.orders.defaultCount, items: [] },
    { id: "billing", name: "Billing", summary: "Accounting masters and vouchers reused for ledger, voucher, and report walkthroughs.", currentCount: current.billing, defaultCount: projectedSummaries.billing.defaultCount, demoCount: projectedSummaries.billing.demoCount, supportsDemo: false, items: attachProjectedItems(current.billingItems, projectedSummaries.billing.items) },
    { id: "frappe", name: "Frappe", summary: "ERP connector sample settings, todos, items, receipts, and sync logs for integration demos.", currentCount: current.frappe, defaultCount: projectedSummaries.frappe.defaultCount, demoCount: projectedSummaries.frappe.demoCount, supportsDemo: false, items: attachProjectedItems(current.frappeItems, projectedSummaries.frappe.items) },
  ]
}
async function ensureInstallerTables(database: Kysely<unknown>) {
  await Promise.all([
    ensureJsonStoreTable(database, cxappTableNames.bootstrapSnapshots),
    ensureJsonStoreTable(database, cxappTableNames.companies),
    ensureJsonStoreTable(database, coreTableNames.commonModuleMetadata),
    ensureJsonStoreTable(database, coreTableNames.commonModuleItems),
    ensureJsonStoreTable(database, coreTableNames.contacts),
    ensureJsonStoreTable(database, coreTableNames.products),
    ensureJsonStoreTable(database, ecommerceTableNames.storefrontSettings),
    ensureJsonStoreTable(database, ecommerceTableNames.customerAccounts),
    ensureJsonStoreTable(database, ecommerceTableNames.orders),
    ensureJsonStoreTable(database, billingTableNames.categories),
    ensureJsonStoreTable(database, billingTableNames.ledgers),
    ensureJsonStoreTable(database, billingTableNames.voucherGroups),
    ensureJsonStoreTable(database, billingTableNames.voucherTypes),
    ensureJsonStoreTable(database, billingTableNames.vouchers),
    ensureJsonStoreTable(database, frappeTableNames.settings),
    ensureJsonStoreTable(database, frappeTableNames.todos),
    ensureJsonStoreTable(database, frappeTableNames.items),
    ensureJsonStoreTable(database, frappeTableNames.purchaseReceipts),
    ensureJsonStoreTable(database, frappeTableNames.itemProductSyncLogs),
  ])
}

async function writeCommonModuleTables(database: Kysely<unknown>, bundle: DemoDataBundle) {
  const queryDatabase = asQueryDatabase(database)
  const definitions = listCommonModuleDefinitions()

  for (const definition of [...definitions].reverse()) {
    await queryDatabase.deleteFrom(definition.tableName).execute()
  }

  for (const definition of definitions) {
    const items = bundle.commonModuleItemsByKey[definition.key]

    if (items.length === 0) {
      continue
    }

    await queryDatabase.insertInto(definition.tableName).values(
      items.map((item) => {
        const row: Record<string, unknown> = {
          id: item.id,
          is_active: item.isActive ? 1 : 0,
          created_at: item.createdAt,
          updated_at: item.updatedAt,
        }

        for (const column of definition.columns) {
          row[column.key] = toStoredValue((item as Record<string, unknown>)[column.key])
        }

        return row
      })
    ).execute()
  }
}

async function installBundle(database: Kysely<unknown>, bundle: DemoDataBundle) {
  await ensureInstallerTables(database)

  await replaceJsonStoreRecords(database, cxappTableNames.bootstrapSnapshots, bundle.bootstrapSnapshots.map((item, index) => ({ id: `bootstrap-snapshot:${index + 1}`, moduleKey: "bootstrap-snapshot", sortOrder: index + 1, payload: item })))
  await replaceJsonStoreRecords(database, cxappTableNames.companies, bundle.companies.map((item, index) => ({ id: item.id, moduleKey: "companies", sortOrder: index + 1, payload: item, createdAt: item.createdAt, updatedAt: item.updatedAt })))

  const commonModuleMetadata = listCommonModuleDefinitions().map((definition) => toCommonModuleMetadata(definition))
  await replaceJsonStoreRecords(database, coreTableNames.commonModuleMetadata, commonModuleMetadata.map((item, index) => ({ id: item.key, moduleKey: item.key, sortOrder: index + 1, payload: item })))
  await replaceJsonStoreRecords(database, coreTableNames.commonModuleItems, Object.entries(bundle.commonModuleItemsByKey).flatMap(([moduleKey, items]) => items.map((item, index) => ({ id: `${moduleKey}:${item.id}`, moduleKey, sortOrder: index + 1, payload: item, createdAt: item.createdAt, updatedAt: item.updatedAt }))))
  await writeCommonModuleTables(database, bundle)

  await replaceJsonStoreRecords(database, coreTableNames.contacts, bundle.contacts.map((item, index) => ({ id: item.id, moduleKey: "contacts", sortOrder: index + 1, payload: item, createdAt: item.createdAt, updatedAt: item.updatedAt })))
  await replaceJsonStoreRecords(database, coreTableNames.products, bundle.products.map((item, index) => ({ id: item.id, moduleKey: "products", sortOrder: index + 1, payload: item, createdAt: item.createdAt, updatedAt: item.updatedAt })))
  await replaceJsonStoreRecords(database, ecommerceTableNames.storefrontSettings, [{ id: bundle.storefrontSettings.id, moduleKey: "storefront-settings", sortOrder: 1, payload: bundle.storefrontSettings, createdAt: bundle.storefrontSettings.createdAt, updatedAt: bundle.storefrontSettings.updatedAt }])
  await replaceJsonStoreRecords(database, ecommerceTableNames.customerAccounts, bundle.customerAccounts.map((item, index) => ({ id: item.id, moduleKey: "customer-account", sortOrder: index + 1, payload: item, createdAt: item.createdAt, updatedAt: item.updatedAt })))
  await replaceJsonStoreRecords(database, ecommerceTableNames.orders, bundle.orders.map((item, index) => ({ id: item.id, moduleKey: "storefront-order", sortOrder: index + 1, payload: item, createdAt: item.createdAt, updatedAt: item.updatedAt })))

  await replaceJsonStoreRecords(database, billingTableNames.categories, bundle.billing.categories.map((item, index) => ({ id: item.id, moduleKey: "billing-category", sortOrder: index + 1, payload: item })))
  await replaceJsonStoreRecords(database, billingTableNames.ledgers, bundle.billing.ledgers.map((item, index) => ({ id: item.id, moduleKey: "billing-ledger", sortOrder: index + 1, payload: item })))
  await replaceJsonStoreRecords(database, billingTableNames.voucherGroups, bundle.billing.voucherGroups.map((item, index) => ({ id: item.id, moduleKey: "billing-voucher-group", sortOrder: index + 1, payload: item })))
  await replaceJsonStoreRecords(database, billingTableNames.voucherTypes, bundle.billing.voucherTypes.map((item, index) => ({ id: item.id, moduleKey: "billing-voucher-type", sortOrder: index + 1, payload: item })))
  await replaceJsonStoreRecords(database, billingTableNames.vouchers, bundle.billing.vouchers.map((item, index) => ({ id: item.id, moduleKey: "billing-voucher", sortOrder: index + 1, payload: item, createdAt: item.createdAt, updatedAt: item.updatedAt })))

  await replaceJsonStoreRecords(database, frappeTableNames.settings, [{ id: "frappe-settings", moduleKey: "frappe-settings", sortOrder: 1, payload: bundle.frappe.settings }])
  await replaceJsonStoreRecords(database, frappeTableNames.todos, bundle.frappe.todos.map((item, index) => ({ id: item.id, moduleKey: "frappe-todo", sortOrder: index + 1, payload: item })))
  await replaceJsonStoreRecords(database, frappeTableNames.items, bundle.frappe.items.map((item, index) => ({ id: item.id, moduleKey: "frappe-item", sortOrder: index + 1, payload: item })))
  await replaceJsonStoreRecords(database, frappeTableNames.purchaseReceipts, bundle.frappe.purchaseReceipts.map((item, index) => ({ id: item.id, moduleKey: "frappe-purchase-receipt", sortOrder: index + 1, payload: item })))
  await replaceJsonStoreRecords(database, frappeTableNames.itemProductSyncLogs, bundle.frappe.itemProductSyncLogs.map((item, index) => ({ id: item.id, moduleKey: "frappe-item-sync-log", sortOrder: index + 1, payload: item })))
}

function putJob(job: DemoInstallJob) {
  demoJobs.set(job.id, demoInstallJobSchema.parse(job))
}

function updateJob(jobId: string, updater: (job: DemoInstallJob) => DemoInstallJob) {
  const current = demoJobs.get(jobId)
  if (!current) return
  putJob(updater(current))
}

function setJobProgress(jobId: string, processed: number, total: number, message: string) {
  updateJob(jobId, (job) => ({ ...job, status: "running", processed, total, percent: total === 0 ? 0 : Math.min(100, Math.round((processed / total) * 100)), message }))
}

function completeJob(jobId: string, message: string, summary: DemoSummaryResponse) {
  updateJob(jobId, (job) => ({ ...job, status: "completed", processed: job.total, percent: 100, message, finishedAt: new Date().toISOString(), summary }))
}

function failJob(jobId: string, message: string) {
  updateJob(jobId, (job) => ({ ...job, status: "failed", message, finishedAt: new Date().toISOString() }))
}

function chooseItem<T>(items: T[], index: number, fallback: T | null = null) {
  if (items.length === 0) return fallback
  return items[index % items.length] ?? fallback
}

function nextNumber(values: string[], prefix: string) {
  const matcher = new RegExp(`^${prefix}-(\\d+)$`, "i")
  return values.reduce((maxValue, value) => Math.max(maxValue, Number(matcher.exec(value)?.[1] ?? 0)), 0) + 1
}

function buildJsonStoreSeedRecords<T extends { id: string; createdAt?: string; updatedAt?: string }>(
  moduleKey: string,
  items: T[]
) {
  return items.map((item, index) => ({
    id: item.id,
    moduleKey,
    sortOrder: index + 1,
    payload: item,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }))
}

async function loadCommonChoices(database: Kysely<unknown>) {
  const entries = await Promise.all(
    listCommonModuleDefinitions().map(async (definition) => [
      definition.key,
      await listJsonStorePayloads<CommonModuleItem>(
        database,
        coreTableNames.commonModuleItems,
        definition.key
      ),
    ])
  )

  return Object.fromEntries(entries) as CommonChoices
}

async function writeAllCommonModuleItems(
  database: Kysely<unknown>,
  itemsByKey: CommonChoices
) {
  const records = listCommonModuleDefinitions().flatMap((definition) =>
    (itemsByKey[definition.key] ?? []).map((item, index) => ({
      id: `${definition.key}:${item.id}`,
      moduleKey: definition.key,
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )

  await replaceJsonStoreRecords(database, coreTableNames.commonModuleItems, records)
}

async function insertCommonModuleItem(
  database: Kysely<unknown>,
  moduleKey: CommonModuleKey,
  item: CommonModuleItem
) {
  const definition = listCommonModuleDefinitions().find(
    (candidate) => candidate.key === moduleKey
  )

  if (!definition) {
    throw new Error(`Unknown common module key: ${moduleKey}`)
  }

  const row: Record<string, unknown> = {
    id: item.id,
    is_active: item.isActive ? 1 : 0,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  }

  for (const column of definition.columns) {
    row[column.key] = toStoredValue((item as Record<string, unknown>)[column.key])
  }

  await asQueryDatabase(database).insertInto(definition.tableName).values(row).execute()
}

function buildContactRecord(
  template: Contact,
  variant: "customer" | "supplier",
  index: number
) {
  const timestamp = new Date().toISOString()
  const name = `${variant}-${index}`
  const email = `${name}@demo.local`
  const phoneNumber = `+91 90000${String(index).padStart(5, "0")}`

  return {
    ...clone(template),
    id: `contact:${name}`,
    uuid: randomUUID(),
    code: `${variant === "customer" ? "CUS" : "SUP"}-${String(index).padStart(4, "0")}`,
    contactTypeId:
      variant === "customer"
        ? "contact-type:unregistered-customer-b2c"
        : "contact-type:supplier",
    name,
    legalName: name,
    description: `Demo ${variant} generated by the installer.`,
    primaryEmail: email,
    primaryPhone: phoneNumber,
    createdAt: timestamp,
    updatedAt: timestamp,
    addresses: (template.addresses.length > 0 ? template.addresses : []).map((address, addressIndex) => ({
      ...clone(address),
      id: `contact-address:${name}:${addressIndex + 1}`,
      contactId: `contact:${name}`,
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
    emails: [
      {
        id: `contact-email:${name}:1`,
        contactId: `contact:${name}`,
        email,
        emailType: "primary",
        isPrimary: true,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    phones: [
      {
        id: `contact-phone:${name}:1`,
        contactId: `contact:${name}`,
        phoneNumber,
        phoneType: "primary",
        isPrimary: true,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    bankAccounts: [],
    gstDetails: [],
  } satisfies Contact
}

function buildCustomerAccountRecord(contact: Contact, index: number): CustomerAccount {
  const timestamp = new Date().toISOString()
  const name = `customer-${index}`

  return {
    id: `ecommerce-customer:${name}`,
    authUserId: null,
    coreContactId: contact.id,
    email: contact.primaryEmail ?? `${name}@demo.local`,
    phoneNumber: contact.primaryPhone ?? `+91 90000${String(index).padStart(5, "0")}`,
    displayName: contact.name,
    companyName: null,
    gstin: null,
    isActive: true,
    lifecycleState: "active",
    lifecycleNote: null,
    blockedAt: null,
    deletedAt: null,
    anonymizedAt: null,
    lastLoginAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function buildProductRecord(
  template: Product,
  choices: CommonChoices,
  index: number
) {
  const timestamp = new Date().toISOString()
  const name = `product-${index}`
  const category = chooseItem(choices.productCategories, index)
  const brand = chooseItem(choices.brands, index)
  const productGroup = chooseItem(choices.productGroups, index)
  const productType = chooseItem(choices.productTypes, index)
  const unit = chooseItem(choices.units, index)
  const hsnCode = chooseItem(choices.hsnCodes, index)
  const style = chooseItem(choices.styles, index)
  const tax = chooseItem(choices.taxes, index)

  return {
    ...clone(template),
    id: `product:${name}`,
    uuid: randomUUID(),
    code: `PRD-${String(index).padStart(4, "0")}`,
    name,
    slug: name,
    description: `Demo catalog product ${index} generated for storefront development and QA.`,
    shortDescription: `Demo catalog product ${index}.`,
    brandId: brand?.id ?? null,
    brandName: typeof brand?.name === "string" ? brand.name : null,
    categoryId: category?.id ?? null,
    categoryName: typeof category?.name === "string" ? category.name : null,
    productGroupId: productGroup?.id ?? null,
    productGroupName: typeof productGroup?.name === "string" ? productGroup.name : null,
    productTypeId: productType?.id ?? null,
    productTypeName: typeof productType?.name === "string" ? productType.name : null,
    unitId: unit?.id ?? null,
    hsnCodeId: hsnCode?.id ?? null,
    styleId: style?.id ?? null,
    sku: `SKU-${String(index).padStart(6, "0")}`,
    hasVariants: false,
    basePrice: 499 + index * 25,
    costPrice: 300 + index * 15,
    taxId: tax?.id ?? null,
    isFeatured: index % 3 === 0,
    isActive: true,
    storefrontDepartment: chooseItem(["women", "men", "kids", "accessories"] as const, index) ?? null,
    homeSliderEnabled: false,
    promoSliderEnabled: false,
    featureSectionEnabled: false,
    isNewArrival: index % 2 === 0,
    isBestSeller: index % 4 === 0,
    isFeaturedLabel: index % 3 === 0,
    primaryImageUrl: `https://placehold.co/520x640/f4ebe1/3b2a20?text=${encodeURIComponent(name)}`,
    variantCount: 0,
    tagCount: 0,
    tagNames: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    images: [
      {
        id: `product-image:${name}:1`,
        productId: `product:${name}`,
        imageUrl: `https://placehold.co/520x640/f4ebe1/3b2a20?text=${encodeURIComponent(name)}`,
        isPrimary: true,
        sortOrder: 1,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    variants: [],
    prices: [],
    discounts: [],
    offers: [],
    attributes: [],
    attributeValues: [],
    variantMap: [],
    stockItems: [],
    stockMovements: [],
    seo: null,
    storefront: null,
    tags: [],
    reviews: [],
  } satisfies Product
}

function buildCategoryRecord(index: number) {
  const timestamp = new Date().toISOString()
  const name = `category-${index}`

  return {
    id: `product-category:${name}`,
    code: name,
    name,
    description: `Demo storefront category ${index}.`,
    image: `https://placehold.co/320x220/f4ebe1/3b2a20?text=${encodeURIComponent(name)}`,
    position_order: index * 10,
    show_on_storefront_top_menu: true,
    show_on_storefront_catalog: true,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies CommonModuleItem
}

async function installContactsByType(
  database: Kysely<unknown>,
  variant: "customer" | "supplier",
  count: number,
  jobId: string
) {
  const existingContacts = await listJsonStorePayloads<Contact>(database, coreTableNames.contacts)
  const template = clone(existingContacts[0] ?? buildDefaultDemoData().contacts[0]!)
  const nextIndex = nextNumber(existingContacts.map((item) => item.name.toLowerCase()), variant)
  const records = [...existingContacts]

  for (let offset = 0; offset < count; offset += 1) {
    const contact = buildContactRecord(template, variant, nextIndex + offset)
    records.push(contact)
    await replaceJsonStoreRecords(
      database,
      coreTableNames.contacts,
      buildJsonStoreSeedRecords("contacts", records)
    )
    setJobProgress(jobId, offset + 1, count, `Installed ${contact.name}.`)
  }
}

async function installPortalCustomers(
  database: Kysely<unknown>,
  count: number,
  jobId: string
) {
  const existingContacts = await listJsonStorePayloads<Contact>(database, coreTableNames.contacts)
  const existingCustomers = await listJsonStorePayloads<CustomerAccount>(
    database,
    ecommerceTableNames.customerAccounts
  )
  const template = clone(existingContacts[0] ?? buildDefaultDemoData().contacts[0]!)
  const nextIndex = nextNumber(
    existingContacts.map((item) => item.name.toLowerCase()),
    "customer"
  )
  const contactRecords = [...existingContacts]
  const customerRecords = [...existingCustomers]

  for (let offset = 0; offset < count; offset += 1) {
    const contact = buildContactRecord(template, "customer", nextIndex + offset)
    const customerAccount = buildCustomerAccountRecord(contact, nextIndex + offset)
    contactRecords.push(contact)
    customerRecords.push(customerAccount)

    await replaceJsonStoreRecords(
      database,
      coreTableNames.contacts,
      buildJsonStoreSeedRecords("contacts", contactRecords)
    )
    await replaceJsonStoreRecords(
      database,
      ecommerceTableNames.customerAccounts,
      buildJsonStoreSeedRecords("customer-account", customerRecords)
    )
    setJobProgress(jobId, offset + 1, count, `Installed ${customerAccount.displayName}.`)
  }
}

async function installCatalogProducts(
  database: Kysely<unknown>,
  count: number,
  jobId: string
) {
  const choices = await loadCommonChoices(database)
  const existingProducts = await listJsonStorePayloads<Product>(database, coreTableNames.products)
  const template = clone(existingProducts[0] ?? buildDefaultDemoData().products[0]!)
  const nextIndex = nextNumber(existingProducts.map((item) => item.name.toLowerCase()), "product")
  const records = [...existingProducts]

  for (let offset = 0; offset < count; offset += 1) {
    const product = buildProductRecord(template, choices, nextIndex + offset)
    records.push(product)
    await replaceJsonStoreRecords(
      database,
      coreTableNames.products,
      buildJsonStoreSeedRecords("products", records)
    )
    setJobProgress(jobId, offset + 1, count, `Installed ${product.name}.`)
  }
}

async function installStorefrontCategories(
  database: Kysely<unknown>,
  count: number,
  jobId: string
) {
  const allItems = await loadCommonChoices(database)
  const existingCategories = [...(allItems.productCategories ?? [])]
  const nextIndex = nextNumber(
    existingCategories.map((item) => String(item.name ?? "").toLowerCase()),
    "category"
  )

  for (let offset = 0; offset < count; offset += 1) {
    const category = buildCategoryRecord(nextIndex + offset)
    existingCategories.push(category)
    allItems.productCategories = existingCategories
    await writeAllCommonModuleItems(database, allItems)
    await insertCommonModuleItem(database, "productCategories", category)
    setJobProgress(jobId, offset + 1, count, `Installed ${category.name}.`)
  }
}

async function runInstallJob(database: Kysely<unknown>, jobId: string, payload: DemoInstallJobPayload) {
  try {
    if (payload.target === "profile") {
      const profileId = payload.variant === "demo" ? "demo" : "default"
      const bundle = getProfileBundle(profileId)
      setJobProgress(jobId, 0, 1, `Installing ${profileId} profile.`)
      await database.transaction().execute(async (transaction) => {
        await installBundle(transaction, bundle)
      })
      completeJob(jobId, `Installed ${profileId} profile.`, await getDemoSummary(database))
      return
    }

    await database.transaction().execute(async (transaction) => {
      switch (payload.target) {
        case "contacts":
          await installContactsByType(
            transaction,
            payload.variant === "supplier" ? "supplier" : "customer",
            payload.count,
            jobId
          )
          break
        case "customers":
          await installPortalCustomers(transaction, payload.count, jobId)
          break
        case "products":
          await installCatalogProducts(transaction, payload.count, jobId)
          break
        case "categories":
          await installStorefrontCategories(transaction, payload.count, jobId)
          break
        default:
          throw new Error(`Unsupported install target: ${payload.target}`)
      }
    })

    completeJob(jobId, "Installer completed successfully.", await getDemoSummary(database))
  } catch (error) {
    failJob(jobId, error instanceof Error ? error.message : "Demo install failed.")
  }
}

export async function listDemoProfiles() {
  return clone(demoProfiles)
}

export async function getDemoSummary(database: Kysely<unknown>) {
  const current = await buildCurrentModuleMetrics(database)

  return demoSummaryResponseSchema.parse({
    generatedAt: new Date().toISOString(),
    profiles: clone(demoProfiles),
    modules: toModuleSummaries(current),
  })
}

export async function installDemoProfile(
  database: Kysely<unknown>,
  payload: unknown
) {
  const parsedPayload = demoInstallPayloadSchema.parse(payload)
  const profile = getProfile(parsedPayload.profileId)

  await database.transaction().execute(async (transaction) => {
    await installBundle(transaction, getProfileBundle(profile.id))
  })

  return demoInstallResponseSchema.parse({
    installedAt: new Date().toISOString(),
    profile,
    summary: await getDemoSummary(database),
  })
}

export async function startDemoInstallJob(
  database: Kysely<unknown>,
  payload: unknown
) {
  const parsedPayload = demoInstallJobPayloadSchema.parse(payload)
  const jobId = randomUUID()
  const job: DemoInstallJob = {
    id: jobId,
    target: parsedPayload.target,
    variant: parsedPayload.variant,
    count: parsedPayload.count,
    total: parsedPayload.target === "profile" ? 1 : parsedPayload.count,
    processed: 0,
    percent: 0,
    status: "queued",
    message: "Queued for installation.",
    startedAt: new Date().toISOString(),
    finishedAt: null,
    summary: null,
  }

  putJob(job)
  demoJobQueue = demoJobQueue
    .catch(() => undefined)
    .then(() => runInstallJob(database, jobId, parsedPayload))

  return demoInstallJobResponseSchema.parse({ item: demoJobs.get(jobId) })
}

export async function getDemoInstallJob(jobId: string) {
  const job = demoJobs.get(jobId)

  if (!job) {
    throw new Error("Demo install job not found.")
  }

  return demoInstallJobResponseSchema.parse({ item: job })
}
