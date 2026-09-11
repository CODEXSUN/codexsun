#!/usr/bin/env node

import assert from 'node:assert/strict'
import { sql } from 'kysely'
import { resolve } from 'node:path'
import { ModuleRegistry } from '../packages/framework/src/index.ts'
import {
  DeclaredPlatformEventBus,
  PlatformDurableEventDispatcher,
  PlatformDiagnosticRegistry,
} from '../packages/platform-core/api/src/index.ts'
import { createDatabase } from '../apps/platform/api/src/database.ts'
import { readEnvironment } from '../apps/platform/api/src/config.ts'
import {
  KyselyModuleDataTransactionRunner,
  MariaDbModuleRuntimeLock,
  MariaDbModuleRuntimeRepository,
  ModuleRuntimeCoordinator,
  moduleRuntimeApiModule,
} from '../apps/platform/api/src/modules/module-runtime/index.ts'
import {
  eventRuntimeApiModule,
  MariaDbDurableEventStore,
} from '../apps/platform/api/src/modules/event-runtime/index.ts'
import { MariaDbAdministrator, readMariaDbEnvironment } from './mariadb-local.mjs'

const projectRoot = resolve(import.meta.dirname, '..')
const databaseName = `codexsun_foundation_test_${process.pid}`
const mariaDbEnvironment = readMariaDbEnvironment(projectRoot)
const environment = readEnvironment({ ...mariaDbEnvironment, DB_MASTER_NAME: databaseName })
const admin = await MariaDbAdministrator.connect(mariaDbEnvironment)

assert.match(databaseName, /^codexsun_foundation_test_\d+$/u)
await admin.provisionApplicationDatabase(databaseName)

try {
  await verifyLifecycle(environment)
  process.stdout.write(
    '[mariadb] install, restart, schema drift, lock, rollback, recovery, and cleanup passed.\n',
  )
} finally {
  await admin.dropDatabase(databaseName)
  assert.equal(await admin.hasDatabaseGrant(databaseName), false)
  await admin.close()
}

async function verifyLifecycle(testEnvironment) {
  const database = createDatabase(testEnvironment)
  try {
    for (const migration of moduleRuntimeApiModule.migrations) await migration.up(database.client)
    await verifyCleanInstallAndRestart(database)
    await verifyDurableEventDelivery(database)
    await verifySchemaDrift(database)
    await verifyLockContention(database)
    await verifyRollbackAndRecovery(database)
  } finally {
    await database.close()
  }
}

async function verifySchemaDrift(database) {
  await sql`
    alter table platform_module_state
    modify column last_failure_message varchar(511) null
  `.execute(database.client)
  try {
    await assert.rejects(
      () => coordinator(database, [moduleRuntimeApiModule]).prepare(),
      /schema checksum mismatch/u,
    )
  } finally {
    await sql`
      alter table platform_module_state
      modify column last_failure_message varchar(512) null
    `.execute(database.client)
  }
  await coordinator(database, [moduleRuntimeApiModule]).prepare()
}

async function verifyCleanInstallAndRestart(database) {
  const modules = [moduleRuntimeApiModule, eventRuntimeApiModule]
  const first = coordinator(database, modules)
  await first.prepare()
  const firstCounts = await ledgerCounts(database.client)

  const restarted = coordinator(database, modules)
  await restarted.prepare()
  assert.deepEqual(await ledgerCounts(database.client), firstCounts)
  assert.deepEqual(firstCounts, { migrations: 3, modules: 2, seeds: 1 })
}

async function verifyDurableEventDelivery(database) {
  const store = new MariaDbDurableEventStore(database.client)
  await database.client.transaction().execute((transaction) =>
    store.append(transaction, {
      correlationId: 'foundation-event',
      eventId: 'foundation-event-1',
      eventType: 'foundation.created',
      occurredAt: new Date().toISOString(),
      payload: { value: 1 },
      publisherId: 'foundation',
      version: '1.0.0',
    }),
  )
  const received = []
  const dispatcher = new PlatformDurableEventDispatcher(store)
  const consumer = {
    consumerId: 'foundation-consumer',
    eventTypes: ['foundation.created'],
    handle: async (event) => received.push(event.eventId),
  }
  await dispatcher.dispatch(consumer)
  await dispatcher.dispatch(consumer)
  assert.deepEqual(received, ['foundation-event-1'])
  const result = await sql`
    select state, attempts from platform_event_inbox
    where consumer_id = 'foundation-consumer' and event_id = 'foundation-event-1'
  `.execute(database.client)
  assert.deepEqual(result.rows, [{ attempts: 1, state: 'completed' }])
}

