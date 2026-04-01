import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import mysql from 'mysql2/promise'
import { environment } from '../config/environment'

type SqlPrimitive = string | number | boolean | Date | Buffer | null
type SqlRecord = Record<string, SqlPrimitive>

export type TransactionClient = {
  execute: (sql: string, params?: SqlPrimitive[]) => Promise<ResultSetHeader>
  query: <T extends RowDataPacket = RowDataPacket>(sql: string, params?: SqlPrimitive[]) => Promise<T[]>
  first: <T extends RowDataPacket = RowDataPacket>(sql: string, params?: SqlPrimitive[]) => Promise<T | null>
  insert: (table: string, values: SqlRecord) => Promise<ResultSetHeader>
}

let pool: mysql.Pool | null = null

function createPool() {
  return mysql.createPool({
    host: environment.database.host,
    port: environment.database.port,
    user: environment.database.user,
    password: environment.database.password,
    database: environment.database.name,
    connectionLimit: 10,
    namedPlaceholders: true,
  })
}

function createTransactionClient(connection: PoolConnection): TransactionClient {
  return {
    async execute(sql: string, params: SqlPrimitive[] = []) {
      const [result] = await connection.execute<ResultSetHeader>(sql, params)
      return result
    },
    query<T extends RowDataPacket = RowDataPacket>(sql: string, params: SqlPrimitive[] = []) {
      return connection.query<T[]>(sql, params).then(([rows]) => rows)
    },
    async first<T extends RowDataPacket = RowDataPacket>(sql: string, params: SqlPrimitive[] = []): Promise<T | null> {
      const [rows] = await connection.query<T[]>(sql, params)
      return (rows[0] ?? null) as T | null
    },
    async insert(table: string, values: SqlRecord) {
      const columns = Object.keys(values)
      const placeholders = columns.map(() => '?').join(', ')
      const params = columns.map((column) => values[column] ?? null)
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
        params,
      )
      return result
    },
  }
}

export class DatabaseOrm {
  isEnabled() {
    return environment.database.enabled
  }

  getPool() {
    if (!this.isEnabled()) {
      throw new Error('MariaDB integration is disabled. Set DB_ENABLED=true to enable it.')
    }

    if (!pool) {
      pool = createPool()
    }

    return pool
  }

  async close() {
    if (!pool) {
      return
    }

    const activePool = pool
    pool = null
    await activePool.end()
  }

  async execute(sql: string, params: SqlPrimitive[] = []) {
    const [result] = await this.getPool().execute<ResultSetHeader>(sql, params)
    return result
  }

  async query<T extends RowDataPacket = RowDataPacket>(sql: string, params: SqlPrimitive[] = []) {
    const [rows] = await this.getPool().query<T[]>(sql, params)
    return rows
  }

  async first<T extends RowDataPacket = RowDataPacket>(sql: string, params: SqlPrimitive[] = []) {
    const rows = await this.query<T>(sql, params)
    return rows[0] ?? null
  }

  async insert(table: string, values: SqlRecord) {
    const columns = Object.keys(values)
    const placeholders = columns.map(() => '?').join(', ')
    const params = columns.map((column) => values[column] ?? null)
    return this.execute(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
      params,
    )
  }

  async transaction<T>(callback: (transaction: TransactionClient) => Promise<T>) {
    const connection = await this.getPool().getConnection()

    try {
      await connection.beginTransaction()
      const transactionClient = createTransactionClient(connection)
      const result = await callback(transactionClient)
      await connection.commit()
      return result
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }
}

export const db = new DatabaseOrm()
