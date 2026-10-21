import type { FastifyRequest } from "fastify";
import { normalizeTenantDomain } from "../modules/tenant-domain/tenant-domain.repository.js";

export function requestHost(request: FastifyRequest) {
  return normalizeTenantDomain(request.headers.host ?? "");
}
