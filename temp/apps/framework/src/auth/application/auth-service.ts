import type {
  AuthAccountRecoveryRequestResponse,
  AuthAccountRecoveryRestoreResponse,
  AuthChangePasswordResponse,
  AuthDeleteAccountResponse,
  AuthPasswordResetConfirmResponse,
  AuthPasswordResetRequestResponse,
  AuthRegisterOtpRequestResponse,
  AuthRegisterOtpVerifyResponse,
  AuthTokenResponse,
  AuthUser,
  PermissionKey,
} from '@shared/index'
import {
  authAccountRecoveryRequestPayloadSchema,
  authAccountRecoveryRequestResponseSchema,
  authAccountRecoveryRestorePayloadSchema,
  authAccountRecoveryRestoreResponseSchema,
  authChangePasswordPayloadSchema,
  authChangePasswordResponseSchema,
  authDeleteAccountPayloadSchema,
  authDeleteAccountResponseSchema,
  authPasswordResetConfirmPayloadSchema,
  authPasswordResetConfirmResponseSchema,
  authPasswordResetRequestPayloadSchema,
  authPasswordResetRequestResponseSchema,
  authLoginPayloadSchema,
  authRegisterPayloadSchema,
  authRegisterOtpRequestPayloadSchema,
  authRegisterOtpRequestResponseSchema,
  authRegisterOtpVerifyPayloadSchema,
  authRegisterOtpVerifyResponseSchema,
} from '@shared/index'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomInt } from 'node:crypto'
import type { AuthUserRepository } from '../data/auth-user-repository'
import { environment } from '@framework-core/runtime/config/environment'
import { isDatabaseEnabled } from '@framework-core/runtime/database/database'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'
import type { MailboxService } from '../../mailbox/application/mailbox-service'

interface TokenClaims {
  sub: string
  email: string
  actorType: AuthUser['actorType']
  fallbackAuth?: boolean
}

const fallbackAdminEmail = 'admin@codexsun.com'
const fallbackAdminPassword = 'Aaran1@@'
const fallbackAdminPermissions: {
  key: PermissionKey
  name: string
  summary: string
}[] = [
  { key: 'dashboard:view', name: 'Dashboard View', summary: 'View dashboard surfaces.' },
  { key: 'users:manage', name: 'User Management', summary: 'Manage platform users.' },
  { key: 'roles:manage', name: 'Role Management', summary: 'Manage roles and assignments.' },
  { key: 'permissions:manage', name: 'Permission Management', summary: 'Manage permission mappings.' },
  { key: 'vendors:view', name: 'Vendor Access', summary: 'View vendor-facing records.' },
  { key: 'customers:view', name: 'Customer Access', summary: 'View customer-facing records.' },
]

export class AuthService {
  constructor(
    private readonly repository: AuthUserRepository,
    private readonly mailboxService: MailboxService,
  ) {}

  async requestRegisterOtp(payload: unknown): Promise<AuthRegisterOtpRequestResponse> {
    this.assertDatabaseEnabled()

    const parsedPayload = authRegisterOtpRequestPayloadSchema.parse(payload)
    if (parsedPayload.channel !== 'email') {
      throw new ApplicationError(
        'Mobile OTP is currently disabled. Use email OTP verification instead.',
        { channel: parsedPayload.channel },
        400,
      )
    }

    const actorType = 'customer'
    const destination = parsedPayload.destination.trim().toLowerCase()

    const existingUser = await this.repository.findByEmailAndActorType(destination, actorType)
    if (existingUser) {
      throw new ApplicationError('An account already exists for this email.', { email: destination }, 409)
    }

    const otp = String(randomInt(100000, 1000000))
    const otpHash = await bcrypt.hash(otp, 10)
    const expiresAt = new Date(Date.now() + environment.auth.otp.expiryMinutes * 60_000)

    await this.repository.deactivatePendingContactVerifications({
      purpose: 'customer_registration',
      actorType,
      channel: parsedPayload.channel,
      destination,
    })

    const verification = await this.repository.createContactVerification({
      purpose: 'customer_registration',
      actorType,
      channel: parsedPayload.channel,
      destination,
      otpHash,
      expiresAt,
    })

    try {
      await this.deliverRegisterOtp({
        channel: parsedPayload.channel,
        destination,
        otp,
        verificationId: verification.id,
      })
    } catch (error) {
      await this.repository.deactivatePendingContactVerifications({
        purpose: 'customer_registration',
        actorType,
        channel: parsedPayload.channel,
        destination,
      })

      throw new ApplicationError(
        'Unable to send the email OTP right now.',
        {
          channel: parsedPayload.channel,
          destination,
          detail: error instanceof Error ? error.message : 'Unknown delivery error',
        },
        502,
      )
    }

    return authRegisterOtpRequestResponseSchema.parse({
      verificationId: verification.id,
      expiresAt: verification.expiresAt,
      debugOtp: environment.auth.otp.debug ? otp : null,
    } satisfies AuthRegisterOtpRequestResponse)
  }

