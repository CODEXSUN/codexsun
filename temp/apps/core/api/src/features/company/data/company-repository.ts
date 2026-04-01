import type {
  Company,
  CompanyAddress,
  CompanyAddressInput,
  CompanyBankAccount,
  CompanyBankAccountInput,
  CompanyEmail,
  CompanyEmailInput,
  CompanyLogo,
  CompanyLogoInput,
  CompanyPhone,
  CompanyPhoneInput,
  CompanySummary,
  CompanyUpsertPayload,
} from '@shared/index'
import type { RowDataPacket } from 'mysql2'
import { randomUUID } from 'node:crypto'
import { ensureDatabaseSchema } from '@framework-core/runtime/database/database'
import { db } from '@framework-core/runtime/database/orm'
import { companyTableNames } from '@framework-core/runtime/database/table-names'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'

interface CompanySummaryRow extends RowDataPacket {
  id: string
  name: string
  legal_name: string | null
  tagline: string | null
  registration_number: string | null
  pan: string | null
  financial_year_start: Date | null
  books_start: Date | null
  website: string | null
  description: string | null
  facebook_url: string | null
  twitter_url: string | null
  instagram_url: string | null
  youtube_url: string | null
  primary_email: string | null
  primary_phone: string | null
  is_active: number
  created_at: Date
  updated_at: Date
}

type CompanyRow = CompanySummaryRow

interface CompanyLogoRow extends RowDataPacket {
  id: string
  company_id: string
  logo_url: string
  logo_type: string
  is_active: number
  created_at: Date
  updated_at: Date
}

interface CompanyAddressRow extends RowDataPacket {
  id: string
  company_id: string
  address_type: string
  address_line1: string
  address_line2: string | null
  city_id: string | null
  state_id: string | null
  country_id: string | null
  pincode_id: string | null
  latitude: number | string | null
  longitude: number | string | null
  is_default: number
  is_active: number
  created_at: Date
  updated_at: Date
}

interface CompanyEmailRow extends RowDataPacket {
  id: string
  company_id: string
  email: string
  email_type: string
  is_active: number
  created_at: Date
  updated_at: Date
}

interface CompanyPhoneRow extends RowDataPacket {
  id: string
  company_id: string
  phone_number: string
  phone_type: string
  is_primary: number
  is_active: number
  created_at: Date
  updated_at: Date
}

interface CompanyBankAccountRow extends RowDataPacket {
  id: string
  company_id: string
  bank_name: string
  account_number: string
  account_holder_name: string
  ifsc: string
  branch: string | null
  is_primary: number
  is_active: number
  created_at: Date
  updated_at: Date
}

function toDateString(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : null
}

function toTimestamp(value: Date) {
  return value.toISOString()
}

function toCompanySummary(row: CompanySummaryRow): CompanySummary {
  return {
    id: row.id,
    name: row.name,
    legalName: row.legal_name,
    tagline: row.tagline,
    registrationNumber: row.registration_number,
    pan: row.pan,
    financialYearStart: toDateString(row.financial_year_start),
    booksStart: toDateString(row.books_start),
    website: row.website,
    description: row.description,
    facebookUrl: row.facebook_url,
    twitterUrl: row.twitter_url,
    instagramUrl: row.instagram_url,
    youtubeUrl: row.youtube_url,
    primaryEmail: row.primary_email,
    primaryPhone: row.primary_phone,
    isActive: Boolean(row.is_active),
    createdAt: toTimestamp(row.created_at),
    updatedAt: toTimestamp(row.updated_at),
  }
}

function toCompanyLogo(row: CompanyLogoRow): CompanyLogo {
  return {
    id: row.id,
    companyId: row.company_id,
    logoUrl: row.logo_url,
    logoType: row.logo_type,
    isActive: Boolean(row.is_active),
    createdAt: toTimestamp(row.created_at),
    updatedAt: toTimestamp(row.updated_at),
  }
}

function toCompanyAddress(row: CompanyAddressRow): CompanyAddress {
  return {
    id: row.id,
    companyId: row.company_id,
    addressType: row.address_type,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    cityId: row.city_id,
    stateId: row.state_id,
    countryId: row.country_id,
    pincodeId: row.pincode_id,
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    isDefault: Boolean(row.is_default),
    isActive: Boolean(row.is_active),
    createdAt: toTimestamp(row.created_at),
    updatedAt: toTimestamp(row.updated_at),
  }
}

