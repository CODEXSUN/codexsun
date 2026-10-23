import { useQuery } from "@tanstack/react-query";
import { useMarketingTransport } from "../../transport";
import { listCaptures } from "./capture.services";
export function useCaptures(search:string,page:number) { const api=useMarketingTransport();return useQuery({queryKey:["marketing",api.scopeKey,"capture",search,page],queryFn:()=>listCaptures(api,search,page*50)}); }
