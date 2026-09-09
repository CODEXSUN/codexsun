import { PlatformEnvironmentLoader } from '../dist/packages/platform-core/api/index.js'
import mysql, { escape, escapeId } from 'mysql2/promise'
import { resolve } from 'node:path'
import { z } from 'zod'

const environmentSchema = z
  .object({
    APP_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DB_DRIVER: z.literal('mariadb').default('mariadb'),
    DB_HOST: z.string().min(1).default('127.0.0.1'),
    DB_MASTER_NAME: z
      .string()
      .regex(/^[A-Za-z0-9_]+$/u)
      .default('codexsun'),
    DB_PASSWORD: z.string().default(''),
    DB_PORT: z.coerce.number().int().min(1).max(65_535).default(3306),
    DB_USER: z.string().min(1).max(80).default('codexsun'),
    MARIADB_ADMIN_HOST: z.string().min(1),
    MARIADB_ADMIN_PASSWORD: z.string(),
    MARIADB_ADMIN_PORT: z.coerce.number().int().min(1).max(65_535),
    MARIADB_ADMIN_USER: z.string().min(1).max(80),
    MARIADB_APPLICATION_HOST: z.string().min(1).max(255).default('localhost'),
  })
  .superRefine((value, context) => {
    if (value.APP_ENV === 'production' && value.DB_PASSWORD.length === 0) {
      context.addIssue({
        code: 'custom',
        message: 'DB_PASSWORD is required in production.',
        path: ['DB_PASSWORD'],
      })
    }
  })

export function readMariaDbEnvironment(projectRoot) {
  const source = PlatformEnvironmentLoader.load({
    defaults: {
      MARIADB_APPLICATION_HOST: 'localhost',
    },
    path: resolve(projectRoot, '.env'),
  })
  return environmentSchema.parse({
    ...source,
    MARIADB_ADMIN_HOST: source.MARIADB_ADMIN_HOST || source.DB_HOST || '127.0.0.1',
    MARIADB_ADMIN_PASSWORD: source.MARIADB_ADMIN_PASSWORD || source.DB_PASSWORD || '',
    MARIADB_ADMIN_PORT: source.MARIADB_ADMIN_PORT || source.DB_PORT || '3306',
    MARIADB_ADMIN_USER: source.MARIADB_ADMIN_USER || source.DB_USER || 'root',
  })
}

export class MariaDbAdministrator {
  static async connect(environment) {
    const connection = await mysql.createConnection({
      host: environment.MARIADB_ADMIN_HOST,
      password: environment.MARIADB_ADMIN_PASSWORD,
      port: environment.MARIADB_ADMIN_PORT,
      user: environment.MARIADB_ADMIN_USER,
    })
    return new MariaDbAdministrator(connection, environment)
  }

  constructor(connection, environment) {
    this.connection = connection
    this.environment = environment
  }

  async provisionApplicationDatabase(databaseName = this.environment.DB_MASTER_NAME) {
    validateDatabaseName(databaseName)
    await this.connection.query(`CREATE DATABASE IF NOT EXISTS ${escapeId(databaseName)}`)
    await this.ensureApplicationAccount()
    await this.connection.query(
      `GRANT ALL PRIVILEGES ON ${escapeId(databaseName)}.* TO ${accountSql(this.environment)}`,
    )
  }

  async dropDatabase(databaseName) {
    validateDatabaseName(databaseName)
    await this.connection.query(
      `REVOKE ALL PRIVILEGES ON ${escapeId(databaseName)}.* FROM ${accountSql(this.environment)}`,
    )
    await this.connection.query(`DROP DATABASE IF EXISTS ${escapeId(databaseName)}`)
  }

  async hasDatabaseGrant(databaseName) {
    validateDatabaseName(databaseName)
    const [rows] = await this.connection.query(
      'select 1 from mysql.db where User = ? and Host = ? and Db = ? limit 1',
      [this.environment.DB_USER, this.environment.MARIADB_APPLICATION_HOST, databaseName],
    )
    return rows.length > 0
  }

  async close() {
    await this.connection.end()
  }

  async ensureApplicationAccount() {
    const account = accountSql(this.environment)
    const password = escape(this.environment.DB_PASSWORD)
    await this.connection.query(`CREATE USER IF NOT EXISTS ${account} IDENTIFIED BY ${password}`)
    await this.connection.query(`ALTER USER ${account} IDENTIFIED BY ${password}`)
  }
}

export async function verifyApplicationDatabase(environment, databaseName) {
  const connection = await mysql.createConnection({
    database: databaseName,
    host: environment.DB_HOST,
    password: environment.DB_PASSWORD,
    port: environment.DB_PORT,
    user: environment.DB_USER,
  })
  try {
    const [rows] = await connection.query(
      'select version() as version, current_user() as account, database() as databaseName',
    )
    return rows[0]
  } finally {
    await connection.end()
  }
}

function accountSql(environment) {
  return `${escape(environment.DB_USER)}@${escape(environment.MARIADB_APPLICATION_HOST)}`
}

function validateDatabaseName(databaseName) {
  if (!/^[A-Za-z0-9_]+$/u.test(databaseName)) {
    throw new Error('The MariaDB database name contains unsupported characters.')
  }
}
