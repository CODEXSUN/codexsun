import { commonTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

export const commonUnknownDefaultsMigration: Migration = {
  id: '007-common-unknown-defaults',
  name: 'Common unknown fallback records',
  async up({ db }) {
    const execute = db.execute.bind(db)

    await execute(
      `INSERT INTO ${commonTableNames.countries} (id, code, name, phone_code) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE code = VALUES(code), name = VALUES(name), phone_code = VALUES(phone_code), is_active = 1`,
      ['1', '-', '-', '-'],
    )

    await execute(
      `INSERT INTO ${commonTableNames.states} (id, country_id, code, name) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE country_id = VALUES(country_id), code = VALUES(code), name = VALUES(name), is_active = 1`,
      ['1', '1', '-', '-'],
    )

    await execute(
      `INSERT INTO ${commonTableNames.districts} (id, state_id, code, name) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE state_id = VALUES(state_id), code = VALUES(code), name = VALUES(name), is_active = 1`,
      ['1', '1', '-', '-'],
    )

    await execute(
      `INSERT INTO ${commonTableNames.cities} (id, state_id, district_id, code, name) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE state_id = VALUES(state_id), district_id = VALUES(district_id), code = VALUES(code), name = VALUES(name), is_active = 1`,
      ['1', '1', '1', '-', '-'],
    )

    await execute(
      `INSERT INTO ${commonTableNames.pincodes} (id, country_id, state_id, district_id, city_id, code, area_name) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE country_id = VALUES(country_id), state_id = VALUES(state_id), district_id = VALUES(district_id), city_id = VALUES(city_id), code = VALUES(code), area_name = VALUES(area_name), is_active = 1`,
      ['1', '1', '1', '1', '1', '-', '-'],
    )

    await execute(
      `INSERT INTO ${commonTableNames.contactGroups} (id, code, name, description) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE code = VALUES(code), name = VALUES(name), description = VALUES(description), is_active = 1`,
      ['1', '-', '-', 'Default or unknown contact group.'],
    )

    await execute(
      `INSERT INTO ${commonTableNames.contactTypes} (id, code, name, description) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE code = VALUES(code), name = VALUES(name), description = VALUES(description), is_active = 1`,
      ['1', '-', '-', 'Default or unknown contact type.'],
    )

    await execute(
      `INSERT INTO ${commonTableNames.productGroups} (id, code, name, description) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE code = VALUES(code), name = VALUES(name), description = VALUES(description), is_active = 1`,
      ['1', '-', '-', 'Default or unknown product group.'],
    )

    await execute(
      `INSERT INTO ${commonTableNames.productCategories} (id, code, name, description) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE code = VALUES(code), name = VALUES(name), description = VALUES(description), is_active = 1`,
      ['1', '-', '-', 'Default or unknown product category.'],
    )

    await execute(
      `INSERT INTO ${commonTableNames.productTypes} (id, code, name, description) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE code = VALUES(code), name = VALUES(name), description = VALUES(description), is_active = 1`,
      ['1', '-', '-', 'Default or unknown product type.'],
    )

    await execute(
      `INSERT INTO ${commonTableNames.units} (id, code, name, symbol, description) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE code = VALUES(code), name = VALUES(name), symbol = VALUES(symbol), description = VALUES(description), is_active = 1`,
      ['1', '-', '-', '-', 'Default or unknown unit.'],
    )

    await execute(
      `INSERT INTO ${commonTableNames.hsnCodes} (id, code, name, description) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE code = VALUES(code), name = VALUES(name), description = VALUES(description), is_active = 1`,
      ['1', '-', '-', 'Default or unknown HSN code.'],
    )

    await execute(
      `INSERT INTO ${commonTableNames.taxes} (id, code, name, tax_type, rate_percent, description) VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE code = VALUES(code), name = VALUES(name), tax_type = VALUES(tax_type), rate_percent = VALUES(rate_percent), description = VALUES(description), is_active = 1`,
      ['1', '-', '-', '-', 0, 'Default or unknown tax.'],
    )

    await execute(
      `INSERT INTO ${commonTableNames.brands} (id, code, name, description) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE code = VALUES(code), name = VALUES(name), description = VALUES(description), is_active = 1`,
      ['1', '-', '-', 'Default or unknown brand.'],
    )

    await execute(
      `INSERT INTO ${commonTableNames.colours} (id, code, name, hex_code, description) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE code = VALUES(code), name = VALUES(name), hex_code = VALUES(hex_code), description = VALUES(description), is_active = 1`,
      ['1', '-', '-', '#000000', 'Default or unknown colour.'],
    )

    await execute(
      `INSERT INTO ${commonTableNames.sizes} (id, code, name, sort_order, description) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE code = VALUES(code), name = VALUES(name), sort_order = VALUES(sort_order), description = VALUES(description), is_active = 1`,
      ['1', '-', '-', 0, 'Default or unknown size.'],
    )

    await execute(
      `INSERT INTO ${commonTableNames.currencies} (id, code, name, symbol, decimal_places) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE code = VALUES(code), name = VALUES(name), symbol = VALUES(symbol), decimal_places = VALUES(decimal_places), is_active = 1`,
      ['1', '-', '-', '-', 2],
    )

    await execute(
      `INSERT INTO ${commonTableNames.orderTypes} (id, code, name, description) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE code = VALUES(code), name = VALUES(name), description = VALUES(description), is_active = 1`,
      ['1', '-', '-', 'Default or unknown order type.'],
    )

    await execute(
      `INSERT INTO ${commonTableNames.styles} (id, code, name, description) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE code = VALUES(code), name = VALUES(name), description = VALUES(description), is_active = 1`,
      ['1', '-', '-', 'Default or unknown style.'],
    )

    await execute(
      `INSERT INTO ${commonTableNames.transports} (id, code, name, description) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE code = VALUES(code), name = VALUES(name), description = VALUES(description), is_active = 1`,
      ['1', '-', '-', 'Default or unknown transport.'],
    )

    await execute(
      `INSERT INTO ${commonTableNames.destinations} (id, code, name, description) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE code = VALUES(code), name = VALUES(name), description = VALUES(description), is_active = 1`,
      ['1', '-', '-', 'Default or unknown destination.'],
    )

    await execute(
      `INSERT INTO ${commonTableNames.warehouses} (id, code, name, country_id, state_id, district_id, city_id, pincode_id, address_line1, address_line2, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE code = VALUES(code), name = VALUES(name), country_id = VALUES(country_id), state_id = VALUES(state_id), district_id = VALUES(district_id), city_id = VALUES(city_id), pincode_id = VALUES(pincode_id), address_line1 = VALUES(address_line1), address_line2 = VALUES(address_line2), description = VALUES(description), is_active = 1`,
      ['1', '-', '-', '1', '1', '1', '1', '1', '-', '-', 'Default or unknown warehouse.'],
    )

    await execute(
      `INSERT INTO ${commonTableNames.paymentTerms} (id, code, name, due_days, description) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE code = VALUES(code), name = VALUES(name), due_days = VALUES(due_days), description = VALUES(description), is_active = 1`,
      ['1', '-', '-', 0, 'Default or unknown payment term.'],
    )
  },
}


