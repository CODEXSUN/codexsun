import { useState } from "react";
import { useMutation,useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { useMarketingTransport } from "../../transport";
import { useCaptures } from "./capture.hooks";
import { createCapture,updateCapture } from "./capture.services";
import { CaptureList } from "./capture.list";
import { CaptureForm } from "./capture.form";
import { CaptureShow } from "./capture.show";
import type { CaptureInput,CaptureRecord } from "./capture.types";
export function CaptureWorkspace() {
 const api=useMarketingTransport(),client=useQueryClient();
 const [search,setSearch]=useState(""),[page,setPage]=useState(0);
 const [editing,setEditing]=useState<CaptureRecord|null|undefined>(undefined),[viewing,setViewing]=useState<CaptureRecord|null>(null);
 const query=useCaptures(search,page);
 const save=useMutation({mutationFn:(input:CaptureInput)=>editing?updateCapture(api,editing.uuid,input):createCapture(api,input),onSuccess:async()=>{await client.invalidateQueries({queryKey:["marketing",api.scopeKey]});setEditing(undefined);toast.success("Capture form saved.");}});
 const toggle=useMutation({mutationFn:(record:CaptureRecord)=>updateCapture(api,record.uuid,{brandUuid:record.brandUuid,campaignUuid:record.campaignUuid,name:record.name,allowedOrigin:record.allowedOrigin,consentNotice:record.consentNotice,noticeVersion:record.noticeVersion,status:record.status==="active"?"inactive":"active"}),onSuccess:()=>client.invalidateQueries({queryKey:["marketing",api.scopeKey]}),onError:error=>toast.error(error.message)});
 return <WorkspacePage variant="list" title="Capture forms" description="Manage captures in the current tenant and company." technicalName="page.marketing.capture.list" actions={<div className="flex gap-2"><Button variant="outline" onClick={()=>void query.refetch()}>Refresh</Button><Button onClick={()=>{save.reset();setEditing(null);}}>New Capture form</Button></div>}>
 <WorkspaceFilters searchValue={search} searchPlaceholder="Search captures" onSearchValueChange={value=>{setSearch(value);setPage(0);}}/>
 {query.error?<p role="alert" className="text-destructive">{query.error.message}</p>:null}
 <CaptureList records={query.data??[]} loading={query.isLoading} onView={setViewing} onEdit={record=>{save.reset();setEditing(record);}} onToggle={record=>{if(window.confirm(record.status==="active"?"Deactivate this capture?":"Restore this capture?"))toggle.mutate(record);}}/>
 <div className="flex justify-end gap-3"><Button variant="outline" disabled={!page} onClick={()=>setPage(page-1)}>Previous</Button><span>Page {page+1}</span><Button variant="outline" disabled={(query.data?.length??0)<50} onClick={()=>setPage(page+1)}>Next</Button></div>
 {editing!==undefined?<CaptureForm key={editing?.uuid??"new"} record={editing} pending={save.isPending} error={save.error?.message??""} onCancel={()=>setEditing(undefined)} onSubmit={value=>save.mutate(value)}/>:null}
 {viewing?<CaptureShow record={viewing} onClose={()=>setViewing(null)} onEdit={()=>{setEditing(viewing);setViewing(null);}}/>:null}</WorkspacePage>;
}
