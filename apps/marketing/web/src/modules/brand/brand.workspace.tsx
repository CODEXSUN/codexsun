import { useState } from "react";
import { useMutation,useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { useMarketingTransport } from "../../transport";
import { useBrands } from "./brand.hooks";
import { createBrand,updateBrand } from "./brand.services";
import { BrandList } from "./brand.list";
import { BrandForm } from "./brand.form";
import { BrandShow } from "./brand.show";
import type { BrandInput,BrandRecord } from "./brand.types";
export function BrandWorkspace() {
 const api=useMarketingTransport(),client=useQueryClient();
 const [search,setSearch]=useState(""),[page,setPage]=useState(0);
 const [editing,setEditing]=useState<BrandRecord|null|undefined>(undefined),[viewing,setViewing]=useState<BrandRecord|null>(null);
 const query=useBrands(search,page);
 const save=useMutation({mutationFn:(input:BrandInput)=>editing?updateBrand(api,editing.uuid,input):createBrand(api,input),onSuccess:async()=>{await client.invalidateQueries({queryKey:["marketing",api.scopeKey]});setEditing(undefined);toast.success("Brand saved.");}});
 const toggle=useMutation({mutationFn:(record:BrandRecord)=>updateBrand(api,record.uuid,{name:record.name,timezone:record.timezone,website:record.website,status:record.status==="active"?"inactive":"active"}),onSuccess:()=>client.invalidateQueries({queryKey:["marketing",api.scopeKey]}),onError:error=>toast.error(error.message)});
 return <WorkspacePage variant="list" title="Brands" description="Manage brands in the current tenant and company." technicalName="page.marketing.brand.list" actions={<div className="flex gap-2"><Button variant="outline" onClick={()=>void query.refetch()}>Refresh</Button><Button onClick={()=>{save.reset();setEditing(null);}}>New Brand</Button></div>}>
 <WorkspaceFilters searchValue={search} searchPlaceholder="Search brands" onSearchValueChange={value=>{setSearch(value);setPage(0);}}/>
 {query.error?<p role="alert" className="text-destructive">{query.error.message}</p>:null}
 <BrandList records={query.data??[]} loading={query.isLoading} onView={setViewing} onEdit={record=>{save.reset();setEditing(record);}} onToggle={record=>{if(window.confirm(record.status==="active"?"Deactivate this brand?":"Restore this brand?"))toggle.mutate(record);}}/>
 <div className="flex justify-end gap-3"><Button variant="outline" disabled={!page} onClick={()=>setPage(page-1)}>Previous</Button><span>Page {page+1}</span><Button variant="outline" disabled={(query.data?.length??0)<50} onClick={()=>setPage(page+1)}>Next</Button></div>
 {editing!==undefined?<BrandForm key={editing?.uuid??"new"} record={editing} pending={save.isPending} error={save.error?.message??""} onCancel={()=>setEditing(undefined)} onSubmit={value=>save.mutate(value)}/>:null}
 {viewing?<BrandShow record={viewing} onClose={()=>setViewing(null)} onEdit={()=>{setEditing(viewing);setViewing(null);}}/>:null}</WorkspacePage>;
}