  async verifyRegisterOtp(payload: unknown): Promise<AuthRegisterOtpVerifyResponse> {
    this.assertDatabaseEnabled()

    const parsedPayload = authRegisterOtpVerifyPayloadSchema.parse(payload)
    const verification = await this.repository.getContactVerification(parsedPayload.verificationId)

    if (!verification || !verification.isActive || verification.purpose !== 'customer_registration') {
      throw new ApplicationError('Verification session could not be found.', { verificationId: parsedPayload.verificationId }, 404)
    }

    if (verification.consumedAt) {
      throw new ApplicationError('This verification session has already been used.', { verificationId: verification.id }, 409)
    }

    if (verification.verifiedAt) {
      return authRegisterOtpVerifyResponseSchema.parse({
        verificationId: verification.id,
        verified: true,
      } satisfies AuthRegisterOtpVerifyResponse)
    }

    if (new Date(verification.expiresAt).getTime() < Date.now()) {
      throw new ApplicationError('The OTP has expired. Request a new code.', { verificationId: verification.id }, 410)
    }

    if (typeof verification.otpHash !== 'string' || verification.otpHash.length === 0) {
      throw new ApplicationError('Verification session is missing a stored OTP hash.', { verificationId: verification.id }, 500)
    }

    const comparePassword = bcrypt.compare as (password: string, hash: string) => Promise<boolean>
    const otpMatches = await comparePassword(String(parsedPayload.otp ?? ''), String(verification.otpHash ?? ''))
    if (!otpMatches) {
      await this.repository.incrementContactVerificationAttempts(verification.id)
      throw new ApplicationError('Invalid OTP. Check the code and try again.', { verificationId: verification.id }, 400)
    }

    await this.repository.markContactVerificationVerified(verification.id)

    return authRegisterOtpVerifyResponseSchema.parse({
      verificationId: verification.id,
      verified: true,
    } satisfies AuthRegisterOtpVerifyResponse)
  }

