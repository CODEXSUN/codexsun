import { identityPortalSchema } from '@codexsun/platform-contracts'
import { z } from 'zod'

const permissionPart = z.string().regex(/^[a-z][a-z0-9.-]{0,119}$/u)

export const identityAccessRequirementSchema = z.strictObject({
  resource: permissionPart,
  action: permissionPart,
})

export const identityAccessDecisionSchema = z.strictObject({
  allowed: z.boolean(),
  userId: z.string().uuid(),
  portal: identityPortalSchema,
})

export type IdentityAccessRequirement = z.infer<typeof identityAccessRequirementSchema>
export type IdentityAccessDecision = z.infer<typeof identityAccessDecisionSchema>
