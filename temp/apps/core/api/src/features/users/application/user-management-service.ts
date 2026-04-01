import bcrypt from 'bcryptjs'
import {
  authUserListResponseSchema,
  authUserResponseSchema,
  authUserUpsertPayloadSchema,
  type AuthUser,
} from '@shared/index'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'
import { AuthUserRepository } from '@framework-core/auth/data/auth-user-repository'
import { isSuperAdminEmail } from '@framework-core/runtime/config/environment'

export class UserManagementService {
  constructor(private readonly repository: AuthUserRepository) {}

  async list(user: AuthUser) {
    this.assertCanManageUsers(user)

    return authUserListResponseSchema.parse({
      items: await this.repository.list(),
    })
  }

  async getById(user: AuthUser, userId: string) {
    this.assertCanManageUsers(user)

    const storedUser = await this.repository.findById(userId)
    if (!storedUser) {
      throw new ApplicationError('User could not be found.', { userId }, 404)
    }

    return authUserResponseSchema.parse({
      item: storedUser.user,
    })
  }

  async create(user: AuthUser, payload: unknown) {
    this.assertCanManageUsers(user)

    const parsedPayload = authUserUpsertPayloadSchema.parse(payload)
    if (!parsedPayload.password) {
      throw new ApplicationError('Password is required when creating a user.', {}, 400)
    }

    const normalizedEmail = parsedPayload.email.trim().toLowerCase()
    this.assertCanManageSuperAdminTarget(user, false, normalizedEmail, parsedPayload.actorType)
    const normalizedPhone = this.normalizePhoneNumber(parsedPayload.phoneNumber)
    await this.assertUniqueIdentity({
      email: normalizedEmail,
      phoneNumber: normalizedPhone,
      ignoreUserId: null,
    })

    const passwordHash = await bcrypt.hash(parsedPayload.password, 10)
    const createdUser = await this.repository.create({
      email: normalizedEmail,
      phoneNumber: normalizedPhone,
      displayName: parsedPayload.displayName.trim(),
      actorType: parsedPayload.actorType,
      avatarUrl: parsedPayload.avatarUrl ?? this.buildDefaultAvatarUrl(parsedPayload.displayName),
      passwordHash,
      organizationName: parsedPayload.organizationName,
    })

    if (!parsedPayload.isActive) {
      await this.repository.deactivateUser(createdUser.id)
      const storedUser = await this.repository.findById(createdUser.id)
      if (!storedUser) {
        throw new ApplicationError('Expected created user to be retrievable.', { userId: createdUser.id }, 500)
      }

      return authUserResponseSchema.parse({
        item: storedUser.user,
      })
    }

    return authUserResponseSchema.parse({
      item: createdUser,
    })
  }

  async update(user: AuthUser, userId: string, payload: unknown) {
    this.assertCanManageUsers(user)

    const storedUser = await this.repository.findById(userId)
    if (!storedUser) {
      throw new ApplicationError('User could not be found.', { userId }, 404)
    }

    const parsedPayload = authUserUpsertPayloadSchema.parse(payload)
    if (user.id === userId && !parsedPayload.isActive) {
      throw new ApplicationError('You cannot deactivate your own account from user management.', { userId }, 409)
    }

    const normalizedEmail = parsedPayload.email.trim().toLowerCase()
    this.assertCanManageSuperAdminTarget(user, storedUser.user.isSuperAdmin, normalizedEmail, parsedPayload.actorType)
    const normalizedPhone = this.normalizePhoneNumber(parsedPayload.phoneNumber)
    await this.assertUniqueIdentity({
      email: normalizedEmail,
      phoneNumber: normalizedPhone,
      ignoreUserId: userId,
    })

    const nextPasswordHash = parsedPayload.password
      ? await bcrypt.hash(parsedPayload.password, 10)
      : null

    const updatedUser = await this.repository.update({
      id: userId,
      email: normalizedEmail,
      phoneNumber: normalizedPhone,
      displayName: parsedPayload.displayName.trim(),
      actorType: parsedPayload.actorType,
      avatarUrl: parsedPayload.avatarUrl ?? this.buildDefaultAvatarUrl(parsedPayload.displayName),
      organizationName: parsedPayload.organizationName,
      isActive: parsedPayload.isActive,
      passwordHash: nextPasswordHash,
    })

    return authUserResponseSchema.parse({
      item: updatedUser,
    })
  }

