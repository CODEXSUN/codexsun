import { WorkspaceTable } from "@codexsun/ui/workspace/table";

import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";

import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";

import { enquiryStatuses, type EnquiryRecord } from "./enquiry.types.js";

export function EnquiryList({
  records,
  loading,
  onView,
  onDelete,
  onRestore
}: {
  records: EnquiryRecord[];
  loading: boolean;
  onView: (r: EnquiryRecord) => void;
  onDelete: (r: EnquiryRecord) => void;
  onRestore: (r: EnquiryRecord) => void;
}) {
  return (
    <WorkspaceTable<EnquiryRecord>
      data={records}
      isLoading={loading}
      emptyState="No enquiries match these filters."
      onRowClick={onView}
      columns={[
        {
          accessorKey: "name",
          header: "From",
          cell: ({ row }) => (
            <div>
              <strong>{row.original.name}</strong>
              <div className="text-muted-foreground">{row.original.email}</div>
            </div>
          )
        },

        { accessorKey: "company", header: "Company" },

        {
          accessorKey: "createdAt",
          header: "Received",
          cell: ({ row }) => new Date(row.original.createdAt).toLocaleString()
        },

        {
          accessorKey: "status",
          header: "Status",
          cell: ({ row }) => (
            <WorkspaceStatusBadge
              label={
                row.original.deletedAt
                  ? "Trash"
                  : (enquiryStatuses.find((s) => s.value === row.original.status)?.label ??
                    row.original.status)
              }
              tone={
                row.original.deletedAt
                  ? "neutral"
                  : row.original.status === "new"
                    ? "info"
                    : row.original.status === "resolved"
                      ? "success"
                      : row.original.status === "spam"
                        ? "danger"
                        : "warning"
              }
            />
          )
        },

        {
          id: "actions",
          header: "Actions",
          cell: ({ row }) => (
            <div onClick={(e) => e.stopPropagation()}>
              <WorkspaceRowActions
                title={row.original.name}
                onView={() => onView(row.original)}
                deleteLabel="Move to trash"
                {...(row.original.deletedAt
                  ? { isSuspended: true, onRestore: () => onRestore(row.original) }
                  : { onDelete: () => onDelete(row.original) })}
              />
            </div>
          )
        }
      ]}
    />
  );
}
