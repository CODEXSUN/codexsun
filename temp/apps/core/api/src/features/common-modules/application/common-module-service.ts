import type {
  CommonModuleDefinition,
} from '../domain/common-module-definitions'
import type {
  CommonModuleKey,
  CommonModuleListResponse,
  CommonModuleMetadataListResponse,
  CommonModuleMetadataResponse,
  CommonModuleRecordResponse,
  CommonModuleValue,
} from '@shared/index'
import {
  commonModuleListResponseSchema,
  commonModuleMetadataListResponseSchema,
  commonModuleMetadataResponseSchema,
  commonModuleRecordResponseSchema,
  commonModuleUpsertPayloadSchema,
} from '@shared/index'
import type { CommonModuleRepository } from '../data/common-module-repository'
import {
  getCommonModuleDefinition,
  listCommonModuleDefinitions,
  toCommonModuleMetadata,
} from '../domain/common-module-definitions'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'

interface PersistenceError {
  code?: string
  sqlMessage?: string
  message?: string
}

export class CommonModuleService {
  constructor(private readonly repository: CommonModuleRepository) {}

  listModuleMetadata(): CommonModuleMetadataListResponse {
    return commonModuleMetadataListResponseSchema.parse({
      modules: listCommonModuleDefinitions().map((definition) => toCommonModuleMetadata(definition)),
    })
  }

  getModuleMetadata(moduleKey: CommonModuleKey): CommonModuleMetadataResponse {
    const definition = this.requireDefinition(moduleKey)

    return commonModuleMetadataResponseSchema.parse({
      module: toCommonModuleMetadata(definition),
    })
  }

  async list(moduleKey: CommonModuleKey, includeInactive: boolean) {
    const definition = this.requireDefinition(moduleKey)
    const items = await this.repository.list(definition, includeInactive)

    return commonModuleListResponseSchema.parse({
      module: definition.key,
      items,
    } satisfies CommonModuleListResponse)
  }

  async getRecord(moduleKey: CommonModuleKey, id: string) {
    const definition = this.requireDefinition(moduleKey)
    const item = await this.repository.findById(definition, id)

    if (!item) {
      throw new ApplicationError('Master record not found.', { module: moduleKey, id }, 404)
    }

    return commonModuleRecordResponseSchema.parse({
      module: definition.key,
      item,
    } satisfies CommonModuleRecordResponse)
  }

  async create(moduleKey: CommonModuleKey, payload: unknown) {
    const definition = this.requireDefinition(moduleKey)
    const parsedPayload = this.normalizePayload(definition, payload, 'create')

    try {
      const item = await this.repository.create(definition, parsedPayload.values, parsedPayload.isActive)

      return commonModuleRecordResponseSchema.parse({
        module: definition.key,
        item,
      } satisfies CommonModuleRecordResponse)
    } catch (error) {
      this.throwPersistenceError(error, definition, 'create')
    }
  }

  async update(moduleKey: CommonModuleKey, id: string, payload: unknown) {
    const definition = this.requireDefinition(moduleKey)
    const parsedPayload = this.normalizePayload(definition, payload, 'update')

    try {
      const item = await this.repository.update(
        definition,
        id,
        parsedPayload.values,
        parsedPayload.hasExplicitActiveState ? parsedPayload.isActive : undefined,
      )

      return commonModuleRecordResponseSchema.parse({
        module: definition.key,
        item,
      } satisfies CommonModuleRecordResponse)
    } catch (error) {
      this.throwPersistenceError(error, definition, 'update', id)
    }
  }

  async deactivate(moduleKey: CommonModuleKey, id: string) {
    return this.setActiveState(moduleKey, id, false)
  }

  async restore(moduleKey: CommonModuleKey, id: string) {
    return this.setActiveState(moduleKey, id, true)
  }

  private async setActiveState(moduleKey: CommonModuleKey, id: string, isActive: boolean) {
    const definition = this.requireDefinition(moduleKey)

    try {
      const item = await this.repository.setActiveState(definition, id, isActive)

      return commonModuleRecordResponseSchema.parse({
        module: definition.key,
        item,
      } satisfies CommonModuleRecordResponse)
    } catch (error) {
      this.throwPersistenceError(error, definition, isActive ? 'restore' : 'deactivate', id)
    }
  }

  private requireDefinition(moduleKey: CommonModuleKey) {
    const definition = getCommonModuleDefinition(moduleKey)

    if (!definition) {
      throw new ApplicationError('Unsupported common module.', { module: moduleKey }, 404)
    }

    return definition
  }

