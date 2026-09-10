import { randomUUID } from 'node:crypto'
import { sql } from 'kysely'
import type { IdentityPortal } from '@codexsun/platform-contracts'
import type { Database } from '../../../database.js'
import type { IdentityPasswordHasher, IdentityRepository } from '../domain/identity.ports.js'
import { identityMigrations } from '../infrastructure/identity.migrations.js'
import { ArgonIdentityPasswordHasher } from '../infrastructure/identity.password.js'
import { MariaDbIdentityRepository } from '../infrastructure/identity.repository.js'

export interface P001IdentityBrowserFixtureOptions {
  databaseName: string
  environment: string
  password: string
  suffix: string
}

export interface P001IdentityBrowserFixtureAccount {
  email: string
  portal: IdentityPortal
}

interface FixtureDependencies {
  createId: () => string
  migrations: typeof identityMigrations
  passwords: IdentityPasswordHasher
  repository: Pick<IdentityRepository, 'createUser'>
}

// Test-only bootstrap. The caller owns an exclusive disposable database and its cleanup.
export async function bootstrapP001IdentityBrowserFixture(
  database: Database,
  options: P001IdentityBrowserFixtureOptions,
  dependencies?: FixtureDependencies,
): Promise<readonly P001IdentityBrowserFixtureAccount[]> {
  assertP001IdentityBrowserFixtureSafety(options)
  return database.connection().execute(async (connection) => {
    await assertEmptyFixtureDatabase(connection, options.databaseName)
    const fixture = dependencies ?? createFixtureDependencies(connection)
    for (const migration of fixture.migrations) await migration.up(connection)
    const accounts = fixtureAccounts(options.suffix)
    for (const account of accounts) {
      const id = fixture.createId()
      await fixture.repository.createUser(
        { ...account, id, displayName: `${account.portal} P001 fixture`, status: 'active' },
        { passwordHash: await fixture.passwords.hash(options.password), userId: id },
      )
    }
    return accounts
  })
}

export function assertP001IdentityBrowserFixtureSafety(
  options: P001IdentityBrowserFixtureOptions,
): void {
  if (options.environment !== 'test') throw new Error('P001 fixtures require the test environment.')
  if (!/^[a-z0-9]{12}$/u.test(options.suffix))
    throw new Error('P001 fixtures require a twelve-character lowercase suffix.')
  if (
    !/^codexsun_p001_identity_fixture_\d+_[a-z0-9]{12}$/u.test(options.databaseName) ||
    !options.databaseName.endsWith(`_${options.suffix}`) ||
    options.databaseName.length > 64
  )
    throw new Error('P001 fixtures require a matching disposable database name.')
  if (options.password.length < 8)
    throw new Error('P001 fixture passwords must meet the Identity minimum length.')
}

async function assertEmptyFixtureDatabase(database: Database, expectedName: string): Promise<void> {
  const selected = await sql<{ name: string | null }>`select database() as name`.execute(database)
  if (selected.rows[0]?.name !== expectedName)
    throw new Error('P001 fixture connection does not match the disposable database.')
  const existing = await sql<{ total: string | number | bigint }>`
    select count(*) as total from information_schema.tables where table_schema = ${expectedName}
  `.execute(database)
  if (String(existing.rows[0]?.total) !== '0')
    throw new Error('P001 fixtures require an empty database. Existing databases are never reused.')
}

function createFixtureDependencies(database: Database): FixtureDependencies {
  return {
    createId: randomUUID,
    migrations: identityMigrations,
    passwords: new ArgonIdentityPasswordHasher(),
    repository: new MariaDbIdentityRepository(database),
  }
}

function fixtureAccounts(suffix: string): readonly P001IdentityBrowserFixtureAccount[] {
  return [
    { email: `p001-regular-${suffix}@fixture.invalid`, portal: 'regular' },
    { email: `p001-admin-${suffix}@fixture.invalid`, portal: 'administrator' },
    { email: `p001-super-admin-${suffix}@fixture.invalid`, portal: 'super-admin' },
  ]
}
