import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { MarketingDependencies, MarketingContext } from "../../context.js";
import type { CampaignInput } from "./campaign.types.js";
import { CampaignService } from "./campaign.service.js";
export const campaignInputSchema=z.strictObject({brandUuid: z.string().regex(/^[a-f0-9]{8}$/),
name: z.string().trim().min(1).max(160),
objective: z.string().trim().min(1).max(500),
channel: z.enum(['website','facebook','instagram','whatsapp','linkedin','google-ads','google-business','youtube','threads','pinterest','x','telegram','email']),
landingUrl: z.union([z.literal(''),z.url().startsWith('https://')]).default(''),status:z.enum(["active","inactive"]).default("active")});
export const campaignRecordSchema=campaignInputSchema.extend({uuid:z.string(),companyId:z.number(),createdBy:z.string(),updatedBy:z.string(),createdAt:z.string(),updatedAt:z.string()});
export function registerCampaignRoutes(app:FastifyInstance,deps:MarketingDependencies,validateParent:(ctx:MarketingContext,input:CampaignInput)=>Promise<void>) {
 const params=z.object({uuid:z.string().regex(/^[a-f0-9]{8}$/)});
 const service=async(request:import("fastify").FastifyRequest)=>{const ctx=await deps.context(request);return new CampaignService(ctx,input=>validateParent(ctx,input));};
 registerContractRoute(app,{method:"GET",url:"/marketing/campaigns",schemas:{querystring:z.object({search:z.string().max(160).default(""),limit:z.coerce.number().int().min(1).max(100).default(50),offset:z.coerce.number().int().min(0).default(0)}),response:z.array(campaignRecordSchema)},handler:async({request,query})=>(await service(request)).list(query.search,query.limit,query.offset)});
 registerContractRoute(app,{method:"GET",url:"/marketing/campaigns/:uuid",schemas:{params,response:campaignRecordSchema},handler:async({request,params})=>(await service(request)).get(params.uuid)});
 registerContractRoute(app,{method:"POST",url:"/marketing/campaigns",schemas:{body:campaignInputSchema,response:campaignRecordSchema},handler:async({request,body})=>(await service(request)).save(body)});
 registerContractRoute(app,{method:"PUT",url:"/marketing/campaigns/:uuid",schemas:{params,body:campaignInputSchema,response:campaignRecordSchema},handler:async({request,params,body})=>(await service(request)).save(body,params.uuid)});
 registerContractRoute(app,{method:"GET",url:"/marketing/campaigns/:uuid/activity",schemas:{params,response:z.array(z.object({action:z.string(),actor:z.string(),occurredAt:z.string()}))},handler:async({request,params})=>(await service(request)).activity(params.uuid)});
}
