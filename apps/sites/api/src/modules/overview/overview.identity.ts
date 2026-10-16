import { AppError } from "@codexsun/framework/errors";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { SitesOverviewPermission, SitesOverviewRequestContext } from "./overview.types.js";

type IdentityResolver = (request: FastifyRequest) => Promise<SitesOverviewRequestContext>;
const identities = new WeakMap<FastifyInstance, IdentityResolver>();

export function registerSitesIdentity(app: FastifyInstance, resolve: IdentityResolver) {
  identities.set(app, resolve);
}

export async function authorizeSitesAction(
  app: FastifyInstance,
  request: FastifyRequest,
  permission: SitesOverviewPermission
) {
  const resolve = identities.get(app);
  if (!resolve) throw AppError.forbidden("Sites identity is not connected.");
  const context = await resolve(request);
  await context.authorize(permission);
  return context;
}
