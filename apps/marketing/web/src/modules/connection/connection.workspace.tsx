import { useState } from "react";
import { useMutation,useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { useMarketingTransport } from "../../transport";
import { useConnections } from "./connection.hooks";
import { createConnection,updateConnection } from "./connection.services";
import { ConnectionList } from "./connection.list";
import { ConnectionForm } from "./connection.form";
import { ConnectionShow } from "./connection.show";
import type { ConnectionInput,ConnectionRecord } from "./connection.types";
export function ConnectionWorkspace() {
 const api=useMarketingTransport(),client=useQueryClient();
 const [search,setSearch]=useState(""),[page,setPage]=useState(0);
 const [editing,setEditing]=useState<ConnectionRecord|null|undefined>(undefined),[viewing,setViewing]=useState<ConnectionRecord|null>(null);
 const query=useConnections(search,page);
 const save=useMutation({mutationFn:(input:ConnectionInput)=>editing?updateConnection(api,editing.uuid,input):createConnection(api,input),onSuccess:async()=>{await client.invalidateQueries({queryKey:["marketing",api.scopeKey]});setEditing(undefined);toast.success("Connection saved.");}});
 const toggle=useMutation({mutationFn:(record:ConnectionRecord)=>updateConnection(api,record.uuid,{brandUuid:record.brandUuid,name:record.name,provider:record.provider,externalAccountId:record.externalAccountId,status:record.status==="active"?"inactive":"active"}),onSuccess:()=>client.invalidateQueries({queryKey:["marketing",api.scopeKey]}),onError:error=>toast.error(error.message)});
 return <WorkspacePage variant="list" title="Connections" description="Manage connections in the current tenant and company." technicalName="page.marketing.connection.list" actions={<div className="flex gap-2"><Button variant="outline" onClick={()=>void query.refetch()}>Refresh</Button><Button onClick={()=>{save.reset();setEditing(null);}}>New Connection</Button></div>}>
 <WorkspaceFilters searchValue={search} searchPlaceholder="Search connections" onSearchValueChange={value=>{setSearch(value);setPage(0);}}/>
 {query.error?<p role="alert" className="text-destructive">{query.error.message}</p>:null}
 <ConnectionList records={query.data??[]} loading={query.isLoading} onView={setViewing} onEdit={record=>{save.reset();setEditing(record);}} onToggle={record=>{if(window.confirm(record.status==="active"?"Deactivate this connection?":"Restore this connection?"))toggle.mutate(record);}}/>
 <div className="flex justify-end gap-3"><Button variant="outline" disabled={!page} onClick={()=>setPage(page-1)}>Previous</Button><span>Page {page+1}</span><Button variant="outline" disabled={(query.data?.length??0)<50} onClick={()=>setPage(page+1)}>Next</Button></div>
 {editing!==undefined?<ConnectionForm key={editing?.uuid??"new"} record={editing} pending={save.isPending} error={save.error?.message??""} onCancel={()=>setEditing(undefined)} onSubmit={value=>save.mutate(value)}/>:null}
 {viewing?<ConnectionShow record={viewing} onClose={()=>setViewing(null)} onEdit={()=>{setEditing(viewing);setViewing(null);}}/>:null}</WorkspacePage>;
}
