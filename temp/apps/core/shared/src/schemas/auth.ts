import { z } from 'zod'

export const actorTypeSchema = z.enum(['customer', 'staff', 'admin', 'vendor'])
export const permissionKeySchema = z.enum([
  'dashboard:view',
  'users:manage',
  'roles:manage',
  'permissions:manage',
  'vendors:view',
  'customers:view',
])

export const roleKeySchema = z.enum([
  'customer_portal',
  'staff_operator',
  'admin_owner',
  'vendor_portal',
])

export const permissionSchema = z.object({
  key: permissionKeySchema,
  name: z.string().min(1),
  summary: z.string().min(1),
})

export const roleSchema = z.object({
  key: roleKeySchema,
  name: z.string().min(1),
  summary: z.string().min(1),
  actorType: actorTypeSchema,
  permissions: z.array(permissionSchema),
})

export const authUserSchema = z.object({
  id: z.string().min(1),
  email: z.email(),
  phoneNumber: z.string().min(10).nullable(),
  displayName: z.string().min(1),
  actorType: actorTypeSchema,
  isSuperAdmin: z.boolean(),
  avatarUrl: z.url().nullable(),
  isActive: z.boolean(),
  organizationName: z.string().min(1).nullable(),
  roles: z.array(roleSchema),
  permissions: z.array(permissionSchema),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const authUserSummarySchema = authUserSchema

const nullablePhoneInputSchema = z
  .string()
  .trim()
  .max(20)
  .nullable()
  .transform((value) => {
    if (typeof value !== 'string') {
      return null
    }

    return value.length === 0 ? null : value
  })

const nullableUrlInputSchema = z
  .string()
  .trim()
  .nullable()
  .transform((value) => {
    if (typeof value !== 'string') {
      return null
    }

    return value.length === 0 ? null : value
  })
  .refine((value) => value === null || z.url().safeParse(value).success, {
    message: 'Enter a valid URL.',
  })

const nullableOrganizationInputSchema = z
  .string()
  .trim()
  .max(120)
  .nullable()
  .transform((value) => {
    if (typeof value !== 'string') {
      return null
    }

    return value.length === 0 ? null : value
  })

export const authUserUpsertPayloadSchema = z.object({
  email: z.email(),
  phoneNumber: nullablePhoneInputSchema,
  displayName: z.string().trim().min(2).max(120),
  actorType: actorTypeSchema,
  avatarUrl: nullableUrlInputSchema,
  organizationName: nullableOrganizationInputSchema,
  password: z.string().min(8).nullable().optional(),
  isActive: z.boolean(),
})

export const authUserResponseSchema = z.object({
  item: authUserSchema,
})

export const authUserListResponseSchema = z.object({
  items: z.array(authUserSummarySchema),
})

export const authOtpChannelSchema = z.enum(['email', 'mobile'])

export const authRegisterOtpRequestPayloadSchema = z.object({
  channel: authOtpChannelSchema,
  destination: z.string().trim().min(1),
})

export const authRegisterOtpRequestResponseSchema = z.object({
  verificationId: z.string().min(1),
  expiresAt: z.string().min(1),
  debugOtp: z.string().length(6).nullable(),
})

export const authRegisterOtpVerifyPayloadSchema = z.object({
  verificationId: z.string().min(1),
  otp: z.string().trim().length(6).optional(),
  accessToken: z.string().trim().min(1).optional(),
}).superRefine((value, context) => {
  if (!value.otp && !value.accessToken) {
    context.addIssue({
      code: 'custom',
      message: 'Provide either OTP or access token.',
      path: ['otp'],
    })
  }
})

export const authRegisterOtpVerifyResponseSchema = z.object({
  verificationId: z.string().min(1),
  verified: z.literal(true),
})

export const authRegisterPayloadSchema = z.object({
  email: z.email(),
  phoneNumber: z.string().trim().min(10).max(20),
  password: z.string().min(8),
  displayName: z.string().min(2),
  actorType: actorTypeSchema.default('customer'),
  emailVerificationId: z.string().min(1),
  mobileVerificationId: z.string().min(1).optional(),
  organizationName: z.string().trim().min(2).max(120).optional(),
})

export const authLoginPayloadSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export const authTokenResponseSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.literal('Bearer'),
  expiresInSeconds: z.number().int().positive(),
  user: authUserSchema,
})

export const authChangePasswordPayloadSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
})

export const authChangePasswordResponseSchema = z.object({
  updated: z.literal(true),
})

