import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { createDatabase } from '../apps/platform/api/src/database.ts'
import { readEnvironment } from '../apps/platform/api/src/config.ts'
import { verifyIdentityConcurrency } from '../apps/platform/api/tests/identity.mariadb.test.ts'
import { MariaDbAdministrator, readMariaDbEnvironment } from './mariadb-local.mjs'

const databaseName = `codexsun_identity_test_${process.pid}`
assert.match(databaseName, /^codexsun_identity_test_\d+$/u)
const values = readMariaDbEnvironment(resolve(import.meta.dirname, '..'))
const admin = await MariaDbAdministrator.connect(values)
await admin.provisionApplicationDatabase(databaseName)
try {
  const database = createDatabase(readEnvironment({ ...values, DB_MASTER_NAME: databaseName }))
  try {
    await verifyIdentityConcurrency(database.client)
    process.stdout.write(
      '[identity] schema, atomic registration, device race, and session revocation passed.\n',
    )
  } finally {
    await database.close()
  }
} finally {
  await admin.dropDatabase(databaseName)
  assert.equal(await admin.hasDatabaseGrant(databaseName), false)
  await admin.close()
}
