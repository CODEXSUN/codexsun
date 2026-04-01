import {
  customerProfileResponseSchema,
  customerProfileUpdatePayloadSchema,
  type AuthUser,
} from '@shared/index'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'
import type { CustomerProfileRepository } from '../data/customer-profile-repository'

export class CustomerProfileService {
  constructor(private readonly repository: CustomerProfileRepository) {}

  async getProfile(user: AuthUser) {
    if (user.actorType !== 'customer') {
      throw new ApplicationError('Customer profile is available for customer accounts only.', {}, 403)
    }

    return customerProfileResponseSchema.parse({
      profile: await this.repository.getByUser(user),
    })
  }

  async saveProfile(user: AuthUser, payload: unknown) {
    if (user.actorType !== 'customer') {
      throw new ApplicationError('Customer profile is available for customer accounts only.', {}, 403)
    }

    const parsedPayload = customerProfileUpdatePayloadSchema.parse(payload)

    return customerProfileResponseSchema.parse({
      profile: await this.repository.save(user, parsedPayload),
    })
  }
}
