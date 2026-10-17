export type WorkReportTarget = {enquiryId: number | null; taskId: number | null};
export type WorkReport = {id:number;uuid:string;action:string;body:string;latitude:string|null;longitude:string|null;accuracy_meters:string|null;captured_at:string|null;created_by:string;created_at:string};
export type WorkReportPayload = WorkReportTarget & {action:"report"|"check-in"|"check-out";body:string;requestId:string;latitude:number|null;longitude:number|null;accuracyMeters:number|null;capturedAt:string|null};