  private normalizePayload(definition: CommonModuleDefinition, payload: unknown, mode: 'create' | 'update') {
    const parsedPayload = commonModuleUpsertPayloadSchema.parse(payload)
    const allowedKeys = new Set(definition.columns.map((column) => column.key))
    const unknownKeys = Object.keys(parsedPayload).filter((key) => key !== 'isActive' && !allowedKeys.has(key))

    if (unknownKeys.length > 0) {
      throw new ApplicationError(
        'Payload contains unsupported fields for this module.',
        { module: definition.key, fields: unknownKeys.join(', ') },
        400,
      )
    }

    const values: Record<string, CommonModuleValue> = {}
    const providedKeys = new Set(Object.keys(parsedPayload))

    for (const column of definition.columns) {
      if (!providedKeys.has(column.key)) {
        if (mode === 'create' && column.required) {
          throw new ApplicationError(
            'Required master fields are missing.',
            { module: definition.key, field: column.key },
            400,
          )
        }

        continue
      }

      values[column.key] = this.normalizeFieldValue(definition, column, parsedPayload[column.key])
    }

    if (mode === 'update' && Object.keys(values).length === 0 && parsedPayload.isActive === undefined) {
      throw new ApplicationError(
        'Update payload must include at least one writable field.',
        { module: definition.key },
        400,
      )
    }

    return {
      values,
      isActive: parsedPayload.isActive ?? true,
      hasExplicitActiveState: parsedPayload.isActive !== undefined,
    }
  }

  private normalizeFieldValue(
    definition: CommonModuleDefinition,
    column: CommonModuleDefinition['columns'][number],
    rawValue: CommonModuleValue | undefined,
  ) {
    if (rawValue === undefined) {
      return null
    }

    if (rawValue === null) {
      if (!column.nullable) {
        throw new ApplicationError(
          'A non-nullable master field cannot be null.',
          { module: definition.key, field: column.key },
          400,
        )
      }

      return null
    }

    if (column.type === 'string') {
      if (typeof rawValue !== 'string') {
        throw new ApplicationError(
          'Expected a string value for the master field.',
          { module: definition.key, field: column.key },
          400,
        )
      }

      const value = rawValue.trim()

      if (!value) {
        if (column.required) {
          throw new ApplicationError(
            'A required master field cannot be empty.',
            { module: definition.key, field: column.key },
            400,
          )
        }

        return column.nullable ? null : ''
      }

      return value
    }

    if (column.type === 'boolean') {
      if (typeof rawValue !== 'boolean') {
        throw new ApplicationError(
          'Expected a boolean value for the master field.',
          { module: definition.key, field: column.key },
          400,
        )
      }

      return rawValue
    }

    if (typeof rawValue !== 'number' || !Number.isFinite(rawValue)) {
      throw new ApplicationError(
        'Expected a numeric value for the master field.',
        { module: definition.key, field: column.key },
        400,
      )
    }

    if (column.numberMode === 'integer' && !Number.isInteger(rawValue)) {
      throw new ApplicationError(
        'Expected an integer value for the master field.',
        { module: definition.key, field: column.key },
        400,
      )
    }

    return rawValue
  }

  private throwPersistenceError(
    error: unknown,
    definition: CommonModuleDefinition,
    action: 'create' | 'update' | 'deactivate' | 'restore',
    id?: string,
  ): never {
    if (error instanceof ApplicationError) {
      throw error
    }

    const persistenceError = error as PersistenceError

    if (persistenceError.code === 'ER_DUP_ENTRY') {
      throw new ApplicationError(
        'A master record with the same unique value already exists.',
        {
          module: definition.key,
          action,
          detail: persistenceError.sqlMessage ?? persistenceError.message ?? 'duplicate entry',
        },
        409,
      )
    }

    if (persistenceError.code === 'ER_NO_REFERENCED_ROW_2') {
      throw new ApplicationError(
        'One or more referenced master records do not exist.',
        {
          module: definition.key,
          action,
          detail: persistenceError.sqlMessage ?? persistenceError.message ?? 'missing reference',
        },
        400,
      )
    }

    if (persistenceError.code === 'ER_ROW_IS_REFERENCED_2') {
      throw new ApplicationError(
        'This master record is still referenced by dependent data.',
        { module: definition.key, action, id: id ?? 'unknown' },
        409,
      )
    }

    throw new ApplicationError(
      'Failed to persist common master data.',
      {
        module: definition.key,
        action,
        detail: persistenceError.sqlMessage ?? persistenceError.message ?? 'unknown persistence error',
      },
      500,
    )
  }
}