export const authDeleteAccountPayloadSchema = z.object({
  confirmation: z.string().trim().min(1),
})

export const authDeleteAccountResponseSchema = z.object({
  deleted: z.literal(true),
})

export const authAccountRecoveryRequestPayloadSchema = z.object({
  email: z.email(),
})

export const authAccountRecoveryRequestResponseSchema = z.object({
  verificationId: z.string().min(1),
  expiresAt: z.string().min(1),
  debugOtp: z.string().length(6).nullable(),
})

export const authPasswordResetRequestPayloadSchema = z.object({
  email: z.email(),
})

export const authPasswordResetRequestResponseSchema = z.object({
  verificationId: z.string().min(1),
  expiresAt: z.string().min(1),
  debugOtp: z.string().length(6).nullable(),
})

export const authPasswordResetConfirmPayloadSchema = z.object({
  email: z.email(),
  verificationId: z.string().min(1),
  otp: z.string().trim().length(6),
  newPassword: z.string().min(8),
})

export const authPasswordResetConfirmResponseSchema = z.object({
  updated: z.literal(true),
})

export const authAccountRecoveryRestorePayloadSchema = z.object({
  email: z.email(),
  verificationId: z.string().min(1),
  otp: z.string().trim().length(6),
})

export const authAccountRecoveryRestoreResponseSchema = z.object({
  restored: z.literal(true),
})

export const databaseHealthSchema = z.object({
  status: z.enum(['ok', 'disabled', 'error']),
  engine: z.literal('mariadb'),
  checkedAt: z.string().min(1),
  detail: z.string().min(1),
})

export type ActorType = z.infer<typeof actorTypeSchema>
export type PermissionKey = z.infer<typeof permissionKeySchema>
export type RoleKey = z.infer<typeof roleKeySchema>
export type AuthPermission = z.infer<typeof permissionSchema>
export type AuthRole = z.infer<typeof roleSchema>
export type AuthUser = z.infer<typeof authUserSchema>
export type AuthUserSummary = z.infer<typeof authUserSummarySchema>
export type AuthOtpChannel = z.infer<typeof authOtpChannelSchema>
export type AuthUserUpsertPayload = z.infer<typeof authUserUpsertPayloadSchema>
export type AuthUserResponse = z.infer<typeof authUserResponseSchema>
export type AuthUserListResponse = z.infer<typeof authUserListResponseSchema>
export type AuthRegisterOtpRequestPayload = z.infer<typeof authRegisterOtpRequestPayloadSchema>
export type AuthRegisterOtpRequestResponse = z.infer<typeof authRegisterOtpRequestResponseSchema>
export type AuthRegisterOtpVerifyPayload = z.infer<typeof authRegisterOtpVerifyPayloadSchema>
export type AuthRegisterOtpVerifyResponse = z.infer<typeof authRegisterOtpVerifyResponseSchema>
export type AuthRegisterPayload = z.infer<typeof authRegisterPayloadSchema>
export type AuthLoginPayload = z.infer<typeof authLoginPayloadSchema>
export type AuthTokenResponse = z.infer<typeof authTokenResponseSchema>
export type AuthChangePasswordPayload = z.infer<typeof authChangePasswordPayloadSchema>
export type AuthChangePasswordResponse = z.infer<typeof authChangePasswordResponseSchema>
export type AuthDeleteAccountPayload = z.infer<typeof authDeleteAccountPayloadSchema>
export type AuthDeleteAccountResponse = z.infer<typeof authDeleteAccountResponseSchema>
export type AuthAccountRecoveryRequestPayload = z.infer<typeof authAccountRecoveryRequestPayloadSchema>
export type AuthAccountRecoveryRequestResponse = z.infer<typeof authAccountRecoveryRequestResponseSchema>
export type AuthPasswordResetRequestPayload = z.infer<typeof authPasswordResetRequestPayloadSchema>
export type AuthPasswordResetRequestResponse = z.infer<typeof authPasswordResetRequestResponseSchema>
export type AuthPasswordResetConfirmPayload = z.infer<typeof authPasswordResetConfirmPayloadSchema>
export type AuthPasswordResetConfirmResponse = z.infer<typeof authPasswordResetConfirmResponseSchema>
export type AuthAccountRecoveryRestorePayload = z.infer<typeof authAccountRecoveryRestorePayloadSchema>
export type AuthAccountRecoveryRestoreResponse = z.infer<typeof authAccountRecoveryRestoreResponseSchema>
export type DatabaseHealth = z.infer<typeof databaseHealthSchema>
