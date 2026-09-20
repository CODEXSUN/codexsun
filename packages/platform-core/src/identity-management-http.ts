import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { type Actor } from "./identity-contracts.js";
import { LocalIdentityStore, type IdentityUserUpsert } from "./local-identity.js";

const identifierSchema = z.string().trim().min(1).max(120).regex(/^[a-z0-9][a-z0-9._:-]*$/iu);
const permissionIdSchema = z.union([z.literal("*"), identifierSchema]);
const userIdSchema = z.string().uuid();
const userInputSchema = z.object({
  login: z.string().trim().email().max(180),
  name: z.string().trim().min(1).max(180),
  password: z.string().min(8).max(256).optional(),
  state: z.enum(["active", "disabled"]),
  username: z.string().trim().min(1).max(120),
});
const replaceAssignmentsSchema = z.object({
  ids: z.array(identifierSchema).max(100),
});
const replacePermissionAssignmentsSchema = z.object({
  ids: z.array(permissionIdSchema).max(100),
});
const errorSchema = z.object({ error: z.string().min(1) });
const managedUserSchema = z.object({
  id: userIdSchema,
  login: z.string(),
  name: z.string(),
  roles: z.array(z.string()),
  protected: z.boolean(),
  state: z.enum(["active", "disabled"]),
  username: z.string(),
});

export type IdentityManagementRouteOptions = {
  readonly app: FastifyInstance;
  readonly identity: LocalIdentityStore;
  readonly prefix: string;
};

