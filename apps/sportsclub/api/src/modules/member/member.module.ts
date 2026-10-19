import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerMemberRoutes } from "./member.routes.js";
import type { MemberService } from "./member.service.js";

export const memberModule = {
  key: "sportsclub.member",
  label: "Members",
  register(
    app: FastifyInstance,
    resolveService: (request: FastifyRequest) => Promise<MemberService> | MemberService
  ) {
    return registerMemberRoutes(app, resolveService);
  }
};
