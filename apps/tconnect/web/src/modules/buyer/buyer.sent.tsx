import { useState } from "react";
import { ConversationWorkspace, openConversation } from "../conversation/index";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceTable, formatDateTime } from "@codexsun/ui/workspace";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import type { TconnectGateway } from "../../workspace.types";
export function BuyerSent({ gateway }: { gateway: TconnectGateway }) {
  const query = useQuery({ queryKey: ["tconnect", "sent"], queryFn: gateway.buyer.sent });
  const [thread, setThread] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function reply(uuid: string) {
    setBusy(true);
    setError("");
    try {
      const result = await openConversation(gateway, { requirementUuid: null, inquiryUuid: uuid });
      setThread(result.uuid);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Conversation could not open.");
    } finally {
      setBusy(false);
    }
  }
  if (thread)
    return (
      <ConversationWorkspace
        key={thread}
        gateway={gateway}
        mode="buyer"
        conversationUuid={thread}
        onBack={() => setThread(null)}
      />
    );
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Your enquiries and the latest status set by each seller.
        </p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Refresh
        </Button>
      </div>
      {query.isError ? (
        <WorkspaceFormBanner title="Enquiries could not load">
          {query.error.message}
        </WorkspaceFormBanner>
      ) : null}
      {error ? <WorkspaceFormBanner title="Conversation error">{error}</WorkspaceFormBanner> : null}
      <WorkspaceTable
        data={query.data ?? []}
        isLoading={query.isPending}
        emptyState="No enquiries sent yet. Find a product to contact its seller."
        columns={[
          {
            id: "conversation",
            header: "Conversation",
            cell: ({ row }) => (
              <Button
                disabled={busy}
                variant="outline"
                onClick={() => void reply(row.original.uuid)}
              >
                Messages / Quotes
              </Button>
            )
          },
          { accessorKey: "sellerName", header: "Seller" },
          { accessorKey: "requirement", header: "Requirement" },
          { accessorKey: "quantity", header: "Quantity" },
          { accessorKey: "status", header: "Status" },
          {
            accessorKey: "createdAt",
            header: "Sent",
            cell: ({ row }) => formatDateTime(row.original.createdAt)
          }
        ]}
      />
    </section>
  );
}
