import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { MarketingDependencies, MarketingContext } from "../../context.js";
import type { BrandInput } from "./brand.types.js";
import { BrandService } from "./brand.service.js";
export const brandInputSchema=z.strictObject({name: z.string().trim().min(1).max(160),
timezone: z.string().trim().min(1).max(80).refine(value => { try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; } }, 'Select a valid timezone.'),
website: z.union([z.literal(''), z.url().startsWith('https://')]).default(''),status:z.enum(["active","inactive"]).default("active")});
export const brandRecordSchema=brandInputSchema.extend({uuid:z.string(),companyId:z.number(),createdBy:z.string(),updatedBy:z.string(),createdAt:z.string(),updatedAt:z.string()});
export function registerBrandRoutes(app:FastifyInstance,deps:MarketingDependencies,validateParent:(ctx:MarketingContext,input:BrandInput)=>Promise<void>) {
 const params=z.object({uuid:z.string().regex(/^[a-f0-9]{8}$/)});
 const service=async(request:import("fastify").FastifyRequest)=>{const ctx=await deps.context(request);return new BrandService(ctx,input=>validateParent(ctx,input));};
 registerContractRoute(app,{method:"GET",url:"/marketing/brands",schemas:{querystring:z.object({search:z.string().max(160).default(""),limit:z.coerce.number().int().min(1).max(100).default(50),offset:z.coerce.number().int().min(0).default(0)}),response:z.array(brandRecordSchema)},handler:async({request,query})=>(await service(request)).list(query.search,query.limit,query.offset)});
 registerContractRoute(app,{method:"GET",url:"/marketing/brands/:uuid",schemas:{params,response:brandRecordSchema},handler:async({request,params})=>(await service(request)).get(params.uuid)});
 registerContractRoute(app,{method:"POST",url:"/marketing/brands",schemas:{body:brandInputSchema,response:brandRecordSchema},handler:async({request,body})=>(await service(request)).save(body)});
 registerContractRoute(app,{method:"PUT",url:"/marketing/brands/:uuid",schemas:{params,body:brandInputSchema,response:brandRecordSchema},handler:async({request,params,body})=>(await service(request)).save(body,params.uuid)});
 registerContractRoute(app,{method:"GET",url:"/marketing/brands/:uuid/activity",schemas:{params,response:z.array(z.object({action:z.string(),actor:z.string(),occurredAt:z.string()}))},handler:async({request,params})=>(await service(request)).activity(params.uuid)});
}
