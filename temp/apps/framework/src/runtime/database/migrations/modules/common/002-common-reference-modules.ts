import { commonTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

type SeedRow = Record<string, string | number | boolean | null>

function lifecycleColumnsSql() {
  return `
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  `
}

async function seedRows(
  execute: (sql: string, params?: (string | number | boolean | null)[]) => Promise<unknown>,
  table: string,
  columns: string[],
  rows: SeedRow[],
) {
  const updateColumns = columns.filter((column) => column !== 'id')
  const upsertSql = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES (${columns.map(() => '?').join(', ')})
    ON DUPLICATE KEY UPDATE
      ${updateColumns.map((column) => `${column} = VALUES(${column})`).join(', ')},
      is_active = 1
  `

  for (const row of rows) {
    await execute(
      upsertSql,
      columns.map((column) => {
        const value = row[column]
        return value === undefined ? null : value
      }),
    )
  }
}

export const commonReferenceModulesMigration: Migration = {
  id: '002-common-reference-modules',
  name: 'Common ecommerce and billing reference modules',
  async up({ db }) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${commonTableNames.countries} (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(8) NOT NULL UNIQUE,
        name VARCHAR(120) NOT NULL UNIQUE,
        phone_code VARCHAR(8) NULL,
        ${lifecycleColumnsSql()}
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${commonTableNames.states} (
        id VARCHAR(64) PRIMARY KEY,
        country_id VARCHAR(64) NOT NULL,
        code VARCHAR(16) NOT NULL,
        name VARCHAR(120) NOT NULL,
        ${lifecycleColumnsSql()},
        UNIQUE KEY uq_common_states_country_code (country_id, code),
        UNIQUE KEY uq_common_states_country_name (country_id, name),
        CONSTRAINT fk_common_states_country FOREIGN KEY (country_id) REFERENCES ${commonTableNames.countries} (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${commonTableNames.districts} (
        id VARCHAR(64) PRIMARY KEY,
        state_id VARCHAR(64) NOT NULL,
        code VARCHAR(32) NOT NULL,
        name VARCHAR(120) NOT NULL,
        ${lifecycleColumnsSql()},
        UNIQUE KEY uq_common_districts_state_code (state_id, code),
        UNIQUE KEY uq_common_districts_state_name (state_id, name),
        CONSTRAINT fk_common_districts_state FOREIGN KEY (state_id) REFERENCES ${commonTableNames.states} (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${commonTableNames.cities} (
        id VARCHAR(64) PRIMARY KEY,
        state_id VARCHAR(64) NOT NULL,
        district_id VARCHAR(64) NOT NULL,
        code VARCHAR(32) NOT NULL,
        name VARCHAR(120) NOT NULL,
        ${lifecycleColumnsSql()},
        UNIQUE KEY uq_common_cities_district_code (district_id, code),
        UNIQUE KEY uq_common_cities_district_name (district_id, name),
        CONSTRAINT fk_common_cities_state FOREIGN KEY (state_id) REFERENCES ${commonTableNames.states} (id),
        CONSTRAINT fk_common_cities_district FOREIGN KEY (district_id) REFERENCES ${commonTableNames.districts} (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${commonTableNames.pincodes} (
        id VARCHAR(64) PRIMARY KEY,
        country_id VARCHAR(64) NOT NULL,
        state_id VARCHAR(64) NOT NULL,
        district_id VARCHAR(64) NOT NULL,
        city_id VARCHAR(64) NOT NULL,
        code VARCHAR(16) NOT NULL UNIQUE,
        area_name VARCHAR(160) NULL,
        ${lifecycleColumnsSql()},
        CONSTRAINT fk_common_pincodes_country FOREIGN KEY (country_id) REFERENCES ${commonTableNames.countries} (id),
        CONSTRAINT fk_common_pincodes_state FOREIGN KEY (state_id) REFERENCES ${commonTableNames.states} (id),
        CONSTRAINT fk_common_pincodes_district FOREIGN KEY (district_id) REFERENCES ${commonTableNames.districts} (id),
        CONSTRAINT fk_common_pincodes_city FOREIGN KEY (city_id) REFERENCES ${commonTableNames.cities} (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    const simpleTables: Array<{ table: string; codeLength?: number; extraColumns?: string }> = [
      { table: commonTableNames.contactGroups, codeLength: 32, extraColumns: 'description VARCHAR(255) NULL,' },
      { table: commonTableNames.contactTypes, codeLength: 32, extraColumns: 'description VARCHAR(255) NULL,' },
      { table: commonTableNames.productGroups, codeLength: 32, extraColumns: 'description VARCHAR(255) NULL,' },
      { table: commonTableNames.productCategories, codeLength: 32, extraColumns: 'description VARCHAR(255) NULL,' },
      { table: commonTableNames.productTypes, codeLength: 32, extraColumns: 'description VARCHAR(255) NULL,' },
      { table: commonTableNames.units, codeLength: 16, extraColumns: 'symbol VARCHAR(16) NULL, description VARCHAR(255) NULL,' },
      { table: commonTableNames.hsnCodes, codeLength: 16, extraColumns: 'description VARCHAR(255) NOT NULL,' },
      { table: commonTableNames.brands, codeLength: 32, extraColumns: 'description VARCHAR(255) NULL,' },
      { table: commonTableNames.colours, codeLength: 32, extraColumns: 'hex_code VARCHAR(12) NULL, description VARCHAR(255) NULL,' },
      { table: commonTableNames.sizes, codeLength: 16, extraColumns: 'sort_order INT NOT NULL DEFAULT 0, description VARCHAR(255) NULL,' },
      { table: commonTableNames.orderTypes, codeLength: 32, extraColumns: 'description VARCHAR(255) NULL,' },
      { table: commonTableNames.styles, codeLength: 32, extraColumns: 'description VARCHAR(255) NULL,' },
      { table: commonTableNames.transports, codeLength: 32, extraColumns: 'description VARCHAR(255) NULL,' },
      { table: commonTableNames.destinations, codeLength: 32, extraColumns: 'description VARCHAR(255) NULL,' },
    ]

    for (const simpleTable of simpleTables) {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS ${simpleTable.table} (
          id VARCHAR(64) PRIMARY KEY,
          code VARCHAR(${simpleTable.codeLength ?? 32}) NOT NULL UNIQUE,
          name VARCHAR(120) NOT NULL UNIQUE,
          ${simpleTable.extraColumns ?? ''}
          ${lifecycleColumnsSql()}
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
    }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${commonTableNames.taxes} (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(32) NOT NULL UNIQUE,
        name VARCHAR(120) NOT NULL,
        tax_type VARCHAR(32) NOT NULL,
        rate_percent DECIMAL(10, 4) NOT NULL,
        description VARCHAR(255) NULL,
        ${lifecycleColumnsSql()}
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${commonTableNames.currencies} (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(8) NOT NULL UNIQUE,
        name VARCHAR(120) NOT NULL UNIQUE,
        symbol VARCHAR(8) NOT NULL,
        decimal_places INT NOT NULL DEFAULT 2,
        ${lifecycleColumnsSql()}
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${commonTableNames.warehouses} (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(32) NOT NULL UNIQUE,
        name VARCHAR(120) NOT NULL UNIQUE,
        country_id VARCHAR(64) NULL,
        state_id VARCHAR(64) NULL,
        district_id VARCHAR(64) NULL,
        city_id VARCHAR(64) NULL,
        pincode_id VARCHAR(64) NULL,
        address_line1 VARCHAR(160) NULL,
        address_line2 VARCHAR(160) NULL,
        description VARCHAR(255) NULL,
        ${lifecycleColumnsSql()},
        CONSTRAINT fk_common_warehouses_country FOREIGN KEY (country_id) REFERENCES ${commonTableNames.countries} (id),
        CONSTRAINT fk_common_warehouses_state FOREIGN KEY (state_id) REFERENCES ${commonTableNames.states} (id),
        CONSTRAINT fk_common_warehouses_district FOREIGN KEY (district_id) REFERENCES ${commonTableNames.districts} (id),
        CONSTRAINT fk_common_warehouses_city FOREIGN KEY (city_id) REFERENCES ${commonTableNames.cities} (id),
        CONSTRAINT fk_common_warehouses_pincode FOREIGN KEY (pincode_id) REFERENCES ${commonTableNames.pincodes} (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${commonTableNames.paymentTerms} (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(32) NOT NULL UNIQUE,
        name VARCHAR(120) NOT NULL UNIQUE,
        due_days INT NOT NULL DEFAULT 0,
        description VARCHAR(255) NULL,
        ${lifecycleColumnsSql()}
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await seedRows(db.execute.bind(db), commonTableNames.countries, ['id', 'code', 'name', 'phone_code'], [
      { id: 'country:IN', code: 'IN', name: 'India', phone_code: '+91' },
    ])
    await db.execute(`UPDATE ${commonTableNames.countries} SET is_active = 0 WHERE id <> 'country:IN'`)

    await seedRows(db.execute.bind(db), commonTableNames.states, ['id', 'country_id', 'code', 'name'], [
      { id: 'state:IN-TN', country_id: 'country:IN', code: 'TN', name: 'Tamil Nadu' },
      { id: 'state:IN-KA', country_id: 'country:IN', code: 'KA', name: 'Karnataka' },
      { id: 'state:IN-MH', country_id: 'country:IN', code: 'MH', name: 'Maharashtra' },
    ])

    await seedRows(db.execute.bind(db), commonTableNames.districts, ['id', 'state_id', 'code', 'name'], [
      { id: 'district:IN-TN-CHN', state_id: 'state:IN-TN', code: 'CHN', name: 'Chennai' },
      { id: 'district:IN-KA-BLR', state_id: 'state:IN-KA', code: 'BLR', name: 'Bengaluru Urban' },
      { id: 'district:IN-MH-MUM', state_id: 'state:IN-MH', code: 'MUM', name: 'Mumbai' },
    ])

    await seedRows(db.execute.bind(db), commonTableNames.cities, ['id', 'state_id', 'district_id', 'code', 'name'], [
      { id: 'city:IN-TN-CHENNAI', state_id: 'state:IN-TN', district_id: 'district:IN-TN-CHN', code: 'CHENNAI', name: 'Chennai' },
      { id: 'city:IN-KA-BENGALURU', state_id: 'state:IN-KA', district_id: 'district:IN-KA-BLR', code: 'BENGALURU', name: 'Bengaluru' },
      { id: 'city:IN-MH-MUMBAI', state_id: 'state:IN-MH', district_id: 'district:IN-MH-MUM', code: 'MUMBAI', name: 'Mumbai' },
    ])

    await seedRows(db.execute.bind(db), commonTableNames.pincodes, ['id', 'country_id', 'state_id', 'district_id', 'city_id', 'code', 'area_name'], [
      { id: 'pincode:600001', country_id: 'country:IN', state_id: 'state:IN-TN', district_id: 'district:IN-TN-CHN', city_id: 'city:IN-TN-CHENNAI', code: '600001', area_name: 'Parrys' },
      { id: 'pincode:560001', country_id: 'country:IN', state_id: 'state:IN-KA', district_id: 'district:IN-KA-BLR', city_id: 'city:IN-KA-BENGALURU', code: '560001', area_name: 'MG Road' },
      { id: 'pincode:400001', country_id: 'country:IN', state_id: 'state:IN-MH', district_id: 'district:IN-MH-MUM', city_id: 'city:IN-MH-MUMBAI', code: '400001', area_name: 'Fort' },
    ])

    await seedRows(db.execute.bind(db), commonTableNames.contactGroups, ['id', 'code', 'name', 'description'], [
      { id: 'contact-group:customer', code: 'CUSTOMER', name: 'Customer', description: 'Retail or wholesale buyers.' },
      { id: 'contact-group:supplier', code: 'SUPPLIER', name: 'Supplier', description: 'Raw material and merchandise suppliers.' },
      { id: 'contact-group:vendor', code: 'VENDOR', name: 'Vendor', description: 'Marketplace vendors.' },
      { id: 'contact-group:logistics', code: 'LOGISTICS', name: 'Logistics Partner', description: 'Transport and fulfilment partners.' },
    ])

    await seedRows(db.execute.bind(db), commonTableNames.contactTypes, ['id', 'code', 'name', 'description'], [
      { id: 'contact-type:company', code: 'COMPANY', name: 'Company', description: 'Organization or legal entity contact.' },
      { id: 'contact-type:individual', code: 'INDIVIDUAL', name: 'Individual', description: 'Personal contact.' },
      { id: 'contact-type:billing', code: 'BILLING', name: 'Billing', description: 'Billing contact role.' },
      { id: 'contact-type:shipping', code: 'SHIPPING', name: 'Shipping', description: 'Shipping contact role.' },
    ])

    await seedRows(db.execute.bind(db), commonTableNames.productGroups, ['id', 'code', 'name', 'description'], [
      { id: 'product-group:apparel', code: 'APPAREL', name: 'Apparel', description: 'Fashion and garment products.' },
      { id: 'product-group:electronics', code: 'ELECTRONICS', name: 'Electronics', description: 'Consumer electronics and accessories.' },
      { id: 'product-group:home', code: 'HOME', name: 'Home & Living', description: 'Home and living products.' },
      { id: 'product-group:grocery', code: 'GROCERY', name: 'Grocery', description: 'Grocery and essentials.' },
    ])

    await seedRows(db.execute.bind(db), commonTableNames.productCategories, ['id', 'code', 'name', 'description'], [
      { id: 'product-category:menswear', code: 'MENSWEAR', name: 'Menswear', description: 'Menswear catalog category.' },
      { id: 'product-category:womenswear', code: 'WOMENSWEAR', name: 'Womenswear', description: 'Womenswear catalog category.' },
      { id: 'product-category:footwear', code: 'FOOTWEAR', name: 'Footwear', description: 'Footwear category.' },
      { id: 'product-category:accessories', code: 'ACCESSORIES', name: 'Accessories', description: 'Accessory category.' },
    ])

    await seedRows(db.execute.bind(db), commonTableNames.productTypes, ['id', 'code', 'name', 'description'], [
      { id: 'product-type:finished-goods', code: 'FINISHED_GOODS', name: 'Finished Goods', description: 'Sellable finished inventory.' },
      { id: 'product-type:service', code: 'SERVICE', name: 'Service', description: 'Service or non-stock item.' },
      { id: 'product-type:bundle', code: 'BUNDLE', name: 'Bundle', description: 'Composite product bundle.' },
    ])

    await seedRows(db.execute.bind(db), commonTableNames.units, ['id', 'code', 'name', 'symbol', 'description'], [
      { id: 'unit:nos', code: 'NOS', name: 'Numbers', symbol: 'Nos', description: 'Counted units.' },
      { id: 'unit:pcs', code: 'PCS', name: 'Pieces', symbol: 'Pcs', description: 'Pieces.' },
      { id: 'unit:box', code: 'BOX', name: 'Box', symbol: 'Box', description: 'Box quantity.' },
      { id: 'unit:kg', code: 'KG', name: 'Kilogram', symbol: 'kg', description: 'Weight in kilograms.' },
      { id: 'unit:ltr', code: 'LTR', name: 'Litre', symbol: 'L', description: 'Liquid litre unit.' },
    ])

    await seedRows(db.execute.bind(db), commonTableNames.hsnCodes, ['id', 'code', 'name', 'description'], [
      { id: 'hsn:610910', code: '610910', name: 'Cotton T-Shirts', description: 'Knitted or crocheted T-shirts of cotton.' },
      { id: 'hsn:420221', code: '420221', name: 'Handbags', description: 'Handbags with outer surface of leather.' },
      { id: 'hsn:851712', code: '851712', name: 'Smartphones', description: 'Telephones for cellular networks or other wireless networks.' },
    ])

    await seedRows(db.execute.bind(db), commonTableNames.taxes, ['id', 'code', 'name', 'tax_type', 'rate_percent', 'description'], [
      { id: 'tax:gst-0', code: 'GST_0', name: 'GST 0%', tax_type: 'GST', rate_percent: 0, description: 'Nil-rated GST.' },
      { id: 'tax:gst-5', code: 'GST_5', name: 'GST 5%', tax_type: 'GST', rate_percent: 5, description: 'Low-rate GST.' },
      { id: 'tax:gst-12', code: 'GST_12', name: 'GST 12%', tax_type: 'GST', rate_percent: 12, description: 'Standard GST slab.' },
      { id: 'tax:gst-18', code: 'GST_18', name: 'GST 18%', tax_type: 'GST', rate_percent: 18, description: 'Standard GST slab.' },
      { id: 'tax:gst-28', code: 'GST_28', name: 'GST 28%', tax_type: 'GST', rate_percent: 28, description: 'High GST slab.' },
    ])

    await seedRows(db.execute.bind(db), commonTableNames.brands, ['id', 'code', 'name', 'description'], [
      { id: 'brand:codexsun', code: 'CODEXSUN', name: 'CODEXSUN', description: 'Default internal brand.' },
      { id: 'brand:generic', code: 'GENERIC', name: 'Generic', description: 'Unbranded merchandise.' },
    ])

    await seedRows(db.execute.bind(db), commonTableNames.colours, ['id', 'code', 'name', 'hex_code', 'description'], [
      { id: 'colour:black', code: 'BLACK', name: 'Black', hex_code: '#000000', description: 'Black tone.' },
      { id: 'colour:white', code: 'WHITE', name: 'White', hex_code: '#FFFFFF', description: 'White tone.' },
      { id: 'colour:blue', code: 'BLUE', name: 'Blue', hex_code: '#2563EB', description: 'Blue tone.' },
      { id: 'colour:red', code: 'RED', name: 'Red', hex_code: '#DC2626', description: 'Red tone.' },
    ])

    await seedRows(db.execute.bind(db), commonTableNames.sizes, ['id', 'code', 'name', 'sort_order', 'description'], [
      { id: 'size:xs', code: 'XS', name: 'Extra Small', sort_order: 1, description: 'XS size.' },
      { id: 'size:s', code: 'S', name: 'Small', sort_order: 2, description: 'S size.' },
      { id: 'size:m', code: 'M', name: 'Medium', sort_order: 3, description: 'M size.' },
      { id: 'size:l', code: 'L', name: 'Large', sort_order: 4, description: 'L size.' },
      { id: 'size:xl', code: 'XL', name: 'Extra Large', sort_order: 5, description: 'XL size.' },
      { id: 'size:free', code: 'FREE', name: 'Free Size', sort_order: 99, description: 'Universal size.' },
    ])

    await seedRows(db.execute.bind(db), commonTableNames.currencies, ['id', 'code', 'name', 'symbol', 'decimal_places'], [
      { id: 'currency:INR', code: 'INR', name: 'Indian Rupee', symbol: 'Rs', decimal_places: 2 },
      { id: 'currency:USD', code: 'USD', name: 'US Dollar', symbol: '$', decimal_places: 2 },
      { id: 'currency:AED', code: 'AED', name: 'UAE Dirham', symbol: 'AED', decimal_places: 2 },
    ])

    await seedRows(db.execute.bind(db), commonTableNames.orderTypes, ['id', 'code', 'name', 'description'], [
      { id: 'order-type:sales', code: 'SALES_ORDER', name: 'Sales Order', description: 'Customer sales order.' },
      { id: 'order-type:purchase', code: 'PURCHASE_ORDER', name: 'Purchase Order', description: 'Supplier purchase order.' },
      { id: 'order-type:sales-return', code: 'SALES_RETURN', name: 'Sales Return', description: 'Customer return order.' },
      { id: 'order-type:purchase-return', code: 'PURCHASE_RETURN', name: 'Purchase Return', description: 'Supplier return order.' },
    ])

    await seedRows(db.execute.bind(db), commonTableNames.styles, ['id', 'code', 'name', 'description'], [
      { id: 'style:casual', code: 'CASUAL', name: 'Casual', description: 'Casual product style.' },
      { id: 'style:formal', code: 'FORMAL', name: 'Formal', description: 'Formal product style.' },
      { id: 'style:ethnic', code: 'ETHNIC', name: 'Ethnic', description: 'Ethnic product style.' },
      { id: 'style:sport', code: 'SPORT', name: 'Sport', description: 'Sport or athleisure style.' },
    ])

    await seedRows(db.execute.bind(db), commonTableNames.transports, ['id', 'code', 'name', 'description'], [
      { id: 'transport:road', code: 'ROAD', name: 'Road', description: 'Road freight and local delivery.' },
      { id: 'transport:air', code: 'AIR', name: 'Air', description: 'Air cargo transport.' },
      { id: 'transport:sea', code: 'SEA', name: 'Sea', description: 'Sea or ocean freight.' },
      { id: 'transport:courier', code: 'COURIER', name: 'Courier', description: 'Courier parcel delivery.' },
    ])

    await seedRows(db.execute.bind(db), commonTableNames.destinations, ['id', 'code', 'name', 'description'], [
      { id: 'destination:domestic', code: 'DOMESTIC', name: 'Domestic', description: 'Domestic destination.' },
      { id: 'destination:international', code: 'INTERNATIONAL', name: 'International', description: 'International destination.' },
      { id: 'destination:warehouse-transfer', code: 'WAREHOUSE_TRANSFER', name: 'Warehouse Transfer', description: 'Internal warehouse movement destination.' },
    ])

    await seedRows(db.execute.bind(db), commonTableNames.paymentTerms, ['id', 'code', 'name', 'due_days', 'description'], [
      { id: 'payment-term:immediate', code: 'IMMEDIATE', name: 'Immediate', due_days: 0, description: 'Payment due immediately.' },
      { id: 'payment-term:net-7', code: 'NET_7', name: 'Net 7', due_days: 7, description: 'Payment due in 7 days.' },
      { id: 'payment-term:net-15', code: 'NET_15', name: 'Net 15', due_days: 15, description: 'Payment due in 15 days.' },
      { id: 'payment-term:net-30', code: 'NET_30', name: 'Net 30', due_days: 30, description: 'Payment due in 30 days.' },
    ])

    await seedRows(db.execute.bind(db), commonTableNames.warehouses, ['id', 'code', 'name', 'country_id', 'state_id', 'district_id', 'city_id', 'pincode_id', 'address_line1', 'address_line2', 'description'], [
      {
        id: 'warehouse:main',
        code: 'MAIN',
        name: 'Main Warehouse',
        country_id: 'country:IN',
        state_id: 'state:IN-TN',
        district_id: 'district:IN-TN-CHN',
        city_id: 'city:IN-TN-CHENNAI',
        pincode_id: 'pincode:600001',
        address_line1: '1 Harbour Estate',
        address_line2: 'George Town',
        description: 'Primary warehouse for bootstrap inventory operations.',
      },
    ])
  },
}