  async deactivate(user: AuthUser, userId: string) {
    this.assertCanManageUsers(user)

    if (user.id === userId) {
      throw new ApplicationError('You cannot deactivate your own account from user management.', { userId }, 409)
    }

    const storedUser = await this.repository.findById(userId)
    if (!storedUser) {
      throw new ApplicationError('User could not be found.', { userId }, 404)
    }
    this.assertCanManageSuperAdminTarget(user, storedUser.user.isSuperAdmin)

    await this.repository.deactivateUser(userId)

    const updatedUser = await this.repository.findById(userId)
    if (!updatedUser) {
      throw new ApplicationError('Expected deactivated user to be retrievable.', { userId }, 500)
    }

    return authUserResponseSchema.parse({
      item: updatedUser.user,
    })
  }

  async restore(user: AuthUser, userId: string) {
    this.assertCanManageUsers(user)

    const storedUser = await this.repository.findById(userId)
    if (!storedUser) {
      throw new ApplicationError('User could not be found.', { userId }, 404)
    }
    this.assertCanManageSuperAdminTarget(user, storedUser.user.isSuperAdmin)

    await this.repository.reactivateUser(userId)

    const updatedUser = await this.repository.findById(userId)
    if (!updatedUser) {
      throw new ApplicationError('Expected restored user to be retrievable.', { userId }, 500)
    }

    return authUserResponseSchema.parse({
      item: updatedUser.user,
    })
  }

  private assertCanManageUsers(user: AuthUser) {
    const hasPermission = user.isSuperAdmin || user.permissions.some((permission) => permission.key === 'users:manage')
    if (!hasPermission) {
      throw new ApplicationError('User management access is required.', { userId: user.id }, 403)
    }
  }

  private assertCanManageSuperAdminTarget(
    user: AuthUser,
    targetIsSuperAdmin: boolean,
    nextEmail?: string,
    nextActorType?: AuthUser['actorType'],
  ) {
    const nextIsSuperAdmin = nextEmail && nextActorType
      ? isSuperAdminEmail(nextEmail, nextActorType)
      : false

    if ((targetIsSuperAdmin || nextIsSuperAdmin) && !user.isSuperAdmin) {
      throw new ApplicationError('Super admin access is required to manage this user.', { userId: user.id }, 403)
    }
  }

  private async assertUniqueIdentity(input: {
    email: string
    phoneNumber: string | null
    ignoreUserId: string | null
  }) {
    const existingEmailUsers = await this.repository.findByEmail(input.email)
    if (existingEmailUsers.some((entry) => entry.user.id !== input.ignoreUserId)) {
      throw new ApplicationError('An account already exists for this email.', { email: input.email }, 409)
    }

    if (input.phoneNumber) {
      const existingPhoneUsers = await this.repository.findByPhoneNumber(input.phoneNumber)
      if (existingPhoneUsers.some((entry) => entry.user.id !== input.ignoreUserId)) {
        throw new ApplicationError('An account already exists for this phone number.', { phoneNumber: input.phoneNumber }, 409)
      }
    }
  }

  private normalizePhoneNumber(value: string | null) {
    if (!value) {
      return null
    }

    const trimmed = value.trim()
    if (!trimmed) {
      return null
    }

    const digits = trimmed.replace(/\D/g, '')
    if (!digits) {
      throw new ApplicationError('Enter a valid mobile number.', { phoneNumber: value }, 400)
    }

    if (digits.length === 10) {
      return `+91${digits}`
    }

    if (digits.length < 11 || digits.length > 15) {
      throw new ApplicationError('Enter a valid mobile number.', { phoneNumber: value }, 400)
    }

    return `+${digits}`
  }

  private buildDefaultAvatarUrl(displayName: string) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName.trim())}&background=1f2937&color=ffffff`
  }
}
