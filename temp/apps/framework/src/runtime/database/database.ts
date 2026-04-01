import { randomBytes } from 'node:crypto'
import type { DatabaseHealth, SetupStatus } from '@shared/index'
import { databaseSetupPayloadSchema, setupStatusSchema } from '@shared/index'
import mysql from 'mysql2/promise'
import { environment, reloadEnvironment, updateEnvironmentFile } from '../config/environment'
import { db } from './orm'
import { runMigrations } from './migrator'
import { ApplicationError } from '../errors/application-error'

let setupStatus = createSetupStatus(
  'required',
  'Database setup is required before codexsun can use persistence.',
)
let setupPromise: Promise<SetupStatus> | null = null

function createSetupStatus(status: SetupStatus['status'], detail: string): SetupStatus {
  const configuration = environment.database.enabled ? environment.database : null

  return setupStatusSchema.parse({
    status,
    checkedAt: new Date().toISOString(),
    detail,
    database: {
      configured: Boolean(configuration),
      source: configuration ? 'env_file' : 'none',
      host: configuration?.host ?? null,
      port: configuration?.port ?? null,
      user: configuration?.user ?? null,
      name: configuration?.name ?? null,
    },
  } satisfies SetupStatus)
}

function isMissingDatabaseError(error: unknown) {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      typeof error.code === 'string' &&
      error.code === 'ER_BAD_DB_ERROR',
  )
}

function quoteIdentifier(value: string) {
  return '`' + value.replaceAll('`', '``') + '`'
}

function generateJwtSecret() {
  return randomBytes(32).toString('hex')
}

async function createDatabaseIfMissing() {
  const configuration = environment.database.enabled ? environment.database : null

  if (!configuration) {
    return
  }

  const connection = await mysql.createConnection({
    host: configuration.host,
    port: configuration.port,
    user: configuration.user,
    password: configuration.password,
  })

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${quoteIdentifier(configuration.name)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    )
  } finally {
    await connection.end()
  }
}

async function verifyOrCreateConfiguredDatabase() {
  try {
    await db.query('SELECT 1')
  } catch (error) {
    if (!isMissingDatabaseError(error)) {
      throw error
    }

    await db.close()
    await createDatabaseIfMissing()
    await db.query('SELECT 1')
  }
}

export function getSetupStatus() {
  return setupStatus
}

export function isApplicationSetupReady() {
  return setupStatus.status === 'ready'
}

export function isSetupRecoveryMode() {
  return !environment.app.skipSetupCheck && setupStatus.status !== 'ready'
}

export function isDatabaseEnabled() {
  return isApplicationSetupReady()
}

export function getDatabasePool() {
  if (!isApplicationSetupReady()) {
    throw new Error('Database setup is incomplete.')
  }

  return db.getPool()
}

export async function ensureDatabaseSchema() {
  if (setupStatus.status !== 'ready') {
    await initializeApplicationSetup()
  }

  if (setupStatus.status !== 'ready') {
    throw new ApplicationError(
      'Database setup is incomplete.',
      {
        setupStatus: setupStatus.status,
        detail: setupStatus.detail,
      },
      503,
    )
  }

  await runMigrations()
}

export async function ensureConfiguredDatabaseConnection(options?: { createDatabaseIfMissing?: boolean }) {
  const configuration = environment.database.enabled ? environment.database : null

  if (!configuration) {
    throw new ApplicationError('Database settings are missing.', {}, 409)
  }

  try {
    if (options?.createDatabaseIfMissing) {
      await verifyOrCreateConfiguredDatabase()
      return
    }

    await db.query('SELECT 1')
  } catch (error) {
    throw new ApplicationError(
      error instanceof Error ? error.message : 'Unable to connect to the configured database.',
      { database: configuration.name },
      503,
    )
  }
}

export async function closeDatabasePool() {
  await db.close()
}

export async function initializeApplicationSetup(force = false) {
  if (setupPromise && !force) {
    return setupPromise
  }

  const nextSetupPromise = (async () => {
    if (environment.app.skipSetupCheck) {
      setupStatus = createSetupStatus(
        'ready',
        'Application setup checks are bypassed by APP_SKIP_SETUP_CHECK.',
      )
      await db.close()
      return setupStatus
    }

    const configuration = environment.database.enabled ? environment.database : null

    if (!configuration) {
      setupStatus = createSetupStatus(
        'required',
        'Database settings are missing. Complete the initial setup screen to continue.',
      )
      await db.close()
      return setupStatus
    }

    try {
      await verifyOrCreateConfiguredDatabase()
      await runMigrations()

      setupStatus = createSetupStatus(
        'ready',
        `Connected to MariaDB and initialized schema "${configuration.name}".`,
      )
    } catch (error) {
      await db.close()
      setupStatus = createSetupStatus(
        'error',
        error instanceof Error ? error.message : 'Unknown database setup error.',
      )
    }

    return setupStatus
  })()

  setupPromise = nextSetupPromise

  try {
    return await nextSetupPromise
  } finally {
    if (setupPromise === nextSetupPromise) {
      setupPromise = null
    }
  }
}

export async function applyDatabaseSetup(payload: unknown, options?: { mediaPublicBaseUrl?: string }) {
  const parsedPayload = databaseSetupPayloadSchema.parse(payload)
  const mediaPublicBaseUrl = options?.mediaPublicBaseUrl?.replace(/\/$/, '') ?? environment.media.publicBaseUrl
  updateEnvironmentFile({
    DB_ENABLED: 'true',
    DB_HOST: parsedPayload.host,
    DB_PORT: String(parsedPayload.port),
    DB_USER: parsedPayload.user,
    DB_PASSWORD: parsedPayload.password,
    DB_NAME: parsedPayload.name,
    JWT_SECRET: generateJwtSecret(),
    MEDIA_PUBLIC_BASE_URL: mediaPublicBaseUrl,
  })
  reloadEnvironment()
  await db.close()

  return {
    status: await initializeApplicationSetup(true),
  }
}

export function getDatabaseHealth(): DatabaseHealth {
  const configuration = environment.database.enabled ? environment.database : null

  if (!configuration) {
    return {
      status: 'disabled',
      engine: 'mariadb',
      checkedAt: new Date().toISOString(),
      detail: 'Database settings are not configured yet.',
    }
  }

  if (setupStatus.status === 'ready') {
    return {
      status: 'ok',
      engine: 'mariadb',
      checkedAt: setupStatus.checkedAt,
      detail: setupStatus.detail,
    }
  }

  return {
    status: setupStatus.status === 'required' ? 'disabled' : 'error',
    engine: 'mariadb',
    checkedAt: setupStatus.checkedAt,
    detail: setupStatus.detail,
  }
}
