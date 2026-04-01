import { commonTableNames, companyTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

function lifecycleColumnsSql() {
  return `
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  `
}

export const companyFoundationMigration: Migration = {
  id: '003-company-foundation',
  name: 'Company master foundation',
  async up({ db }) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${companyTableNames.companies} (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(160) NOT NULL UNIQUE,
        legal_name VARCHAR(200) NULL,
        registration_number VARCHAR(80) NULL,
        pan VARCHAR(32) NULL,
        financial_year_start DATE NULL,
        books_start DATE NULL,
        website VARCHAR(200) NULL,
        description TEXT NULL,
        ${lifecycleColumnsSql()}
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${companyTableNames.logos} (
        id VARCHAR(64) PRIMARY KEY,
        company_id VARCHAR(64) NOT NULL,
        logo_url VARCHAR(255) NOT NULL,
        logo_type VARCHAR(50) NOT NULL,
        ${lifecycleColumnsSql()},
        CONSTRAINT fk_company_logos_company FOREIGN KEY (company_id) REFERENCES ${companyTableNames.companies} (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${companyTableNames.addresses} (
        id VARCHAR(64) PRIMARY KEY,
        company_id VARCHAR(64) NOT NULL,
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
        CONSTRAINT fk_company_addresses_company FOREIGN KEY (company_id) REFERENCES ${companyTableNames.companies} (id),
        CONSTRAINT fk_company_addresses_city FOREIGN KEY (city_id) REFERENCES ${commonTableNames.cities} (id),
        CONSTRAINT fk_company_addresses_state FOREIGN KEY (state_id) REFERENCES ${commonTableNames.states} (id),
        CONSTRAINT fk_company_addresses_country FOREIGN KEY (country_id) REFERENCES ${commonTableNames.countries} (id),
        CONSTRAINT fk_company_addresses_pincode FOREIGN KEY (pincode_id) REFERENCES ${commonTableNames.pincodes} (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${companyTableNames.emails} (
        id VARCHAR(64) PRIMARY KEY,
        company_id VARCHAR(64) NOT NULL,
        email VARCHAR(200) NOT NULL,
        email_type VARCHAR(50) NOT NULL,
        ${lifecycleColumnsSql()},
        CONSTRAINT fk_company_emails_company FOREIGN KEY (company_id) REFERENCES ${companyTableNames.companies} (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${companyTableNames.phones} (
        id VARCHAR(64) PRIMARY KEY,
        company_id VARCHAR(64) NOT NULL,
        phone_number VARCHAR(50) NOT NULL,
        phone_type VARCHAR(50) NOT NULL,
        is_primary TINYINT(1) NOT NULL DEFAULT 0,
        ${lifecycleColumnsSql()},
        CONSTRAINT fk_company_phones_company FOREIGN KEY (company_id) REFERENCES ${companyTableNames.companies} (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${companyTableNames.bankAccounts} (
        id VARCHAR(64) PRIMARY KEY,
        company_id VARCHAR(64) NOT NULL,
        bank_name VARCHAR(160) NOT NULL,
        account_number VARCHAR(80) NOT NULL,
        account_holder_name VARCHAR(160) NOT NULL,
        ifsc VARCHAR(32) NOT NULL,
        branch VARCHAR(120) NULL,
        is_primary TINYINT(1) NOT NULL DEFAULT 0,
        ${lifecycleColumnsSql()},
        CONSTRAINT fk_company_bank_accounts_company FOREIGN KEY (company_id) REFERENCES ${companyTableNames.companies} (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(
      `
        INSERT INTO ${companyTableNames.companies} (
          id,
          name,
          legal_name,
          registration_number,
          pan,
          financial_year_start,
          books_start,
          website,
          description
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          legal_name = VALUES(legal_name),
          registration_number = VALUES(registration_number),
          pan = VALUES(pan),
          financial_year_start = VALUES(financial_year_start),
          books_start = VALUES(books_start),
          website = VALUES(website),
          description = VALUES(description),
          is_active = 1
      `,
      [
        'company:codexsun',
        'CODEXSUN',
        'CODEXSUN Software Private Limited',
        'CDS-ERP-001',
        'ABCDE1234F',
        '2025-04-01',
        '2025-04-01',
        'https://codexsun.com',
        'Default company bootstrap for the codexsun workspace.',
      ],
    )

    await db.execute(
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
        ON DUPLICATE KEY UPDATE
          address_line1 = VALUES(address_line1),
          address_line2 = VALUES(address_line2),
          city_id = VALUES(city_id),
          state_id = VALUES(state_id),
          country_id = VALUES(country_id),
          pincode_id = VALUES(pincode_id),
          latitude = VALUES(latitude),
          longitude = VALUES(longitude),
          is_default = VALUES(is_default),
          is_active = 1
      `,
      [
        'company-address:codexsun-head-office',
        'company:codexsun',
        'head_office',
        '1 Harbour Estate',
        'George Town',
        'city:IN-TN-CHENNAI',
        'state:IN-TN',
        'country:IN',
        'pincode:600001',
        13.0827,
        80.2707,
        1,
      ],
    )

    await db.execute(
      `
        INSERT INTO ${companyTableNames.emails} (id, company_id, email, email_type)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          email = VALUES(email),
          email_type = VALUES(email_type),
          is_active = 1
      `,
      ['company-email:codexsun-admin', 'company:codexsun', 'admin@codexsun.com', 'admin'],
    )

    await db.execute(
      `
        INSERT INTO ${companyTableNames.phones} (id, company_id, phone_number, phone_type, is_primary)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          phone_number = VALUES(phone_number),
          phone_type = VALUES(phone_type),
          is_primary = VALUES(is_primary),
          is_active = 1
      `,
      ['company-phone:codexsun-primary', 'company:codexsun', '+91-9000000000', 'phone', 1],
    )

    await db.execute(
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
        ON DUPLICATE KEY UPDATE
          bank_name = VALUES(bank_name),
          account_number = VALUES(account_number),
          account_holder_name = VALUES(account_holder_name),
          ifsc = VALUES(ifsc),
          branch = VALUES(branch),
          is_primary = VALUES(is_primary),
          is_active = 1
      `,
      [
        'company-bank:codexsun-primary',
        'company:codexsun',
        'State Bank of India',
        '123456789012',
        'CODEXSUN Software Private Limited',
        'SBIN0000456',
        'Chennai Main',
        1,
      ],
    )
  },
}


