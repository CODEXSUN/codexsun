import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { buildShowingLabel, formatDateTime } from "@codexsun/ui/workspace/utils";
import { getSyncQueue } from "./enquiry-sync.services";
import type { SyncQueueStatus } from "./enquiry-sync.types";

const statuses: SyncQueueStatus[] = ["all", "pending", "processing", "retry", "failed", "synced"];
const pageSize = 25;
const queueKey = ["frappe", "enquiry-sync", "queue"] as const;

export function FrappeEnquirySyncWorkspace() {
  return <FrappeEnquirySyncQueueWorkspace />;
}

function FrappeEnquirySyncQueueWorkspace() {
  const [status, setStatus] = useState<SyncQueueStatus>("all");
  const [page, setPage] = useState(1);
  const queue = useQuery({
    queryKey: [...queueKey, status, page],
    queryFn: () => getSyncQueue(status, page, pageSize),
    refetchInterval: 5000
  });
  const total = queue.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <WorkspacePage
      title="Enquiry sync queue"
      description="Previous outbound events are retained for review. Sending to Frappe is stopped."
      technicalName="page.frappe.enquiry-sync"
      actions={
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => void queue.refetch()}>
            <RefreshCw className="size-4" /> Refresh
          </Button>
        </div>
      }
    >
      <div className="flex flex-wrap gap-2" aria-label="Sync status filter">
        {statuses.map((option) => (
          <Button
            key={option}
            type="button"
            size="sm"
            variant={status === option ? "default" : "outline"}
            onClick={() => {
              setStatus(option);
              setPage(1);
            }}
          >
            {option === "all" ? "All" : option[0]!.toUpperCase() + option.slice(1)}
          </Button>
        ))}
      </div>
      {queue.error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {queue.error.message}
        </p>
      ) : null}
      <div className="mt-4 overflow-x-auto rounded-md border bg-card shadow-sm">
        <table className="w-full min-w-[950px] text-left text-sm">
          <thead className="border-b bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Queued</th>
              <th className="px-4 py-3">Enquiry</th>
              <th className="px-4 py-3">Change</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Attempts</th>
              <th className="px-4 py-3">Frappe ID / error</th>
            </tr>
          </thead>
          <tbody>
            {(queue.data?.items ?? []).map((event) => (
              <tr key={event.id} className="border-b last:border-b-0">
                <td className="whitespace-nowrap px-4 py-3">{formatDateTime(event.createdAt)}</td>
                <td className="px-4 py-3">
                  <a
                    className="font-medium underline-offset-2 hover:underline"
                    href={`/app/crm/enquiries/${event.enquiryId}`}
                  >
                    #{event.enquiryNo} {event.title}
                  </a>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {event.eventType.replaceAll("-", " ")}
                </td>
                <td className="capitalize px-4 py-3">{event.status}</td>
                <td className="px-4 py-3 tabular-nums">{event.attempts}</td>
                <td className="max-w-80 break-words px-4 py-3 text-muted-foreground">
                  {event.lastError || event.remoteName || "—"}
                </td>
              </tr>
            ))}
            {!queue.isLoading && !queue.data?.items.length ? (
              <tr>
                <td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>
                  No sync events found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <WorkspacePagination
        className="mt-3"
        page={page}
        rowsPerPage={pageSize}
        rowsPerPageOptions={[pageSize]}
        showingLabel={buildShowingLabel(page, pageSize, total)}
        singularLabel="sync event"
        totalCount={total}
        totalPages={totalPages}
        onNextPage={() => setPage((value) => Math.min(totalPages, value + 1))}
        onPageChange={setPage}
        onPreviousPage={() => setPage((value) => Math.max(1, value - 1))}
      />
    </WorkspacePage>
  );
}
