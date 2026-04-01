import type {
  Contact,
  ContactAddress,
  ContactAddressInput,
  ContactBankAccount,
  ContactBankAccountInput,
  ContactEmail,
  ContactEmailInput,
  ContactGstDetail,
  ContactGstDetailInput,
  ContactPhone,
  ContactPhoneInput,
  ContactSummary,
  ContactUpsertPayload,
} from '@shared/index'
import type { RowDataPacket } from 'mysql2'
import { randomUUID } from 'node:crypto'
import { ensureDatabaseSchema } from '@framework-core/runtime/database/database'
import { db } from '@framework-core/runtime/database/orm'
import { contactTableNames } from '@framework-core/runtime/database/table-names'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'

interface ContactSummaryRow extends RowDataPacket {
  id: string
  uuid: string
  contact_type_id: string
  name: string
  legal_name: string | null
  pan: string | null
  gstin: string | null
  msme_type: string | null
  msme_no: string | null
  opening_balance: number | string
  balance_type: string | null
  credit_limit: number | string
  website: string | null
  description: string | null
  primary_email: string | null
  primary_phone: string | null
  is_active: number
  created_at: Date
  updated_at: Date
}

type ContactRow = ContactSummaryRow
interface ContactAddressRow extends RowDataPacket { id:string; contact_id:string; address_type:string; address_line1:string; address_line2:string|null; city_id:string|null; state_id:string|null; country_id:string|null; pincode_id:string|null; latitude:number|string|null; longitude:number|string|null; is_default:number; is_active:number; created_at:Date; updated_at:Date }
interface ContactEmailRow extends RowDataPacket { id:string; contact_id:string; email:string; email_type:string; is_primary:number; is_active:number; created_at:Date; updated_at:Date }
interface ContactPhoneRow extends RowDataPacket { id:string; contact_id:string; phone_number:string; phone_type:string; is_primary:number; is_active:number; created_at:Date; updated_at:Date }
interface ContactBankAccountRow extends RowDataPacket { id:string; contact_id:string; bank_name:string; account_number:string; account_holder_name:string; ifsc:string; branch:string|null; is_primary:number; is_active:number; created_at:Date; updated_at:Date }
interface ContactGstDetailRow extends RowDataPacket { id:string; contact_id:string; gstin:string; state:string; is_default:number; is_active:number; created_at:Date; updated_at:Date }

const asDate = (value: Date) => value.toISOString()
const asDateOnly = (value: number | string) => Number(value)

function toSummary(row: ContactSummaryRow): ContactSummary {
  return {
    id: row.id,
    uuid: row.uuid,
    contactTypeId: row.contact_type_id,
    name: row.name,
    legalName: row.legal_name,
    pan: row.pan,
    gstin: row.gstin,
    msmeType: row.msme_type,
    msmeNo: row.msme_no,
    openingBalance: asDateOnly(row.opening_balance),
    balanceType: row.balance_type,
    creditLimit: asDateOnly(row.credit_limit),
    website: row.website,
    description: row.description,
    primaryEmail: row.primary_email,
    primaryPhone: row.primary_phone,
    isActive: Boolean(row.is_active),
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
  }
}

const toAddress = (row: ContactAddressRow): ContactAddress => ({ id: row.id, contactId: row.contact_id, addressType: row.address_type, addressLine1: row.address_line1, addressLine2: row.address_line2, cityId: row.city_id, stateId: row.state_id, countryId: row.country_id, pincodeId: row.pincode_id, latitude: row.latitude == null ? null : Number(row.latitude), longitude: row.longitude == null ? null : Number(row.longitude), isDefault: Boolean(row.is_default), isActive: Boolean(row.is_active), createdAt: asDate(row.created_at), updatedAt: asDate(row.updated_at) })
const toEmail = (row: ContactEmailRow): ContactEmail => ({ id: row.id, contactId: row.contact_id, email: row.email, emailType: row.email_type, isPrimary: Boolean(row.is_primary), isActive: Boolean(row.is_active), createdAt: asDate(row.created_at), updatedAt: asDate(row.updated_at) })
const toPhone = (row: ContactPhoneRow): ContactPhone => ({ id: row.id, contactId: row.contact_id, phoneNumber: row.phone_number, phoneType: row.phone_type, isPrimary: Boolean(row.is_primary), isActive: Boolean(row.is_active), createdAt: asDate(row.created_at), updatedAt: asDate(row.updated_at) })
const toBank = (row: ContactBankAccountRow): ContactBankAccount => ({ id: row.id, contactId: row.contact_id, bankName: row.bank_name, accountNumber: row.account_number, accountHolderName: row.account_holder_name, ifsc: row.ifsc, branch: row.branch, isPrimary: Boolean(row.is_primary), isActive: Boolean(row.is_active), createdAt: asDate(row.created_at), updatedAt: asDate(row.updated_at) })
const toGst = (row: ContactGstDetailRow): ContactGstDetail => ({ id: row.id, contactId: row.contact_id, gstin: row.gstin, state: row.state, isDefault: Boolean(row.is_default), isActive: Boolean(row.is_active), createdAt: asDate(row.created_at), updatedAt: asDate(row.updated_at) })

