import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { Database } from '../src/database.js'
import { identityMigrations } from '../src/modules/identity/infrastructure/identity.migrations.js'
import { identitySchema } from '../src/modules/identity/infrastructure/identity.schema.js'
import { MariaDbIdentityRepository } from '../src/modules/identity/infrastructure/identity.repository.js'
import {
  IdentityAuthenticationError,
  IdentityConflictError,
} from '../src/modules/identity/domain/identity.errors.js'
import type { StoredIdentityDevice } from '../src/modules/identity/device/domain/device.types.js'

export async function verifyIdentityConcurrency(database: Database) {
  for (const migration of identityMigrations) await migration.up(database)
  assert.equal(await identitySchema.inspect(database), identitySchema.checksum)
  const repository = new MariaDbIdentityRepository(database)
  const ids = [randomUUID(), randomUUID()]
  const registration = await Promise.allSettled(
    ids.map((id, index) =>
      repository.createUser(
        {
          id,
          email: `concurrent${index}@example.test`,
          displayName: 'Concurrency test',
          portal: 'regular',
          status: 'active',
        },
        { userId: id, passwordHash: 'test-only-not-a-real-password' },
        [
          { type: 'email', value: `concurrent${index}@example.test` },
          { type: 'username', value: 'same-user' },
        ],
      ),
    ),
  )
  assert.equal(registration.filter((result) => result.status === 'fulfilled').length, 1)
  const failure = registration.find((result) => result.status === 'rejected')
  assert.ok(failure?.status === 'rejected' && failure.reason instanceof IdentityConflictError)
  assert.equal((await database.selectFrom('identity_users').selectAll().execute()).length, 1)
  assert.equal((await database.selectFrom('identity_credentials').selectAll().execute()).length, 1)
  const identifiers = await database.selectFrom('identity_user_identifiers').selectAll().execute()
  assert.equal(identifiers.length, 2)
  assert.ok(identifiers.every((row) => row.verified_at === null))
  const user = await repository.findUserByIdentifier('username', 'same-user')
  assert.ok(user)
  const devices = await Promise.all([
    repository.createDevice(device(user.id)),
    repository.createDevice(device(user.id)),
  ])
  assert.equal(devices.filter((item) => item.status === 'active').length, 1)
  assert.equal(devices.filter((item) => item.status === 'pending').length, 1)
  const active = devices.find((item) => item.status === 'active')!
  const session = () => ({
    id: randomUUID(),
    userId: user.id,
    deviceId: active.deviceId,
    portal: 'regular' as const,
    tokenHash: randomUUID().replaceAll('-', '').repeat(2),
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 60_000),
    authVersion: 0,
  })
  const existing = session()
  await repository.createSession(existing)
  const raced = session()
  const race = await Promise.allSettled([
    repository.createSession(raced),
    repository.updateUserStatus(user.id, 'disabled'),
  ])
  assert.equal(race[1].status, 'fulfilled')
  if (race[0].status === 'rejected')
    assert.ok(race[0].reason instanceof IdentityAuthenticationError)
  await repository.updateUserStatus(user.id, 'active')
  assert.equal(await repository.findSession(existing.tokenHash, 'regular'), undefined)
  assert.equal(await repository.findSession(raced.tokenHash, 'regular'), undefined)
  await assert.rejects(() => repository.createSession(session()), IdentityAuthenticationError)
  const current = await repository.findUserById(user.id)
  assert.equal(current?.authVersion, 2)
  const fresh = { ...session(), authVersion: current!.authVersion }
  await repository.createSession(fresh)
  assert.ok(await repository.findSession(fresh.tokenHash, 'regular'))
}

function device(userId: string): StoredIdentityDevice {
  return {
    userId,
    deviceId: randomUUID(),
    deviceName: 'Test client',
    clientType: 'desktop',
    status: 'pending',
    activatedAt: null,
    activatedBy: null,
    firstSeenAt: new Date(),
    lastSeenAt: new Date(),
    tokenHash: 'a'.repeat(64),
  }
}
