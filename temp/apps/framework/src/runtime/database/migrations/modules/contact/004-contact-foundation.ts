import { commonTableNames, contactTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

function lifecycleColumnsSql() {
  return `
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  `
}

export const contactFoundationMigration: Migration = {
  id: '004-contact-foundation',
  name: 'Contact master foundation',
  async up({ db }) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${contactTableNames.contacts} (
        id VARCHAR(64) PRIMARY KEY,
        uuid VARCHAR(64) NOT NULL UNIQUE,
        contact_type_id VARCHAR(64) NOT NULL,
        name VARCHAR(200) NOT NULL,
        legal_name VARCHAR(250) NULL,
        pan VARCHAR(20) NULL,
        gstin VARCHAR(20) NULL,
        msme_type VARCHAR(20) NULL,
        msme_no VARCHAR(20) NULL,
        opening_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
        balance_type VARCHAR(10) NULL,
        credit_limit DECIMAL(15, 2) NOT NULL DEFAULT 0,
        website VARCHAR(200) NULL,
        description TEXT NULL,
        ${lifecycleColumnsSql()},
        CONSTRAINT fk_contacts_contact_type FOREIGN KEY (contact_type_id) REFERENCES ${commonTableNames.contactTypes}(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${contactTableNames.addresses} (
        id VARCHAR(64) PRIMARY KEY,
        contact_id VARCHAR(64) NOT NULL,
        address_type VARCHAR(50) NOT NULL,
        address_line1 VARCHAR(200) NOT NULL,
        address_line2 VARCHAR(200) NULL,
        city_id VARCHAR(64) NULL,
        state_id VARCHAR(64) NULL,
        country_id VARCHAR(64) NULL,
        pincode_id VARCHAR(64) NULL,
        latitude DECIMAL(10, 7) NULL,
        longitude DECIMAL(10, 7) NULL,
        is_default TINYINT(1) NOT NULL DEFAULT 0,
        ${lifecycleColumnsSql()},
        CONSTRAINT fk_contact_addresses_contact FOREIGN KEY (contact_id) REFERENCES ${contactTableNames.contacts}(id),
        CONSTRAINT fk_contact_addresses_city FOREIGN KEY (city_id) REFERENCES ${commonTableNames.cities}(id),
        CONSTRAINT fk_contact_addresses_state FOREIGN KEY (state_id) REFERENCES ${commonTableNames.states}(id),
        CONSTRAINT fk_contact_addresses_country FOREIGN KEY (country_id) REFERENCES ${commonTableNames.countries}(id),
        CONSTRAINT fk_contact_addresses_pincode FOREIGN KEY (pincode_id) REFERENCES ${commonTableNames.pincodes}(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${contactTableNames.emails} (
        id VARCHAR(64) PRIMARY KEY,
        contact_id VARCHAR(64) NOT NULL,
        email VARCHAR(200) NOT NULL,
        email_type VARCHAR(50) NOT NULL,
        is_primary TINYINT(1) NOT NULL DEFAULT 0,
        ${lifecycleColumnsSql()},
        CONSTRAINT fk_contact_emails_contact FOREIGN KEY (contact_id) REFERENCES ${contactTableNames.contacts}(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${contactTableNames.phones} (
        id VARCHAR(64) PRIMARY KEY,
        contact_id VARCHAR(64) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        phone_type VARCHAR(50) NOT NULL,
        is_primary TINYINT(1) NOT NULL DEFAULT 0,
        ${lifecycleColumnsSql()},
        CONSTRAINT fk_contact_phones_contact FOREIGN KEY (contact_id) REFERENCES ${contactTableNames.contacts}(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${contactTableNames.bankAccounts} (
        id VARCHAR(64) PRIMARY KEY,
        contact_id VARCHAR(64) NOT NULL,
        bank_name VARCHAR(150) NOT NULL,
        account_number VARCHAR(50) NOT NULL,
        account_holder_name VARCHAR(200) NOT NULL,
        ifsc VARCHAR(20) NOT NULL,
        branch VARCHAR(150) NULL,
        is_primary TINYINT(1) NOT NULL DEFAULT 0,
        ${lifecycleColumnsSql()},
        CONSTRAINT fk_contact_bank_accounts_contact FOREIGN KEY (contact_id) REFERENCES ${contactTableNames.contacts}(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${contactTableNames.gstDetails} (
        id VARCHAR(64) PRIMARY KEY,
        contact_id VARCHAR(64) NOT NULL,
        gstin VARCHAR(20) NOT NULL,
        state VARCHAR(100) NOT NULL,
        is_default TINYINT(1) NOT NULL DEFAULT 0,
        ${lifecycleColumnsSql()},
        CONSTRAINT fk_contact_gst_details_contact FOREIGN KEY (contact_id) REFERENCES ${contactTableNames.contacts}(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(
      `
        INSERT INTO ${commonTableNames.contactTypes} (id, code, name, description)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          code = VALUES(code),
          name = VALUES(name),
          description = VALUES(description),
          is_active = 1
      `,
      ['contact-type:company', 'COMPANY', 'Company', 'Organization or legal entity contact.'],
    )

    await db.execute(
      `
        INSERT INTO ${contactTableNames.contacts} (
          id, uuid, contact_type_id, name, legal_name, opening_balance, credit_limit, description
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          legal_name = VALUES(legal_name),
          opening_balance = VALUES(opening_balance),
          credit_limit = VALUES(credit_limit),
          description = VALUES(description),
          is_active = 1
      `,
      ['contact:default', 'contact-default', 'contact-type:company', '-', '-', 0, 0, 'Default placeholder contact.'],
    )
  },
}


