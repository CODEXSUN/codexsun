import type { CommonModuleItem, CommonModuleValue } from '@shared/index'
import type { RowDataPacket } from 'mysql2'
import { randomUUID } from 'node:crypto'
import type { CommonModuleDefinition } from '../domain/common-module-definitions'
import { ensureDatabaseSchema } from '@framework-core/runtime/database/database'
import { db } from '@framework-core/runtime/database/orm'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'

interface CommonModuleRow extends RowDataPacket {
  id: string
  is_active: number
  created_at: Date
  updated_at: Date
}

function normalizeValue(
  definition: CommonModuleDefinition,
  columnKey: string,
  value: string | number | Date | null | undefined,
) {
  if (value instanceof Date) {
    return value.toISOString()
  }

  const column = definition.columns.find((entry) => entry.key === columnKey)
  if (column?.type === 'boolean') {
    if (typeof value === 'string') {
      return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
    }

    return Boolean(value)
  }

  return value ?? null
}

function toCommonModuleItem(definition: CommonModuleDefinition, row: CommonModuleRow): CommonModuleItem {
  const item: CommonModuleItem = {
    id: row.id,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }

  for (const column of definition.columns) {
    item[column.key] = normalizeValue(
      definition,
      column.key,
      row[column.key as keyof CommonModuleRow] as string | number | Date | null | undefined,
    ) as CommonModuleValue
  }

  return item
}

export class CommonModuleRepository {
  async list(definition: CommonModuleDefinition, includeInactive: boolean) {
    await ensureDatabaseSchema()

    const rows = await db.query<CommonModuleRow>(
      `
        SELECT
          id,
          ${definition.columns.map((column) => column.key).join(',\n          ')},
          is_active,
          created_at,
          updated_at
        FROM ${definition.tableName}
        ${includeInactive ? '' : 'WHERE is_active = 1'}
        ORDER BY ${definition.defaultSortKey} ASC, created_at DESC
      `,
    )

    return rows.map((row) => toCommonModuleItem(definition, row))
  }

  async findById(definition: CommonModuleDefinition, id: string) {
    await ensureDatabaseSchema()

    const row = await db.first<CommonModuleRow>(
      `
        SELECT
          id,
          ${definition.columns.map((column) => column.key).join(',\n          ')},
          is_active,
          created_at,
          updated_at
        FROM ${definition.tableName}
        WHERE id = ?
        LIMIT 1
      `,
      [id],
    )

    return row ? toCommonModuleItem(definition, row) : null
  }

  async create(definition: CommonModuleDefinition, values: Record<string, CommonModuleValue>, isActive: boolean) {
    await ensureDatabaseSchema()

    const id = `${definition.idPrefix}:${randomUUID()}`
    const columns = ['id', ...Object.keys(values), 'is_active']
    const params = [id, ...Object.values(values), isActive ? 1 : 0]

    await db.execute(
      `
        INSERT INTO ${definition.tableName} (${columns.join(', ')})
        VALUES (${columns.map(() => '?').join(', ')})
      `,
      params,
    )

    const item = await this.findById(definition, id)
    if (!item) {
      throw new ApplicationError('Expected created master record to be retrievable.', { id }, 500)
    }

    return item
  }

  async update(
    definition: CommonModuleDefinition,
    id: string,
    values: Record<string, CommonModuleValue>,
    isActive?: boolean,
  ) {
    await ensureDatabaseSchema()

    const assignments = [
      ...Object.keys(values).map((column) => `${column} = ?`),
      ...(isActive === undefined ? [] : ['is_active = ?']),
    ]
    const params = [...Object.values(values), ...(isActive === undefined ? [] : [isActive ? 1 : 0]), id]

    const result = await db.execute(
      `
        UPDATE ${definition.tableName}
        SET ${assignments.join(', ')}
        WHERE id = ?
      `,
      params,
    )

    if (result.affectedRows === 0) {
      throw new ApplicationError('Master record not found.', { module: definition.key, id }, 404)
    }

    const item = await this.findById(definition, id)
    if (!item) {
      throw new ApplicationError('Expected updated master record to be retrievable.', { id }, 500)
    }

    return item
  }

  async setActiveState(definition: CommonModuleDefinition, id: string, isActive: boolean) {
    return this.update(definition, id, {}, isActive)
  }
}
