import { z } from "zod";

export const actorKindSchema = z.enum(["user", "service"]);
export const permissionSchema = z.string().trim().min(1).max(120);
export const roleSchema = z.object({
  id: z.string().trim().min(1).max(120),
  permissions: z.array(permissionSchema).readonly(),
});
export const actorSchema = z.object({
  id: z.string().trim().min(1).max(120),
  kind: actorKindSchema,
  roles: z.array(z.string().trim().min(1).max(120)).readonly(),
  permissions: z.array(permissionSchema).readonly(),
});
export const sessionStateSchema = z.enum(["active", "revoked"]);
export const identitySessionSchema = z.object({
  id: z.string().trim().min(1).max(120),
  actorId: z.string().trim().min(1).max(120),
  state: sessionStateSchema,
  issuedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});
export const authorizationRequirementSchema = z.object({
  permissions: z.array(permissionSchema).min(1).readonly(),
});

export type ActorKind = z.infer<typeof actorKindSchema>;
export type Permission = z.infer<typeof permissionSchema>;
export type Role = z.infer<typeof roleSchema>;
export type Actor = z.infer<typeof actorSchema>;
export type SessionState = z.infer<typeof sessionStateSchema>;
export type IdentitySession = z.infer<typeof identitySessionSchema>;
export type AuthorizationRequirement = z.infer<typeof authorizationRequirementSchema>;

export interface AuthorizationDecision {
  readonly allowed: boolean;
  readonly missingPermissions: readonly Permission[];
}

export function authorize(actor: Actor, requirement: AuthorizationRequirement): AuthorizationDecision {
  const assigned = new Set(actor.permissions);
  const missingPermissions = requirement.permissions.filter(
    (permission) => !assigned.has("*") && !assigned.has(permission),
  );
  return { allowed: missingPermissions.length === 0, missingPermissions };
}