function toCompanyEmail(row: CompanyEmailRow): CompanyEmail {
  return {
    id: row.id,
    companyId: row.company_id,
    email: row.email,
    emailType: row.email_type,
    isActive: Boolean(row.is_active),
    createdAt: toTimestamp(row.created_at),
    updatedAt: toTimestamp(row.updated_at),
  }
}

function toCompanyPhone(row: CompanyPhoneRow): CompanyPhone {
  return {
    id: row.id,
    companyId: row.company_id,
    phoneNumber: row.phone_number,
    phoneType: row.phone_type,
    isPrimary: Boolean(row.is_primary),
    isActive: Boolean(row.is_active),
    createdAt: toTimestamp(row.created_at),
    updatedAt: toTimestamp(row.updated_at),
  }
}

function toCompanyBankAccount(row: CompanyBankAccountRow): CompanyBankAccount {
  return {
    id: row.id,
    companyId: row.company_id,
    bankName: row.bank_name,
    accountNumber: row.account_number,
    accountHolderName: row.account_holder_name,
    ifsc: row.ifsc,
    branch: row.branch,
    isPrimary: Boolean(row.is_primary),
    isActive: Boolean(row.is_active),
    createdAt: toTimestamp(row.created_at),
    updatedAt: toTimestamp(row.updated_at),
  }
}

async function replaceLogos(
  execute: (sql: string, params?: (string | number | boolean | null)[]) => Promise<unknown>,
  companyId: string,
  logos: CompanyLogoInput[],
) {
  await execute(`UPDATE ${companyTableNames.logos} SET is_active = 0 WHERE company_id = ? AND is_active = 1`, [companyId])

  for (const logo of logos) {
    await execute(
      `
        INSERT INTO ${companyTableNames.logos} (id, company_id, logo_url, logo_type)
        VALUES (?, ?, ?, ?)
      `,
      [randomUUID(), companyId, logo.logoUrl, logo.logoType],
    )
  }
}

async function replaceAddresses(
  execute: (sql: string, params?: (string | number | boolean | null)[]) => Promise<unknown>,
  companyId: string,
  addresses: CompanyAddressInput[],
) {
  await execute(`UPDATE ${companyTableNames.addresses} SET is_active = 0 WHERE company_id = ? AND is_active = 1`, [companyId])

  for (const address of addresses) {
    await execute(
      `
        INSERT INTO ${companyTableNames.addresses} (
          id,
          company_id,
          address_type,
          address_line1,
          address_line2,
          city_id,
          state_id,
          country_id,
          pincode_id,
          latitude,
          longitude,
          is_default
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        randomUUID(),
        companyId,
        address.addressType,
        address.addressLine1,
        address.addressLine2,
        address.cityId,
        address.stateId,
        address.countryId,
        address.pincodeId,
        address.latitude,
        address.longitude,
        address.isDefault,
      ],
    )
  }
}

async function replaceEmails(
  execute: (sql: string, params?: (string | number | boolean | null)[]) => Promise<unknown>,
  companyId: string,
  emails: CompanyEmailInput[],
) {
  await execute(`UPDATE ${companyTableNames.emails} SET is_active = 0 WHERE company_id = ? AND is_active = 1`, [companyId])

  for (const email of emails) {
    await execute(
      `
        INSERT INTO ${companyTableNames.emails} (id, company_id, email, email_type)
        VALUES (?, ?, ?, ?)
      `,
      [randomUUID(), companyId, email.email, email.emailType],
    )
  }
}

async function replacePhones(
  execute: (sql: string, params?: (string | number | boolean | null)[]) => Promise<unknown>,
  companyId: string,
  phones: CompanyPhoneInput[],
) {
  await execute(`UPDATE ${companyTableNames.phones} SET is_active = 0 WHERE company_id = ? AND is_active = 1`, [companyId])

  for (const phone of phones) {
    await execute(
      `
        INSERT INTO ${companyTableNames.phones} (id, company_id, phone_number, phone_type, is_primary)
        VALUES (?, ?, ?, ?, ?)
      `,
      [randomUUID(), companyId, phone.phoneNumber, phone.phoneType, phone.isPrimary],
    )
  }
}

async function replaceBankAccounts(
  execute: (sql: string, params?: (string | number | boolean | null)[]) => Promise<unknown>,
  companyId: string,
  bankAccounts: CompanyBankAccountInput[],
) {
  await execute(`UPDATE ${companyTableNames.bankAccounts} SET is_active = 0 WHERE company_id = ? AND is_active = 1`, [companyId])

  for (const account of bankAccounts) {
    await execute(
      `
        INSERT INTO ${companyTableNames.bankAccounts} (
          id,
          company_id,
          bank_name,
          account_number,
          account_holder_name,
          ifsc,
          branch,
          is_primary
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        randomUUID(),
        companyId,
        account.bankName,
        account.accountNumber,
        account.accountHolderName,
        account.ifsc,
        account.branch,
        account.isPrimary,
      ],
    )
  }
}

