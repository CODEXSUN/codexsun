import { useQuery } from "@tanstack/react-query";
import { useMarketingTransport } from "../../transport";
import { listConnections } from "./connection.services";
export function useConnections(search:string,page:number) { const api=useMarketingTransport();return useQuery({queryKey:["marketing",api.scopeKey,"connection",search,page],queryFn:()=>listConnections(api,search,page*50)}); }