/** Registers application-local RBAC administration endpoints under one API prefix. */
export function registerIdentityManagementRoutes({ app, identity, prefix }: IdentityManagementRouteOptions): void {
  const requireManager = (request: FastifyRequest, reply: FastifyReply): Actor | undefined => {
    const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]);
    if (actor?.permissions.includes("*") || actor?.permissions.includes("identity.manage")) return actor;
    reply.code(403).send({ error: "Identity management permission is required." });
    return undefined;
  };

  app.get(`${prefix}/identity/users`, { schema: { response: { 200: z.array(managedUserSchema), 403: errorSchema } } }, (request, reply) => {
    if (!requireManager(request, reply)) return;
    return identity.listUsers();
  });
  app.post(`${prefix}/identity/users`, { schema: { body: userInputSchema.refine((input) => Boolean(input.password), "Password is required."), response: { 201: managedUserSchema, 400: errorSchema, 403: errorSchema, 409: errorSchema } } }, async (request, reply) => {
    if (!requireManager(request, reply)) return;
    const input = userInputSchema.safeParse(request.body);
    if (!input.success || !input.data.password) return reply.code(400).send({ error: "Invalid user." });
    try {
      return reply.code(201).send(await identity.createManagedUser(input.data));
    } catch {
      return reply.code(409).send({ error: "Login or username is already in use." });
    }
  });
  app.put(`${prefix}/identity/users/:id`, { schema: { params: z.object({ id: userIdSchema }), body: userInputSchema, response: { 200: managedUserSchema, 400: errorSchema, 403: errorSchema, 404: errorSchema, 409: errorSchema } } }, async (request, reply) => {
    if (!requireManager(request, reply)) return;
    const params = z.object({ id: userIdSchema }).safeParse(request.params);
    const input = userInputSchema.safeParse(request.body);
    if (!params.success || !input.success) return reply.code(400).send({ error: "Invalid user." });
    try {
      const user = await identity.updateUser(params.data.id, input.data as IdentityUserUpsert);
      return user ? reply.send(user) : reply.code(404).send({ error: "Identity user was not found." });
    } catch {
      return reply.code(409).send({ error: "Login or username is already in use." });
    }
  });
  app.delete(`${prefix}/identity/users/:id`, { schema: { params: z.object({ id: userIdSchema }), response: { 204: z.null(), 403: errorSchema, 404: errorSchema } } }, (request, reply) => {
    if (!requireManager(request, reply)) return;
    const params = z.object({ id: userIdSchema }).safeParse(request.params);
    if (!params.success) return reply.code(404).send({ error: "Identity user was not found." });
    try {
      return identity.forceDeleteManagedUser(params.data.id)
        ? reply.code(204).send(null)
        : reply.code(404).send({ error: "Identity user was not found." });
    } catch {
      return reply.code(403).send({ error: "Default identity users cannot be deleted." });
    }
  });

  app.get(`${prefix}/identity/roles`, { schema: { response: { 200: z.array(z.object({ id: identifierSchema })), 403: errorSchema } } }, (request, reply) => {
    if (!requireManager(request, reply)) return;
    return identity.listRoles().map((id) => ({ id }));
  });
  app.post(`${prefix}/identity/roles`, { schema: { body: z.object({ id: identifierSchema }), response: { 201: z.object({ id: identifierSchema }), 400: errorSchema, 403: errorSchema, 409: errorSchema } } }, (request, reply) => {
    if (!requireManager(request, reply)) return;
    const body = z.object({ id: identifierSchema }).safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: "Invalid role." });
    try { return reply.code(201).send({ id: identity.createRole(body.data.id) }); } catch { return reply.code(409).send({ error: "Role already exists." }); }
  });

  app.get(`${prefix}/identity/permissions`, { schema: { response: { 200: z.array(z.object({ id: permissionIdSchema })), 403: errorSchema } } }, (request, reply) => {
    if (!requireManager(request, reply)) return;
    return identity.listPermissions().map((id) => ({ id }));
  });
  app.post(`${prefix}/identity/permissions`, { schema: { body: z.object({ id: permissionIdSchema }), response: { 201: z.object({ id: permissionIdSchema }), 400: errorSchema, 403: errorSchema, 409: errorSchema } } }, (request, reply) => {
    if (!requireManager(request, reply)) return;
    const body = z.object({ id: permissionIdSchema }).safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: "Invalid permission." });
    try { return reply.code(201).send({ id: identity.createPermission(body.data.id) }); } catch { return reply.code(409).send({ error: "Permission already exists." }); }
  });

  app.get(`${prefix}/identity/user-roles`, { schema: { response: { 200: z.array(z.object({ roleId: identifierSchema, userId: userIdSchema })), 403: errorSchema } } }, (request, reply) => {
    if (!requireManager(request, reply)) return;
    return identity.listUserRoleAssignments();
  });
  app.put(`${prefix}/identity/user-roles/:userId`, { schema: { params: z.object({ userId: userIdSchema }), body: replaceAssignmentsSchema, response: { 204: z.null(), 400: errorSchema, 403: errorSchema, 404: errorSchema } } }, (request, reply) => {
    if (!requireManager(request, reply)) return;
    const params = z.object({ userId: userIdSchema }).safeParse(request.params);
    const body = replaceAssignmentsSchema.safeParse(request.body);
    if (!params.success || !body.success) return reply.code(400).send({ error: "Invalid role assignment." });
    try { identity.replaceUserRoles(params.data.userId, body.data.ids); return reply.code(204).send(); } catch { return reply.code(404).send({ error: "Identity user or role was not found." }); }
  });

  app.get(`${prefix}/identity/role-permissions`, { schema: { response: { 200: z.array(z.object({ permissionId: permissionIdSchema, roleId: identifierSchema })), 403: errorSchema } } }, (request, reply) => {
    if (!requireManager(request, reply)) return;
    return identity.listRolePermissionAssignments();
  });
  app.put(`${prefix}/identity/role-permissions/:roleId`, { schema: { params: z.object({ roleId: identifierSchema }), body: replacePermissionAssignmentsSchema, response: { 204: z.null(), 400: errorSchema, 403: errorSchema, 404: errorSchema } } }, (request, reply) => {
    if (!requireManager(request, reply)) return;
    const params = z.object({ roleId: identifierSchema }).safeParse(request.params);
    const body = replacePermissionAssignmentsSchema.safeParse(request.body);
    if (!params.success || !body.success) return reply.code(400).send({ error: "Invalid permission assignment." });
    try { identity.replaceRolePermissions(params.data.roleId, body.data.ids); return reply.code(204).send(); } catch { return reply.code(404).send({ error: "Identity role or permission was not found." }); }
  });
}
