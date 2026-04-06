import { z } from "zod"

export const actorTypeSchema = z.enum([
  "customer",
  "staff",
  "employee",
  "partner",
  "supplier",
  "admin",
  "vendor",
])
export const authRegisterActorTypeSchema = z.enum(["customer", "staff", "vendor"])
export const permissionKeySchema = z
  .string()
  .trim()
  .min(2)
  .max(160)
  .regex(/^[a-z0-9]+(?::[a-z0-9_]+)+$/, "Use lowercase namespace segments separated by colons.")

export const permissionScopeTypeSchema = z.enum([
  "desk",
  "workspace",
  "module",
  "page",
  "report",
  "module-def",
])

export const roleKeySchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/, "Use lowercase letters, numbers, and underscores only.")

export const permissionSchema = z.object({
  key: permissionKeySchema,
  name: z.string().min(1),
  summary: z.string().min(1),
  scopeType: permissionScopeTypeSchema,
  appId: z.string().min(1).nullable(),
  resourceKey: z.string().min(1),
  actionKey: z.string().min(1),
  route: z.string().min(1).nullable(),
  isActive: z.boolean(),
})

export const roleSchema = z.object({
  key: roleKeySchema,
  name: z.string().min(1),
  summary: z.string().min(1),
  actorType: actorTypeSchema,
  isActive: z.boolean(),
  permissions: z.array(permissionSchema),
})

export const roleSummarySchema = roleSchema.extend({
  assignedUserCount: z.number().int().nonnegative(),
})

export const authRoleUpsertPayloadSchema = z.object({
  actorType: actorTypeSchema,
  key: roleKeySchema.optional(),
  name: z.string().trim().min(2).max(120),
  summary: z.string().trim().min(2).max(400),
  permissionKeys: z.array(permissionKeySchema).min(1),
  isActive: z.boolean(),
})

export const authPermissionUpsertPayloadSchema = z.object({
  key: permissionKeySchema.optional(),
  name: z.string().trim().min(2).max(120),
  summary: z.string().trim().min(2).max(400),
  scopeType: permissionScopeTypeSchema,
  appId: z.string().trim().min(1).max(120).nullable(),
  resourceKey: z.string().trim().min(1).max(191),
  actionKey: z.string().trim().min(1).max(64),
  route: z.string().trim().min(1).max(255).nullable(),
  isActive: z.boolean(),
})

export const authUserSchema = z.object({
  id: z.string().min(1),
  email: z.email(),
  phoneNumber: z.string().min(10).nullable(),
  displayName: z.string().min(1),
  actorType: actorTypeSchema,
  isSuperAdmin: z.boolean(),
  avatarUrl: z.string().url().nullable(),
  isActive: z.boolean(),
  organizationName: z.string().min(1).nullable(),
  roles: z.array(roleSchema),
  permissions: z.array(permissionSchema),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const authUserSummarySchema = authUserSchema

export const authSessionSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  actorType: actorTypeSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  expiresAt: z.string().min(1),
  revokedAt: z.string().nullable(),
  lastSeenAt: z.string().nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
})

const nullablePhoneInputSchema = z
  .string()
  .trim()
  .max(20)
  .nullable()
  .transform((value) => {
    if (typeof value !== "string") {
      return null
    }

    return value.length === 0 ? null : value
  })

const nullableUrlInputSchema = z
  .string()
  .trim()
  .nullable()
  .transform((value) => {
    if (typeof value !== "string") {
      return null
    }

    return value.length === 0 ? null : value
  })
  .refine((value) => value === null || z.string().url().safeParse(value).success, {
    message: "Enter a valid URL.",
  })

const nullableOrganizationInputSchema = z
  .string()
  .trim()
  .max(120)
  .nullable()
  .transform((value) => {
    if (typeof value !== "string") {
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
  roleKeys: z.array(roleKeySchema).min(1),
  password: z.string().min(8).nullable().optional(),
  isActive: z.boolean(),
  isSuperAdmin: z.boolean(),
})

export const authUserResponseSchema = z.object({
  item: authUserSchema,
})

export const authUserListResponseSchema = z.object({
  items: z.array(authUserSummarySchema),
})

export const authRoleListResponseSchema = z.object({
  items: z.array(roleSummarySchema),
})

export const authRoleResponseSchema = z.object({
  item: roleSummarySchema,
})

export const authPermissionListResponseSchema = z.object({
  items: z.array(permissionSchema),
})

export const authPermissionResponseSchema = z.object({
  item: permissionSchema,
})

export const authSessionListResponseSchema = z.object({
  items: z.array(authSessionSchema),
})

export const authOtpChannelSchema = z.enum(["email", "mobile"])

export const authRegisterOtpRequestPayloadSchema = z.object({
  channel: authOtpChannelSchema,
  destination: z.string().trim().min(1),
  displayName: z.string().trim().min(2).max(120).optional(),
})

export const authRegisterOtpRequestResponseSchema = z.object({
  verificationId: z.string().min(1),
  expiresAt: z.string().min(1),
  debugOtp: z.string().length(6).nullable(),
})

export const authRegisterOtpVerifyPayloadSchema = z.object({
  verificationId: z.string().min(1),
  otp: z.string().trim().length(6),
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
  actorType: authRegisterActorTypeSchema.default("staff"),
  emailVerificationId: z.string().min(1),
  organizationName: z.string().trim().min(2).max(120).optional(),
})

export const authLoginPayloadSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export const authTokenResponseSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.literal("Bearer"),
  expiresInSeconds: z.number().int().positive(),
  expiresAt: z.string().min(1),
  sessionId: z.string().min(1),
  user: authUserSchema,
})

