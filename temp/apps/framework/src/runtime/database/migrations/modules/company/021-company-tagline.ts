import { companyTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

export const companyTaglineMigration: Migration = {
  id: '021-company-tagline',
  name: 'Add company tagline support',
  async up({ db }) {
    await db.execute(`
      ALTER TABLE ${companyTableNames.companies}
      ADD COLUMN tagline VARCHAR(200) NULL AFTER legal_name
    `).catch(async (error: unknown) => {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (!message.includes('duplicate column')) {
        throw error
      }
    })

    await db.execute(
      `
        UPDATE ${companyTableNames.companies}
        SET tagline = ?
        WHERE id = ?
      `,
      ['Software Made Simple', 'company:codexsun'],
    )
  },
}