async function replaceRows(
  execute: (sql: string, params?: (string | number | boolean | null)[]) => Promise<unknown>,
  table: string,
  contactId: string,
  columns: string[],
  rows: Array<Record<string, string | number | boolean | null>>,
) {
  await execute(`UPDATE ${table} SET is_active = 0 WHERE contact_id = ? AND is_active = 1`, [contactId])

  for (const row of rows) {
    const insertColumns = ['id', 'contact_id', ...columns]
    await execute(
      `INSERT INTO ${table} (${insertColumns.join(', ')}) VALUES (${insertColumns.map(() => '?').join(', ')})`,
      [randomUUID(), contactId, ...columns.map((column) => row[column] ?? null)],
    )
  }
}

export class ContactRepository {
  async list() {
    await ensureDatabaseSchema()
    const rows = await db.query<ContactSummaryRow>(`
      SELECT
        c.*,
        (SELECT email FROM ${contactTableNames.emails} ce WHERE ce.contact_id = c.id AND ce.is_active = 1 ORDER BY ce.is_primary DESC, ce.created_at ASC LIMIT 1) AS primary_email,
        (SELECT phone_number FROM ${contactTableNames.phones} cp WHERE cp.contact_id = c.id AND cp.is_active = 1 ORDER BY cp.is_primary DESC, cp.created_at ASC LIMIT 1) AS primary_phone
      FROM ${contactTableNames.contacts} c
      ORDER BY c.created_at DESC
    `)
    return rows.map(toSummary)
  }

  async findById(id: string) {
    await ensureDatabaseSchema()
    const row = await db.first<ContactRow>(`
      SELECT
        c.*,
        (SELECT email FROM ${contactTableNames.emails} ce WHERE ce.contact_id = c.id AND ce.is_active = 1 ORDER BY ce.is_primary DESC, ce.created_at ASC LIMIT 1) AS primary_email,
        (SELECT phone_number FROM ${contactTableNames.phones} cp WHERE cp.contact_id = c.id AND cp.is_active = 1 ORDER BY cp.is_primary DESC, cp.created_at ASC LIMIT 1) AS primary_phone
      FROM ${contactTableNames.contacts} c
      WHERE c.id = ?
      LIMIT 1
    `, [id])
    if (!row) return null
    const [addresses, emails, phones, bankAccounts, gstDetails] = await Promise.all([
      db.query<ContactAddressRow>(`SELECT * FROM ${contactTableNames.addresses} WHERE contact_id = ? AND is_active = 1 ORDER BY is_default DESC, created_at ASC`, [id]),
      db.query<ContactEmailRow>(`SELECT * FROM ${contactTableNames.emails} WHERE contact_id = ? AND is_active = 1 ORDER BY is_primary DESC, created_at ASC`, [id]),
      db.query<ContactPhoneRow>(`SELECT * FROM ${contactTableNames.phones} WHERE contact_id = ? AND is_active = 1 ORDER BY is_primary DESC, created_at ASC`, [id]),
      db.query<ContactBankAccountRow>(`SELECT * FROM ${contactTableNames.bankAccounts} WHERE contact_id = ? AND is_active = 1 ORDER BY is_primary DESC, created_at ASC`, [id]),
      db.query<ContactGstDetailRow>(`SELECT * FROM ${contactTableNames.gstDetails} WHERE contact_id = ? AND is_active = 1 ORDER BY is_default DESC, created_at ASC`, [id]),
    ])
    return { ...toSummary(row), addresses: addresses.map(toAddress), emails: emails.map(toEmail), phones: phones.map(toPhone), bankAccounts: bankAccounts.map(toBank), gstDetails: gstDetails.map(toGst) } satisfies Contact
  }

