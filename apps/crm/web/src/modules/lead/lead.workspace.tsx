import { useWorkspaceQueryValue } from "@codexsun/ui/workspace/navigation";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { Button } from "@codexsun/ui/components/button";
import { useLeads, useLead } from "./lead.hooks";
import { LeadList } from "./lead.list";
import { LeadShow } from "./lead.show";
export function LeadWorkspace() {
  const query = useLeads();
  const [uuid, setUuid] = useWorkspaceQueryValue("show", "");
  const detail = useLead(uuid);
  return (
    <WorkspacePage
      variant="list"
      title="Leads"
      description="Captured prospects assigned to you. Contact identity stays under review."
      technicalName="page.crm.lead.list"
      actions={
        <Button variant="outline" onClick={() => void query.refetch()}>
          Refresh
        </Button>
      }
    >
      {query.error || detail.error ? (
        <p role="alert">{query.error?.message ?? detail.error?.message}</p>
      ) : null}
      <LeadList
        records={query.data ?? []}
        loading={query.isLoading}
        onView={(row) => setUuid(row.uuid)}
      />
      <p className="text-sm text-muted-foreground">
        Latest 100 assigned leads. Qualification and conversion are not enabled in this intake
        release.
      </p>
      {uuid && detail.data ? <LeadShow record={detail.data} onClose={() => setUuid("")} /> : null}
    </WorkspacePage>
  );
}
