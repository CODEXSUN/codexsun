import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@codexsun/ui/components/input";
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from "@codexsun/ui/components/select";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import { WorkspaceFormBanner,WorkspaceFormField,WorkspaceFormFooter,WorkspaceFormGrid,WorkspaceUpsertDialog } from "@codexsun/ui/workspace/upsert";
import { useMarketingTransport } from "../../transport";
import { campaignSchema } from "./campaign.schema";
import type { CampaignInput, CampaignRecord } from "./campaign.types";
export function CampaignForm({record,onCancel,onSubmit,pending,error}:{record:CampaignRecord|null;onCancel:()=>void;onSubmit:(input:CampaignInput)=>void;pending:boolean;error:string;}) {
 const api=useMarketingTransport();
 const [value,setValue]=useState<CampaignInput>({brandUuid:record?.brandUuid??"",name:record?.name??"",objective:record?.objective??"",channel:record?.channel??"website",landingUrl:record?.landingUrl??"",status:record?.status??"active"});
 const [issues,setIssues]=useState<Record<string,string>>({});
 const brands=useQuery({queryKey:["marketing",api.scopeKey,"brand-options"],queryFn:()=>api.get<{uuid:string;name:string}[]>("/marketing/brands?limit=100")});
 
 const close=()=>{if(JSON.stringify(value)!==JSON.stringify({brandUuid:record?.brandUuid??"",name:record?.name??"",objective:record?.objective??"",channel:record?.channel??"website",landingUrl:record?.landingUrl??"",status:record?.status??"active"})&&!window.confirm("Discard unsaved changes?"))return;onCancel();};
 return <WorkspaceUpsertDialog open onClose={close} title={record?"Edit Campaign":"New Campaign"} description="Marketing details for the current company.">
 <form noValidate onSubmit={event=>{event.preventDefault();const result=campaignSchema.safeParse(value);if(!result.success){setIssues(Object.fromEntries(result.error.issues.map(issue=>[String(issue.path[0]),issue.message])));return;}setIssues({});onSubmit(result.data);}}>
 {error||Object.keys(issues).length?<WorkspaceFormBanner title="Unable to save" tone="error">{error||"Check the required fields."}</WorkspaceFormBanner>:null}
 <WorkspaceFormGrid><WorkspaceFormField label="Brand" required><WorkspaceLookup ariaLabel="Brand" allowTextValue={false} invalid={Boolean(issues.brandUuid)} value={value.brandUuid} options={(brands.data??[]).map(row=>({value:row.uuid,label:row.name}))} onValueChange={next=>setValue({...value,brandUuid:next})}/>{issues.brandUuid?<p className="text-xs text-destructive">{issues.brandUuid}</p>:null}</WorkspaceFormField>
<WorkspaceFormField label="Name" required={true}><Input aria-label="Name" value={value.name} aria-invalid={Boolean(issues.name)} className={issues.name?"border-destructive":""} onChange={event=>setValue({...value,name:event.target.value})}/>{issues.name?<p className="text-xs text-destructive">{issues.name}</p>:null}</WorkspaceFormField>
<WorkspaceFormField label="Objective" required={true}><Input aria-label="Objective" value={value.objective} aria-invalid={Boolean(issues.objective)} className={issues.objective?"border-destructive":""} onChange={event=>setValue({...value,objective:event.target.value})}/>{issues.objective?<p className="text-xs text-destructive">{issues.objective}</p>:null}</WorkspaceFormField>
<WorkspaceFormField label="Channel" required><Select value={value.channel} onValueChange={next=>setValue({...value,channel:next})}><SelectTrigger aria-label="Channel"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="website">website</SelectItem><SelectItem value="facebook">facebook</SelectItem><SelectItem value="instagram">instagram</SelectItem><SelectItem value="whatsapp">whatsapp</SelectItem><SelectItem value="linkedin">linkedin</SelectItem><SelectItem value="google-ads">google-ads</SelectItem><SelectItem value="google-business">google-business</SelectItem><SelectItem value="youtube">youtube</SelectItem><SelectItem value="threads">threads</SelectItem><SelectItem value="pinterest">pinterest</SelectItem><SelectItem value="x">x</SelectItem><SelectItem value="telegram">telegram</SelectItem><SelectItem value="email">email</SelectItem></SelectContent></Select></WorkspaceFormField>
<WorkspaceFormField label="Landing Url" required={false}><Input aria-label="Landing Url" value={value.landingUrl} aria-invalid={Boolean(issues.landingUrl)} className={issues.landingUrl?"border-destructive":""} onChange={event=>setValue({...value,landingUrl:event.target.value})}/>{issues.landingUrl?<p className="text-xs text-destructive">{issues.landingUrl}</p>:null}</WorkspaceFormField>
 <WorkspaceFormField label="Status"><Select value={value.status} onValueChange={next=>setValue({...value,status:next==="active"?"active":"inactive"})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></WorkspaceFormField>
 </WorkspaceFormGrid><WorkspaceFormFooter onCancel={close} primaryLabel={record?"Update":"Save"} primaryLoading={pending}/></form></WorkspaceUpsertDialog>;
}
