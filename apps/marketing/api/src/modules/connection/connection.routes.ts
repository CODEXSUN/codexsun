import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { MarketingDependencies, MarketingContext } from "../../context.js";
import type { ConnectionInput } from "./connection.types.js";
import { ConnectionService } from "./connection.service.js";
export const connectionInputSchema=z.strictObject({brandUuid: z.string().regex(/^[a-f0-9]{8}$/),
name: z.string().trim().min(1).max(160),
provider: z.enum(['facebook','instagram','whatsapp','linkedin','google','threads','pinterest','x','telegram','email']),
externalAccountId: z.string().trim().max(191).default(''),status:z.enum(["active","inactive"]).default("active")});
export const connectionRecordSchema=connectionInputSchema.extend({uuid:z.string(),companyId:z.number(),createdBy:z.string(),updatedBy:z.string(),createdAt:z.string(),updatedAt:z.string()});
export function registerConnectionRoutes(app:FastifyInstance,deps:MarketingDependencies,validateParent:(ctx:MarketingContext,input:ConnectionInput)=>Promise<void>) {
 const params=z.object({uuid:z.string().regex(/^[a-f0-9]{8}$/)});
 const service=async(request:import("fastify").FastifyRequest)=>{const ctx=await deps.context(request);return new ConnectionService(ctx,input=>validateParent(ctx,input));};
 registerContractRoute(app,{method:"GET",url:"/marketing/connections",schemas:{querystring:z.object({search:z.string().max(160).default(""),limit:z.coerce.number().int().min(1).max(100).default(50),offset:z.coerce.number().int().min(0).default(0)}),response:z.array(connectionRecordSchema)},handler:async({request,query})=>(await service(request)).list(query.search,query.limit,query.offset)});
 registerContractRoute(app,{method:"GET",url:"/marketing/connections/:uuid",schemas:{params,response:connectionRecordSchema},handler:async({request,params})=>(await service(request)).get(params.uuid)});
 registerContractRoute(app,{method:"POST",url:"/marketing/connections",schemas:{body:connectionInputSchema,response:connectionRecordSchema},handler:async({request,body})=>(await service(request)).save(body)});
 registerContractRoute(app,{method:"PUT",url:"/marketing/connections/:uuid",schemas:{params,body:connectionInputSchema,response:connectionRecordSchema},handler:async({request,params,body})=>(await service(request)).save(body,params.uuid)});
 registerContractRoute(app,{method:"GET",url:"/marketing/connections/:uuid/activity",schemas:{params,response:z.array(z.object({action:z.string(),actor:z.string(),occurredAt:z.string()}))},handler:async({request,params})=>(await service(request)).activity(params.uuid)});
}
