import { ConversationWorkspace, openConversation } from "../conversation/index";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel
} from "@codexsun/ui/components/alert-dialog";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceTable, formatDateTime } from "@codexsun/ui/workspace";
import type { TconnectGateway } from "../../workspace.types";
export function InquiryWorkspace({
  gateway,
  memberOwned = false
}: {
  gateway: TconnectGateway;
  memberOwned?: boolean;
}) {
  const query = useQuery({ queryKey: ["tconnect", "inquiry"], queryFn: gateway.inquiry.list });
  const client = useQueryClient();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [thread, setThread] = useState<string | null>(null);
  const [closing, setClosing] = useState<string | null>(null);
  async function update(uuid: string, status: "contacted" | "closed") {
    setBusy(true);
    setError("");
    try {
      await gateway.inquiry.setStatus(uuid, status);
      await client.invalidateQueries({ queryKey: ["tconnect", "inquiry"] });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not update enquiry.");
    } finally {
      setBusy(false);
    }
  }
  async function reply(uuid: string) {
    setBusy(true);
    setError("");
    try {
      const result = await openConversation(gateway, { requirementUuid: null, inquiryUuid: uuid });
      setThread(result.uuid);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not open conversation.");
    } finally {
      setBusy(false);
    }
  }
  if (thread)
    return (
      <ConversationWorkspace
        key={thread}
        gateway={gateway}
        mode="seller"
        conversationUuid={thread}
        onBack={() => setThread(null)}
      />
    );
  return (
    <section className="space-y-4">
      <Button variant="outline" onClick={() => void query.refetch()}>
        Refresh enquiries
      </Button>
      {error || query.isError ? (
        <WorkspaceFormBanner title="Enquiry error">
          {error || query.error?.message}
        </WorkspaceFormBanner>
      ) : null}
      <WorkspaceTable
        isLoading={query.isPending}
        data={query.data ?? []}
        columns={[
          { accessorKey: "buyerName", header: "Buyer" },
          { accessorKey: "email", header: "Email" },
          { accessorKey: "phone", header: "Phone" },
          { accessorKey: "requirement", header: "Requirement" },
          { accessorKey: "quantity", header: "Quantity" },
          {
            accessorKey: "createdAt",
            header: "Received",
            cell: ({ row }) => formatDateTime(row.original.createdAt)
          },
          { accessorKey: "status", header: "Status" },
          {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
              <div className="flex flex-wrap gap-2">
                {memberOwned ? (
                  row.original.canReply ? (
                    <Button
                      disabled={busy}
                      variant="outline"
                      onClick={() => void reply(row.original.uuid)}
                    >
                      Reply / Quote
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Guest enquiry · use contact details
                    </span>
                  )
                ) : null}
                <Button
                  disabled={busy || row.original.status !== "new"}
                  variant="outline"
                  onClick={() => void update(row.original.uuid, "contacted")}
                >
                  Contacted
                </Button>
                <Button
                  disabled={busy || row.original.status === "closed"}
                  variant="outline"
                  onClick={() => setClosing(row.original.uuid)}
                >
                  Close
                </Button>
              </div>
            )
          }
        ]}
        emptyState="No enquiries received yet."
      />
      <AlertDialog
        open={Boolean(closing)}
        onOpenChange={(open) => {
          if (!open) setClosing(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close this enquiry?</AlertDialogTitle>
            <AlertDialogDescription>
              The enquiry and its contact details remain in the tenant history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep open</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (closing) void update(closing, "closed");
                setClosing(null);
              }}
            >
              Close enquiry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
