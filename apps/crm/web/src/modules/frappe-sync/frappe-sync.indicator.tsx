import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, CloudUpload, LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { crmRequest } from "../../crm-request";
import { toast } from "sonner";

export type FrappeSyncStatus = "pending" | "processing" | "failed" | "synced" | "unlinked" | null;
type VerifyKind = "contacts" | "enquiries" | "call-logs";

type ExportJob = {
  status: string;
  progress: {
    results: Array<{
      id: number;
      outcome: "linked" | "matched" | "mismatch" | "new" | "blocked" | "exported";
    }>;
    failures: Array<{ id: number; message: string }>;
  } | null;
  errorMessage: string | null;
};

export function FrappeSyncIndicator({
  status,
  onVerify,
  unsupported = false
}: {
  status: FrappeSyncStatus;
  onVerify: () => Promise<FrappeSyncStatus>;
  unsupported?: boolean;
}) {
  const [checking, setChecking] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);
  useEffect(() => {
    setCurrentStatus(status);
  }, [status]);
  const Icon =
    currentStatus === "synced"
      ? CheckCircle2
      : currentStatus === "failed"
        ? CircleAlert
        : currentStatus === "processing"
          ? LoaderCircle
          : CloudUpload;
  const tone =
    currentStatus === "synced"
      ? "text-emerald-600"
      : currentStatus === "failed"
        ? "text-red-600"
        : "text-muted-foreground";
  const label = unsupported
    ? "Frappe sync is not supported for this record type"
    : currentStatus === "synced"
      ? "Confirmed in Frappe"
      : currentStatus === "failed"
        ? "Frappe sync or verification failed"
        : currentStatus === "processing"
          ? "Frappe sync is processing"
          : currentStatus === "unlinked"
            ? "No matching record was found in Frappe"
            : currentStatus === "pending"
              ? "Waiting for Frappe sync confirmation"
              : "Not verified with Frappe";

  async function verify() {
    if (checking || unsupported) return;
    setChecking(true);
    try {
      setCurrentStatus(await onVerify());
    } catch (error) {
      setCurrentStatus("failed");
      toast.error("Frappe verification failed", {
        description: error instanceof Error ? error.message : "The record could not be verified."
      });
    } finally {
      setChecking(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-1.5" onClick={(event) => event.stopPropagation()}>
      <Icon
        className={`size-4 ${tone} ${checking || currentStatus === "processing" ? "animate-spin" : ""}`}
        aria-label={label}
      />
      <span className="sr-only">{label}</span>
      <Button
        aria-label={unsupported ? label : `Verify ${label.toLowerCase()}`}
        className="h-7 px-2"
        disabled={checking || unsupported}
        onClick={() => void verify()}
        size="sm"
        title={unsupported ? label : "Verify with Frappe now"}
        type="button"
        variant="ghost"
      >
        {checking ? (
          <LoaderCircle className="size-3.5 animate-spin" />
        ) : (
          <RefreshCw className="size-3.5" />
        )}
        <span className="sr-only">Verify</span>
      </Button>
    </span>
  );
}

export async function verifyFrappeRecord(kind: VerifyKind, id: number): Promise<FrappeSyncStatus> {
  const queued = await crmRequest<{ jobId: number }>(`/frappe/export/${kind}`, {
    method: "POST",
    body: JSON.stringify({ ids: [id], mode: "verify" })
  });
  const deadline = Date.now() + 30_000;
  let latestStatus: FrappeSyncStatus = "pending";
  while (Date.now() < deadline) {
    const job = await crmRequest<ExportJob>(`/frappe/export/jobs/${queued.jobId}`);
    if (job.status === "failed") return "failed";
    latestStatus = job.status === "running" ? "processing" : "pending";
    if (job.status === "completed") {
      const result = job.progress?.results.find((item) => item.id === id);
      if (result && ["linked", "matched", "exported"].includes(result.outcome)) return "synced";
      if (result && ["mismatch", "blocked"].includes(result.outcome)) return "failed";
      if (result?.outcome === "new") return "unlinked";
      if (job.progress?.failures.some((failure) => failure.id === id)) return "failed";
      return "pending";
    }
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  return latestStatus;
}

export async function getFrappeRecordStatuses(
  kind: VerifyKind,
  ids: number[]
): Promise<Record<number, FrappeSyncStatus>> {
  if (!ids.length) return {};
  const response = await crmRequest<{
    items: Array<{ id: number; status: FrappeSyncStatus }>;
  }>(`/frappe/export/${kind}/status`, {
    method: "POST",
    body: JSON.stringify({ ids })
  });
  return Object.fromEntries(response.items.map((item) => [item.id, item.status]));
}
