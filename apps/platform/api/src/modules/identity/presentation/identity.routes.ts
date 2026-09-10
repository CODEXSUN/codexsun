import type { IdentityPortal } from '@codexsun/platform-contracts'
import {
  errorEnvelopeSchema,
  identityDeviceInputSchema,
  identityForgotPasswordInputSchema,
  identityDeviceSchema,
  identityLoginInputSchema,
  identityManagedUserSchema,
  identityPublicConfigSchema,
  identityRegisterInputSchema,
  identityRoleSchema,
  identitySessionDataSchema,
  identitySecurityEventSchema,
  identityUserSchema,
  successEnvelopeSchema,
} from '@codexsun/platform-contracts'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import type { Environment } from '../../../config.js'
import { createResponseMeta } from '../../../http.js'
import {
  IdentityAuthenticationError,
  IdentityConflictError,
  IdentityDeviceActivationError,
  IdentityPortalError,
} from '../domain/identity.errors.js'
import type { IdentityService } from '../application/identity.service.js'

const portalPaths: Readonly<Record<IdentityPortal, string>> = {
  administrator: '/admin',
  regular: '',
  'super-admin': '/sa',
}

export async function registerIdentityRoutes(
  server: FastifyInstance,
  service: IdentityService,
  environment: Environment,
): Promise<void> {
  server.addHook('preHandler', async (request, reply) => {
    if (isSafeMethod(request.method) || request.headers.authorization?.startsWith('Bearer ')) return
    const hasSessionCookie = Object.keys(request.cookies).some((name) =>
      name.startsWith('codexsun_'),
    )
    if (
      !hasSessionCookie ||
      request.headers.origin === environment.PLATFORM_WEB_ORIGIN ||
      request.headers.origin === environment.ORSHIP_WEB_ORIGIN
    )
      return
    await sendError(reply, request, 403, 'ORIGIN_DENIED', 'The request origin is not allowed.')
  })
  registerPublicRoutes(server, service, environment)
  for (const portal of ['regular', 'administrator', 'super-admin'] as const) {
    registerPortalRoutes(server, service, portal, environment)
  }
  if (environment.APP_ENV === 'development' && environment.IDENTITY_DEV_LOGIN_ENABLED === 'true') {
    registerDevelopmentLogin(server, service, environment)
  }
}

function registerDevelopmentLogin(
  server: FastifyInstance,
  service: IdentityService,
  environment: Environment,
): void {
  server.post(
    '/api/identity/sa/dev-login',
    {
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
      schema: {
        body: jsonSchema(identityDeviceInputSchema),
        response: {
          200: response(identitySessionDataSchema),
          403: jsonSchema(errorEnvelopeSchema),
        },
      },
    },
    async (request, reply) => {
      if (!isLoopback(request.ip)) {
        return sendError(
          reply,
          request,
          403,
          'LOCAL_ACCESS_REQUIRED',
          'Development sign in is local only.',
        )
      }
      const device = identityDeviceInputSchema.parse(request.body)
      const result = await service.login(
        'super-admin',
        {
          device,
          identifier: environment.IDENTITY_SUPER_ADMIN_EMAIL,
          password: environment.IDENTITY_SUPER_ADMIN_PASSWORD,
        },
        requestEvidence(request),
        true,
      )
      const prefix = '/api/identity/sa'
      reply.setCookie(
        identityCookieName('super-admin'),
        result.token,
        cookieOptions(environment, prefix, result.expiresAt),
      )
      return { success: true, data: sessionData(result), meta: createResponseMeta(request) }
    },
  )
}

