import { companyTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

export const companySocialLinksMigration: Migration = {
  id: '022-company-social-links',
  name: 'Add company social links',
  async up({ db }) {
    await db.execute(`
      ALTER TABLE ${companyTableNames.companies}
      ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(300) NULL AFTER description,
      ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(300) NULL AFTER facebook_url,
      ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(300) NULL AFTER twitter_url,
      ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(300) NULL AFTER instagram_url
    `)
  },
}
