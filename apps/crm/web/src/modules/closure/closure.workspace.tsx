import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { listClosureRequests, reviewClosureRequest } from "./closure.services";
import type { ClosureRequest, ClosureStatus } from "./closure.types";

const statuses: Array<{ id: ClosureStatus; label: string }> = [
  { id: "pending", label: "Waiting for approval" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" }
];

export function ClosureWorkspace({ onOpenEnquiry }: { onOpenEnquiry: (id: number) => void }) {
  const [status, setStatus] = useState<ClosureStatus>("pending");
  const [items, setItems] = useState<ClosureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const result = await listClosureRequests(status);
      setItems(result.items);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Closure requests could not load.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [status]);

  async function review(item: ClosureRequest, decision: "approve" | "reject") {
    setBusyId(item.id);
    setError("");
    try {
      await reviewClosureRequest(item.id, decision);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The request could not be reviewed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <WorkspacePage title="" technicalName="page.crm.closure.approvals" className="pt-0 lg:pt-0">
      <div className="space-y-4">
        <div
          className="flex flex-wrap items-center gap-2"
          role="tablist"
          aria-label="Closure request status"
        >
          {statuses.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant={status === item.id ? "default" : "outline"}
              role="tab"
              aria-selected={status === item.id}
              onClick={() => setStatus(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <div className="overflow-hidden rounded-lg border bg-background">
          <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] border-b bg-muted/60 text-xs font-semibold uppercase text-muted-foreground">
            <span className="flex items-center justify-center border-l-0 px-4 py-3 text-center">
              Enquiry
            </span>
            <span className="flex items-center justify-center border-l border-border/70 px-4 py-3 text-center">
              Contact
            </span>
            <span className="flex items-center justify-center border-l border-border/70 px-4 py-3 text-center">
              Requested by
            </span>
            <span className="flex items-center justify-center border-l border-border/70 px-4 py-3 text-center">
              Requested on
            </span>
            <span className="flex items-center justify-center border-l border-border/70 px-4 py-3 text-center">
              Decision
            </span>
          </div>
          {loading ? (
            <p className="p-5 text-sm text-muted-foreground">Loading closure requests…</p>
          ) : null}
          {!loading && items.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No {status} closure requests.</p>
          ) : null}
          {items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-center border-b text-sm last:border-b-0"
            >
              <div className="min-w-0 px-4 py-3">
                <button
                  className="cursor-pointer text-left font-medium text-primary hover:underline"
                  type="button"
                  onClick={() => onOpenEnquiry(item.enquiryId)}
                >
                  #{item.enquiryNo} · {item.title}
                </button>
              </div>
              <span className="border-l border-border/70 px-4 py-3">{item.contact || "—"}</span>
              <span className="truncate border-l border-border/70 px-4 py-3" title={item.requester}>
                {item.requester}
              </span>
              <span className="border-l border-border/70 px-4 py-3">
                {formatDateTime(item.requestedAt)}
              </span>
              {item.status === "pending" ? (
                <div className="flex gap-2 border-l border-border/70 px-4 py-2.5">
                  <Button
                    aria-label={`Approve closure for enquiry ${item.enquiryNo}`}
                    disabled={busyId === item.id}
                    size="sm"
                    type="button"
                    onClick={() => void review(item, "approve")}
                  >
                    <Check className="mr-1 size-4" /> Verify and close
                  </Button>
                  <Button
                    aria-label={`Reject closure for enquiry ${item.enquiryNo}`}
                    disabled={busyId === item.id}
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() => void review(item, "reject")}
                  >
                    <X className="mr-1 size-4" /> Reject
                  </Button>
                </div>
              ) : (
                <span
                  className="min-w-0 truncate border-l border-border/70 px-4 py-3 capitalize"
                  title={`${item.status}${item.reviewedBy ? ` · ${item.reviewedBy}` : ""}`}
                >
                  {item.status}
                  {item.reviewedBy ? ` · ${item.reviewedBy}` : ""}
                </span>
              )}
              {item.reviewNote ? (
                <span className="col-span-full border-t border-border/70 px-4 py-2 text-xs text-muted-foreground">
                  Review note: {item.reviewNote}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </WorkspacePage>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const datePart = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(date);
  return `${datePart} - ${timePart}`;
}
