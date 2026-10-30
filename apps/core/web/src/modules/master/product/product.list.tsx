import type { WorkspaceListTools } from "@codexsun/ui/workspace/list-tools";
import { Trash2 } from "lucide-react";
import { WorkspaceProtectedIndicator } from "@codexsun/ui/workspace/protected-indicator";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import {
  WorkspaceTableEmptyState,
  WorkspaceTableHeaderCell,
  WorkspaceTablePanel,
  WorkspaceTableLoadingState
} from "@codexsun/ui/workspace/table";
import type { ProductRecord } from "./product.types";
export const productColumns = [
  { id: "name", label: "Product" },
  { id: "openingStock", label: "Opening Qty" },
  { id: "openingRate", label: "Opening Price" },
  { id: "status", label: "Status" }
];
export function ProductList({
  listTools,
  loading,
  onEdit,
  onForceDelete,
  onToggle,
  records
}: {
  listTools?: WorkspaceListTools;
  loading: boolean;
  onEdit: (record: ProductRecord) => void;
  onForceDelete: (record: ProductRecord) => void;
  onToggle: (record: ProductRecord) => void;
  records: ProductRecord[];
}) {
  return (
    <WorkspaceTablePanel>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr>
              {productColumns
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
                {productColumns
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
              const protectedRow = record.name.trim() === "-";
              return (
                <tr className="border-b last:border-0" key={record.id}>
                  <td hidden={listTools?.hidden.includes("name")} className="px-4 py-3">
                    <button
                      className="font-medium hover:underline"
                      disabled={protectedRow}
                      onClick={() => onEdit(record)}
                    >
                      {record.name}
                    </button>
                  </td>
                  <td hidden={listTools?.hidden.includes("openingStock")} className="px-4 py-3">
                    {record.openingStock}
                  </td>
                  <td hidden={listTools?.hidden.includes("openingRate")} className="px-4 py-3">
                    {record.openingRate}
                  </td>
                  <td hidden={listTools?.hidden.includes("status")} className="px-4 py-3">
                    <WorkspaceStatusBadge
                      label={record.isActive ? "active" : "inactive"}
                      tone={record.isActive ? "success" : "warning"}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {protectedRow ? (
                      <WorkspaceProtectedIndicator />
                    ) : (
                      <WorkspaceRowActions
                        actions={[
                          {
                            id: "force-delete",
                            icon: <Trash2 className="size-4" />,
                            label: "Force delete",
                            onSelect: () => onForceDelete(record),
                            tone: "destructive"
                          }
                        ]}
                        deleteLabel="Suspend"
                        isSuspended={!record.isActive}
                        onDelete={() => onToggle(record)}
                        onEdit={() => onEdit(record)}
                        onRestore={() => onToggle(record)}
                        restoreLabel="Activate"
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
        <WorkspaceTableEmptyState>No products found.</WorkspaceTableEmptyState>
      ) : null}
    </WorkspaceTablePanel>
  );
}
