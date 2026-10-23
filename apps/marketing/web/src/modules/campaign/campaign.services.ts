import type { MarketingTransport } from "../../transport";
import type { CampaignInput, CampaignRecord } from "./campaign.types";
export const listCampaigns=(api:MarketingTransport,search:string,offset:number)=>api.get<CampaignRecord[]>("/marketing/campaigns?limit=50&search="+encodeURIComponent(search)+"&offset="+offset);
export const getCampaign=(api:MarketingTransport,uuid:string)=>api.get<CampaignRecord>("/marketing/campaigns/"+uuid);
export const createCampaign=(api:MarketingTransport,input:CampaignInput)=>api.post<CampaignRecord>("/marketing/campaigns",input);
export const updateCampaign=(api:MarketingTransport,uuid:string,input:CampaignInput)=>api.put<CampaignRecord>("/marketing/campaigns/"+uuid,input);
export const campaignActivity=(api:MarketingTransport,uuid:string)=>api.get<{action:string;actor:string;occurredAt:string}[]>("/marketing/campaigns/"+uuid+"/activity");
