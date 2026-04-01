import type { ProductListResponse, ProductResponse, ProductUpsertPayload, StorefrontCatalogResponse } from '@shared/index'
import {
  productListResponseSchema,
  productResponseSchema,
  productUpsertPayloadSchema,
  storefrontCatalogResponseSchema,
} from '@shared/index'
import type { ProductRepository } from '../data/product-repository'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'

interface PersistenceError {
  code?: string
  sqlMessage?: string
  message?: string
}

export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  async list() {
    const items = await this.repository.list()
    return productListResponseSchema.parse({ items } satisfies ProductListResponse)
  }

  async getById(id: string) {
    const item = await this.repository.findById(id)

    if (!item) {
      throw new ApplicationError('Product not found.', { id }, 404)
    }

    return productResponseSchema.parse({ item } satisfies ProductResponse)
  }

  async getStorefrontCatalog() {
    const catalog = await this.repository.listStorefrontCatalog()
    return storefrontCatalogResponseSchema.parse(catalog satisfies StorefrontCatalogResponse)
  }

  async create(payload: unknown) {
    const parsedPayload = this.parsePayload(payload)

    try {
      const item = await this.repository.create(parsedPayload)
      return productResponseSchema.parse({ item } satisfies ProductResponse)
    } catch (error) {
      this.throwPersistenceError(error, 'create')
    }
  }

  async update(id: string, payload: unknown) {
    const parsedPayload = this.parsePayload(payload)

    try {
      const item = await this.repository.update(id, parsedPayload)
      return productResponseSchema.parse({ item } satisfies ProductResponse)
    } catch (error) {
      this.throwPersistenceError(error, 'update', id)
    }
  }

  async deactivate(id: string) {
    try {
      const item = await this.repository.setActiveState(id, false)
      return productResponseSchema.parse({ item } satisfies ProductResponse)
    } catch (error) {
      this.throwPersistenceError(error, 'deactivate', id)
    }
  }

  async restore(id: string) {
    try {
      const item = await this.repository.setActiveState(id, true)
      return productResponseSchema.parse({ item } satisfies ProductResponse)
    } catch (error) {
      this.throwPersistenceError(error, 'restore', id)
    }
  }

  private parsePayload(payload: unknown) {
    const parsedPayload = productUpsertPayloadSchema.parse(payload)
    const normalizedPayload = {
      ...parsedPayload,
      slug: parsedPayload.slug || this.toSlug(parsedPayload.name),
      sku: parsedPayload.sku || this.toSku(parsedPayload.name),
    }
    this.validateClientReferences(normalizedPayload)
    return normalizedPayload
  }

  private toSlug(value: string) {
    const slug = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    return slug || 'product'
  }

  private toSku(value: string) {
    const sku = value
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    return sku || 'PRODUCT'
  }

  private validateClientReferences(payload: ProductUpsertPayload) {
    const variantKeys = new Set<string>()
    const attributeKeys = new Set<string>()
    const attributeValueKeys = new Set<string>()

    for (const variant of payload.variants) {
      if (variantKeys.has(variant.clientKey)) {
        throw new ApplicationError('Variant client keys must be unique.', { clientKey: variant.clientKey }, 400)
      }
      variantKeys.add(variant.clientKey)
    }

    for (const attribute of payload.attributes) {
      if (attributeKeys.has(attribute.clientKey)) {
        throw new ApplicationError('Attribute client keys must be unique.', { clientKey: attribute.clientKey }, 400)
      }
      attributeKeys.add(attribute.clientKey)
    }

    for (const attributeValue of payload.attributeValues) {
      if (!attributeKeys.has(attributeValue.attributeClientKey)) {
        throw new ApplicationError(
          'Attribute values must reference an existing attribute client key.',
          { attributeClientKey: attributeValue.attributeClientKey },
          400,
        )
      }
      if (attributeValueKeys.has(attributeValue.clientKey)) {
        throw new ApplicationError('Attribute value client keys must be unique.', { clientKey: attributeValue.clientKey }, 400)
      }
      attributeValueKeys.add(attributeValue.clientKey)
    }

    for (const collection of [payload.prices, payload.discounts, payload.stockItems, payload.stockMovements]) {
      for (const item of collection) {
        if (item.variantClientKey && !variantKeys.has(item.variantClientKey)) {
          throw new ApplicationError(
            'Variant-linked records must reference an existing variant client key.',
            { variantClientKey: item.variantClientKey },
            400,
          )
        }
      }
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
        'A product with the same unique value already exists.',
        { action, detail: persistenceError.sqlMessage ?? persistenceError.message ?? 'duplicate entry' },
        409,
      )
    }

    if (persistenceError.code === 'ER_NO_REFERENCED_ROW_2') {
      throw new ApplicationError(
        'One or more referenced product master records do not exist.',
        { action, detail: persistenceError.sqlMessage ?? persistenceError.message ?? 'missing reference' },
        400,
      )
    }

    throw new ApplicationError(
      'Failed to persist product data.',
      { action, id: id ?? 'new', detail: persistenceError.sqlMessage ?? persistenceError.message ?? 'unknown persistence error' },
      500,
    )
  }
}
