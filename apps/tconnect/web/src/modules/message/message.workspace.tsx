import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFormPanel } from "@codexsun/ui/workspace";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import type { TconnectGateway } from "../../workspace.types";
import { useMessages } from "./message.hooks";
import { MessageForm } from "./message.form";
import { MessageList } from "./message.list";
export function MessageWorkspace({
  gateway,
  uuid,
  mode,
  buyerBusiness,
  sellerName
}: {
  gateway: TconnectGateway;
  uuid: string;
  mode: "buyer" | "seller";
  buyerBusiness: string;
  sellerName: string;
}) {
  const query = useMessages(gateway, uuid);
  const client = useQueryClient();
  const [sent, setSent] = useState(false);
  const messages = [
    ...new Map(
      (
        query.data?.pages
          .slice()
          .reverse()
          .flatMap((page) => page.messages) ?? []
      ).map((message) => [message.uuid, message])
    ).values()
  ];
  return (
    <WorkspaceFormPanel title="Conversation">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void query.refetch()}>
            Refresh messages
          </Button>
          {query.hasNextPage ? (
            <Button
              variant="outline"
              disabled={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              Load earlier messages
            </Button>
          ) : null}
        </div>
        {query.isError ? (
          <WorkspaceFormBanner title="Messages could not load">
            {query.error.message}
          </WorkspaceFormBanner>
        ) : query.isPending ? (
          <p role="status">Loading messages…</p>
        ) : (
          <MessageList
            records={messages}
            mode={mode}
            buyerBusiness={buyerBusiness}
            sellerName={sellerName}
          />
        )}
        {sent ? (
          <p role="status" className="text-sm text-emerald-700">
            Message sent.
          </p>
        ) : null}
        <MessageForm
          onSend={async (body) => {
            setSent(false);
            await gateway.message.send(uuid, body);
            await client.invalidateQueries({ queryKey: ["tconnect", "message", uuid] });
            await client.invalidateQueries({ queryKey: ["tconnect", "conversation"] });
            setSent(true);
          }}
        />
      </div>
    </WorkspaceFormPanel>
  );
}
