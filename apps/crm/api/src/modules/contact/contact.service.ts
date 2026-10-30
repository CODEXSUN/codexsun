import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { AppError } from "@codexsun/framework/errors";
import type { CrmContactProxyMethod } from "./contact.types.js";

const coreEnvelopeSchema = z.discriminatedUnion("success", [
  z.object({ success: z.literal(true), data: z.unknown() }),
  z.object({
    success: z.literal(false),
    error: z.object({ message: z.string(), code: z.string().optional() }).passthrough()
  })
]);

export class CrmContactService {
  constructor(private readonly app: FastifyInstance) {}

  async forward(
    request: FastifyRequest,
    method: CrmContactProxyMethod,
    corePath: string,
    body?: unknown
  ): Promise<unknown> {
    const upstream = await this.app.inject({
      method,
      url: corePath,
      headers: {
        ...forwardedHeaders(request),
        ...(body === undefined ? {} : { "content-type": "application/json" })
      },
      ...(body === undefined ? {} : { payload: JSON.stringify(body) })
    });
    let raw: unknown;
    try {
      raw = JSON.parse(upstream.body);
    } catch {
      throw AppError.internal("Core Contacts returned an unreadable response.");
    }
    const result = coreEnvelopeSchema.safeParse(raw);
    if (!result.success) throw AppError.internal("Core Contacts returned an invalid response.");
    if (!upstream.statusCode.toString().startsWith("2") || !result.data.success) {
      const message = result.data.success
        ? "Core Contacts request failed."
        : result.data.error.message;
      const code = result.data.success ? undefined : result.data.error.code;
      throw coreError(upstream.statusCode, message, code);
    }
    return result.data.data;
  }
}

function forwardedHeaders(request: FastifyRequest) {
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  return Object.fromEntries(
    Object.entries({
      authorization: first(request.headers.authorization),
      cookie: first(request.headers.cookie),
      host: first(request.headers.host),
      origin: first(request.headers.origin),
      "x-codexsun-session-slot": first(request.headers["x-codexsun-session-slot"]),
      "x-tenant-db": first(request.headers["x-tenant-db"]),
      "x-tenant-id": first(request.headers["x-tenant-id"])
    }).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  );
}

function coreError(status: number, message: string, code?: string) {
  if (code === "AUTH_SESSION_EXPIRED" || code === "AUTH_DOMAIN_MISMATCH") {
    return new AppError({ code, message, statusCode: 401 });
  }
  if (status === 400) return AppError.validation(message);
  if (status === 401) return AppError.unauthorized(message);
  if (status === 403) return AppError.forbidden(message);
  if (status === 404) return AppError.notFound(message);
  if (status === 409) return AppError.conflict(message);
  return AppError.internal(message);
}