function registerPublicRoutes(
  server: FastifyInstance,
  service: IdentityService,
  environment: Environment,
): void {
  server.get(
    '/api/identity/config',
    { schema: { response: { 200: response(identityPublicConfigSchema) } } },
    async (request) => ({
      success: true,
      data: {
        devLoginEnabled:
          environment.APP_ENV === 'development' &&
          environment.IDENTITY_DEV_LOGIN_ENABLED === 'true',
        otpProviderEnabled: false,
        passwordMinimumLength: 8,
        registrationEnabled: environment.IDENTITY_REGISTRATION_ENABLED === 'true',
      },
      meta: createResponseMeta(request),
    }),
  )

  if (environment.IDENTITY_REGISTRATION_ENABLED === 'true') {
    server.post(
      '/api/identity/register',
      {
        config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
        schema: {
          body: jsonSchema(identityRegisterInputSchema),
          response: { 201: response(identityUserSchema), 409: jsonSchema(errorEnvelopeSchema) },
        },
      },
      async (request, reply) => {
        try {
          const user = await service.register(identityRegisterInputSchema.parse(request.body))
          return reply
            .status(201)
            .send({ success: true, data: user, meta: createResponseMeta(request) })
        } catch (error) {
          if (error instanceof IdentityConflictError)
            return sendError(reply, request, 409, error.code, error.message)
          throw error
        }
      },
    )
  }

  server.post(
    '/api/identity/password/forgot',
    {
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
      schema: {
        body: jsonSchema(identityForgotPasswordInputSchema),
        response: { 202: response(z.object({ accepted: z.literal(true) })) },
      },
    },
    async (request, reply) => {
      identityForgotPasswordInputSchema.parse(request.body)
      return reply.status(202).send({
        success: true,
        data: { accepted: true },
        meta: createResponseMeta(request),
      })
    },
  )
}

