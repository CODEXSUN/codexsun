import { QuotationWorkspace } from "../quotation/index";
import { ConversationWorkspace, openConversation } from "../conversation/index";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import type { TconnectGateway } from "../../workspace.types";
import type { Requirement } from "./requirement.types";
import { useRequirements } from "./requirement.hooks";
import { RequirementList } from "./requirement.list";
import { RequirementForm } from "./requirement.form";
export function RequirementWorkspace({
  gateway,
  board = false
}: {
  gateway: TconnectGateway;
  board?: boolean;
}) {
  const query = useRequirements(gateway, board);
  const client = useQueryClient();
  const [record, setRecord] = useState<Requirement | null | undefined>();
  const [search, setSearch] = useState("");
  const [responses, setResponses] = useState<Requirement | null>(null);
  const [thread, setThread] = useState<string | null>(null);
  const [replyError, setReplyError] = useState("");
  const [opening, setOpening] = useState(false);
  const [saved, setSaved] = useState(false);
  async function reply(uuid: string) {
    setReplyError("");
    setOpening(true);
    try {
      const result = await openConversation(gateway, { requirementUuid: uuid, inquiryUuid: null });
      setThread(result.uuid);
    } catch (error) {
      setReplyError(error instanceof Error ? error.message : "Conversation could not open.");
    } finally {
      setOpening(false);
    }
  }
  if (thread)
    return (
      <ConversationWorkspace
        key={thread}
        gateway={gateway}
        mode={board ? "seller" : "buyer"}
        conversationUuid={thread}
        onBack={() => setThread(null)}
      />
    );
  if (responses)
    return (
      <section className="space-y-5">
        <Button variant="outline" onClick={() => setResponses(null)}>
          Back to requirements
        </Button>
        <h2 className="text-lg font-semibold">{responses.title}</h2>
        <QuotationWorkspace
          gateway={gateway}
          mode="buyer"
          requirementUuid={responses.uuid}
          onDiscuss={setThread}
        />
        <ConversationWorkspace gateway={gateway} mode="buyer" requirementUuid={responses.uuid} />
      </section>
    );
  if (record !== undefined && !board)
    return (
      <RequirementForm
        record={record}
        onCancel={() => setRecord(undefined)}
        onSave={async (input, uuid) => {
          await gateway.requirement.save(input, uuid);
          await client.invalidateQueries({ queryKey: ["tconnect", "requirement"] });
          setRecord(undefined);
          setSaved(true);
        }}
      />
    );
  const records = (query.data ?? []).filter((row) =>
    `${row.title} ${row.description} ${row.category} ${row.deliveryCity}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input
          className="max-w-md"
          aria-label="Search requirements"
          placeholder="Search requirements"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {!board ? (
          <Button
            onClick={() => {
              setRecord(null);
              setSaved(false);
            }}
          >
            Post requirement
          </Button>
        ) : null}
        <Button variant="outline" onClick={() => void query.refetch()}>
          Refresh
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        {board
          ? "Open sourcing requirements from registered buyers. Reply privately and send a quotation to introduce your offer."
          : "Manage your sourcing needs. Only open requirements are shared with sellers."}
      </p>
      {saved ? <p role="status">Requirement saved.</p> : null}
      {query.isError ? (
        <WorkspaceFormBanner title="Requirements could not load">
          {query.error.message}
        </WorkspaceFormBanner>
      ) : null}
      {replyError ? (
        <WorkspaceFormBanner title="Could not open conversation">{replyError}</WorkspaceFormBanner>
      ) : null}
      {opening ? <p role="status">Opening conversation…</p> : null}
      <RequirementList
        records={records}
        loading={query.isPending}
        onEdit={board ? undefined : setRecord}
        onViewReplies={board ? undefined : setResponses}
        onReply={board && !opening ? (record) => void reply(record.uuid) : undefined}
      />
    </section>
  );
}
