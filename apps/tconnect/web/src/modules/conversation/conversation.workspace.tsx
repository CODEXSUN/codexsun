import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import type { TconnectGateway } from "../../workspace.types";
import { QuotationWorkspace } from "../quotation/index";
import { useConversations } from "./conversation.hooks";
import { ConversationList } from "./conversation.list";
import { MessageWorkspace } from "../message/index";
export function ConversationWorkspace({
  gateway,
  mode,
  conversationUuid,
  requirementUuid,
  onBack
}: {
  gateway: TconnectGateway;
  mode: "buyer" | "seller";
  conversationUuid?: string;
  requirementUuid?: string;
  onBack?: () => void;
}) {
  const query = useConversations(gateway);
  const [selected, setSelected] = useState<string | null>(conversationUuid ?? null);
  const [search, setSearch] = useState("");
  if (selected)
    return (
      <ConversationDetail
        key={selected}
        gateway={gateway}
        mode={mode}
        uuid={selected}
        onBack={() => {
          if (onBack) onBack();
          else setSelected(null);
        }}
      />
    );
  return (
    <section className="space-y-4">
      <div className="flex gap-3">
        <Input
          aria-label="Search conversations"
          placeholder="Search business or requirement"
          className="max-w-md"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Button variant="outline" onClick={() => void query.refetch()}>
          Refresh conversations
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Private buyer–seller conversations. Updates refresh every 15 seconds while this page is
        open.
      </p>
      {query.isError ? (
        <WorkspaceFormBanner title="Conversations could not load">
          {query.error.message}
        </WorkspaceFormBanner>
      ) : null}
      <ConversationList
        records={(query.data ?? [])
          .filter((row) => !requirementUuid || row.requirementUuid === requirementUuid)
          .filter((row) =>
            `${row.subject} ${row.sellerName} ${row.buyerBusiness}`
              .toLowerCase()
              .includes(search.toLowerCase())
          )}
        loading={query.isPending}
        mode={mode}
        onOpen={setSelected}
      />
    </section>
  );
}
function ConversationDetail({
  gateway,
  mode,
  uuid,
  onBack
}: {
  gateway: TconnectGateway;
  mode: "buyer" | "seller";
  uuid: string;
  onBack: () => void;
}) {
  const thread = useQuery({
    queryKey: ["tconnect", "conversation", uuid],
    queryFn: () => gateway.conversation.get(uuid)
  });
  return (
    <section className="space-y-5">
      <Button variant="outline" onClick={onBack}>
        Back
      </Button>
      {thread.isError ? (
        <WorkspaceFormBanner title="Conversation unavailable">
          {thread.error.message}
        </WorkspaceFormBanner>
      ) : null}
      {thread.isPending ? (
        <p role="status">Opening conversation…</p>
      ) : thread.data ? (
        <>
          <div className="rounded-xl border bg-muted/20 p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {thread.data.requirementUuid ? "Requirement" : "Enquiry"} · Private conversation
            </p>
            <h2 className="mt-2 text-lg font-semibold">{thread.data.subject}</h2>
            <p className="mt-1 text-sm">
              {mode === "buyer" ? thread.data.sellerName : thread.data.buyerBusiness}
            </p>
          </div>
          <QuotationWorkspace gateway={gateway} mode={mode} conversationUuid={uuid} />
          <MessageWorkspace
            gateway={gateway}
            uuid={uuid}
            mode={mode}
            buyerBusiness={thread.data.buyerBusiness}
            sellerName={thread.data.sellerName}
          />
        </>
      ) : null}
    </section>
  );
}