export const authLogoutResponseSchema = z.object({
  revoked: z.literal(true),
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

export type ActorType = z.infer<typeof actorTypeSchema>
export type PermissionKey = z.infer<typeof permissionKeySchema>
export type RoleKey = z.infer<typeof roleKeySchema>
export type AuthPermission = z.infer<typeof permissionSchema>
export type AuthRole = z.infer<typeof roleSchema>
export type AuthRoleSummary = z.infer<typeof roleSummarySchema>
export type AuthUser = z.infer<typeof authUserSchema>
export type AuthUserSummary = z.infer<typeof authUserSummarySchema>
export type AuthSession = z.infer<typeof authSessionSchema>
export type AuthOtpChannel = z.infer<typeof authOtpChannelSchema>
export type AuthUserUpsertPayload = z.infer<typeof authUserUpsertPayloadSchema>
export type AuthRoleUpsertPayload = z.infer<typeof authRoleUpsertPayloadSchema>
export type AuthPermissionUpsertPayload = z.infer<typeof authPermissionUpsertPayloadSchema>
export type AuthUserResponse = z.infer<typeof authUserResponseSchema>
export type AuthUserListResponse = z.infer<typeof authUserListResponseSchema>
export type AuthRoleListResponse = z.infer<typeof authRoleListResponseSchema>
export type AuthRoleResponse = z.infer<typeof authRoleResponseSchema>
export type AuthPermissionListResponse = z.infer<typeof authPermissionListResponseSchema>
export type AuthPermissionResponse = z.infer<typeof authPermissionResponseSchema>
export type AuthSessionListResponse = z.infer<typeof authSessionListResponseSchema>
export type PermissionScopeType = z.infer<typeof permissionScopeTypeSchema>
export type AuthRegisterOtpRequestPayload = z.infer<
  typeof authRegisterOtpRequestPayloadSchema
>
export type AuthRegisterOtpRequestResponse = z.infer<
  typeof authRegisterOtpRequestResponseSchema
>
export type AuthRegisterOtpVerifyPayload = z.infer<
  typeof authRegisterOtpVerifyPayloadSchema
>
export type AuthRegisterOtpVerifyResponse = z.infer<
  typeof authRegisterOtpVerifyResponseSchema
>
export type AuthRegisterPayload = z.infer<typeof authRegisterPayloadSchema>
export type AuthLoginPayload = z.infer<typeof authLoginPayloadSchema>
export type AuthTokenResponse = z.infer<typeof authTokenResponseSchema>
export type AuthLogoutResponse = z.infer<typeof authLogoutResponseSchema>
export type AuthChangePasswordPayload = z.infer<
  typeof authChangePasswordPayloadSchema
>
export type AuthChangePasswordResponse = z.infer<
  typeof authChangePasswordResponseSchema
>
export type AuthDeleteAccountPayload = z.infer<
  typeof authDeleteAccountPayloadSchema
>
export type AuthDeleteAccountResponse = z.infer<
  typeof authDeleteAccountResponseSchema
>
export type AuthAccountRecoveryRequestPayload = z.infer<
  typeof authAccountRecoveryRequestPayloadSchema
>
export type AuthAccountRecoveryRequestResponse = z.infer<
  typeof authAccountRecoveryRequestResponseSchema
>
export type AuthPasswordResetRequestPayload = z.infer<
  typeof authPasswordResetRequestPayloadSchema
>
export type AuthPasswordResetRequestResponse = z.infer<
  typeof authPasswordResetRequestResponseSchema
>
export type AuthPasswordResetConfirmPayload = z.infer<
  typeof authPasswordResetConfirmPayloadSchema
>
export type AuthPasswordResetConfirmResponse = z.infer<
  typeof authPasswordResetConfirmResponseSchema
>
export type AuthAccountRecoveryRestorePayload = z.infer<
  typeof authAccountRecoveryRestorePayloadSchema
>
export type AuthAccountRecoveryRestoreResponse = z.infer<
  typeof authAccountRecoveryRestoreResponseSchema
>
