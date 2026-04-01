import { authTableNames, commonTableNames, customerTableNames } from '../../../table-names'
import type { RowDataPacket } from 'mysql2'
import type { Migration } from '../../migration'

interface ConstraintRow extends RowDataPacket {
  constraint_name: string
}

export const customerProfileMigration: Migration = {
  id: '015-customer-profile',
  name: 'Customer profile',
  async up({ db }) {
    const constraintDefinitions = [
      {
        name: 'fk_customer_delivery_addresses_user',
        sql: `ALTER TABLE ${customerTableNames.deliveryAddresses} ADD CONSTRAINT fk_customer_delivery_addresses_user FOREIGN KEY (user_id) REFERENCES ${authTableNames.users}(id)`,
      },
      {
        name: 'fk_customer_delivery_addresses_city',
        sql: `ALTER TABLE ${customerTableNames.deliveryAddresses} ADD CONSTRAINT fk_customer_delivery_addresses_city FOREIGN KEY (city_id) REFERENCES ${commonTableNames.cities}(id)`,
      },
      {
        name: 'fk_customer_delivery_addresses_state',
        sql: `ALTER TABLE ${customerTableNames.deliveryAddresses} ADD CONSTRAINT fk_customer_delivery_addresses_state FOREIGN KEY (state_id) REFERENCES ${commonTableNames.states}(id)`,
      },
      {
        name: 'fk_customer_delivery_addresses_country',
        sql: `ALTER TABLE ${customerTableNames.deliveryAddresses} ADD CONSTRAINT fk_customer_delivery_addresses_country FOREIGN KEY (country_id) REFERENCES ${commonTableNames.countries}(id)`,
      },
      {
        name: 'fk_customer_delivery_addresses_pincode',
        sql: `ALTER TABLE ${customerTableNames.deliveryAddresses} ADD CONSTRAINT fk_customer_delivery_addresses_pincode FOREIGN KEY (pincode_id) REFERENCES ${commonTableNames.pincodes}(id)`,
      },
    ] as const

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${customerTableNames.deliveryAddresses} (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        label VARCHAR(80) NOT NULL,
        first_name VARCHAR(80) NOT NULL,
        last_name VARCHAR(80) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        address_line1 VARCHAR(200) NOT NULL,
        address_line2 VARCHAR(200) NULL,
        city_id VARCHAR(64) NOT NULL,
        state_id VARCHAR(64) NOT NULL,
        country_id VARCHAR(64) NOT NULL,
        pincode_id VARCHAR(64) NOT NULL,
        is_default TINYINT(1) NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
      ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      ALTER TABLE ${customerTableNames.deliveryAddresses}
      CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)

    for (const constraint of constraintDefinitions) {
      const existing = await db.query<ConstraintRow>(
        `
          SELECT CONSTRAINT_NAME AS constraint_name
          FROM information_schema.TABLE_CONSTRAINTS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = ?
            AND CONSTRAINT_NAME = ?
          LIMIT 1
        `,
        [customerTableNames.deliveryAddresses, constraint.name],
      )

      if (existing.length === 0) {
        await db.execute(constraint.sql)
      }
    }
  },
}