function registerPortalRoutes(
  server: FastifyInstance,
  service: IdentityService,
  portal: IdentityPortal,
  environment: Environment,
): void {
  const prefix = `/api/identity${portalPaths[portal]}`
  const cookieName = identityCookieName(portal)
  server.post(
    `${prefix}/login`,
    {
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
      schema: {
        body: jsonSchema(identityLoginInputSchema),
        response: {
          200: response(identitySessionDataSchema),
          401: jsonSchema(errorEnvelopeSchema),
          403: jsonSchema(errorEnvelopeSchema),
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await service.login(
          portal,
          identityLoginInputSchema.parse(request.body),
          requestEvidence(request),
        )
        reply.setCookie(
          cookieName,
          result.token,
          cookieOptions(environment, prefix, result.expiresAt),
        )
        return { success: true, data: sessionData(result), meta: createResponseMeta(request) }
      } catch (error) {
        if (error instanceof IdentityDeviceActivationError) {
          if (error.deviceToken) reply.header('x-device-token', error.deviceToken)
          return sendError(reply, request, 403, error.code, error.message)
        }
        if (error instanceof IdentityAuthenticationError || error instanceof IdentityPortalError) {
          return sendError(reply, request, 401, error.code, error.message)
        }
        throw error
      }
    },
  )

  server.get(
    `${prefix}/session`,
    {
      schema: {
        response: {
          200: response(identitySessionDataSchema),
          401: jsonSchema(errorEnvelopeSchema),
        },
      },
    },
    async (request, reply) => {
      const token = requestToken(request, cookieName)
      const session = await service.resolveSession(portal, token)
      if (!session)
        return sendError(reply, request, 401, 'AUTHENTICATION_REQUIRED', 'Sign in is required.')
      reply.setCookie(cookieName, token!, cookieOptions(environment, prefix, session.expiresAt))
      return {
        success: true,
        data: {
          device: session.device,
          expiresAt: session.expiresAt.toISOString(),
          user: session.user,
        },
        meta: createResponseMeta(request),
      }
    },
  )

  server.post(
    `${prefix}/logout`,
    { schema: { response: { 200: response(z.object({ loggedOut: z.literal(true) })) } } },
    async (request, reply) => {
      await service.revoke(portal, requestToken(request, cookieName))
      reply.clearCookie(cookieName, { path: prefix })
      return { success: true, data: { loggedOut: true }, meta: createResponseMeta(request) }
    },
  )

  server.get(
    `${prefix}/devices`,
    { schema: { response: { 200: response(z.array(identityDeviceSchema)) } } },
    async (request, reply) => {
      const session = await requirePortalSession(request, reply, service, portal, cookieName)
      if (!session) return
      const devices = await service.devices.list(session.user.id)
      return {
        success: true,
        data: devices.map((device) => ({
          activatedAt: device.activatedAt?.toISOString() ?? null,
          clientType: device.clientType,
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          firstSeenAt: device.firstSeenAt.toISOString(),
          lastSeenAt: device.lastSeenAt.toISOString(),
          status: device.status,
        })),
        meta: createResponseMeta(request),
      }
    },
  )

  server.post(
    `${prefix}/devices/:deviceId/activate`,
    { schema: { response: { 200: response(z.object({ activated: z.literal(true) })) } } },
    async (request, reply) => {
      const session = await requirePortalSession(request, reply, service, portal, cookieName)
      if (!session) return
      const deviceId = z
        .object({ deviceId: z.string().min(16).max(128) })
        .parse(request.params).deviceId
      await service.devices.activate(session.user.id, session.user.id, deviceId)
      return { success: true, data: { activated: true }, meta: createResponseMeta(request) }
    },
  )

  if (portal === 'administrator') registerAdministratorRoutes(server, service, prefix, cookieName)
  if (portal === 'super-admin') registerSuperAdminRoutes(server, service, prefix, cookieName)
}

function registerAdministratorRoutes(
  server: FastifyInstance,
  service: IdentityService,
  prefix: string,
  cookieName: string,
): void {
  server.get(
    `${prefix}/users`,
    { schema: { response: { 200: response(z.array(identityManagedUserSchema)) } } },
    async (request, reply) => {
      const session = await requirePortalSession(
        request,
        reply,
        service,
        'administrator',
        cookieName,
      )
      if (!session) return
      return {
        success: true,
        data: await service.listUsers('regular'),
        meta: createResponseMeta(request),
      }
    },
  )
  server.patch(
    `${prefix}/users/:userId/status`,
    { schema: { response: { 200: response(z.object({ updated: z.literal(true) })) } } },
    async (request, reply) => {
      const session = await requirePortalSession(
        request,
        reply,
        service,
        'administrator',
        cookieName,
      )
      if (!session) return
      const { userId } = userParamsSchema.parse(request.params)
      const { status } = z.object({ status: z.enum(['active', 'disabled']) }).parse(request.body)
      await service.updateUserStatus(session.user.id, userId, status, requestEvidence(request))
      return { success: true, data: { updated: true }, meta: createResponseMeta(request) }
    },
  )
  server.post(
    `${prefix}/users/:userId/password-reset-request`,
    { schema: { response: { 200: response(z.object({ accepted: z.literal(true) })) } } },
    async (request, reply) => {
      const session = await requirePortalSession(
        request,
        reply,
        service,
        'administrator',
        cookieName,
      )
      if (!session) return
      const { userId } = userParamsSchema.parse(request.params)
      await service.recordResetRequest(session.user.id, userId, requestEvidence(request))
      return { success: true, data: { accepted: true }, meta: createResponseMeta(request) }
    },
  )
  server.put(
    `${prefix}/users/:userId/roles`,
    { schema: { response: { 200: response(z.object({ updated: z.literal(true) })) } } },
    async (request, reply) => {
      const session = await requirePortalSession(
        request,
        reply,
        service,
        'administrator',
        cookieName,
      )
      if (!session) return
      const { userId } = userParamsSchema.parse(request.params)
      const { roleIds } = z
        .object({ roleIds: z.array(z.string().uuid()).max(50) })
        .parse(request.body)
      await service.assignRegularUserRoles(userId, roleIds)
      await service.security.record({
        actorUserId: session.user.id,
        clientType: session.device.clientType,
        deviceId: session.device.deviceId,
        eventType: 'identity.user.roles-changed',
        evidence: requestEvidence(request),
        outcome: 'allowed',
        risk: 'medium',
        subjectUserId: userId,
      })
      return { success: true, data: { updated: true }, meta: createResponseMeta(request) }
    },
  )
  server.get(
    `${prefix}/roles`,
    { schema: { response: { 200: response(z.array(identityRoleSchema)) } } },
    async (request, reply) => {
      const session = await requirePortalSession(
        request,
        reply,
        service,
        'administrator',
        cookieName,
      )
      if (!session) return
      return {
        success: true,
        data: await service.roles.list('regular'),
        meta: createResponseMeta(request),
      }
    },
  )
  server.post(
    `${prefix}/roles`,
    { schema: { response: { 201: response(identityRoleSchema) } } },
    async (request, reply) => {
      const session = await requirePortalSession(
        request,
        reply,
        service,
        'administrator',
        cookieName,
      )
      if (!session) return
      const input = z
        .object({
          name: z.string().trim().min(2).max(120),
          permissions: z
            .array(
              z
                .string()
                .trim()
                .regex(/^[a-z][a-z0-9.-]*:[a-z][a-z0-9.-]*$/u),
            )
            .max(200),
        })
        .parse(request.body)
      const role = await service.roles.create(input.name, 'regular', input.permissions)
      return reply.status(201).send({
        success: true,
        data: role,
        meta: createResponseMeta(request),
      })
    },
  )
}

function registerSuperAdminRoutes(
  server: FastifyInstance,
  service: IdentityService,
  prefix: string,
  cookieName: string,
): void {
  server.get(
    `${prefix}/users`,
    { schema: { response: { 200: response(z.array(identityManagedUserSchema)) } } },
    async (request, reply) => {
      const session = await requirePortalSession(request, reply, service, 'super-admin', cookieName)
      if (!session) return
      return { success: true, data: await service.listUsers(), meta: createResponseMeta(request) }
    },
  )
  server.get(
    `${prefix}/security-events`,
    { schema: { response: { 200: response(z.array(identitySecurityEventSchema)) } } },
    async (request, reply) => {
      const session = await requirePortalSession(request, reply, service, 'super-admin', cookieName)
      if (!session) return
      const limit = z.coerce
        .number()
        .int()
        .min(1)
        .max(500)
        .default(100)
        .parse((request.query as { limit?: unknown }).limit)
      return {
        success: true,
        data: await service.listSecurityEvents(limit),
        meta: createResponseMeta(request),
      }
    },
  )
  server.post(
    `${prefix}/users/:userId/devices/:deviceId/activate`,
    { schema: { response: { 200: response(z.object({ activated: z.literal(true) })) } } },
    async (request, reply) => {
      const session = await requirePortalSession(request, reply, service, 'super-admin', cookieName)
      if (!session) return
      const { deviceId, userId } = z
        .object({ userId: z.string().uuid(), deviceId: z.string().min(16).max(128) })
        .parse(request.params)
      await service.devices.activate(session.user.id, userId, deviceId)
      await service.security.record({
        actorUserId: session.user.id,
        clientType: session.device.clientType,
        deviceId: session.device.deviceId,
        eventType: 'identity.device.activated',
        evidence: requestEvidence(request),
        outcome: 'allowed',
        risk: 'medium',
        subjectUserId: userId,
      })
      return { success: true, data: { activated: true }, meta: createResponseMeta(request) }
    },
  )
}

export function identityCookieName(portal: IdentityPortal): string {
  return `codexsun_${portal.replace('-', '_')}_session`
}

function cookieOptions(environment: Environment, path: string, expires: Date) {
  return {
    expires,
    httpOnly: true,
    path,
    sameSite: 'strict' as const,
    secure: environment.APP_ENV === 'production',
  }
}

function response(schema: z.ZodType) {
  return jsonSchema(successEnvelopeSchema(schema))
}

function jsonSchema(schema: z.ZodType) {
  return z.toJSONSchema(schema, { target: 'draft-7' })
}

function sessionData(result: Awaited<ReturnType<IdentityService['login']>>) {
  return {
    accessToken: result.accessToken,
    device: result.device,
    deviceToken: result.deviceToken,
    expiresAt: result.expiresAt.toISOString(),
    user: result.user,
  }
}

function sendError(
  reply: FastifyReply,
  request: FastifyRequest,
  status: 401 | 403 | 409,
  code: string,
  message: string,
) {
  return reply
    .status(status)
    .send({ success: false, error: { code, message }, meta: createResponseMeta(request) })
}

async function requirePortalSession(
  request: FastifyRequest,
  reply: FastifyReply,
  service: IdentityService,
  portal: IdentityPortal,
  cookieName: string,
) {
  const session = await service.resolveSession(portal, requestToken(request, cookieName))
  if (session) return session
  sendError(reply, request, 401, 'AUTHENTICATION_REQUIRED', 'Sign in is required.')
  return undefined
}

function requestToken(request: FastifyRequest, cookieName: string): string | undefined {
  const authorization = request.headers.authorization
  if (authorization?.startsWith('Bearer ')) return authorization.slice(7)
  return request.cookies[cookieName]
}

function requestEvidence(request: FastifyRequest) {
  return {
    ipAddress: request.ip,
    path: request.url.split('?')[0],
    userAgent: headerValue(request, 'user-agent'),
  }
}

function headerValue(request: FastifyRequest, name: string): string | undefined {
  const value = request.headers[name]
  return Array.isArray(value) ? value[0] : value
}

const userParamsSchema = z.object({ userId: z.string().uuid() })

function isSafeMethod(method: string): boolean {
  return method === 'GET' || method === 'HEAD' || method === 'OPTIONS'
}

function isLoopback(address: string): boolean {
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1'
}
