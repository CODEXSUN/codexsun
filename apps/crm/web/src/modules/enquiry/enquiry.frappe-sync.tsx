import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import type { EnquiryFrappeSyncEvent } from "./enquiry.types";

export function EnquiryFrappeSyncWorkspace({
  events,
  loading,
  error
}: {
  events: EnquiryFrappeSyncEvent[];
  loading: boolean;
  error: string;
}) {
  if (loading)
    return <p className="p-4 text-sm text-muted-foreground">Loading Frappe sync history…</p>;
  if (error)
    return (
      <p className="p-4 text-sm text-destructive" role="alert">
        {error}
      </p>
    );
  if (events.length === 0)
    return (
      <p className="p-4 text-sm text-muted-foreground">No Frappe sync events for this enquiry.</p>
    );
  return (
    <div className="space-y-3 p-3 sm:p-4">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Event</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Frappe record</th>
              <th className="px-3 py-2">Attempts</th>
              <th className="px-3 py-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr className="border-t align-top" key={event.id}>
                <td className="px-3 py-3">{event.eventType}</td>
                <td className="px-3 py-3">
                  <WorkspaceStatusBadge label={event.status} />
                </td>
                <td className="px-3 py-3">{event.remoteName || "—"}</td>
                <td className="px-3 py-3">{event.attempts}</td>
                <td className="px-3 py-3">{new Date(event.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {events.some((event) => event.lastError || (event.validation?.errors.length ?? 0) > 0) ? (
        <section className="space-y-2" aria-label="Frappe sync errors">
          <h3 className="text-sm font-semibold">Errors and validation</h3>
          {events
            .filter((event) => event.lastError || (event.validation?.errors.length ?? 0) > 0)
            .map((event) => (
              <article
                className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm"
                key={event.id}
              >
                <p className="font-medium">
                  {event.eventType} · {event.status}
                </p>
                {event.lastError ? (
                  <p className="mt-1 break-words text-destructive">{event.lastError}</p>
                ) : null}
                {event.validation?.errors.map((message, index) => (
                  <p className="mt-1 break-words text-destructive" key={`${event.id}-${index}`}>
                    {message}
                  </p>
                ))}
              </article>
            ))}
        </section>
      ) : null}
    </div>
  );
}
