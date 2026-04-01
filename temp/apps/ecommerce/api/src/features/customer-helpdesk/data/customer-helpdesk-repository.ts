import type {
  CustomerHelpdeskSummary,
  CustomerHelpdeskVerification,
  StorefrontOrder,
} from '@shared/index'
import type { RowDataPacket } from 'mysql2'
import { ensureDatabaseSchema } from '@framework-core/runtime/database/database'
import { db } from '@framework-core/runtime/database/orm'
import {
  authTableNames,
  commonTableNames,
  customerTableNames,
  storefrontTableNames,
} from '@framework-core/runtime/database/table-names'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'
import { StorefrontOrderRepository } from '../../storefront/data/storefront-order-repository'

interface CustomerSummaryRow extends RowDataPacket {
  id: string
  display_name: string
  email: string
  phone_number: string | null
  is_active: number
  deletion_requested_at: Date | null
  purge_after_at: Date | null
  order_count: number | string
  total_spent: number | string | null
  last_order_at: Date | null
  last_order_number: string | null
  last_order_status: string | null
}

interface DefaultAddressRow extends RowDataPacket {
  user_id: string
  label: string
  city_name: string
  state_name: string
  pincode_code: string
}

interface VerificationRow extends RowDataPacket {
  id: string
  purpose: string
  channel: 'email' | 'mobile'
  destination: string
  expires_at: Date
  verified_at: Date | null
  consumed_at: Date | null
  is_active: number
  created_at: Date
}

function asIso(value: Date | null) {
  return value ? value.toISOString() : null
}

export class CustomerHelpdeskRepository {
  private readonly storefrontOrderRepository = new StorefrontOrderRepository()

  async listCustomers(): Promise<CustomerHelpdeskSummary[]> {
    await ensureDatabaseSchema()

    const [rows, defaultAddressRows] = await Promise.all([
      db.query<CustomerSummaryRow>(
        `
          SELECT
            u.id,
            u.display_name,
            u.email,
            u.phone_number,
            u.is_active,
            u.deletion_requested_at,
            u.purge_after_at,
            COUNT(o.id) AS order_count,
            COALESCE(SUM(o.total_amount), 0) AS total_spent,
            MAX(o.created_at) AS last_order_at,
            (
              SELECT so.order_number
              FROM ${storefrontTableNames.orders} so
              WHERE LOWER(so.email) = LOWER(u.email)
              ORDER BY so.created_at DESC
              LIMIT 1
            ) AS last_order_number,
            (
              SELECT so.status
              FROM ${storefrontTableNames.orders} so
              WHERE LOWER(so.email) = LOWER(u.email)
              ORDER BY so.created_at DESC
              LIMIT 1
            ) AS last_order_status
          FROM ${authTableNames.users} u
          LEFT JOIN ${storefrontTableNames.orders} o
            ON LOWER(o.email) = LOWER(u.email)
          WHERE u.actor_type = 'customer'
          GROUP BY
            u.id,
            u.display_name,
            u.email,
            u.phone_number,
            u.is_active,
            u.deletion_requested_at,
            u.purge_after_at
          ORDER BY
            last_order_at DESC,
            u.updated_at DESC
        `,
      ),
      db.query<DefaultAddressRow>(
        `
          SELECT
            address.user_id,
            address.label,
            city.name AS city_name,
            state.name AS state_name,
            pincode.code AS pincode_code
          FROM ${customerTableNames.deliveryAddresses} address
          INNER JOIN ${commonTableNames.cities} city ON city.id = address.city_id
          INNER JOIN ${commonTableNames.states} state ON state.id = address.state_id
          INNER JOIN ${commonTableNames.pincodes} pincode ON pincode.id = address.pincode_id
          WHERE address.is_active = 1
            AND address.is_default = 1
        `,
      ),
    ])

    const addressMap = new Map<string, string>()
    for (const row of defaultAddressRows) {
      addressMap.set(row.user_id, `${row.label} - ${row.city_name}, ${row.state_name} ${row.pincode_code}`)
    }

    return rows.map((row) => {
      const issueCount = [
        !row.phone_number,
        !addressMap.get(row.id),
        !row.is_active,
      ].filter(Boolean).length

      return {
        id: row.id,
        displayName: row.display_name,
        email: row.email,
        phoneNumber: row.phone_number,
        isActive: Boolean(row.is_active),
        deletionRequestedAt: asIso(row.deletion_requested_at),
        purgeAfterAt: asIso(row.purge_after_at),
        orderCount: Number(row.order_count),
        totalSpent: Number(row.total_spent ?? 0),
        lastOrderAt: asIso(row.last_order_at),
        lastOrderNumber: row.last_order_number,
        lastOrderStatus: row.last_order_status,
        defaultAddressSummary: addressMap.get(row.id) ?? null,
        issueCount,
      } satisfies CustomerHelpdeskSummary
    })
  }

  async getCustomerById(customerId: string) {
    const items = await this.listCustomers()
    const item = items.find((entry) => entry.id === customerId) ?? null

    if (!item) {
      throw new ApplicationError('Customer helpdesk record not found.', { customerId }, 404)
    }

    return item
  }

  async listOrdersByCustomerEmail(email: string): Promise<StorefrontOrder[]> {
    return this.storefrontOrderRepository.listByCustomerEmail(email)
  }

  async listVerificationsForDestinations(destinations: string[]): Promise<CustomerHelpdeskVerification[]> {
    await ensureDatabaseSchema()

    const filteredDestinations = destinations
      .map((destination) => destination.trim())
      .filter(Boolean)

    if (filteredDestinations.length === 0) {
      return []
    }

    const placeholders = filteredDestinations.map(() => '?').join(', ')
    const rows = await db.query<VerificationRow>(
      `
        SELECT
          id,
          purpose,
          channel,
          destination,
          expires_at,
          verified_at,
          consumed_at,
          is_active,
          created_at
        FROM ${authTableNames.contactVerifications}
        WHERE actor_type = 'customer'
          AND destination IN (${placeholders})
        ORDER BY created_at DESC
        LIMIT 20
      `,
      filteredDestinations,
    )

    return rows.map((row) => ({
      id: row.id,
      purpose: row.purpose,
      channel: row.channel,
      destination: row.destination,
      expiresAt: row.expires_at.toISOString(),
      verifiedAt: row.verified_at?.toISOString() ?? null,
      consumedAt: row.consumed_at?.toISOString() ?? null,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at.toISOString(),
    } satisfies CustomerHelpdeskVerification))
  }
}
