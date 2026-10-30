import type { WorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { WorkspaceProtectedIndicator } from "@codexsun/ui/workspace/protected-indicator";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import {
  WorkspaceTableEmptyState,
  WorkspaceTableHeaderCell,
  WorkspaceTablePanel,
  WorkspaceTableLoadingState
} from "@codexsun/ui/workspace/table";
import type { CompanyRecord } from "./company.types";
export const companyColumns = [
  { id: "name", label: "Company" },
  { id: "code", label: "Code" },
  { id: "industryName", label: "Industry" },
  { id: "primaryPhone", label: "Phone" },
  { id: "status", label: "Status" }
];
export function CompanyList({
  listTools,
  loading,
  onEdit,
  onForceDelete,
  onRestore,
  onSuspend,
  records
}: {
  listTools?: WorkspaceListTools;
  loading: boolean;
  onEdit: (record: CompanyRecord) => void;
  onForceDelete: (record: CompanyRecord) => void;
  onRestore: (record: CompanyRecord) => void;
  onSuspend: (record: CompanyRecord) => void;
  records: CompanyRecord[];
}) {
  return (
    <WorkspaceTablePanel>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr>
              {companyColumns
                .filter((column) => !listTools?.hidden.includes(column.id))
                .map((column) => (
                  <WorkspaceTableHeaderCell key={column.id}>
                    {column.label}
                  </WorkspaceTableHeaderCell>
                ))}
              <WorkspaceTableHeaderCell className="text-right">Action</WorkspaceTableHeaderCell>
            </tr>
            {listTools?.showFilters ? (
              <tr>
                {companyColumns
                  .filter((column) => !listTools.hidden.includes(column.id))
                  .map((column) => (
                    <td key={column.id} className="border-b bg-muted/20 px-4 py-2">
                      {listTools.filterRow(column.id)}
                    </td>
                  ))}
                <td />
              </tr>
            ) : null}
          </thead>
          <tbody>
            {records.map((record) => {
              const locked = record.name.trim() === "-";
              return (
                <tr className="border-b last:border-0" key={record.id}>
                  <td hidden={listTools?.hidden.includes("name")} className="px-4 py-3">
                    <button
                      className="font-medium hover:underline"
                      disabled={locked}
                      onClick={() => onEdit(record)}
                    >
                      {record.name}
                    </button>
                  </td>
                  <td hidden={listTools?.hidden.includes("code")} className="px-4 py-3">
                    {record.code}
                  </td>
                  <td hidden={listTools?.hidden.includes("industryName")} className="px-4 py-3">
                    {record.industryName || "-"}
                  </td>
                  <td hidden={listTools?.hidden.includes("primaryPhone")} className="px-4 py-3">
                    {record.primaryPhone || "-"}
                  </td>
                  <td hidden={listTools?.hidden.includes("status")} className="px-4 py-3">
                    <WorkspaceStatusBadge
                      label={record.isActive ? "active" : "inactive"}
                      tone={record.isActive ? "success" : "warning"}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {locked ? (
                      <WorkspaceProtectedIndicator />
                    ) : (
                      <WorkspaceRowActions
                        actions={[
                          {
                            id: "force-delete",
                            label: "Force delete",
                            onSelect: () => onForceDelete(record),
                            tone: "destructive"
                          }
                        ]}
                        deleteLabel="Suspend"
                        isSuspended={!record.isActive}
                        onDelete={() => onSuspend(record)}
                        onEdit={() => onEdit(record)}
                        onRestore={() => onRestore(record)}
                        title={record.name}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {loading && !records.length ? <WorkspaceTableLoadingState /> : null}
      {!loading && !records.length ? (
        <WorkspaceTableEmptyState>No companies found.</WorkspaceTableEmptyState>
      ) : null}
    </WorkspaceTablePanel>
  );
}