async function verifyLockContention(database) {
  const firstLock = new MariaDbModuleRuntimeLock(database.client, 2)
  const secondLock = new MariaDbModuleRuntimeLock(database.client, 1)
  let release
  let acquired
  const entered = new Promise((resolveEntered) => (acquired = resolveEntered))
  const blocked = new Promise((resolveBlocked) => (release = resolveBlocked))
  const holder = firstLock.runExclusive(async () => {
    acquired()
    await blocked
  })
  await entered
  await assert.rejects(() => secondLock.runExclusive(async () => {}), /could not be acquired/u)
  release()
  await holder
}

async function verifyRollbackAndRecovery(database) {
  await database.client.schema
    .createTable('platform_integration_probe')
    .addColumn('id', 'integer', (column) => column.primaryKey())
    .execute()

  const failing = probeModule(async (context) => {
    await sql`insert into platform_integration_probe (id) values (1)`.execute(context)
    throw new Error('controlled migration interruption')
  })
  await assert.rejects(() => coordinator(database, [moduleRuntimeApiModule, failing]).prepare())
  assert.equal(await probeCount(database.client), 0)

  const recovered = probeModule(async (context) => {
    await sql`insert into platform_integration_probe (id) values (1)`.execute(context)
  })
  await coordinator(database, [moduleRuntimeApiModule, recovered]).prepare()
  assert.equal(await probeCount(database.client), 1)
}

function coordinator(database, modules) {
  const registry = new ModuleRegistry()
  for (const module of modules) registry.register(module.manifest)
  const plan = registry.createCompositionPlan('0.1.0')
  return new ModuleRuntimeCoordinator(
    plan,
    modules,
    new MariaDbModuleRuntimeRepository(database.client),
    new KyselyModuleDataTransactionRunner(database.client),
    new PlatformDiagnosticRegistry(),
    new DeclaredPlatformEventBus(plan.modules).forModule('module-runtime'),
    () => new Date(),
    () => Promise.resolve(),
    new MariaDbModuleRuntimeLock(database.client),
  )
}

function probeModule(up) {
  return {
    createPlugin: () => async () => {},
    manifest: {
      capabilities: ['integration-probe.write'],
      configuration: [],
      consumes: [],
      dependencies: [{ id: 'module-runtime', versionRange: '^1.0.0' }],
      description: 'Verifies live MariaDB module recovery.',
      extensionPoints: [],
      extensions: [],
      id: 'integration-probe',
      kind: 'core',
      lifecycle: lifecycle(),
      owner: 'platform-test',
      platformVersionRange: '^0.1.0',
      publicContracts: [],
      publishes: [],
      scope: 'test',
      version: '1.0.0',
    },
    migrations: [{ checksum: 'integration-probe-v1', id: '0001-probe', up, version: '1.0.0' }],
  }
}

function lifecycle() {
  return {
    activate() {},
    deactivate() {},
    install() {},
    uninstall() {},
    upgrade() {},
  }
}

async function ledgerCounts(database) {
  const [modules, migrations, seeds] = await Promise.all([
    sql`select count(*) as total from platform_module_state`.execute(database),
    sql`select count(*) as total from platform_module_migrations`.execute(database),
    sql`select count(*) as total from platform_module_seeds`.execute(database),
  ])
  return {
    migrations: Number(migrations.rows[0].total),
    modules: Number(modules.rows[0].total),
    seeds: Number(seeds.rows[0].total),
  }
}

async function probeCount(database) {
  const result = await sql`select count(*) as total from platform_integration_probe`.execute(
    database,
  )
  return Number(result.rows[0].total)
}
