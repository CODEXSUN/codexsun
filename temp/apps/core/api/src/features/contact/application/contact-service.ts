import type { ContactListResponse, ContactResponse, ContactUpsertPayload } from '@shared/index'
import { contactListResponseSchema, contactResponseSchema, contactUpsertPayloadSchema } from '@shared/index'
import type { ContactRepository } from '../data/contact-repository'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'

interface PersistenceError { code?: string; sqlMessage?: string; message?: string }

export class ContactService {
  constructor(private readonly repository: ContactRepository) {}

  async list() {
    return contactListResponseSchema.parse({ items: await this.repository.list() } satisfies ContactListResponse)
  }

  async getById(id: string) {
    const item = await this.repository.findById(id)
    if (!item) throw new ApplicationError('Contact not found.', { id }, 404)
    return contactResponseSchema.parse({ item } satisfies ContactResponse)
  }

  async create(payload: unknown) {
    const parsed = normalizePayload(contactUpsertPayloadSchema.parse(payload))
    try {
      return contactResponseSchema.parse({ item: await this.repository.create(parsed) } satisfies ContactResponse)
    } catch (error) {
      this.throwPersistenceError(error, 'create')
    }
  }

  async update(id: string, payload: unknown) {
    const parsed = normalizePayload(contactUpsertPayloadSchema.parse(payload))
    try {
      return contactResponseSchema.parse({ item: await this.repository.update(id, parsed) } satisfies ContactResponse)
    } catch (error) {
      this.throwPersistenceError(error, 'update', id)
    }
  }

  async deactivate(id: string) {
    try {
      return contactResponseSchema.parse({ item: await this.repository.setActiveState(id, false) } satisfies ContactResponse)
    } catch (error) {
      this.throwPersistenceError(error, 'deactivate', id)
    }
  }

  async restore(id: string) {
    try {
      return contactResponseSchema.parse({ item: await this.repository.setActiveState(id, true) } satisfies ContactResponse)
    } catch (error) {
      this.throwPersistenceError(error, 'restore', id)
    }
  }

  private throwPersistenceError(error: unknown, action: 'create'|'update'|'deactivate'|'restore', id?: string): never {
    if (error instanceof ApplicationError) throw error
    const persistenceError = error as PersistenceError
    if (persistenceError.code === 'ER_DUP_ENTRY') {
      throw new ApplicationError('A contact with the same unique value already exists.', { action, detail: persistenceError.sqlMessage ?? persistenceError.message ?? 'duplicate entry' }, 409)
    }
    if (persistenceError.code === 'ER_NO_REFERENCED_ROW_2') {
      throw new ApplicationError('One or more referenced records do not exist.', { action, detail: persistenceError.sqlMessage ?? persistenceError.message ?? 'missing reference' }, 400)
    }
    throw new ApplicationError('Failed to persist contact data.', { action, id: id ?? 'new', detail: persistenceError.sqlMessage ?? persistenceError.message ?? 'unknown persistence error' }, 500)
  }
}

function normalizePayload(payload: ContactUpsertPayload): ContactUpsertPayload {
  return {
    ...payload,
    addresses: payload.addresses.filter((address) => (
      address.addressLine1 !== '-'
      || address.addressLine2 !== '-'
      || address.cityId !== '1'
      || address.stateId !== '1'
      || address.countryId !== '1'
      || address.pincodeId !== '1'
      || address.latitude != null
      || address.longitude != null
    )),
    emails: payload.emails.filter((email) => email.email !== '-'),
    phones: payload.phones.filter((phone) => phone.phoneNumber !== '-'),
    bankAccounts: payload.bankAccounts.filter((account) => (
      account.bankName !== '-'
      || account.accountNumber !== '-'
      || account.accountHolderName !== '-'
      || account.ifsc !== '-'
      || account.branch !== '-'
    )),
    gstDetails: payload.gstDetails.filter((detail) => detail.gstin !== '-' || detail.state !== '-'),
  }
}
