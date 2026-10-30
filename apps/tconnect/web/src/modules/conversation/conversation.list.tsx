import { Button } from "@codexsun/ui/components/button";
import { WorkspaceTable, formatDateTime } from "@codexsun/ui/workspace";
import type { Conversation } from "./conversation.types";
export function ConversationList({
  records,
  loading,
  mode,
  onOpen
}: {
  records: Conversation[];
  loading: boolean;
  mode: "buyer" | "seller";
  onOpen: (uuid: string) => void;
}) {
  return (
    <WorkspaceTable
      data={records}
      isLoading={loading}
      emptyState="No conversations yet. Start from a requirement or enquiry."
      columns={[
        { accessorKey: "subject", header: "Requirement / enquiry" },
        {
          id: "participant",
          header: mode === "buyer" ? "Seller" : "Buyer",
          cell: ({ row }) =>
            mode === "buyer" ? row.original.sellerName : row.original.buyerBusiness
        },
        {
          accessorKey: "updatedAt",
          header: "Last activity",
          cell: ({ row }) => formatDateTime(row.original.updatedAt)
        },
        {
          id: "actions",
          header: "Conversation",
          cell: ({ row }) => (
            <Button variant="outline" onClick={() => onOpen(row.original.uuid)}>
              Open conversation
            </Button>
          )
        }
      ]}
    />
  );
}
