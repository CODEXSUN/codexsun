import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BellRing, Check, CheckCircle2, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Textarea } from "@codexsun/ui/components/textarea";
import { formatDateTime } from "@codexsun/ui/workspace";
import { WorkspaceShowCard } from "@codexsun/ui/workspace/show";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { requestEnquiryClosure, reviewClosureRequest } from "./closure.services";
import { enquiryClosureQueryKey, useEnquiryClosureState } from "./closure.hooks";
import { ClosurePendingBadge } from "./closure.pending-badge";
import type { ClosureRequest } from "./closure.types";

export function EnquiryClosureCard({
  enquiryId,
  enquiryStatus,
  onChanged
}: {
  enquiryId: string;
  enquiryStatus: string;
  onChanged: () => Promise<unknown>;
}) {
  const client = useQueryClient();
  const [note, setNote] = useState("");
  const request = useEnquiryClosureState(enquiryId);
  const submit = useMutation({
    mutationFn: () => requestEnquiryClosure(enquiryId, note.trim()),
    onSuccess: async (created) => {
      client.setQueryData(enquiryClosureQueryKey(enquiryId), { ...request.data, item: created });
      setNote("");
      await onChanged();
      toast.success("Closure request sent for review");
    },
    onError: (error) => toast.error("Unable to request closure", { description: error.message })
  });
  const review = useMutation({
    mutationFn: ({ id, decision }: { id: number; decision: "approve" | "reject" }) =>
      reviewClosureRequest(id, decision, note.trim()),
    onSuccess: async (updated) => {
      client.setQueryData(enquiryClosureQueryKey(enquiryId), { ...request.data, item: updated });
      setNote("");
      await onChanged();
      toast.success(
        updated.status === "approved" ? "Enquiry verified and closed" : "Closure request rejected"
      );
    },
    onError: (error) => toast.error("Unable to review closure", { description: error.message })
  });
  const latest = request.data?.item;
  const terminal = ["closed", "won", "lost"].includes(enquiryStatus);

  return (
    <WorkspaceShowCard title="Closure approvals">
      <div className="space-y-3 p-4">
        {request.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" /> Loading closure status…
          </div>
        ) : request.error ? (
          <div className="space-y-2" role="alert">
            <p className="text-sm text-destructive">{request.error.message}</p>
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={() => void request.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : latest ? (
          <ClosureRequestSummary request={latest} />
        ) : terminal ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-emerald-600" /> This enquiry is {enquiryStatus}.
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No closure request has been made.</p>
        )}

        {latest?.status === "pending" && request.data?.canReview ? (
          <div className="space-y-3 border-t border-border/60 pt-3">
            <Textarea
              aria-label="Closure review note"
              maxLength={2000}
              placeholder="Review note (optional)"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                disabled={review.isPending}
                onClick={() => review.mutate({ id: latest.id, decision: "approve" })}
              >
                <Check className="size-4" /> Verify and close
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={review.isPending}
                onClick={() => review.mutate({ id: latest.id, decision: "reject" })}
              >
                <X className="size-4" /> Reject
              </Button>
            </div>
          </div>
        ) : null}
        {review.error ? (
          <p role="alert" className="text-sm text-destructive">
            {review.error.message}
          </p>
        ) : null}
        {!terminal && latest?.status !== "pending" && !request.isError ? (
          <div className="space-y-2 border-t border-border/60 pt-3">
            <Textarea
              aria-label="Closure reason"
              maxLength={2000}
              placeholder="Closure reason (optional)"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              A reviewer must verify the request before this enquiry is closed.
            </p>
            <Button
              className="w-full"
              disabled={submit.isPending || request.isLoading}
              type="button"
              onClick={() => submit.mutate()}
            >
              <BellRing className="mr-2 size-4" />
              {submit.isPending ? "Sending request…" : "Request closure"}
            </Button>
          </div>
        ) : null}
      </div>
    </WorkspaceShowCard>
  );
}

function ClosureRequestSummary({ request }: { request: ClosureRequest }) {
  const pending = request.status === "pending";
  return (
    <div className="space-y-2">
      {pending ? (
        <ClosurePendingBadge />
      ) : (
        <WorkspaceStatusBadge
          label={request.status}
          tone={request.status === "approved" ? "success" : "neutral"}
        />
      )}
      <p className="text-sm">
        Requested by <span className="font-medium">{request.requester}</span>
      </p>
      <p className="text-xs text-muted-foreground">{formatDateTime(request.requestedAt)}</p>
      {request.reviewedBy ? (
        <p className="text-sm text-muted-foreground">
          Reviewed by {request.reviewedBy}
          {request.reviewedAt ? ` · ${formatDateTime(request.reviewedAt)}` : ""}
        </p>
      ) : null}
      {request.reviewNote ? (
        <p className="rounded-md bg-muted/40 p-2 text-sm">Review note: {request.reviewNote}</p>
      ) : null}
    </div>
  );
}
