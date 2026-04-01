import { authTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

export const authContactVerificationsMigration: Migration = {
  id: '012-auth-contact-verifications',
  name: 'Auth contact verification challenges',
  async up({ db }) {
    await db.execute(`
      ALTER TABLE ${authTableNames.users}
      ADD COLUMN phone_number VARCHAR(20) NULL AFTER email
    `).catch(() => undefined)

    await db.execute(`
      CREATE UNIQUE INDEX uq_auth_users_phone_number
      ON ${authTableNames.users} (phone_number)
    `).catch(() => undefined)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${authTableNames.contactVerifications} (
        id VARCHAR(64) PRIMARY KEY,
        purpose VARCHAR(64) NOT NULL,
        actor_type VARCHAR(32) NOT NULL,
        channel VARCHAR(16) NOT NULL,
        destination VARCHAR(320) NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        verified_at DATETIME NULL,
        consumed_at DATETIME NULL,
        attempts_count INT NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_auth_contact_verifications_lookup (purpose, actor_type, channel, destination),
        KEY idx_auth_contact_verifications_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
  },
}


