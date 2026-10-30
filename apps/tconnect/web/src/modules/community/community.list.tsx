import { Button } from "@codexsun/ui/components/button";
import { WorkspaceTable } from "@codexsun/ui/workspace";
import type { CommunityPost } from "./community.types";
export function CommunityList({
  records,
  onEdit
}: {
  records: CommunityPost[];
  onEdit: (record: CommunityPost) => void;
}) {
  return (
    <WorkspaceTable
      data={records}
      columns={[
        { accessorKey: "title", header: "Title" },
        { accessorKey: "category", header: "Category" },
        {
          accessorKey: "eventDate",
          header: "Event date",
          cell: ({ row }) => row.original.eventDate?.split("-").reverse().join("-") ?? "—"
        },
        {
          accessorKey: "status",
          header: "Status",
          cell: ({ row }) => (
            <span
              className={row.original.status === "active" ? "text-emerald-700" : "text-amber-700"}
            >
              {row.original.status === "active" ? "Active" : "Inactive"}
            </span>
          )
        },
        {
          id: "actions",
          header: "Actions",
          cell: ({ row }) => (
            <Button variant="outline" onClick={() => onEdit(row.original)}>
              View / Edit
            </Button>
          )
        }
      ]}
      emptyState="No community records. Create the first record."
    />
  );
}
