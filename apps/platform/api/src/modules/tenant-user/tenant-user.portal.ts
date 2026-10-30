import { randomBytes } from "node:crypto";
import type { Kysely } from "kysely";
import { z } from "zod";
import { AppError } from "@codexsun/framework/errors";
import type { TenantDatabase } from "../../database/schema.js";
import { hashPassword } from "../../auth/password-hash.js";
import { TenantUserRepository } from "./tenant-user.repository.js";
import { selectUserRole } from "../tenant-user-role/index.js";
const inputSchema = z
  .object({
    name: z.string().trim().min(2).max(180),
    email: z
      .email()
      .max(180)
      .transform((value) => value.toLowerCase()),
    password: z
      .string()
      .min(12)
      .max(128)
      .refine((value) => value === value.trim(), "Password must not start or end with spaces.")
  })
  .strict();
// The caller supplies a transaction and a server-owned portal role policy.
export async function createPortalUser(
  database: Kysely<TenantDatabase>,
  value: unknown,
  roleKey: string
) {
  const input = inputSchema.parse(value);
  if (!roleKey.startsWith("portal."))
    throw AppError.forbidden("A restricted portal role is required.");
  const role = await database
    .selectFrom("app_roles")
    .select("id")
    .where("key", "=", roleKey)
    .where("status", "=", "active")
    .executeTakeFirst();
  if (!role) throw AppError.forbidden("Portal registration is not configured.");
  const uuid = randomBytes(4).toString("hex");
  const user = await new TenantUserRepository(database).create(
    { ...input, status: "active" },
    uuid,
    hashPassword(input.password)
  );
  await selectUserRole(database, user.id, role.id);
  return user.uuid;
}
