import { AppError } from "@codexsun/framework/errors";
import type { MarketingContext } from "../../context.js";
import { CaptureRepository } from "./capture.repository.js";
import type { CaptureInput } from "./capture.types.js";
export class CaptureService {
 private readonly repository: CaptureRepository;
 constructor(private readonly context: MarketingContext, private readonly validateParent: (input: CaptureInput)=>Promise<void> = async()=>{}) {
  this.repository=new CaptureRepository(context);
 }
 async list(search:string,limit:number,offset:number) { await this.context.authorize("marketing.capture.record.view"); return this.repository.list(search,limit,offset); }
 async get(uuid:string) {
  await this.context.authorize("marketing.capture.record.view");
  const record=await this.repository.get(uuid); if(!record) throw AppError.notFound("Capture form was not found."); return record;
 }
 async save(input:CaptureInput,uuid?:string) {
  await this.context.authorize("marketing.capture.record."+ (uuid?"update":"create"));
  if(uuid) await this.get(uuid);
  await this.validateParent(input);
  try { return await this.get(await this.repository.save(input,uuid)); }
  catch(error) {
   if(error && typeof error==="object" && "code" in error && error.code==="ER_DUP_ENTRY") throw AppError.conflict("Capture form name or identity already exists. Retry new records with a different name.");
   throw error;
  }
 }
 async activity(uuid:string) { await this.get(uuid); return this.repository.activity(uuid); }
}
export async function lookupCapture(context:MarketingContext,uuid:string) {
 return new CaptureService(context).get(uuid);
}