  async create(payload: ContactUpsertPayload) {
    await ensureDatabaseSchema()
    const id = randomUUID()
    const uuid = randomUUID()
    await db.transaction(async (tx) => {
      await tx.execute(
        `INSERT INTO ${contactTableNames.contacts} (
          id, uuid, contact_type_id, name, legal_name, pan, gstin, msme_type, msme_no, opening_balance, balance_type, credit_limit, website, description, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, uuid, payload.contactTypeId, payload.name, payload.legalName, payload.pan, payload.gstin, payload.msmeType, payload.msmeNo, payload.openingBalance, payload.balanceType, payload.creditLimit, payload.website, payload.description, payload.isActive],
      )
      await this.replaceChildren(tx.execute.bind(tx), id, payload)
    })
    const item = await this.findById(id)
    if (!item) throw new ApplicationError('Expected created contact to be retrievable.', { id }, 500)
    return item
  }

  async update(id: string, payload: ContactUpsertPayload) {
    await ensureDatabaseSchema()
    await db.transaction(async (tx) => {
      const existing = await tx.first<RowDataPacket>(`SELECT id FROM ${contactTableNames.contacts} WHERE id = ? LIMIT 1`, [id])
      if (!existing) throw new ApplicationError('Contact not found.', { id }, 404)
      await tx.execute(
        `UPDATE ${contactTableNames.contacts} SET
          contact_type_id = ?, name = ?, legal_name = ?, pan = ?, gstin = ?, msme_type = ?, msme_no = ?, opening_balance = ?, balance_type = ?, credit_limit = ?, website = ?, description = ?, is_active = ?
         WHERE id = ?`,
        [payload.contactTypeId, payload.name, payload.legalName, payload.pan, payload.gstin, payload.msmeType, payload.msmeNo, payload.openingBalance, payload.balanceType, payload.creditLimit, payload.website, payload.description, payload.isActive, id],
      )
      await this.replaceChildren(tx.execute.bind(tx), id, payload)
    })
    const item = await this.findById(id)
    if (!item) throw new ApplicationError('Expected updated contact to be retrievable.', { id }, 500)
    return item
  }

  async setActiveState(id: string, isActive: boolean) {
    await ensureDatabaseSchema()
    const result = await db.execute(`UPDATE ${contactTableNames.contacts} SET is_active = ? WHERE id = ?`, [isActive, id])
    if (result.affectedRows === 0) throw new ApplicationError('Contact not found.', { id }, 404)
    const item = await this.findById(id)
    if (!item) throw new ApplicationError('Expected contact to be retrievable after state update.', { id }, 500)
    return item
  }

  private async replaceChildren(
    execute: (sql: string, params?: (string | number | boolean | null)[]) => Promise<unknown>,
    id: string,
    payload: ContactUpsertPayload,
  ) {
    await replaceRows(execute, contactTableNames.addresses, id, ['address_type', 'address_line1', 'address_line2', 'city_id', 'state_id', 'country_id', 'pincode_id', 'latitude', 'longitude', 'is_default'], payload.addresses.map((row: ContactAddressInput) => ({ address_type: row.addressType, address_line1: row.addressLine1, address_line2: row.addressLine2, city_id: row.cityId, state_id: row.stateId, country_id: row.countryId, pincode_id: row.pincodeId, latitude: row.latitude, longitude: row.longitude, is_default: row.isDefault })))
    await replaceRows(execute, contactTableNames.emails, id, ['email', 'email_type', 'is_primary'], payload.emails.map((row: ContactEmailInput) => ({ email: row.email, email_type: row.emailType, is_primary: row.isPrimary })))
    await replaceRows(execute, contactTableNames.phones, id, ['phone_number', 'phone_type', 'is_primary'], payload.phones.map((row: ContactPhoneInput) => ({ phone_number: row.phoneNumber, phone_type: row.phoneType, is_primary: row.isPrimary })))
    await replaceRows(execute, contactTableNames.bankAccounts, id, ['bank_name', 'account_number', 'account_holder_name', 'ifsc', 'branch', 'is_primary'], payload.bankAccounts.map((row: ContactBankAccountInput) => ({ bank_name: row.bankName, account_number: row.accountNumber, account_holder_name: row.accountHolderName, ifsc: row.ifsc, branch: row.branch, is_primary: row.isPrimary })))
    await replaceRows(execute, contactTableNames.gstDetails, id, ['gstin', 'state', 'is_default'], payload.gstDetails.map((row: ContactGstDetailInput) => ({ gstin: row.gstin, state: row.state, is_default: row.isDefault })))
  }
}
