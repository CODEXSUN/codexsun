import { z } from 'zod'

export const identityPortalSchema = z.enum(['regular', 'administrator', 'super-admin'])

export const identityLoginInputSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
})

export const identityRegisterInputSchema = identityLoginInputSchema.extend({
  displayName: z.string().trim().min(2).max(120),
})

export const identityForgotPasswordInputSchema = z.object({ email: z.email() })

export const identityUserSchema = z.object({
  displayName: z.string(),
  email: z.email(),
  id: z.string().uuid(),
  portal: identityPortalSchema,
})

export const identitySessionDataSchema = z.object({
  expiresAt: z.iso.datetime(),
  user: identityUserSchema,
})

export const identityPublicConfigSchema = z.object({
  devLoginEnabled: z.boolean(),
  registrationEnabled: z.boolean(),
})

export type IdentityLoginInput = z.infer<typeof identityLoginInputSchema>
export type IdentityPortal = z.infer<typeof identityPortalSchema>
export type IdentityRegisterInput = z.infer<typeof identityRegisterInputSchema>
export type IdentitySessionData = z.infer<typeof identitySessionDataSchema>
export type IdentityUser = z.infer<typeof identityUserSchema>
