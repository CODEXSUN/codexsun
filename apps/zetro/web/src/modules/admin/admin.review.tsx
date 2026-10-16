import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  addZetroReviewNote,
  decideZetroApproval,
  getZetroReviewConversation,
  listZetroApprovals,
  listZetroGrantEvents,
  listZetroReviewConversations
} from "./admin.services";

export function ZetroConversationSection({ tenantId }: { tenantId: string }) {
  const client = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const conversations = useQuery({
    queryKey: ["zetro", "admin", tenantId, "conversations"],
    queryFn: () => listZetroReviewConversations(tenantId)
  });
  const detailKey = ["zetro", "admin", tenantId, "conversations", selectedId];
  const detail = useQuery({
    queryKey: detailKey,
    queryFn: () => getZetroReviewConversation(tenantId, selectedId!),
    enabled: selectedId !== null
  });
  const saveNote = useMutation({
    mutationFn: () => addZetroReviewNote(tenantId, selectedId!, note.trim()),
    onSuccess: () => {
      setNote("");
      void client.invalidateQueries({ queryKey: detailKey });
      toast.success("Review note saved");
    },
    onError: (error) => toast.error(error.message)
  });
  return (
    <section className="rounded-lg border bg-card p-4">
      <h2 className="text-lg font-semibold">Conversations and review</h2>
      {conversations.error ? <p role="alert">{conversations.error.message}</p> : null}
      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(15rem,1fr)_minmax(0,2fr)]">
        <div className="max-h-96 space-y-1 overflow-auto">
          {conversations.data?.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`block w-full rounded-md border px-3 py-2 text-left text-sm ${selectedId === item.id ? "bg-muted" : ""}`}
              onClick={() => setSelectedId(item.id)}
            >
              <span className="block font-medium">
                #{item.id} {item.title}
              </span>
              <span className="text-muted-foreground">{item.owner_email}</span>
            </button>
          ))}
          {conversations.data?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No conversations.</p>
          ) : null}
        </div>
        <div className="min-w-0 space-y-3">
          {detail.error ? <p role="alert">{detail.error.message}</p> : null}
          {detail.data ? (
            <>
              <div className="max-h-96 space-y-2 overflow-auto rounded-md border p-3">
                {detail.data.messages.map((message) => (
                  <p key={message.id} className="whitespace-pre-wrap break-words text-sm">
                    <strong>{message.role}:</strong> {message.content}
                  </p>
                ))}
              </div>
              <h3 className="font-medium">Tool audit</h3>
              {detail.data.events.map((event) => (
                <p key={event.id} className="break-words rounded-md border p-2 text-sm">
                  {event.capability_key} · {event.decision} · {event.created_at}
                  <br />
                  Request: {event.request_json}
                  <br />
                  {event.result_json ? `Result: ${event.result_json}` : ""}
                </p>
              ))}
              <h3 className="font-medium">Notes</h3>
              {detail.data.notes.map((item) => (
                <p key={item.id} className="rounded-md border p-2 text-sm">
                  {item.reviewer_email}: {item.note}
                </p>
              ))}
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (note.trim()) saveNote.mutate();
                }}
                className="flex gap-2"
              >
                <input
                  aria-label="Review note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={5000}
                  className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2"
                  placeholder="Add review note"
                />
                <button
                  type="submit"
                  disabled={!note.trim() || saveNote.isPending}
                  className="rounded-md border px-3 py-2"
                >
                  Save note
                </button>
              </form>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a conversation to inspect its messages, tool events, and notes.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export function ZetroApprovalSection({ tenantId }: { tenantId: string }) {
  const client = useQueryClient();
  const [decisionNotes, setDecisionNotes] = useState<Record<number, string>>({});
  const approvalsKey = ["zetro", "admin", tenantId, "approvals"];
  const approvals = useQuery({
    queryKey: approvalsKey,
    queryFn: () => listZetroApprovals(tenantId)
  });
  const decide = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "approved" | "rejected" }) =>
      decideZetroApproval(tenantId, id, status, decisionNotes[id]?.trim() ?? ""),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: approvalsKey });
      toast.success("Review decision saved. Capabilities remain unchanged.");
    },
    onError: (error) => toast.error(error.message)
  });

  return (
    <section className="rounded-lg border bg-card p-4">
      <h2 className="text-lg font-semibold">Approval requests</h2>
      <p className="text-sm text-muted-foreground">
        A review decision does not grant record access. Change grants separately.
      </p>
      {approvals.error ? <p role="alert">{approvals.error.message}</p> : null}
      <div className="mt-3 space-y-3">
        {approvals.data?.map((item) => (
          <article key={item.id} className="rounded-md border p-3 text-sm">
            <p className="font-medium">
              #{item.id} · {item.capability_key} · {item.status}
            </p>
            <p>
              {item.actor_email} · {item.created_at}
            </p>
            <p className="break-words text-muted-foreground">Request: {item.request_json}</p>
            {item.status === "pending" ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  aria-label={`Decision note for request ${item.id}`}
                  className="min-w-64 flex-1 rounded-md border bg-background px-3 py-2"
                  value={decisionNotes[item.id] ?? ""}
                  onChange={(event) =>
                    setDecisionNotes((notes) => ({ ...notes, [item.id]: event.target.value }))
                  }
                  placeholder="Reason for decision"
                  maxLength={5000}
                />
                <button
                  type="button"
                  className="rounded-md border px-3 py-2"
                  disabled={!decisionNotes[item.id]?.trim() || decide.isPending}
                  onClick={() => decide.mutate({ id: item.id, status: "approved" })}
                >
                  Approve review
                </button>
                <button
                  type="button"
                  className="rounded-md border px-3 py-2"
                  disabled={!decisionNotes[item.id]?.trim() || decide.isPending}
                  onClick={() => decide.mutate({ id: item.id, status: "rejected" })}
                >
                  Reject
                </button>
              </div>
            ) : (
              <p>Decision: {item.decision_note}</p>
            )}
          </article>
        ))}
        {approvals.data?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No approval requests.</p>
        ) : null}
      </div>
    </section>
  );
}

export function ZetroGrantEventsSection({ tenantId }: { tenantId: string }) {
  const grantEvents = useQuery({
    queryKey: ["zetro", "admin", tenantId, "grant-events"],
    queryFn: () => listZetroGrantEvents(tenantId)
  });

  return (
    <section className="rounded-lg border bg-card p-4">
      <h2 className="text-lg font-semibold">Grant changes</h2>
      {grantEvents.error ? <p role="alert">{grantEvents.error.message}</p> : null}
      <div className="mt-3 max-h-64 space-y-2 overflow-auto text-sm">
        {grantEvents.data?.map((event) => (
          <p key={event.id} className="rounded-md border p-2">
            {event.created_at} · {event.role_key} · {event.capability_key} · {event.status} ·{" "}
            {event.decided_by}
            <br />
            {event.reason}
          </p>
        ))}
        {grantEvents.data?.length === 0 ? (
          <p className="text-muted-foreground">No grant changes.</p>
        ) : null}
      </div>
    </section>
  );
}
