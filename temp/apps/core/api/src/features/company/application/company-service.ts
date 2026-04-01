import type { CompanyListResponse, CompanyResponse } from '@shared/index'
import {
  companyListResponseSchema,
  companyResponseSchema,
  companyUpsertPayloadSchema,
} from '@shared/index'
import type { CompanyRepository } from '../data/company-repository'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'

interface PersistenceError {
  code?: string
  sqlMessage?: string
  message?: string
}

export class CompanyService {
  constructor(private readonly repository: CompanyRepository) {}

  async list() {
    const items = await this.repository.list()

    return companyListResponseSchema.parse({
      items,
    } satisfies CompanyListResponse)
  }

  async getById(id: string) {
    const item = await this.repository.findById(id)

    if (!item) {
      throw new ApplicationError('Company not found.', { id }, 404)
    }

    return companyResponseSchema.parse({
      item,
    } satisfies CompanyResponse)
  }

  async create(payload: unknown) {
    const parsedPayload = companyUpsertPayloadSchema.parse(payload)

    try {
      const item = await this.repository.create(parsedPayload)
      return companyResponseSchema.parse({ item } satisfies CompanyResponse)
    } catch (error) {
      this.throwPersistenceError(error, 'create')
    }
  }

  async update(id: string, payload: unknown) {
    const parsedPayload = companyUpsertPayloadSchema.parse(payload)

    try {
      const item = await this.repository.update(id, parsedPayload)
      return companyResponseSchema.parse({ item } satisfies CompanyResponse)
    } catch (error) {
      this.throwPersistenceError(error, 'update', id)
    }
  }

  async deactivate(id: string) {
    try {
      const item = await this.repository.setActiveState(id, false)
      return companyResponseSchema.parse({ item } satisfies CompanyResponse)
    } catch (error) {
      this.throwPersistenceError(error, 'deactivate', id)
    }
  }

  async restore(id: string) {
    try {
      const item = await this.repository.setActiveState(id, true)
      return companyResponseSchema.parse({ item } satisfies CompanyResponse)
    } catch (error) {
      this.throwPersistenceError(error, 'restore', id)
    }
  }

  private throwPersistenceError(
    error: unknown,
    action: 'create' | 'update' | 'deactivate' | 'restore',
    id?: string,
  ): never {
    if (error instanceof ApplicationError) {
      throw error
    }

    const persistenceError = error as PersistenceError

    if (persistenceError.code === 'ER_DUP_ENTRY') {
      throw new ApplicationError(
        'A company with the same unique value already exists.',
        { action, detail: persistenceError.sqlMessage ?? persistenceError.message ?? 'duplicate entry' },
        409,
      )
    }

    if (persistenceError.code === 'ER_NO_REFERENCED_ROW_2') {
      throw new ApplicationError(
        'One or more referenced location records do not exist.',
        { action, detail: persistenceError.sqlMessage ?? persistenceError.message ?? 'missing reference' },
        400,
      )
    }

    throw new ApplicationError(
      'Failed to persist company data.',
      { action, id: id ?? 'new', detail: persistenceError.sqlMessage ?? persistenceError.message ?? 'unknown persistence error' },
      500,
    )
  }
}
