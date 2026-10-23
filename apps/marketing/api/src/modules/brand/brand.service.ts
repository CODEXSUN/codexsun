import { AppError } from "@codexsun/framework/errors";
import type { MarketingContext } from "../../context.js";
import { BrandRepository } from "./brand.repository.js";
import type { BrandInput } from "./brand.types.js";
export class BrandService {
 private readonly repository: BrandRepository;
 constructor(private readonly context: MarketingContext, private readonly validateParent: (input: BrandInput)=>Promise<void> = async()=>{}) {
  this.repository=new BrandRepository(context);
 }
 async list(search:string,limit:number,offset:number) { await this.context.authorize("marketing.brand.record.view"); return this.repository.list(search,limit,offset); }
 async get(uuid:string) {
  await this.context.authorize("marketing.brand.record.view");
  const record=await this.repository.get(uuid); if(!record) throw AppError.notFound("Brand was not found."); return record;
 }
 async save(input:BrandInput,uuid?:string) {
  await this.context.authorize("marketing.brand.record."+ (uuid?"update":"create"));
  if(uuid) await this.get(uuid);
  await this.validateParent(input);
  try { return await this.get(await this.repository.save(input,uuid)); }
  catch(error) {
   if(error && typeof error==="object" && "code" in error && error.code==="ER_DUP_ENTRY") throw AppError.conflict("Brand name or identity already exists. Retry new records with a different name.");
   throw error;
  }
 }
 async activity(uuid:string) { await this.get(uuid); return this.repository.activity(uuid); }
}
export async function lookupBrand(context:MarketingContext,uuid:string) {
 return new BrandService(context).get(uuid);
}
