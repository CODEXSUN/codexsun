import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import type { EnquiryImportJob } from "./enquiry-sync.types";

export function EnquiryImportPanel({
  connected,
  workerEnabled,
  busy,
  job,
  starting,
  onStart
}: {
  connected: boolean;
  workerEnabled: boolean;
  busy: boolean;
  job: EnquiryImportJob | null | undefined;
  starting: boolean;
  onStart: () => void;
}) {
  const running = job?.status === "pending" || job?.status === "running";
  return (
    <Card className="space-y-3 p-4" role="status">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Batch import from Frappe</h2>
          <p className="text-xs text-muted-foreground">
            Frappe → local CRM. This bulk import runs in the background; selected row imports run
            immediately.
          </p>
        </div>
        <Button
          type="button"
          disabled={!connected || !workerEnabled || busy || starting || running}
          onClick={onStart}
        >
          {running ? "Import running…" : starting ? "Queueing…" : "Import all unlinked"}
        </Button>
      </div>
      {!connected ? (
        <p role="alert" className="text-xs text-amber-700">
          Verify and enable the Frappe connection before importing.
        </p>
      ) : null}
      {connected && !workerEnabled ? (
        <p role="alert" className="text-xs text-amber-700">
          Background worker is disabled. Import selected enquiries individually or enable the worker
          before starting a batch.
        </p>
      ) : null}
      {job ? (
        <>
          <p className="text-sm">
            Job #{job.jobId}: {job.status}.{" "}
            {job.progress
              ? `${job.progress.scanned} scanned, ${job.progress.created} imported, ${job.progress.skipped} already linked, ${job.progress.failed} failed.`
              : "Waiting for the worker."}
          </p>
          {job.errorMessage ? <p className="text-sm text-destructive">{job.errorMessage}</p> : null}
          {job.progress?.failures.slice(0, 20).map((failure) => (
            <p key={failure.name} className="text-xs text-destructive">
              {failure.name}: {failure.message}
            </p>
          ))}
          {(job.progress?.failures.length ?? 0) > 20 ? (
            <p className="text-xs text-muted-foreground">Showing the first 20 failures.</p>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}
