import { Button } from "@codexsun/ui/components/button";
import { WorkspaceTable } from "@codexsun/ui/workspace";
import type { Credential } from "./credential.types";
export function CredentialList({
  records,
  onEdit
}: {
  records: Credential[];
  onEdit: (record: Credential) => void;
}) {
  return (
    <WorkspaceTable
      data={records}
      emptyState="No credential reviews yet. New companies do not receive badges automatically."
      columns={[
        { accessorKey: "companyName", header: "Company" },
        { accessorKey: "standardName", header: "Evidence" },
        { accessorKey: "kind", header: "Type" },
        { accessorKey: "status", header: "Outcome" },
        { accessorKey: "expiresOn", header: "Valid until" },
        { accessorKey: "reviewedAt", header: "Reviewed" },
        {
          id: "review",
          header: "Action",
          cell: ({ row }) => (
            <Button variant="outline" onClick={() => onEdit(row.original)}>
              View / Review
            </Button>
          )
        }
      ]}
    />
  );
}
