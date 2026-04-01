import { commonTableNames, productTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

function lifecycleColumnsSql() {
  return `
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  `
}

export const productFoundationMigration: Migration = {
  id: '005-product-foundation',
  name: 'Product master foundation',
  async up({ db }) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${commonTableNames.productCategories} (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(32) NOT NULL UNIQUE,
        name VARCHAR(120) NOT NULL UNIQUE,
        description VARCHAR(255) NULL,
        ${lifecycleColumnsSql()}
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(
      `
        INSERT INTO ${commonTableNames.productCategories} (id, code, name, description)
        VALUES (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          code = VALUES(code),
          name = VALUES(name),
          description = VALUES(description),
          is_active = 1
      `,
      [
        'product-category:menswear', 'MENSWEAR', 'Menswear', 'Menswear catalog category.',
        'product-category:womenswear', 'WOMENSWEAR', 'Womenswear', 'Womenswear catalog category.',
        'product-category:footwear', 'FOOTWEAR', 'Footwear', 'Footwear category.',
        'product-category:accessories', 'ACCESSORIES', 'Accessories', 'Accessory category.',
      ],
    )

    await db.execute(
      `
        INSERT INTO ${commonTableNames.brands} (id, code, name, description)
        VALUES (?, ?, ?, ?), (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          code = VALUES(code),
          name = VALUES(name),
          description = VALUES(description),
          is_active = 1
      `,
      [
        'brand:codexsun', 'CODEXSUN', 'CODEXSUN', 'Default internal brand.',
        'brand:generic', 'GENERIC', 'Generic', 'Unbranded merchandise.',
      ],
    )

    await db.execute(
      `
        INSERT INTO ${commonTableNames.productGroups} (id, code, name, description)
        VALUES (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          code = VALUES(code),
          name = VALUES(name),
          description = VALUES(description),
          is_active = 1
      `,
      [
        'product-group:apparel', 'APPAREL', 'Apparel', 'Fashion and garment products.',
        'product-group:electronics', 'ELECTRONICS', 'Electronics', 'Consumer electronics and accessories.',
        'product-group:home', 'HOME', 'Home & Living', 'Home and living products.',
        'product-group:grocery', 'GROCERY', 'Grocery', 'Grocery and essentials.',
      ],
    )

    await db.execute(
      `
        INSERT INTO ${commonTableNames.productTypes} (id, code, name, description)
        VALUES (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          code = VALUES(code),
          name = VALUES(name),
          description = VALUES(description),
          is_active = 1
      `,
      [
        'product-type:finished-goods', 'FINISHED_GOODS', 'Finished Goods', 'Sellable finished inventory.',
        'product-type:service', 'SERVICE', 'Service', 'Service or non-stock item.',
        'product-type:bundle', 'BUNDLE', 'Bundle', 'Composite product bundle.',
      ],
    )

    await db.execute(
      `
        INSERT INTO ${commonTableNames.units} (id, code, name, symbol, description)
        VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          code = VALUES(code),
          name = VALUES(name),
          symbol = VALUES(symbol),
          description = VALUES(description),
          is_active = 1
      `,
      [
        'unit:nos', 'NOS', 'Numbers', 'Nos', 'Counted units.',
        'unit:pcs', 'PCS', 'Pieces', 'Pcs', 'Pieces.',
        'unit:box', 'BOX', 'Box', 'Box', 'Box quantity.',
        'unit:kg', 'KG', 'Kilogram', 'kg', 'Weight in kilograms.',
        'unit:ltr', 'LTR', 'Litre', 'L', 'Liquid litre unit.',
      ],
    )

    await db.execute(
      `
        INSERT INTO ${commonTableNames.hsnCodes} (id, code, name, description)
        VALUES (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          code = VALUES(code),
          name = VALUES(name),
          description = VALUES(description),
          is_active = 1
      `,
      [
        'hsn:610910', '610910', 'Cotton T-Shirts', 'Knitted or crocheted T-shirts of cotton.',
        'hsn:420221', '420221', 'Handbags', 'Handbags with outer surface of leather.',
        'hsn:851712', '851712', 'Smartphones', 'Telephones for cellular networks or other wireless networks.',
      ],
    )

    await db.execute(
      `
        INSERT INTO ${commonTableNames.styles} (id, code, name, description)
        VALUES (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          code = VALUES(code),
          name = VALUES(name),
          description = VALUES(description),
          is_active = 1
      `,
      [
        'style:casual', 'CASUAL', 'Casual', 'Casual product style.',
        'style:formal', 'FORMAL', 'Formal', 'Formal product style.',
        'style:ethnic', 'ETHNIC', 'Ethnic', 'Ethnic product style.',
        'style:sport', 'SPORT', 'Sport', 'Sport or athleisure style.',
      ],
    )

    await db.execute(
      `
        INSERT INTO ${commonTableNames.taxes} (id, code, name, tax_type, rate_percent, description)
        VALUES (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          code = VALUES(code),
          name = VALUES(name),
          tax_type = VALUES(tax_type),
          rate_percent = VALUES(rate_percent),
          description = VALUES(description),
          is_active = 1
      `,
      [
        'tax:gst-0', 'GST_0', 'GST 0%', 'GST', 0, 'Nil-rated GST.',
        'tax:gst-5', 'GST_5', 'GST 5%', 'GST', 5, 'Low-rate GST.',
        'tax:gst-12', 'GST_12', 'GST 12%', 'GST', 12, 'Standard GST slab.',
        'tax:gst-18', 'GST_18', 'GST 18%', 'GST', 18, 'Standard GST slab.',
        'tax:gst-28', 'GST_28', 'GST 28%', 'GST', 28, 'High GST slab.',
      ],
    )

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${productTableNames.products} (
        id VARCHAR(64) PRIMARY KEY,
        uuid VARCHAR(64) NOT NULL UNIQUE,
        name VARCHAR(200) NOT NULL,
        slug VARCHAR(250) NOT NULL UNIQUE,
        description TEXT NULL,
        short_description VARCHAR(500) NULL,
        brand_id VARCHAR(64) NULL,
        category_id VARCHAR(64) NULL,
        product_group_id VARCHAR(64) NULL,
        product_type_id VARCHAR(64) NULL,
        unit_id VARCHAR(64) NULL,
        hsn_code_id VARCHAR(64) NULL,
        style_id VARCHAR(64) NULL,
        sku VARCHAR(100) NOT NULL UNIQUE,
        has_variants TINYINT(1) NOT NULL DEFAULT 0,
        base_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
        cost_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
        tax_id VARCHAR(64) NULL,
        is_featured TINYINT(1) NOT NULL DEFAULT 0,
        ${lifecycleColumnsSql()},
        CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES ${commonTableNames.brands}(id),
        CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES ${commonTableNames.productCategories}(id),
        CONSTRAINT fk_products_group FOREIGN KEY (product_group_id) REFERENCES ${commonTableNames.productGroups}(id),
        CONSTRAINT fk_products_type FOREIGN KEY (product_type_id) REFERENCES ${commonTableNames.productTypes}(id),
        CONSTRAINT fk_products_unit FOREIGN KEY (unit_id) REFERENCES ${commonTableNames.units}(id),
        CONSTRAINT fk_products_hsn FOREIGN KEY (hsn_code_id) REFERENCES ${commonTableNames.hsnCodes}(id),
        CONSTRAINT fk_products_style FOREIGN KEY (style_id) REFERENCES ${commonTableNames.styles}(id),
        CONSTRAINT fk_products_tax FOREIGN KEY (tax_id) REFERENCES ${commonTableNames.taxes}(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${productTableNames.variants} (
        id VARCHAR(64) PRIMARY KEY,
        product_id VARCHAR(64) NOT NULL,
        sku VARCHAR(100) NOT NULL,
        variant_name VARCHAR(200) NOT NULL,
        price DECIMAL(15, 2) NOT NULL DEFAULT 0,
        cost_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
        stock_quantity DECIMAL(15, 2) NOT NULL DEFAULT 0,
        opening_stock DECIMAL(15, 2) NOT NULL DEFAULT 0,
        weight DECIMAL(10, 2) NULL,
        barcode VARCHAR(100) NULL,
        ${lifecycleColumnsSql()},
        UNIQUE KEY uq_product_variants_product_sku (product_id, sku),
        CONSTRAINT fk_product_variants_product FOREIGN KEY (product_id) REFERENCES ${productTableNames.products}(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${productTableNames.variantAttributes} (
        id VARCHAR(64) PRIMARY KEY,
        variant_id VARCHAR(64) NOT NULL,
        attribute_name VARCHAR(100) NOT NULL,
        attribute_value VARCHAR(100) NOT NULL,
        ${lifecycleColumnsSql()},
        CONSTRAINT fk_product_variant_attributes_variant FOREIGN KEY (variant_id) REFERENCES ${productTableNames.variants}(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${productTableNames.images} (
        id VARCHAR(64) PRIMARY KEY,
        product_id VARCHAR(64) NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        is_primary TINYINT(1) NOT NULL DEFAULT 0,
        sort_order INT NOT NULL DEFAULT 0,
        ${lifecycleColumnsSql()},
        CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES ${productTableNames.products}(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${productTableNames.variantImages} (
        id VARCHAR(64) PRIMARY KEY,
        variant_id VARCHAR(64) NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        is_primary TINYINT(1) NOT NULL DEFAULT 0,
        ${lifecycleColumnsSql()},
        CONSTRAINT fk_product_variant_images_variant FOREIGN KEY (variant_id) REFERENCES ${productTableNames.variants}(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${productTableNames.stockItems} (
        id VARCHAR(64) PRIMARY KEY,
        product_id VARCHAR(64) NOT NULL,
        variant_id VARCHAR(64) NULL,
        warehouse_id VARCHAR(64) NOT NULL,
        quantity DECIMAL(15, 2) NOT NULL DEFAULT 0,
        reserved_quantity DECIMAL(15, 2) NOT NULL DEFAULT 0,
        ${lifecycleColumnsSql()},
        CONSTRAINT fk_stock_items_product FOREIGN KEY (product_id) REFERENCES ${productTableNames.products}(id),
        CONSTRAINT fk_stock_items_variant FOREIGN KEY (variant_id) REFERENCES ${productTableNames.variants}(id),
        CONSTRAINT fk_stock_items_warehouse FOREIGN KEY (warehouse_id) REFERENCES ${commonTableNames.warehouses}(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${productTableNames.stockMovements} (
        id VARCHAR(64) PRIMARY KEY,
        product_id VARCHAR(64) NOT NULL,
        variant_id VARCHAR(64) NULL,
        warehouse_id VARCHAR(64) NULL,
        movement_type VARCHAR(50) NOT NULL,
        quantity DECIMAL(15, 2) NOT NULL DEFAULT 0,
        reference_type VARCHAR(50) NULL,
        reference_id VARCHAR(64) NULL,
        movement_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ${lifecycleColumnsSql()},
        CONSTRAINT fk_stock_movements_product FOREIGN KEY (product_id) REFERENCES ${productTableNames.products}(id),
        CONSTRAINT fk_stock_movements_variant FOREIGN KEY (variant_id) REFERENCES ${productTableNames.variants}(id),
        CONSTRAINT fk_stock_movements_warehouse FOREIGN KEY (warehouse_id) REFERENCES ${commonTableNames.warehouses}(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${productTableNames.prices} (
        id VARCHAR(64) PRIMARY KEY,
        product_id VARCHAR(64) NOT NULL,
        variant_id VARCHAR(64) NULL,
        mrp DECIMAL(15, 2) NOT NULL DEFAULT 0,
        selling_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
        cost_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
        ${lifecycleColumnsSql()},
        CONSTRAINT fk_product_prices_product FOREIGN KEY (product_id) REFERENCES ${productTableNames.products}(id),
        CONSTRAINT fk_product_prices_variant FOREIGN KEY (variant_id) REFERENCES ${productTableNames.variants}(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${productTableNames.discounts} (
        id VARCHAR(64) PRIMARY KEY,
        product_id VARCHAR(64) NOT NULL,
        variant_id VARCHAR(64) NULL,
        discount_type VARCHAR(50) NOT NULL,
        discount_value DECIMAL(15, 2) NOT NULL DEFAULT 0,
        start_date DATE NULL,
        end_date DATE NULL,
        ${lifecycleColumnsSql()},
        CONSTRAINT fk_product_discounts_product FOREIGN KEY (product_id) REFERENCES ${productTableNames.products}(id),
        CONSTRAINT fk_product_discounts_variant FOREIGN KEY (variant_id) REFERENCES ${productTableNames.variants}(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${productTableNames.offers} (
        id VARCHAR(64) PRIMARY KEY,
        product_id VARCHAR(64) NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT NULL,
        offer_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
        start_date DATE NULL,
        end_date DATE NULL,
        ${lifecycleColumnsSql()},
        CONSTRAINT fk_product_offers_product FOREIGN KEY (product_id) REFERENCES ${productTableNames.products}(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${productTableNames.attributes} (
        id VARCHAR(64) PRIMARY KEY,
        product_id VARCHAR(64) NOT NULL,
        name VARCHAR(100) NOT NULL,
        ${lifecycleColumnsSql()},
        UNIQUE KEY uq_product_attributes_product_name (product_id, name),
        CONSTRAINT fk_product_attributes_product FOREIGN KEY (product_id) REFERENCES ${productTableNames.products}(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${productTableNames.attributeValues} (
        id VARCHAR(64) PRIMARY KEY,
        product_id VARCHAR(64) NOT NULL,
        attribute_id VARCHAR(64) NOT NULL,
        value VARCHAR(100) NOT NULL,
        ${lifecycleColumnsSql()},
        UNIQUE KEY uq_product_attribute_values_attribute_value (attribute_id, value),
        CONSTRAINT fk_product_attribute_values_product FOREIGN KEY (product_id) REFERENCES ${productTableNames.products}(id),
        CONSTRAINT fk_product_attribute_values_attribute FOREIGN KEY (attribute_id) REFERENCES ${productTableNames.attributes}(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${productTableNames.variantMap} (
        id VARCHAR(64) PRIMARY KEY,
        product_id VARCHAR(64) NOT NULL,
        attribute_id VARCHAR(64) NOT NULL,
        value_id VARCHAR(64) NOT NULL,
        ${lifecycleColumnsSql()},
        CONSTRAINT fk_product_variant_map_product FOREIGN KEY (product_id) REFERENCES ${productTableNames.products}(id),
        CONSTRAINT fk_product_variant_map_attribute FOREIGN KEY (attribute_id) REFERENCES ${productTableNames.attributes}(id),
        CONSTRAINT fk_product_variant_map_value FOREIGN KEY (value_id) REFERENCES ${productTableNames.attributeValues}(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${productTableNames.seo} (
        id VARCHAR(64) PRIMARY KEY,
        product_id VARCHAR(64) NOT NULL UNIQUE,
        meta_title VARCHAR(200) NULL,
        meta_description VARCHAR(500) NULL,
        meta_keywords VARCHAR(500) NULL,
        ${lifecycleColumnsSql()},
        CONSTRAINT fk_product_seo_product FOREIGN KEY (product_id) REFERENCES ${productTableNames.products}(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${productTableNames.reviews} (
        id VARCHAR(64) PRIMARY KEY,
        product_id VARCHAR(64) NOT NULL,
        user_id VARCHAR(64) NULL,
        rating INT NOT NULL,
        review TEXT NULL,
        review_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ${lifecycleColumnsSql()},
        CONSTRAINT fk_product_reviews_product FOREIGN KEY (product_id) REFERENCES ${productTableNames.products}(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${productTableNames.tags} (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        ${lifecycleColumnsSql()}
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${productTableNames.tagMap} (
        id VARCHAR(64) PRIMARY KEY,
        product_id VARCHAR(64) NOT NULL,
        tag_id VARCHAR(64) NOT NULL,
        ${lifecycleColumnsSql()},
        UNIQUE KEY uq_product_tag_map_product_tag (product_id, tag_id),
        CONSTRAINT fk_product_tag_map_product FOREIGN KEY (product_id) REFERENCES ${productTableNames.products}(id),
        CONSTRAINT fk_product_tag_map_tag FOREIGN KEY (tag_id) REFERENCES ${productTableNames.tags}(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
  },
}


