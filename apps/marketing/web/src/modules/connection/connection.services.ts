import type { MarketingTransport } from "../../transport";
import type { ConnectionInput, ConnectionRecord } from "./connection.types";
export const listConnections=(api:MarketingTransport,search:string,offset:number)=>api.get<ConnectionRecord[]>("/marketing/connections?limit=50&search="+encodeURIComponent(search)+"&offset="+offset);
export const getConnection=(api:MarketingTransport,uuid:string)=>api.get<ConnectionRecord>("/marketing/connections/"+uuid);
export const createConnection=(api:MarketingTransport,input:ConnectionInput)=>api.post<ConnectionRecord>("/marketing/connections",input);
export const updateConnection=(api:MarketingTransport,uuid:string,input:ConnectionInput)=>api.put<ConnectionRecord>("/marketing/connections/"+uuid,input);
export const connectionActivity=(api:MarketingTransport,uuid:string)=>api.get<{action:string;actor:string;occurredAt:string}[]>("/marketing/connections/"+uuid+"/activity");
