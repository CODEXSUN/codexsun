import { authTableNames, customerTableNames, productTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

export const customerAccountRecoveryMigration: Migration = {
  id: '017-customer-account-recovery',
  name: 'Customer account deletion grace period and recovery',
  async up({ db }) {
    await db.execute(`
      ALTER TABLE ${authTableNames.users}
      ADD COLUMN deletion_requested_at DATETIME NULL AFTER is_active
    `).catch(() => undefined)

    await db.execute(`
      ALTER TABLE ${authTableNames.users}
      ADD COLUMN purge_after_at DATETIME NULL AFTER deletion_requested_at
    `).catch(() => undefined)

    await db.execute(`
      CREATE INDEX idx_auth_users_purge_after_at
      ON ${authTableNames.users} (purge_after_at)
    `).catch(() => undefined)

    await db.execute(`
      ALTER TABLE ${productTableNames.reviews}
      DROP FOREIGN KEY fk_product_reviews_user
    `).catch(() => undefined)

    await db.execute(`
      ALTER TABLE ${productTableNames.reviews}
      ADD CONSTRAINT fk_product_reviews_user
      FOREIGN KEY (user_id) REFERENCES ${authTableNames.users}(id)
      ON DELETE SET NULL
    `).catch(() => undefined)

    await db.execute(`
      ALTER TABLE ${customerTableNames.deliveryAddresses}
      DROP FOREIGN KEY fk_customer_delivery_addresses_user
    `).catch(() => undefined)

    await db.execute(`
      ALTER TABLE ${customerTableNames.deliveryAddresses}
      ADD CONSTRAINT fk_customer_delivery_addresses_user
      FOREIGN KEY (user_id) REFERENCES ${authTableNames.users}(id)
      ON DELETE CASCADE
    `).catch(() => undefined)

    await db.execute(`
      ALTER TABLE ${authTableNames.userRoles}
      DROP FOREIGN KEY fk_auth_user_roles_user
    `).catch(() => undefined)

    await db.execute(`
      ALTER TABLE ${authTableNames.userRoles}
      ADD CONSTRAINT fk_auth_user_roles_user
      FOREIGN KEY (user_id) REFERENCES ${authTableNames.users}(id)
      ON DELETE CASCADE
    `).catch(() => undefined)
  },
}



