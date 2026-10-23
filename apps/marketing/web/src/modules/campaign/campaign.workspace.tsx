import { useState } from "react";
import { useMutation,useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { useMarketingTransport } from "../../transport";
import { useCampaigns } from "./campaign.hooks";
import { createCampaign,updateCampaign } from "./campaign.services";
import { CampaignList } from "./campaign.list";
import { CampaignForm } from "./campaign.form";
import { CampaignShow } from "./campaign.show";
import type { CampaignInput,CampaignRecord } from "./campaign.types";
export function CampaignWorkspace() {
 const api=useMarketingTransport(),client=useQueryClient();
 const [search,setSearch]=useState(""),[page,setPage]=useState(0);
 const [editing,setEditing]=useState<CampaignRecord|null|undefined>(undefined),[viewing,setViewing]=useState<CampaignRecord|null>(null);
 const query=useCampaigns(search,page);
 const save=useMutation({mutationFn:(input:CampaignInput)=>editing?updateCampaign(api,editing.uuid,input):createCampaign(api,input),onSuccess:async()=>{await client.invalidateQueries({queryKey:["marketing",api.scopeKey]});setEditing(undefined);toast.success("Campaign saved.");}});
 const toggle=useMutation({mutationFn:(record:CampaignRecord)=>updateCampaign(api,record.uuid,{brandUuid:record.brandUuid,name:record.name,objective:record.objective,channel:record.channel,landingUrl:record.landingUrl,status:record.status==="active"?"inactive":"active"}),onSuccess:()=>client.invalidateQueries({queryKey:["marketing",api.scopeKey]}),onError:error=>toast.error(error.message)});
 return <WorkspacePage variant="list" title="Campaigns" description="Manage campaigns in the current tenant and company." technicalName="page.marketing.campaign.list" actions={<div className="flex gap-2"><Button variant="outline" onClick={()=>void query.refetch()}>Refresh</Button><Button onClick={()=>{save.reset();setEditing(null);}}>New Campaign</Button></div>}>
 <WorkspaceFilters searchValue={search} searchPlaceholder="Search campaigns" onSearchValueChange={value=>{setSearch(value);setPage(0);}}/>
 {query.error?<p role="alert" className="text-destructive">{query.error.message}</p>:null}
 <CampaignList records={query.data??[]} loading={query.isLoading} onView={setViewing} onEdit={record=>{save.reset();setEditing(record);}} onToggle={record=>{if(window.confirm(record.status==="active"?"Deactivate this campaign?":"Restore this campaign?"))toggle.mutate(record);}}/>
 <div className="flex justify-end gap-3"><Button variant="outline" disabled={!page} onClick={()=>setPage(page-1)}>Previous</Button><span>Page {page+1}</span><Button variant="outline" disabled={(query.data?.length??0)<50} onClick={()=>setPage(page+1)}>Next</Button></div>
 {editing!==undefined?<CampaignForm key={editing?.uuid??"new"} record={editing} pending={save.isPending} error={save.error?.message??""} onCancel={()=>setEditing(undefined)} onSubmit={value=>save.mutate(value)}/>:null}
 {viewing?<CampaignShow record={viewing} onClose={()=>setViewing(null)} onEdit={()=>{setEditing(viewing);setViewing(null);}}/>:null}</WorkspacePage>;
}
