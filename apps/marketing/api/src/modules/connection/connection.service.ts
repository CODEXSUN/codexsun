import { AppError } from "@codexsun/framework/errors";
import type { MarketingContext } from "../../context.js";
import { ConnectionRepository } from "./connection.repository.js";
import type { ConnectionInput } from "./connection.types.js";
export class ConnectionService {
 private readonly repository: ConnectionRepository;
 constructor(private readonly context: MarketingContext, private readonly validateParent: (input: ConnectionInput)=>Promise<void> = async()=>{}) {
  this.repository=new ConnectionRepository(context);
 }
 async list(search:string,limit:number,offset:number) { await this.context.authorize("marketing.connection.record.view"); return this.repository.list(search,limit,offset); }
 async get(uuid:string) {
  await this.context.authorize("marketing.connection.record.view");
  const record=await this.repository.get(uuid); if(!record) throw AppError.notFound("Connection was not found."); return record;
 }
 async save(input:ConnectionInput,uuid?:string) {
  await this.context.authorize("marketing.connection.record."+ (uuid?"update":"create"));
  if(uuid) await this.get(uuid);
  await this.validateParent(input);
  try { return await this.get(await this.repository.save(input,uuid)); }
  catch(error) {
   if(error && typeof error==="object" && "code" in error && error.code==="ER_DUP_ENTRY") throw AppError.conflict("Connection name or identity already exists. Retry new records with a different name.");
   throw error;
  }
 }
 async activity(uuid:string) { await this.get(uuid); return this.repository.activity(uuid); }
}
export async function lookupConnection(context:MarketingContext,uuid:string) {
 return new ConnectionService(context).get(uuid);
}
