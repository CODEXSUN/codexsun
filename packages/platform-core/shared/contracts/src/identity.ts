import { z } from 'zod'

export const identityPortalSchema = z.enum(['regular', 'administrator', 'super-admin'])
export const identityClientTypeSchema = z.enum(['web', 'desktop', 'mobile'])
export const identityDeviceStatusSchema = z.enum(['pending', 'active', 'revoked'])

export const identityDeviceInputSchema = z.object({
  clientType: identityClientTypeSchema,
  deviceId: z.string().min(16).max(128),
  deviceName: z.string().trim().min(1).max(120),
  deviceToken: z.string().min(32).max(256).optional(),
})

export const identityLoginInputSchema = z.object({
  device: identityDeviceInputSchema,
  identifier: z.string().trim().min(3).max(320),
  password: z.string().min(8).max(128),
})

export const identityRegisterInputSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  email: z.email(),
  mobile: z.string().trim().min(7).max(32).optional(),
  password: z.string().min(8).max(128),
  username: z.string().trim().min(3).max(64).optional(),
})

export const identityForgotPasswordInputSchema = z.object({
  identifier: z.string().trim().min(3).max(320),
})

export const identityUserSchema = z.object({
  displayName: z.string(),
  email: z.email(),
  id: z.string().uuid(),
  portal: identityPortalSchema,
})

export const identityManagedUserSchema = identityUserSchema.extend({
  roleIds: z.array(z.string().uuid()),
  status: z.enum(['active', 'disabled']),
})

export const identityRoleSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  permissions: z.array(z.string()),
  portal: identityPortalSchema,
})

export const identityDeviceSchema = z.object({
  activatedAt: z.iso.datetime().nullable(),
  clientType: identityClientTypeSchema,
  deviceId: z.string(),
  deviceName: z.string(),
  firstSeenAt: z.iso.datetime(),
  lastSeenAt: z.iso.datetime(),
  status: identityDeviceStatusSchema,
})

export const identitySessionDataSchema = z.object({
  accessToken: z.string().optional(),
  device: identityDeviceSchema,
  deviceToken: z.string().optional(),
  expiresAt: z.iso.datetime(),
  user: identityUserSchema,
})

export const identitySecurityEventSchema = z.object({
  actorUserId: z.string().uuid().nullable(),
  clientType: identityClientTypeSchema.nullable(),
  createdAt: z.iso.datetime(),
  deviceId: z.string().nullable(),
  eventType: z.string(),
  id: z.string().uuid(),
  ipAddress: z.string().nullable(),
  outcome: z.enum(['allowed', 'denied', 'failed']),
  path: z.string().nullable(),
  risk: z.enum(['low', 'medium', 'high', 'critical']),
  subjectUserId: z.string().uuid().nullable(),
})

export const identityPublicConfigSchema = z.object({
  devLoginEnabled: z.boolean(),
  otpProviderEnabled: z.boolean(),
  passwordMinimumLength: z.literal(8),
  registrationEnabled: z.boolean(),
})

export type IdentityClientType = z.infer<typeof identityClientTypeSchema>
export type IdentityDevice = z.infer<typeof identityDeviceSchema>
export type IdentityDeviceInput = z.infer<typeof identityDeviceInputSchema>
export type IdentityDeviceStatus = z.infer<typeof identityDeviceStatusSchema>
export type IdentityLoginInput = z.infer<typeof identityLoginInputSchema>
export type IdentityManagedUser = z.infer<typeof identityManagedUserSchema>
export type IdentityPortal = z.infer<typeof identityPortalSchema>
export type IdentityRegisterInput = z.infer<typeof identityRegisterInputSchema>
export type IdentityRole = z.infer<typeof identityRoleSchema>
export type IdentitySecurityEvent = z.infer<typeof identitySecurityEventSchema>
export type IdentitySessionData = z.infer<typeof identitySessionDataSchema>
export type IdentityUser = z.infer<typeof identityUserSchema>
