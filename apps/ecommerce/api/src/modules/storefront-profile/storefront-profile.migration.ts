import { sql, type Kysely } from "kysely";
import type { EcommerceDatabase } from "../../database/ecommerce-database.js";

export const storefrontProfileMigration = {
  description: "White-label storefront profile and footer settings.",
  key: "ecommerce.storefront.profile"
} as const;

export async function migrateStorefrontProfileModule(database: Kysely<EcommerceDatabase>) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS ecommerce_storefront_profiles (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(8) NOT NULL UNIQUE,
    profile_key VARCHAR(32) NOT NULL UNIQUE,
    tagline VARCHAR(240) NOT NULL DEFAULT '',
    about_us TEXT NOT NULL,
    copyright_text VARCHAR(240) NOT NULL DEFAULT '',
    powered_by_text VARCHAR(240) NOT NULL DEFAULT '',
    linkedin_url VARCHAR(500) NOT NULL DEFAULT '',
    instagram_url VARCHAR(500) NOT NULL DEFAULT '',
    x_url VARCHAR(500) NOT NULL DEFAULT '',
    status VARCHAR(24) NOT NULL DEFAULT 'active',
    created_by VARCHAR(191) NOT NULL DEFAULT 'system:migration',
    updated_by VARCHAR(191) NOT NULL DEFAULT 'system:migration',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`
    )
    .execute(database);
}

export const storefrontProfileSocialLinksMigration = {
  description: "Additional configurable storefront social links.",
  key: "ecommerce.storefront.profile.social-links"
} as const;

export async function upgradeStorefrontProfileSocialLinks(database: Kysely<EcommerceDatabase>) {
  await sql
    .raw(
      `ALTER TABLE ecommerce_storefront_profiles
    ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(500) NOT NULL DEFAULT '' AFTER powered_by_text,
    ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(500) NOT NULL DEFAULT '' AFTER x_url,
    ADD COLUMN IF NOT EXISTS whatsapp_url VARCHAR(500) NOT NULL DEFAULT '' AFTER youtube_url,
    ADD COLUMN IF NOT EXISTS threads_url VARCHAR(500) NOT NULL DEFAULT '' AFTER whatsapp_url`
    )
    .execute(database);
}

export const storefrontProfileUxContentMigration = {
  description: "Editable trusted-strip and service-banner storefront content.",
  key: "ecommerce.storefront.profile.ux-content"
} as const;

export async function upgradeStorefrontProfileUxContent(database: Kysely<EcommerceDatabase>) {
  await sql
    .raw(
      `ALTER TABLE ecommerce_storefront_profiles
    ADD COLUMN IF NOT EXISTS trusted_eyebrow VARCHAR(120) NOT NULL DEFAULT 'Trusted in Tiruppur since 2002',
    ADD COLUMN IF NOT EXISTS trusted_title VARCHAR(240) NOT NULL DEFAULT '25+ years of practical technology experience',
    ADD COLUMN IF NOT EXISTS trusted_description VARCHAR(500) NOT NULL DEFAULT 'We help you choose technology that fits the work, set it up properly, and keep it useful as your needs grow.',
    ADD COLUMN IF NOT EXISTS trusted_proof_points VARCHAR(1000) NOT NULL DEFAULT 'Multi-brand guidance\\nLocal technical support\\nRetail and business expertise',
    ADD COLUMN IF NOT EXISTS service_eyebrow VARCHAR(120) NOT NULL DEFAULT 'Tech Media care',
    ADD COLUMN IF NOT EXISTS service_title VARCHAR(240) NOT NULL DEFAULT 'Technology works better with support close by.',
    ADD COLUMN IF NOT EXISTS service_description VARCHAR(500) NOT NULL DEFAULT 'Local help for products, installation, maintenance, and ongoing technology needs.',
    ADD COLUMN IF NOT EXISTS service_action_label VARCHAR(120) NOT NULL DEFAULT 'Get support',
    ADD COLUMN IF NOT EXISTS service_action_url VARCHAR(500) NOT NULL DEFAULT '/support'`
    )
    .execute(database);
}

export const storefrontProfilePaymentMethodsMigration = {
  description: "Ordered footer payment methods managed by Storefront Profile.",
  key: "ecommerce.storefront.profile.payment-methods"
} as const;

export async function upgradeStorefrontProfilePaymentMethods(database: Kysely<EcommerceDatabase>) {
  await sql
    .raw(
      `ALTER TABLE ecommerce_storefront_profiles
    ADD COLUMN IF NOT EXISTS payment_methods_json LONGTEXT NULL AFTER powered_by_text`
    )
    .execute(database);
  await sql
    .raw(
      `UPDATE ecommerce_storefront_profiles
    SET payment_methods_json='[{"name":"VISA","logoUrl":""},{"name":"Mastercard","logoUrl":""},{"name":"UPI","logoUrl":""},{"name":"G Pay","logoUrl":""}]'
    WHERE payment_methods_json IS NULL OR TRIM(payment_methods_json)=''`
    )
    .execute(database);
}
