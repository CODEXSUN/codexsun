import type { MarketingTransport } from "../../transport";
import type { CaptureInput, CaptureRecord } from "./capture.types";
export const listCaptures=(api:MarketingTransport,search:string,offset:number)=>api.get<CaptureRecord[]>("/marketing/captures?limit=50&search="+encodeURIComponent(search)+"&offset="+offset);
export const getCapture=(api:MarketingTransport,uuid:string)=>api.get<CaptureRecord>("/marketing/captures/"+uuid);
export const createCapture=(api:MarketingTransport,input:CaptureInput)=>api.post<CaptureRecord>("/marketing/captures",input);
export const updateCapture=(api:MarketingTransport,uuid:string,input:CaptureInput)=>api.put<CaptureRecord>("/marketing/captures/"+uuid,input);
export const captureActivity=(api:MarketingTransport,uuid:string)=>api.get<{action:string;actor:string;occurredAt:string}[]>("/marketing/captures/"+uuid+"/activity");
