export type ConnectionInput={brandUuid:string;name:string;provider:string;externalAccountId:string;status:"active"|"inactive";};
export type ConnectionRecord=ConnectionInput & {uuid:string;companyId:number;createdBy:string;updatedBy:string;createdAt:string;updatedAt:string;};
