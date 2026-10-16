import type { FastifyInstance, FastifyReply, FastifyRequest, RouteOptions } from "fastify";
import { z } from "zod";
import { AppError } from "../errors/index.js";
import { ok } from "./envelope.js";

type AnySchema = z.ZodType<unknown>;

export type RouteSchemas = {
  body?: AnySchema;
  params?: AnySchema;
  querystring?: AnySchema;
  response: AnySchema;
};

export type ContractRouteContext<TSchemas extends RouteSchemas> = {
  body: TSchemas["body"] extends z.ZodType<infer TBody> ? TBody : undefined;
  params: TSchemas["params"] extends z.ZodType<infer TParams> ? TParams : undefined;
  query: TSchemas["querystring"] extends z.ZodType<infer TQuery> ? TQuery : undefined;
  reply: FastifyReply;
  request: FastifyRequest;
};

export type ContractRouteOptions<TSchemas extends RouteSchemas> = {
  bodyLimit?: RouteOptions["bodyLimit"];
  handler: (
    context: ContractRouteContext<TSchemas>
  ) => Promise<z.output<TSchemas["response"]>> | z.output<TSchemas["response"]>;
  method: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
  preHandler?: RouteOptions["preHandler"];
  schemas: TSchemas;
  url: string;
};

/**
 * Registers a framework-owned HTTP boundary: inputs are parsed before business
 * code runs, successful data is checked before it leaves the module, and every
 * success uses the standard response envelope.
 */
export function registerContractRoute<TSchemas extends RouteSchemas>(
  app: FastifyInstance,
  options: ContractRouteOptions<TSchemas>
): void {
  app.route({
    method: options.method,
    url: options.url,
    ...(options.bodyLimit ? { bodyLimit: options.bodyLimit } : {}),
    ...(options.preHandler ? { preHandler: options.preHandler } : {}),
    handler: async (request, reply) => {
      const context = {
        body: parsePart(options.schemas.body, request.body, "body"),
        params: parsePart(options.schemas.params, request.params, "params"),
        query: parsePart(options.schemas.querystring, request.query, "querystring"),
        reply,
        request
      } as ContractRouteContext<TSchemas>;
      const data = await options.handler(context);
      const response = parsePart(options.schemas.response, data, "response");

      return ok(response, {
        requestId: request.id,
        ...(request.correlationId ? { correlationId: request.correlationId } : {}),
        ...(request.tenantId ? { tenantId: request.tenantId } : {})
      });
    }
  });
}

/** Emits one validated standard envelope per newline for incremental HTTP responses. */
export function registerContractStreamRoute<TSchemas extends RouteSchemas>(
  app: FastifyInstance,
  options: Omit<ContractRouteOptions<TSchemas>, "handler"> & {
    handler: (
      context: ContractRouteContext<TSchemas> & {
        emit: (value: z.output<TSchemas["response"]>) => void;
      }
    ) => Promise<void>;
  }
): void {
  app.route({
    method: options.method,
    url: options.url,
    ...(options.bodyLimit ? { bodyLimit: options.bodyLimit } : {}),
    ...(options.preHandler ? { preHandler: options.preHandler } : {}),
    handler: async (request, reply) => {
      const body = parsePart(options.schemas.body, request.body, "body");
      const params = parsePart(options.schemas.params, request.params, "params");
      const query = parsePart(options.schemas.querystring, request.query, "querystring");
      const metadata = {
        requestId: request.id,
        ...(request.correlationId ? { correlationId: request.correlationId } : {}),
        ...(request.tenantId ? { tenantId: request.tenantId } : {})
      };
      let started = false;
      const emit = (value: z.output<TSchemas["response"]>) => {
        const parsed = parsePart(options.schemas.response, value, "response");
        if (!started) {
          for (const [name, header] of Object.entries(reply.getHeaders())) {
            if (header !== undefined) reply.raw.setHeader(name, header);
          }
          reply.hijack();
          reply.raw.writeHead(200, {
            "Content-Type": "application/x-ndjson; charset=utf-8",
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff"
          });
          started = true;
        }
        reply.raw.write(`${JSON.stringify(ok(parsed, metadata))}\n`);
      };
      try {
        await options.handler({
          body,
          params,
          query,
          request,
          reply,
          emit
        } as ContractRouteContext<TSchemas> & { emit: typeof emit });
        if (!started) reply.code(204).send();
      } catch (error) {
        if (!started) throw error;
        reply.raw.write(
          `${JSON.stringify(ok({ event: "error", message: "The response could not be completed." }, metadata))}\n`
        );
      } finally {
        if (started) reply.raw.end();
      }
    }
  });
}

function parsePart<TSchema extends AnySchema | undefined>(
  schema: TSchema,
  value: unknown,
  location: string
) {
  if (!schema) return undefined;

  const result = schema.safeParse(value);
  if (result.success) return result.data;

  throw AppError.validation(`Invalid request ${location}`, {
    issues: result.error.issues,
    location
  });
}
