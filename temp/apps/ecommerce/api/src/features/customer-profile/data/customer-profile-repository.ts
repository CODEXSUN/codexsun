import type { AuthUser, CustomerDeliveryAddress, CustomerProfile, CustomerProfileUpdatePayload } from '@shared/index'
import type { RowDataPacket } from 'mysql2'
import { ensureDatabaseSchema } from '@framework-core/runtime/database/database'
import { db } from '@framework-core/runtime/database/orm'
import { authTableNames, commonTableNames, customerTableNames } from '@framework-core/runtime/database/table-names'

interface CustomerUserRow extends RowDataPacket {
  id: string
  email: string
  phone_number: string | null
  display_name: string
}

interface CustomerAddressRow extends RowDataPacket {
  id: string
  label: string
  first_name: string
  last_name: string
  phone_number: string
  address_line1: string
  address_line2: string | null
  city_id: string
  city_name: string
  state_id: string
  state_name: string
  country_id: string
  country_name: string
  pincode_id: string
  pincode_code: string
  is_default: number
}

function toDeliveryAddress(row: CustomerAddressRow): CustomerDeliveryAddress {
  return {
    id: row.id,
    label: row.label,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone_number,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2 ?? '',
    cityId: row.city_id,
    city: row.city_name,
    stateId: row.state_id,
    state: row.state_name,
    countryId: row.country_id,
    country: row.country_name,
    postalCodeId: row.pincode_id,
    postalCode: row.pincode_code,
    isDefault: Boolean(row.is_default),
  }
}

function normalizeAddresses(addresses: CustomerProfileUpdatePayload['addresses']) {
  if (addresses.length === 0) {
    return []
  }

  let hasDefault = false

  return addresses.map((address, index) => {
    const normalized = {
      ...address,
      label: address.label.trim(),
      firstName: address.firstName.trim(),
      lastName: address.lastName.trim(),
      phone: address.phone.trim(),
      addressLine1: address.addressLine1.trim(),
      addressLine2: address.addressLine2.trim(),
      isDefault: address.isDefault && !hasDefault,
    }

    if (normalized.isDefault) {
      hasDefault = true
    }

    if (!hasDefault && index === 0) {
      hasDefault = true
      return {
        ...normalized,
        isDefault: true,
      }
    }

    return normalized
  })
}

export class CustomerProfileRepository {
  async getByUser(user: AuthUser) {
    return this.getByUserId(user.id)
  }

  async getByUserId(userId: string) {
    await ensureDatabaseSchema()

    const userRow = await db.first<CustomerUserRow>(
      `
        SELECT id, email, phone_number, display_name
        FROM ${authTableNames.users}
        WHERE id = ?
        LIMIT 1
      `,
      [userId],
    )

    if (!userRow) {
      throw new Error('Expected authenticated user to exist.')
    }

    const addresses = await db.query<CustomerAddressRow>(
      `
        SELECT
          address.id,
          address.label,
          address.first_name,
          address.last_name,
          address.phone_number,
          address.address_line1,
          address.address_line2,
          address.city_id,
          city.name AS city_name,
          address.state_id,
          state.name AS state_name,
          address.country_id,
          country.name AS country_name,
          address.pincode_id,
          pincode.code AS pincode_code,
          address.is_default
        FROM ${customerTableNames.deliveryAddresses} address
        INNER JOIN ${commonTableNames.cities} city ON city.id = address.city_id
        INNER JOIN ${commonTableNames.states} state ON state.id = address.state_id
        INNER JOIN ${commonTableNames.countries} country ON country.id = address.country_id
        INNER JOIN ${commonTableNames.pincodes} pincode ON pincode.id = address.pincode_id
        WHERE address.user_id = ?
          AND address.is_active = 1
        ORDER BY address.is_default DESC, address.created_at ASC
      `,
      [userId],
    )

    return {
      email: userRow.email,
      displayName: userRow.display_name,
      phoneNumber: userRow.phone_number,
      addresses: addresses.map(toDeliveryAddress),
    } satisfies CustomerProfile
  }

  async save(user: AuthUser, payload: CustomerProfileUpdatePayload) {
    await ensureDatabaseSchema()
    const addresses = normalizeAddresses(payload.addresses)

    await db.transaction(async (transaction) => {
      await transaction.execute(
        `
          UPDATE ${authTableNames.users}
          SET display_name = ?, phone_number = ?
          WHERE id = ?
        `,
        [payload.displayName.trim(), payload.phoneNumber?.trim() ?? null, user.id],
      )

      await transaction.execute(
        `
          DELETE FROM ${customerTableNames.deliveryAddresses}
          WHERE user_id = ?
        `,
        [user.id],
      )

      for (const address of addresses) {
        await transaction.execute(
          `
            INSERT INTO ${customerTableNames.deliveryAddresses} (
              id,
              user_id,
              label,
              first_name,
              last_name,
              phone_number,
              address_line1,
              address_line2,
              city_id,
              state_id,
              country_id,
              pincode_id,
              is_default,
              is_active
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
          `,
          [
            address.id,
            user.id,
            address.label,
            address.firstName,
            address.lastName,
            address.phone,
            address.addressLine1,
            address.addressLine2 || null,
            address.cityId,
            address.stateId,
            address.countryId,
            address.postalCodeId,
            address.isDefault ? 1 : 0,
          ],
        )
      }
    })

    return this.getByUserId(user.id)
  }
}
