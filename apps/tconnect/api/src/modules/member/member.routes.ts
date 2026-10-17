import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { ResolveTconnectContext } from "../../context.js";
import { MemberService } from "./member.service.js";
import { memberRegistration, memberRecord } from "./member.types.js";
export async function registerMemberRoutes(app: FastifyInstance, resolve: ResolveTconnectContext) {
  registerContractRoute(app, {
    method: "GET",
    url: "/public/tconnect/registration",
    schemas: { response: z.object({ corporateId: z.string() }) },
    handler: async ({ request }) => ({
      corporateId: (await resolve(request, true)).corporateId ?? ""
    })
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/public/tconnect/registration",
    schemas: {
      body: memberRegistration,
      response: z.object({
        uuid: z.string(),
        companyUuid: z.string(),
        membershipStatus: z.string()
      })
    },
    handler: async ({ request, body }) =>
      new MemberService(await resolve(request, true)).register(body)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/tconnect/member/session",
    schemas: {
      response: z.object({ mode: z.enum(["staff", "member"]), member: memberRecord.nullable() })
    },
    handler: async ({ request }) => new MemberService(await resolve(request, false)).session()
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/tconnect/member",
    schemas: { response: z.array(memberRecord) },
    handler: async ({ request }) => new MemberService(await resolve(request, false)).list()
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/tconnect/member/:uuid",
    schemas: {
      params: z.object({ uuid: z.string().regex(/^[0-9a-f]{8}$/) }),
      body: z
        .object({
          membershipStatus: z.enum(["approved", "rejected"]),
          status: z.enum(["active", "inactive"])
        })
        .strict(),
      response: z.object({ uuid: z.string(), membershipStatus: z.string(), status: z.string() })
    },
    handler: async ({ request, params, body }) =>
      new MemberService(await resolve(request, false)).review(
        params.uuid,
        body.membershipStatus,
        body.status
      )
  });
}
