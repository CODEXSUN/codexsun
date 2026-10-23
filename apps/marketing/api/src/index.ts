import type { FastifyInstance } from "fastify";
import { AppError } from "@codexsun/framework/errors";
import { runMigrationBatch } from "@codexsun/framework/db";
import type { Kysely } from "kysely";
import type { MarketingDatabase, MarketingDependencies, MarketingContext } from "./context.js";
import { brandModule,migrateBrand,seedBrand,lookupBrand,BrandService } from "./modules/brand/index.js";
import { campaignModule,migrateCampaign,seedCampaign,lookupCampaign } from "./modules/campaign/index.js";
import { captureModule,migrateCapture,seedCapture } from "./modules/capture/index.js";
import { connectionModule,migrateConnection,seedConnection } from "./modules/connection/index.js";
export type { MarketingDatabase,MarketingDependencies,MarketingContext } from "./context.js";
export { BrandService } from "./modules/brand/index.js";
export const marketingMigrationBatch={batch:1,scope:"marketing",description:"Tenant Marketing foundation.",version:"1.1.45",steps:[{name:"marketing.foundation.v1",checksum:"marketing.foundation.v1",description:"Brands, campaigns, capture definitions, connections and activity.",version:1,up:async(database:Kysely<MarketingDatabase>)=>{await migrateBrand(database);await migrateCampaign(database);await migrateCapture(database);await migrateConnection(database);}}]};
export function migrateMarketing(database:Kysely<MarketingDatabase>) {return runMigrationBatch(database,marketingMigrationBatch);}
export async function seedMarketing(database:Kysely<MarketingDatabase>) {await seedBrand(database);await seedCampaign(database);await seedCapture(database);await seedConnection(database);}
export async function marketingBrandScope(context:MarketingContext) {return (await new BrandService(context).list("",100,0)).filter(row=>row.status==="active").map(row=>row.uuid);}
export async function registerMarketing(app:FastifyInstance,deps:MarketingDependencies) {
 const parent=async(context:MarketingContext,input:{brandUuid:string})=>{const brand=await lookupBrand(context,input.brandUuid);if(brand.status!=="active")throw AppError.validation("Select an active brand.");};
 brandModule.register(app,deps,async()=>{});
 campaignModule.register(app,deps,parent);
 connectionModule.register(app,deps,parent);
 captureModule.register(app,deps,async(context,input)=>{await parent(context,input);const campaign=await lookupCampaign(context,input.campaignUuid);if(campaign.status!=="active"||campaign.brandUuid!==input.brandUuid)throw AppError.validation("Select an active campaign from this brand.");});
}
