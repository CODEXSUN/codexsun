import { useQuery } from "@tanstack/react-query";
import { listLeads, getLead } from "./lead.services";
export const useLeads = () => useQuery({ queryKey: ["crm", "leads"], queryFn: listLeads });
export const useLead = (uuid: string) =>
  useQuery({
    queryKey: ["crm", "lead", uuid],
    queryFn: () => getLead(uuid),
    enabled: Boolean(uuid)
  });
