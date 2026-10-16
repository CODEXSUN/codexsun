import { Trash2 } from "lucide-react";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import {
  WorkspaceTableEmptyState,
  WorkspaceTableLoadingState,
  WorkspaceTablePanel
} from "@codexsun/ui/workspace/table";
import { cn } from "@codexsun/ui/lib/utils";
import { formatSchemeAmount, formatSchemeDate } from "./scheme.services";
import type { LogicxErpSchemeRecord } from "./scheme.types";

export const logicxErpSchemeColumns = [
  { id: "date", label: "Date" },
  { id: "invoice", label: "Invoice" },
  { id: "description", label: "Description" },
  { id: "brand", label: "Brand" },
  { id: "priority", label: "Priority" },
  { id: "support", label: "Support" },
  { id: "realized", label: "Realized" },
  { id: "claim", label: "Claim" },
  { id: "status", label: "Status" },
  { id: "action", label: "Action" }
] as const;

const rightAligned = new Set(["Support", "Realized"]);

export function LogicxErpSchemeList({
  entries,
  loading,
  onDelete,
  onEdit,
  onSetStatus,
  onView,
  visibleColumns
}: {
  entries: LogicxErpSchemeRecord[];
  loading: boolean;
  onDelete: (scheme: LogicxErpSchemeRecord) => void;
  onEdit: (scheme: LogicxErpSchemeRecord) => void;
  onSetStatus: (scheme: LogicxErpSchemeRecord, status: LogicxErpSchemeRecord["status"]) => void;
  onView: (scheme: LogicxErpSchemeRecord) => void;
  visibleColumns: Record<string, boolean>;
}) {
  const headings = [
    "Scheme",
    ...logicxErpSchemeColumns
      .filter((column) => visibleColumns[column.id])
      .map((column) => column.label)
  ];
  return (
    <WorkspaceTablePanel>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
              {headings.map((heading) => (
                <th
                  key={heading}
                  className={cn(
                    "border-b border-border/70 px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                    rightAligned.has(heading) ? "text-right" : "text-left"
                  )}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((scheme) => (
              <tr
                key={scheme.id}
                aria-label={`View scheme ${scheme.schemeNo}`}
                className="cursor-pointer border-b border-border/70 last:border-b-0 [&>td]:transition-colors hover:[&>td]:bg-muted/60 focus-visible:[&>td]:bg-muted/60 focus-visible:outline-none"
                onClick={(event) => {
                  if ((event.target as Element).closest("button, input, a")) return;
                  onView(scheme);
                }}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onView(scheme);
                  }
                }}
                tabIndex={0}
              >
                <td className="px-4 py-2.5 font-semibold text-foreground">{scheme.schemeNo}</td>
                {visibleColumns.date ? (
                  <td className="whitespace-nowrap px-4 py-2.5">
                    {formatSchemeDate(scheme.schemeDate)}
                  </td>
                ) : null}
                {visibleColumns.invoice ? (
                  <td className="whitespace-nowrap px-4 py-2.5 font-medium">
                    {scheme.invoiceNumber}
                  </td>
                ) : null}
                {visibleColumns.description ? (
                  <td className="max-w-72 truncate px-4 py-2.5" title={scheme.description}>
                    {scheme.description}
                  </td>
                ) : null}
                {visibleColumns.brand ? <td className="px-4 py-2.5">{scheme.brandName}</td> : null}
                {visibleColumns.priority ? (
                  <td className="px-4 py-2.5">
                    <SchemePriorityBadge priority={scheme.priority} />
                  </td>
                ) : null}
                {visibleColumns.support ? (
                  <td className="px-4 py-2.5 text-right">
                    {formatSchemeAmount(scheme.supportValue)}
                  </td>
                ) : null}
                {visibleColumns.realized ? (
                  <td className="px-4 py-2.5 text-right font-semibold">
                    {formatSchemeAmount(scheme.amountRealized)}
                  </td>
                ) : null}
                {visibleColumns.claim ? (
                  <td className="px-4 py-2.5">
                    <SchemeClaimBadge claimDone={scheme.claimDone} />
                  </td>
                ) : null}
                {visibleColumns.status ? (
                  <td className="px-4 py-2.5">
                    <SchemeStatusBadge status={scheme.status} />
                  </td>
                ) : null}
                {visibleColumns.action ? (
                  <td className="px-4 py-2.5">
                    <WorkspaceRowActions
                      actions={[
                        {
                          id: "delete",
                          label: "Delete",
                          icon: <Trash2 className="size-4" />,
                          tone: "destructive",
                          onSelect: () => onDelete(scheme)
                        }
                      ]}
                      deleteLabel="Deactivate"
                      isSuspended={scheme.status === "inactive"}
                      onDelete={() => onSetStatus(scheme, "inactive")}
                      onEdit={() => onEdit(scheme)}
                      onRestore={() => onSetStatus(scheme, "active")}
                      onView={() => onView(scheme)}
                      restoreLabel="Activate"
                      title={scheme.schemeNo}
                    />
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {entries.length === 0 && loading ? <WorkspaceTableLoadingState /> : null}
      {entries.length === 0 && !loading ? (
        <WorkspaceTableEmptyState>No schemes found.</WorkspaceTableEmptyState>
      ) : null}
    </WorkspaceTablePanel>
  );
}

export function SchemePriorityBadge({ priority }: { priority: LogicxErpSchemeRecord["priority"] }) {
  return (
    <WorkspaceStatusBadge
      label={priority}
      tone={priority === "high" ? "danger" : priority === "medium" ? "warning" : "info"}
    />
  );
}

export function SchemeClaimBadge({ claimDone }: { claimDone: boolean }) {
  return (
    <WorkspaceStatusBadge
      label={claimDone ? "claimed" : "pending"}
      tone={claimDone ? "success" : "warning"}
    />
  );
}

export function SchemeStatusBadge({ status }: { status: LogicxErpSchemeRecord["status"] }) {
  return <WorkspaceStatusBadge label={status} tone={status === "active" ? "success" : "danger"} />;
}
