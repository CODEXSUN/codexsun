import { useQueryClient } from "@tanstack/react-query";
import { crmRequest } from "../../crm-request";
import { prioritySwatch, statusIcon } from "../../crm-colors";

export function useEnquiryMasterCreate() {
  const client = useQueryClient();
  const create = async (kind: "list-in" | "status" | "priority", name: string) => {
    const record = await crmRequest<{ id: string; name: string; code: string }>(
      `/crm/enquiries/options/${kind}`,
      { method: "POST", body: JSON.stringify({ name }) }
    );
    await client.invalidateQueries({ queryKey: ["crm", "enquiries", "options"] });
    return record;
  };
  return {
    listIn: async (name: string) => {
      const record = await create("list-in", name);
      return { label: record.name, value: String(record.id) };
    },
    status: async (name: string) => {
      const record = await create("status", name);
      return {
        label: record.name,
        value: String(record.id),
        leadingIcon: statusIcon(record.code)
      };
    },
    priority: async (name: string) => {
      const record = await create("priority", name);
      return {
        label: record.name,
        value: String(record.id),
        swatchClassName: prioritySwatch(record.code)
      };
    }
  };
}
