import type { IdentityPortal } from '@codexsun/platform-contracts'
import {
  errorEnvelopeSchema,
  identityForgotPasswordInputSchema,
  identityLoginInputSchema,
  identityPublicConfigSchema,
  identityRegisterInputSchema,
  identitySessionDataSchema,
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
  server.post('/api/identity/sa/dev-login', async (request, reply) => {
    const result = await service.login('super-admin', {
      email: environment.IDENTITY_SUPER_ADMIN_EMAIL,
      password: environment.IDENTITY_SUPER_ADMIN_PASSWORD,
    })
    const prefix = '/api/identity/sa'
    reply.setCookie(
      identityCookieName('super-admin'),
      result.token,
      cookieOptions(environment, prefix, result.expiresAt),
    )
    return { success: true, data: sessionData(result), meta: createResponseMeta(request) }
  })
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
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await service.login(portal, identityLoginInputSchema.parse(request.body))
        reply.setCookie(
          cookieName,
          result.token,
          cookieOptions(environment, prefix, result.expiresAt),
        )
        return { success: true, data: sessionData(result), meta: createResponseMeta(request) }
      } catch (error) {
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
      const session = await service.resolveSession(portal, request.cookies[cookieName])
      if (!session)
        return sendError(reply, request, 401, 'AUTHENTICATION_REQUIRED', 'Sign in is required.')
      return {
        success: true,
        data: { expiresAt: session.expiresAt.toISOString(), user: session.user },
        meta: createResponseMeta(request),
      }
    },
  )

  server.post(`${prefix}/logout`, async (request, reply) => {
    await service.revoke(portal, request.cookies[cookieName])
    reply.clearCookie(cookieName, { path: prefix })
    return { success: true, data: { loggedOut: true }, meta: createResponseMeta(request) }
  })
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
  return { expiresAt: result.expiresAt.toISOString(), user: result.user }
}

function sendError(
  reply: FastifyReply,
  request: FastifyRequest,
  status: 401 | 409,
  code: string,
  message: string,
) {
  return reply
    .status(status)
    .send({ success: false, error: { code, message }, meta: createResponseMeta(request) })
}
