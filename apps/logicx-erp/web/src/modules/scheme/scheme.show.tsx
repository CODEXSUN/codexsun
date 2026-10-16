import { formatDateTime as formatWorkspaceDateTime } from "@codexsun/ui/workspace";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import {
  WorkspaceDetailTable,
  WorkspaceShowCard,
  WorkspaceShowLayout
} from "@codexsun/ui/workspace/show";
import { WorkspaceTableEmptyState } from "@codexsun/ui/workspace/table";
import { useLogicxErpSchemeActivity } from "./scheme.hooks";
import { SchemeClaimBadge, SchemePriorityBadge, SchemeStatusBadge } from "./scheme.list";
import {
  formatSchemeAmount,
  formatSchemeDate,
  type LogicxErpSchemeGateway
} from "./scheme.services";
import type { LogicxErpSchemeRecord } from "./scheme.types";

export function LogicxErpSchemeShowPage({
  busy,
  gateway,
  onBack,
  onDelete,
  onEdit,
  onNew,
  onSetStatus,
  scheme
}: {
  busy: boolean;
  gateway: LogicxErpSchemeGateway;
  onBack: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onNew: () => void;
  onSetStatus: (status: LogicxErpSchemeRecord["status"]) => void;
  scheme: LogicxErpSchemeRecord;
}) {
  const activityQuery = useLogicxErpSchemeActivity(gateway, scheme.id);
  const active = scheme.status === "active";

  return (
    <WorkspacePage
      title={scheme.description}
      description={`${scheme.schemeNo} · Vendor scheme on invoice ${scheme.invoiceNumber}`}
      technicalName="page.logicx-erp.scheme.show"
      onBack={onBack}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            className="h-9 rounded-md"
            disabled={busy}
            onClick={() => onSetStatus(active ? "inactive" : "active")}
            type="button"
            variant="outline"
          >
            <RotateCcw className="size-4" />
            {active ? "Deactivate" : "Activate"}
          </Button>
          <Button
            className="h-9 rounded-md text-destructive hover:text-destructive"
            disabled={busy}
            onClick={onDelete}
            type="button"
            variant="outline"
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
          <Button className="h-9 rounded-md" onClick={onEdit} type="button" variant="outline">
            <Pencil className="size-4" />
            Edit
          </Button>
          <Button className="h-9 rounded-md" onClick={onNew} type="button">
            <Plus className="size-4" />
            New scheme
          </Button>
        </div>
      }
    >
      <WorkspaceShowLayout>
        <div className="space-y-4">
          <WorkspaceShowCard title="Scheme details">
            <WorkspaceDetailTable
              rows={[
                ["Scheme", scheme.schemeNo],
                ["Date", formatSchemeDate(scheme.schemeDate)],
                ["Sales invoice", scheme.invoiceNumber],
                ["Priority", <SchemePriorityBadge key="priority" priority={scheme.priority} />],
                ["Brand", scheme.brandName],
                ["Support value", formatSchemeAmount(scheme.supportValue)],
                ["Description", scheme.description]
              ]}
            />
          </WorkspaceShowCard>
          <WorkspaceShowCard title="Approval and claim">
            <WorkspaceDetailTable
              rows={[
                ["Requested by", scheme.requestedByName],
                ["Approved by", scheme.approvedByName],
                ["Claim", <SchemeClaimBadge key="claim" claimDone={scheme.claimDone} />],
                [
                  "Amount realized",
                  scheme.amountRealized === null ? null : formatSchemeAmount(scheme.amountRealized)
                ],
                ["Status", <SchemeStatusBadge key="status" status={scheme.status} />]
              ]}
            />
          </WorkspaceShowCard>
        </div>
        <WorkspaceShowCard title="Activity">
          {activityQuery.isLoading ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">Loading activity...</p>
          ) : activityQuery.isError ? (
            <WorkspaceTableEmptyState>
              {activityQuery.error instanceof Error
                ? activityQuery.error.message
                : "Activity could not be loaded."}
            </WorkspaceTableEmptyState>
          ) : (activityQuery.data ?? []).length === 0 ? (
            <WorkspaceTableEmptyState>No activity yet.</WorkspaceTableEmptyState>
          ) : (
            <ol className="divide-y divide-border/60">
              {activityQuery.data!.map((entry) => (
                <li className="px-4 py-3" key={entry.id}>
                  <p className="text-sm font-medium text-foreground">{entry.summary}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {entry.actorEmail} · {formatWorkspaceDateTime(entry.createdAt)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </WorkspaceShowCard>
      </WorkspaceShowLayout>
    </WorkspacePage>
  );
}
