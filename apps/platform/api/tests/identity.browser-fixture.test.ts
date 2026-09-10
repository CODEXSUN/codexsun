import assert from 'node:assert/strict'
import test from 'node:test'
import { Kysely, DummyDriver, MysqlAdapter, MysqlIntrospector, MysqlQueryCompiler } from 'kysely'
import type { Database, DatabaseSchema } from '../src/database.js'
import { bootstrapP001IdentityBrowserFixture } from '../src/modules/identity/test-support/p001-browser-fixture.js'

const options = {
  databaseName: 'codexsun_p001_identity_fixture_1234_abc123def456',
  environment: 'test',
  password: 'fixture-password',
  suffix: 'abc123def456',
}

type Dependencies = NonNullable<Parameters<typeof bootstrapP001IdentityBrowserFixture>[2]>

test('rejects unsafe options before any database operation', async () => {
  for (const override of [
    { environment: 'production' },
    { databaseName: 'codexsun' },
    { suffix: 'ABC123def456' },
    { suffix: 'xyz123def456' },
    { password: 'short' },
  ]) {
    const harness = createHarness()
    await assert.rejects(
      bootstrapP001IdentityBrowserFixture(
        harness.database,
        { ...options, ...override },
        harness.dependencies,
      ),
    )
    assert.deepEqual(harness.effects, [])
    assert.deepEqual(harness.queries, [])
    await harness.database.destroy()
  }
})

test('rejects an actual connection mismatch and existing schema before mutation', async () => {
  for (const [name, total] of [
    ['production', 0],
    [null, 0],
    [options.databaseName, 1],
  ] as const) {
    const harness = createHarness(name, total)
    await assert.rejects(
      bootstrapP001IdentityBrowserFixture(harness.database, options, harness.dependencies),
    )
    assert.deepEqual(harness.effects, [])
    await harness.database.destroy()
  }
})

test('creates three portal accounts after migrations with hashes and no device bypass', async () => {
  const harness = createHarness()
  const accounts = await bootstrapP001IdentityBrowserFixture(
    harness.database,
    options,
    harness.dependencies,
  )
  assert.deepEqual(
    accounts.map(({ portal }) => portal),
    ['regular', 'administrator', 'super-admin'],
  )
  assert.equal(new Set(accounts.map(({ email }) => email)).size, 3)
  assert.ok(accounts.every(({ email }) => email.endsWith('@fixture.invalid')))
  assert.deepEqual(harness.effects, ['migration', 'hash', 'user', 'hash', 'user', 'hash', 'user'])
  assert.deepEqual(harness.queries[1]?.parameters, [options.databaseName])
  await harness.database.destroy()
})

test('stops when a migration fails without creating accounts', async () => {
  const harness = createHarness()
  harness.dependencies.migrations = [
    {
      id: 'failure',
      version: '1.0.0',
      checksum: 'test-only',
      async up() {
        throw new Error('migration failed')
      },
    },
  ]
  await assert.rejects(
    bootstrapP001IdentityBrowserFixture(harness.database, options, harness.dependencies),
    /migration failed/u,
  )
  assert.deepEqual(harness.effects, [])
  await harness.database.destroy()
})

function createHarness(name: string | null = options.databaseName, total = 0) {
  const effects: string[] = []
  const queries: { parameters: readonly unknown[] }[] = []
  const driver = new DummyDriver()
  driver.acquireConnection = async () => ({
    async executeQuery<R>(query: { sql: string; parameters: readonly unknown[] }) {
      queries.push(query)
      return { rows: (query.sql.includes('database()') ? [{ name }] : [{ total }]) as R[] }
    },
    async *streamQuery<R>() {
      yield { rows: [] as R[] }
    },
  })
  const database: Database = new Kysely<DatabaseSchema>({
    dialect: {
      createDriver: () => driver,
      createAdapter: () => new MysqlAdapter(),
      createQueryCompiler: () => new MysqlQueryCompiler(),
      createIntrospector: (db) => new MysqlIntrospector(db),
    },
  })
  const dependencies: Dependencies = {
    createId: () => `user-${effects.length}`,
    migrations: [
      {
        id: 'fixture',
        version: '1.0.0',
        checksum: 'test-only',
        async up() {
          effects.push('migration')
        },
      },
    ],
    passwords: {
      async hash(password) {
        assert.equal(password, options.password)
        effects.push('hash')
        return 'argon-test-hash'
      },
      async verify() {
        return false
      },
      async verifyUnknown() {},
    },
    repository: {
      async createUser(user, credential) {
        assert.equal(user.id, credential.userId)
        assert.equal(credential.passwordHash, 'argon-test-hash')
        assert.equal(user.status, 'active')
        effects.push('user')
      },
    },
  }
  return { database, dependencies, effects, queries }
}