export class CompanyRepository {
  async list() {
    await ensureDatabaseSchema()

    const rows = await db.query<CompanySummaryRow>(
      `
        SELECT
          c.id,
          c.name,
          c.legal_name,
          c.tagline,
          c.registration_number,
          c.pan,
          c.financial_year_start,
          c.books_start,
          c.website,
          c.description,
          c.facebook_url,
          c.twitter_url,
          c.instagram_url,
          c.youtube_url,
          (
            SELECT ce.email
            FROM ${companyTableNames.emails} ce
            WHERE ce.company_id = c.id AND ce.is_active = 1
            ORDER BY ce.created_at ASC
            LIMIT 1
          ) AS primary_email,
          (
            SELECT cp.phone_number
            FROM ${companyTableNames.phones} cp
            WHERE cp.company_id = c.id AND cp.is_active = 1
            ORDER BY cp.is_primary DESC, cp.created_at ASC
            LIMIT 1
          ) AS primary_phone,
          c.is_active,
          c.created_at,
          c.updated_at
        FROM ${companyTableNames.companies} c
        ORDER BY c.created_at DESC
      `,
    )

    return rows.map(toCompanySummary)
  }

  async findById(id: string) {
    await ensureDatabaseSchema()

    const row = await db.first<CompanyRow>(
      `
        SELECT
          c.id,
          c.name,
          c.legal_name,
          c.tagline,
          c.registration_number,
          c.pan,
          c.financial_year_start,
          c.books_start,
          c.website,
          c.description,
          c.facebook_url,
          c.twitter_url,
          c.instagram_url,
          c.youtube_url,
          (
            SELECT ce.email
            FROM ${companyTableNames.emails} ce
            WHERE ce.company_id = c.id AND ce.is_active = 1
            ORDER BY ce.created_at ASC
            LIMIT 1
          ) AS primary_email,
          (
            SELECT cp.phone_number
            FROM ${companyTableNames.phones} cp
            WHERE cp.company_id = c.id AND cp.is_active = 1
            ORDER BY cp.is_primary DESC, cp.created_at ASC
            LIMIT 1
          ) AS primary_phone,
          c.is_active,
          c.created_at,
          c.updated_at
        FROM ${companyTableNames.companies} c
        WHERE c.id = ?
        LIMIT 1
      `,
      [id],
    )

    if (!row) {
      return null
    }

    const [logos, addresses, emails, phones, bankAccounts] = await Promise.all([
      db.query<CompanyLogoRow>(
        `SELECT * FROM ${companyTableNames.logos} WHERE company_id = ? AND is_active = 1 ORDER BY created_at ASC`,
        [id],
      ),
      db.query<CompanyAddressRow>(
        `SELECT * FROM ${companyTableNames.addresses} WHERE company_id = ? AND is_active = 1 ORDER BY is_default DESC, created_at ASC`,
        [id],
      ),
      db.query<CompanyEmailRow>(
        `SELECT * FROM ${companyTableNames.emails} WHERE company_id = ? AND is_active = 1 ORDER BY created_at ASC`,
        [id],
      ),
      db.query<CompanyPhoneRow>(
        `SELECT * FROM ${companyTableNames.phones} WHERE company_id = ? AND is_active = 1 ORDER BY is_primary DESC, created_at ASC`,
        [id],
      ),
      db.query<CompanyBankAccountRow>(
        `SELECT * FROM ${companyTableNames.bankAccounts} WHERE company_id = ? AND is_active = 1 ORDER BY is_primary DESC, created_at ASC`,
        [id],
      ),
    ])

    return {
      ...toCompanySummary(row),
      logos: logos.map(toCompanyLogo),
      addresses: addresses.map(toCompanyAddress),
      emails: emails.map(toCompanyEmail),
      phones: phones.map(toCompanyPhone),
      bankAccounts: bankAccounts.map(toCompanyBankAccount),
    } satisfies Company
  }

