import { BellRing, Timer } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Textarea } from "@codexsun/ui/components/textarea";
import { WorkspaceShowCard } from "@codexsun/ui/workspace/show";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTableEmptyState } from "@codexsun/ui/workspace/table";
import { formatDateTime } from "@codexsun/ui/workspace/utils";
import { ClosurePendingBadge } from "../closure";
import type { TaskClosure, TaskJob } from "./task.types";

export function TaskJobsPanel({
  jobs,
  loading,
  canWork,
  pending,
  running,
  onToggle
}: {
  jobs: TaskJob[];
  loading: boolean;
  canWork: boolean;
  pending: boolean;
  running: boolean;
  onToggle: () => void;
}) {
  return (
    <section className="bg-card p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Time recorded against this task.</p>
        {canWork ? (
          <Button disabled={pending} type="button" variant="secondary" onClick={onToggle}>
            <Timer className="size-4" /> {running ? "Stop job" : "Start job"}
          </Button>
        ) : null}
      </div>
      {loading ? <p className="text-sm text-muted-foreground">Loading jobs…</p> : null}
      <div className="workspace-scroll overflow-x-auto rounded-md border border-border/70">
        <table className="w-full min-w-[750px] text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              {["Job", "Employee", "Start", "Stop", "Status", "Action"].map((label) => (
                <th className="px-3 py-2" key={label}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr className="border-t border-border/70" key={job.uuid}>
                <td className="px-3 py-2 font-medium">#{job.id}</td>
                <td className="px-3 py-2">{job.startedBy}</td>
                <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(job.startedAt)}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {job.stoppedAt ? formatDateTime(job.stoppedAt) : "—"}
                </td>
                <td className="px-3 py-2">
                  <WorkspaceStatusBadge
                    label={job.stoppedAt ? "completed" : "running"}
                    tone={job.stoppedAt ? "success" : "warning"}
                  />
                </td>
                <td className="px-3 py-2">
                  {job.canStop && !job.stoppedAt ? (
                    <Button
                      size="sm"
                      type="button"
                      variant="ghost"
                      disabled={pending}
                      onClick={onToggle}
                    >
                      Stop
                    </Button>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && jobs.length === 0 ? (
          <WorkspaceTableEmptyState>No jobs have been recorded.</WorkspaceTableEmptyState>
        ) : null}
      </div>
    </section>
  );
}

export function TaskClosurePanel({
  requests,
  loading,
  canRespond,
  canReview,
  reason,
  pending,
  requestBlocked,
  onReasonChange,
  onRequest,
  onReview
}: {
  requests: TaskClosure[];
  loading: boolean;
  canRespond: boolean;
  canReview: boolean;
  reason: string;
  pending: boolean;
  requestBlocked: boolean;
  onReasonChange: (value: string) => void;
  onRequest: () => void;
  onReview: (requestId: number, decision: "approved" | "rejected") => void;
}) {
  return (
    <WorkspaceShowCard>
      <div className="space-y-3 p-4">
        {canRespond ? (
          <div className="space-y-2 border-t border-border/60 pt-3">
            <Textarea
              aria-label="Closure reason"
              maxLength={2000}
              placeholder="Reason for requesting closure"
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              A reviewer must verify the request before this task is closed.
            </p>
            <Button
              className="w-full"
              disabled={!reason.trim() || pending || requestBlocked}
              onClick={onRequest}
            >
              <BellRing className="mr-2 size-4" /> Request closure
            </Button>
          </div>
        ) : null}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading closure requests…</p>
        ) : null}
        {!loading && requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No closure request has been made.</p>
        ) : null}
        {requests.length ? (
          <div className="workspace-scroll overflow-x-auto rounded-md border border-border/70">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  {[
                    "#",
                    "Status",
                    "Reason",
                    "Requested by",
                    "Requested",
                    "Reviewed by",
                    "Review note"
                  ].map((label) => (
                    <th className="px-3 py-2" key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((item) => (
                  <tr className="border-t border-border/70 align-top" key={item.uuid}>
                    <td className="px-3 py-2 text-muted-foreground">#{item.id}</td>
                    <td className="px-3 py-2">
                      {item.status === "pending" ? (
                        <ClosurePendingBadge />
                      ) : (
                        <WorkspaceStatusBadge
                          label={item.status}
                          tone={item.status === "approved" ? "success" : "neutral"}
                        />
                      )}
                      {item.status === "pending" && canReview ? (
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            disabled={pending}
                            onClick={() => onReview(item.id, "approved")}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            onClick={() => onReview(item.id, "rejected")}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : null}
                    </td>
                    <td className="min-w-48 px-3 py-2">{item.reason || "—"}</td>
                    <td className="px-3 py-2">{item.requestedBy}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{item.reviewedBy || "—"}</td>
                    <td className="min-w-48 px-3 py-2 text-muted-foreground">
                      {item.reviewNote || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </WorkspaceShowCard>
  );
}
