export type CampaignInput={brandUuid:string;name:string;objective:string;channel:string;landingUrl:string;status:"active"|"inactive";};
export type CampaignRecord=CampaignInput & {uuid:string;companyId:number;createdBy:string;updatedBy:string;createdAt:string;updatedAt:string;};
