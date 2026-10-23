import { AppError } from "@codexsun/framework/errors";
import type { MarketingContext } from "../../context.js";
import { CampaignRepository } from "./campaign.repository.js";
import type { CampaignInput } from "./campaign.types.js";
export class CampaignService {
 private readonly repository: CampaignRepository;
 constructor(private readonly context: MarketingContext, private readonly validateParent: (input: CampaignInput)=>Promise<void> = async()=>{}) {
  this.repository=new CampaignRepository(context);
 }
 async list(search:string,limit:number,offset:number) { await this.context.authorize("marketing.campaign.record.view"); return this.repository.list(search,limit,offset); }
 async get(uuid:string) {
  await this.context.authorize("marketing.campaign.record.view");
  const record=await this.repository.get(uuid); if(!record) throw AppError.notFound("Campaign was not found."); return record;
 }
 async save(input:CampaignInput,uuid?:string) {
  await this.context.authorize("marketing.campaign.record."+ (uuid?"update":"create"));
  if(uuid) await this.get(uuid);
  await this.validateParent(input);
  try { return await this.get(await this.repository.save(input,uuid)); }
  catch(error) {
   if(error && typeof error==="object" && "code" in error && error.code==="ER_DUP_ENTRY") throw AppError.conflict("Campaign name or identity already exists. Retry new records with a different name.");
   throw error;
  }
 }
 async activity(uuid:string) { await this.get(uuid); return this.repository.activity(uuid); }
}
export async function lookupCampaign(context:MarketingContext,uuid:string) {
 return new CampaignService(context).get(uuid);
}