  async register(payload: unknown): Promise<AuthTokenResponse> {
    this.assertDatabaseEnabled()

    const parsedPayload = authRegisterPayloadSchema.parse(payload)
    const actorType = 'customer'
    const normalizedEmail = parsedPayload.email.trim().toLowerCase()
    const normalizedPhone = this.normalizePhoneNumber(parsedPayload.phoneNumber)

    if (parsedPayload.actorType !== actorType) {
      throw new ApplicationError('Public registration is limited to customer accounts.', { actorType: parsedPayload.actorType }, 403)
    }

    const emailVerification = await this.repository.getContactVerification(parsedPayload.emailVerificationId)
    this.assertVerifiedRegistrationContact({
      verification: emailVerification,
      expectedChannel: 'email',
      expectedDestination: normalizedEmail,
    })

    const existingUser = await this.repository.findByEmailAndActorType(
      normalizedEmail,
      actorType,
    )

    if (existingUser) {
      throw new ApplicationError(
        'An account already exists for this email.',
        { email: normalizedEmail, actorType },
        409,
      )
    }

    const existingPhoneUsers = await this.repository.findByPhoneNumber(normalizedPhone)
    if (existingPhoneUsers.some((entry) => entry.user.actorType === actorType)) {
      throw new ApplicationError(
        'An account already exists for this mobile number.',
        { phoneNumber: normalizedPhone, actorType },
        409,
      )
    }

    const passwordHash = await bcrypt.hash(parsedPayload.password, 10)
    const user = await this.repository.create({
      email: normalizedEmail,
      phoneNumber: normalizedPhone,
      displayName: parsedPayload.displayName,
      actorType,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(parsedPayload.displayName)}&background=1f2937&color=ffffff`,
      passwordHash,
      organizationName: parsedPayload.organizationName ?? null,
    })

    await this.repository.consumeContactVerification(emailVerification!.id)

    return this.createAuthResponse(user)
  }

  async login(payload: unknown): Promise<AuthTokenResponse> {
    this.assertDatabaseEnabled()

    const parsedPayload = authLoginPayloadSchema.parse(payload)
    const storedUsers = await this.repository.findByEmail(parsedPayload.email)

    if (storedUsers.length === 0) {
      throw new ApplicationError('Invalid credentials.', { email: parsedPayload.email }, 401)
    }

    let storedUser = null

    for (const candidate of storedUsers) {
      const passwordMatches = await bcrypt.compare(parsedPayload.password, candidate.passwordHash)
      if (passwordMatches) {
        storedUser = candidate
        break
      }
    }

    if (!storedUser) {
      throw new ApplicationError('Invalid credentials.', { email: parsedPayload.email }, 401)
    }

    if (!storedUser.user.isActive) {
      if (storedUser.purgeAfterAt && new Date(storedUser.purgeAfterAt).getTime() <= Date.now()) {
        await this.repository.purgeCustomerAccount(storedUser.user.id)
        throw new ApplicationError('This account was permanently deleted after the recovery window expired.', { id: storedUser.user.id }, 403)
      }

      const recoveryDeadline = storedUser.purgeAfterAt
        ? new Date(storedUser.purgeAfterAt).toLocaleString()
        : null
      const message = recoveryDeadline
        ? `The account is disabled. Recovery is available until ${recoveryDeadline}.`
        : 'The account is disabled.'

      throw new ApplicationError(message, { id: storedUser.user.id, purgeAfterAt: storedUser.purgeAfterAt ?? '' }, 403)
    }

    return this.createAuthResponse(storedUser.user)
  }

  async recoveryLogin(payload: unknown): Promise<AuthTokenResponse> {
    const parsedPayload = authLoginPayloadSchema.parse(payload)
    return this.tryFallbackLogin(parsedPayload)
  }

  async getAuthenticatedUser(token: string) {
    const claims = this.readTokenClaims(token)

    if (claims.fallbackAuth) {
      return this.getFallbackAuthenticatedUser(claims)
    }

    const storedUser = await this.repository.findByEmailAndActorType(
      claims.email,
      claims.actorType,
    )

    if (!storedUser) {
      throw new ApplicationError('Authenticated user no longer exists.', { sub: claims.sub }, 404)
    }

    if (!storedUser.user.isActive) {
      if (storedUser.purgeAfterAt && new Date(storedUser.purgeAfterAt).getTime() <= Date.now()) {
        await this.repository.purgeCustomerAccount(storedUser.user.id)
        throw new ApplicationError('This account was permanently deleted after the recovery window expired.', { sub: claims.sub }, 403)
      }

      throw new ApplicationError('This account is disabled.', { sub: claims.sub, purgeAfterAt: storedUser.purgeAfterAt ?? '' }, 403)
    }

    return storedUser.user
  }

  isFallbackRecoveryToken(token: string) {
    return this.readTokenClaims(token).fallbackAuth === true
  }

  async changePassword(user: AuthUser, payload: unknown): Promise<AuthChangePasswordResponse> {
    this.assertDatabaseEnabled()

    if (user.actorType !== 'customer') {
      throw new ApplicationError('Password change is available only for customer accounts here.', {}, 403)
    }

    const parsedPayload = authChangePasswordPayloadSchema.parse(payload)
    const storedUser = await this.repository.findById(user.id)

    if (!storedUser || !storedUser.user.isActive) {
      throw new ApplicationError('Authenticated user no longer exists.', { userId: user.id }, 404)
    }

    const currentPasswordMatches = await bcrypt.compare(parsedPayload.currentPassword, storedUser.passwordHash)
    if (!currentPasswordMatches) {
      throw new ApplicationError('Current password is incorrect.', { userId: user.id }, 400)
    }

    if (parsedPayload.currentPassword === parsedPayload.newPassword) {
      throw new ApplicationError('Choose a new password different from the current one.', { userId: user.id }, 400)
    }

    const nextPasswordHash = await bcrypt.hash(parsedPayload.newPassword, 10)
    await this.repository.updatePasswordHash(user.id, nextPasswordHash)

    return authChangePasswordResponseSchema.parse({
      updated: true,
    } satisfies AuthChangePasswordResponse)
  }

  async deleteAccount(user: AuthUser, payload: unknown): Promise<AuthDeleteAccountResponse> {
    this.assertDatabaseEnabled()

    if (user.actorType !== 'customer') {
      throw new ApplicationError('Account deletion is available only for customer accounts here.', {}, 403)
    }

    const parsedPayload = authDeleteAccountPayloadSchema.parse(payload)
    if (parsedPayload.confirmation.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
      throw new ApplicationError('Enter the exact account email to confirm deletion.', { userId: user.id }, 400)
    }

    const purgeAfter = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
    await this.repository.scheduleCustomerDeletion(user.id, purgeAfter)

    return authDeleteAccountResponseSchema.parse({
      deleted: true,
    } satisfies AuthDeleteAccountResponse)
  }

  async requestAccountRecoveryOtp(payload: unknown): Promise<AuthAccountRecoveryRequestResponse> {
    this.assertDatabaseEnabled()

    const parsedPayload = authAccountRecoveryRequestPayloadSchema.parse(payload)
    const normalizedEmail = parsedPayload.email.trim().toLowerCase()
    const storedUser = await this.repository.findByEmailAndActorType(normalizedEmail, 'customer')

    if (!storedUser) {
      throw new ApplicationError('No customer account exists for this email.', { email: normalizedEmail }, 404)
    }

    if (storedUser.user.isActive) {
      throw new ApplicationError('This customer account is already active.', { email: normalizedEmail }, 409)
    }

    if (storedUser.purgeAfterAt && new Date(storedUser.purgeAfterAt).getTime() <= Date.now()) {
      await this.repository.purgeCustomerAccount(storedUser.user.id)
      throw new ApplicationError('This account was permanently deleted after the recovery window expired.', { email: normalizedEmail }, 410)
    }

    return this.createCustomerEmailOtp({
      email: normalizedEmail,
      displayName: storedUser.user.displayName,
      purpose: 'customer_account_recovery',
      responseSchema: authAccountRecoveryRequestResponseSchema,
    })
  }

  async restoreAccount(payload: unknown): Promise<AuthAccountRecoveryRestoreResponse> {
    this.assertDatabaseEnabled()

    const parsedPayload = authAccountRecoveryRestorePayloadSchema.parse(payload)
    const normalizedEmail = parsedPayload.email.trim().toLowerCase()
    const verification = await this.repository.getContactVerification(parsedPayload.verificationId)

    if (!verification || !verification.isActive || verification.purpose !== 'customer_account_recovery') {
      throw new ApplicationError('Recovery session could not be found.', { verificationId: parsedPayload.verificationId }, 404)
    }

    if (verification.destination !== normalizedEmail || verification.channel !== 'email') {
      throw new ApplicationError('Recovery verification does not match this email.', { email: normalizedEmail }, 400)
    }

    if (verification.consumedAt) {
      throw new ApplicationError('This recovery session has already been used.', { verificationId: verification.id }, 409)
    }

    if (new Date(verification.expiresAt).getTime() < Date.now()) {
      throw new ApplicationError('The recovery OTP has expired. Request a new code.', { verificationId: verification.id }, 410)
    }

    const storedUser = await this.repository.findByEmailAndActorType(normalizedEmail, 'customer')
    if (!storedUser) {
      throw new ApplicationError('No customer account exists for this email.', { email: normalizedEmail }, 404)
    }

    if (storedUser.purgeAfterAt && new Date(storedUser.purgeAfterAt).getTime() <= Date.now()) {
      await this.repository.purgeCustomerAccount(storedUser.user.id)
      throw new ApplicationError('This account was permanently deleted after the recovery window expired.', { email: normalizedEmail }, 410)
    }

    const otpMatches = await bcrypt.compare(parsedPayload.otp, verification.otpHash)
    if (!otpMatches) {
      await this.repository.incrementContactVerificationAttempts(verification.id)
      throw new ApplicationError('Invalid OTP. Check the code and try again.', { verificationId: verification.id }, 400)
    }

    await this.repository.markContactVerificationVerified(verification.id)
    await this.repository.consumeContactVerification(verification.id)
    await this.repository.reactivateUser(storedUser.user.id)

    return authAccountRecoveryRestoreResponseSchema.parse({
      restored: true,
    } satisfies AuthAccountRecoveryRestoreResponse)
  }

  async requestPasswordResetOtp(payload: unknown): Promise<AuthPasswordResetRequestResponse> {
    this.assertDatabaseEnabled()

    const parsedPayload = authPasswordResetRequestPayloadSchema.parse(payload)
    const normalizedEmail = parsedPayload.email.trim().toLowerCase()
    const storedUser = await this.repository.findByEmailAndActorType(normalizedEmail, 'customer')

    if (!storedUser) {
      throw new ApplicationError('No customer account exists for this email.', { email: normalizedEmail }, 404)
    }

    if (!storedUser.user.isActive) {
      throw new ApplicationError('This customer account is disabled. Use account recovery instead.', { email: normalizedEmail }, 409)
    }

    return this.createCustomerEmailOtp({
      email: normalizedEmail,
      displayName: storedUser.user.displayName,
      purpose: 'customer_password_reset',
      responseSchema: authPasswordResetRequestResponseSchema,
    })
  }

  async requestPasswordResetForCustomer(customerId: string): Promise<AuthPasswordResetRequestResponse> {
    this.assertDatabaseEnabled()

    const storedUser = await this.repository.findById(customerId)
    if (!storedUser || storedUser.user.actorType !== 'customer') {
      throw new ApplicationError('Customer account could not be found for password reset help.', { customerId }, 404)
    }

    if (!storedUser.user.isActive) {
      throw new ApplicationError('Disabled accounts must use recovery instead of password reset.', { customerId }, 409)
    }

    return this.createCustomerEmailOtp({
      email: storedUser.user.email,
      displayName: storedUser.user.displayName,
      purpose: 'customer_password_reset',
      responseSchema: authPasswordResetRequestResponseSchema,
    })
  }

  async requestAccountRecoveryForCustomer(customerId: string): Promise<AuthAccountRecoveryRequestResponse> {
    this.assertDatabaseEnabled()

    const storedUser = await this.repository.findById(customerId)
    if (!storedUser || storedUser.user.actorType !== 'customer') {
      throw new ApplicationError('Customer account could not be found for recovery help.', { customerId }, 404)
    }

    if (storedUser.user.isActive) {
      throw new ApplicationError('Active customer accounts should use password reset instead of recovery.', { customerId }, 409)
    }

    return this.requestAccountRecoveryOtp({
      email: storedUser.user.email,
    })
  }

  async confirmPasswordReset(payload: unknown): Promise<AuthPasswordResetConfirmResponse> {
    this.assertDatabaseEnabled()

    const parsedPayload = authPasswordResetConfirmPayloadSchema.parse(payload)
    const normalizedEmail = parsedPayload.email.trim().toLowerCase()
    const verification = await this.repository.getContactVerification(parsedPayload.verificationId)

    if (!verification || !verification.isActive || verification.purpose !== 'customer_password_reset') {
      throw new ApplicationError('Password reset session could not be found.', { verificationId: parsedPayload.verificationId }, 404)
    }

    if (verification.destination !== normalizedEmail || verification.channel !== 'email') {
      throw new ApplicationError('Password reset verification does not match this email.', { email: normalizedEmail }, 400)
    }

    if (verification.consumedAt) {
      throw new ApplicationError('This password reset session has already been used.', { verificationId: verification.id }, 409)
    }

    if (new Date(verification.expiresAt).getTime() < Date.now()) {
      throw new ApplicationError('The password reset OTP has expired. Request a new code.', { verificationId: verification.id }, 410)
    }

    const storedUser = await this.repository.findByEmailAndActorType(normalizedEmail, 'customer')
    if (!storedUser) {
      throw new ApplicationError('No customer account exists for this email.', { email: normalizedEmail }, 404)
    }

    if (!storedUser.user.isActive) {
      throw new ApplicationError('This customer account is disabled. Use account recovery instead.', { email: normalizedEmail }, 409)
    }

    const otpMatches = await bcrypt.compare(parsedPayload.otp, verification.otpHash)
    if (!otpMatches) {
      await this.repository.incrementContactVerificationAttempts(verification.id)
      throw new ApplicationError('Invalid OTP. Check the code and try again.', { verificationId: verification.id }, 400)
    }

    const nextPasswordHash = await bcrypt.hash(parsedPayload.newPassword, 10)
    await this.repository.updatePasswordHash(storedUser.user.id, nextPasswordHash)
    await this.repository.markContactVerificationVerified(verification.id)
    await this.repository.consumeContactVerification(verification.id)

    return authPasswordResetConfirmResponseSchema.parse({
      updated: true,
    } satisfies AuthPasswordResetConfirmResponse)
  }

  private createAuthResponse(user: AuthUser): AuthTokenResponse {
    const accessToken = jwt.sign(
      {
        email: user.email,
        actorType: user.actorType,
      },
      environment.jwtSecret,
      {
        subject: user.id,
        expiresIn: environment.jwtExpiresInSeconds,
      },
    )

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresInSeconds: environment.jwtExpiresInSeconds,
      user,
    }
  }

  private tryFallbackLogin(payload: { email: string; password: string }) {
    if (
      payload.email.trim().toLowerCase() !== fallbackAdminEmail
      || payload.password !== fallbackAdminPassword
    ) {
      throw new ApplicationError('Invalid credentials.', { email: payload.email }, 401)
    }

    return this.createFallbackAuthResponse()
  }

  private assertDatabaseEnabled() {
    if (!isDatabaseEnabled()) {
      throw new ApplicationError(
        'Database-backed authentication is disabled.',
        { dbEnabled: false },
        503,
      )
    }
  }

  private assertVerifiedRegistrationContact(input: {
    verification: Awaited<ReturnType<AuthUserRepository['getContactVerification']>>
    expectedChannel: 'email' | 'mobile'
    expectedDestination: string
  }) {
    const { verification, expectedChannel, expectedDestination } = input

    if (!verification || !verification.isActive) {
      throw new ApplicationError('A required verification session is missing.', { channel: expectedChannel }, 400)
    }

    if (verification.purpose !== 'customer_registration' || verification.actorType !== 'customer') {
      throw new ApplicationError('Verification session is not valid for customer registration.', { channel: expectedChannel }, 400)
    }

    if (verification.channel !== expectedChannel) {
      throw new ApplicationError('Verification channel mismatch.', { channel: expectedChannel }, 400)
    }

    if (verification.destination !== expectedDestination) {
      throw new ApplicationError('Verification destination mismatch.', { channel: expectedChannel }, 400)
    }

    if (!verification.verifiedAt) {
      throw new ApplicationError('Verify the OTP before completing registration.', { channel: expectedChannel }, 400)
    }

    if (verification.consumedAt) {
      throw new ApplicationError('Verification session has already been used.', { channel: expectedChannel }, 409)
    }

    if (new Date(verification.expiresAt).getTime() < Date.now()) {
      throw new ApplicationError('One of the verification sessions expired. Request a new OTP.', { channel: expectedChannel }, 410)
    }
  }

  private normalizePhoneNumber(value: string) {
    const trimmed = value.trim()
    const digits = trimmed.replace(/\D/g, '')

    if (!digits) {
      throw new ApplicationError('Enter a valid mobile number.', { phoneNumber: value }, 400)
    }

    if (digits.length === 10) {
      return `+91${digits}`
    }

    const normalized = trimmed.startsWith('+') ? `+${digits}` : `+${digits}`

    if (!normalized || normalized === '+') {
      throw new ApplicationError('Enter a valid mobile number.', { phoneNumber: value }, 400)
    }

    if (digits.length < 11 || digits.length > 15) {
      throw new ApplicationError('Enter a valid mobile number.', { phoneNumber: value }, 400)
    }

    return normalized
  }

  private async deliverRegisterOtp(input: {
    channel: 'email' | 'mobile'
    destination: string
    otp: string
    verificationId: string
  }) {
    if (input.channel !== 'email') {
      throw new Error('Mobile OTP delivery is disabled.')
    }

    await this.mailboxService.sendTemplatedEmail({
      to: [{ email: input.destination, name: null }],
      subject: '',
      templateCode: 'customer_registration_otp',
      templateData: {
        brandName: environment.notifications.email.fromName || 'codexsun',
        otp: input.otp,
        expiryMinutes: environment.auth.otp.expiryMinutes,
      },
      referenceType: 'customer_registration_otp',
      referenceId: input.verificationId,
    }, { allowDebugFallback: true })
  }

  private async createCustomerEmailOtp<TResponse extends {
    verificationId: string
    expiresAt: string
    debugOtp: string | null
  }>(input: {
    email: string
    displayName: string | null
    purpose: 'customer_account_recovery' | 'customer_password_reset'
    responseSchema: { parse: (value: unknown) => TResponse }
  }): Promise<TResponse> {
    const otp = String(randomInt(100000, 1000000))
    const otpHash = await bcrypt.hash(otp, 10)
    const expiresAt = new Date(Date.now() + environment.auth.otp.expiryMinutes * 60_000)

    await this.repository.deactivatePendingContactVerifications({
      purpose: input.purpose,
      actorType: 'customer',
      channel: 'email',
      destination: input.email,
    })

    const verification = await this.repository.createContactVerification({
      purpose: input.purpose,
      actorType: 'customer',
      channel: 'email',
      destination: input.email,
      otpHash,
      expiresAt,
    })

    await this.mailboxService.sendTemplatedEmail({
      to: [{ email: input.email, name: input.displayName }],
      subject: '',
      templateCode: 'customer_registration_otp',
      templateData: {
        brandName: environment.notifications.email.fromName || 'codexsun',
        otp,
        expiryMinutes: environment.auth.otp.expiryMinutes,
      },
      referenceType: input.purpose,
      referenceId: verification.id,
    }, { allowDebugFallback: true })

    return input.responseSchema.parse({
      verificationId: verification.id,
      expiresAt: verification.expiresAt,
      debugOtp: environment.auth.otp.debug ? otp : null,
    })
  }

  private readTokenClaims(token: string) {
    return jwt.verify(token, environment.jwtSecret) as TokenClaims
  }

  private createFallbackAuthResponse() {
    const user = this.buildFallbackAdminUser()
    const accessToken = jwt.sign(
      {
        email: user.email,
        actorType: user.actorType,
        fallbackAuth: true,
      },
      environment.jwtSecret,
      {
        subject: user.id,
        expiresIn: environment.jwtExpiresInSeconds,
      },
    )

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresInSeconds: environment.jwtExpiresInSeconds,
      user,
    } satisfies AuthTokenResponse
  }

  private getFallbackAuthenticatedUser(claims: TokenClaims) {
    if (claims.email.trim().toLowerCase() !== fallbackAdminEmail || claims.actorType !== 'admin') {
      throw new ApplicationError('Invalid recovery session.', {}, 401)
    }

    return this.buildFallbackAdminUser()
  }

  private buildFallbackAdminUser(): AuthUser {
    return {
      id: 'fallback-recovery-admin',
      email: fallbackAdminEmail,
      phoneNumber: null,
      displayName: 'Recovery Admin',
      actorType: 'admin',
      isSuperAdmin: true,
      avatarUrl: 'https://ui-avatars.com/api/?name=Recovery+Admin&background=1f2937&color=ffffff',
      isActive: true,
      organizationName: 'codexsun Recovery',
      roles: [
        {
          key: 'admin_owner',
          name: 'Admin Owner',
          summary: 'Recovery-mode super admin access.',
          actorType: 'admin',
          permissions: fallbackAdminPermissions,
        },
      ],
      permissions: fallbackAdminPermissions,
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
    }
  }
}