  async create(payload: CompanyUpsertPayload) {
    await ensureDatabaseSchema()
    const companyId = randomUUID()

    await db.transaction(async (transaction) => {
      await transaction.execute(
        `
          INSERT INTO ${companyTableNames.companies} (
            id,
            name,
            legal_name,
            tagline,
            registration_number,
            pan,
            financial_year_start,
            books_start,
            website,
            description,
            facebook_url,
            twitter_url,
            instagram_url,
            youtube_url,
            is_active
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          companyId,
          payload.name,
          payload.legalName,
          payload.tagline,
          payload.registrationNumber,
          payload.pan,
          payload.financialYearStart,
          payload.booksStart,
          payload.website,
          payload.description,
          payload.facebookUrl,
          payload.twitterUrl,
          payload.instagramUrl,
          payload.youtubeUrl,
          payload.isActive,
        ],
      )

      await replaceLogos(transaction.execute.bind(transaction), companyId, payload.logos)
      await replaceAddresses(transaction.execute.bind(transaction), companyId, payload.addresses)
      await replaceEmails(transaction.execute.bind(transaction), companyId, payload.emails)
      await replacePhones(transaction.execute.bind(transaction), companyId, payload.phones)
      await replaceBankAccounts(transaction.execute.bind(transaction), companyId, payload.bankAccounts)
    })

    const company = await this.findById(companyId)
    if (!company) {
      throw new ApplicationError('Expected created company to be retrievable.', { id: companyId }, 500)
    }

    return company
  }

  async update(id: string, payload: CompanyUpsertPayload) {
    await ensureDatabaseSchema()

    await db.transaction(async (transaction) => {
      const existing = await transaction.first<RowDataPacket>(
        `SELECT id FROM ${companyTableNames.companies} WHERE id = ? LIMIT 1`,
        [id],
      )

      if (!existing) {
        throw new ApplicationError('Company not found.', { id }, 404)
      }

      await transaction.execute(
        `
          UPDATE ${companyTableNames.companies}
          SET
            name = ?,
            legal_name = ?,
            tagline = ?,
            registration_number = ?,
            pan = ?,
            financial_year_start = ?,
            books_start = ?,
            website = ?,
            description = ?,
            facebook_url = ?,
            twitter_url = ?,
            instagram_url = ?,
            youtube_url = ?,
            is_active = ?
          WHERE id = ?
        `,
        [
          payload.name,
          payload.legalName,
          payload.tagline,
          payload.registrationNumber,
          payload.pan,
          payload.financialYearStart,
          payload.booksStart,
          payload.website,
          payload.description,
          payload.facebookUrl,
          payload.twitterUrl,
          payload.instagramUrl,
          payload.youtubeUrl,
          payload.isActive,
          id,
        ],
      )

      await replaceLogos(transaction.execute.bind(transaction), id, payload.logos)
      await replaceAddresses(transaction.execute.bind(transaction), id, payload.addresses)
      await replaceEmails(transaction.execute.bind(transaction), id, payload.emails)
      await replacePhones(transaction.execute.bind(transaction), id, payload.phones)
      await replaceBankAccounts(transaction.execute.bind(transaction), id, payload.bankAccounts)
    })

    const company = await this.findById(id)
    if (!company) {
      throw new ApplicationError('Expected updated company to be retrievable.', { id }, 500)
    }

    return company
  }

  async setActiveState(id: string, isActive: boolean) {
    await ensureDatabaseSchema()

    const result = await db.execute(
      `UPDATE ${companyTableNames.companies} SET is_active = ? WHERE id = ?`,
      [isActive, id],
    )

    if (result.affectedRows === 0) {
      throw new ApplicationError('Company not found.', { id }, 404)
    }

    const company = await this.findById(id)
    if (!company) {
      throw new ApplicationError('Expected company to be retrievable after state update.', { id }, 500)
    }

    return company
  }
}
