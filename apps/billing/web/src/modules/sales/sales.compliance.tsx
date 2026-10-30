import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@codexsun/ui/components/dialog";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { getTenantId, getCompanyId, getFinancialYearId } from "../../shared/api/tenant-context";
import { getSale, listSaleComplianceJobs, reconcileSaleCompliance } from "./sales.services";
import type { Sale } from "./sales.types";

export function SaleComplianceCancel({
  documentType,
  onCancel
}: {
  documentType: "einvoice" | "eway";
  onCancel: (reasonCode: number, remarks: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false),
    [reason, setReason] = useState(""),
    [remarks, setRemarks] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const options =
    documentType === "einvoice"
      ? [
          { label: "Duplicate", value: "1" },
          { label: "Data entry error", value: "2" },
          { label: "Order cancelled", value: "3" },
          { label: "Other", value: "4" }
        ]
      : [
          { label: "Duplicate", value: "1" },
          { label: "Order cancelled", value: "2" },
          { label: "Data entry error", value: "3" },
          { label: "Other", value: "4" }
        ];
  async function submit() {
    if (!reason || remarks.trim().length < 3) {
      setError("Choose a reason and enter at least 3 characters of remarks.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onCancel(Number(reason), remarks.trim());
      setOpen(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Cancellation failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Cancel {documentType === "einvoice" ? "IRN" : "E-way"}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Cancel {documentType === "einvoice" ? "IRN" : "E-way bill"} with WhiteBooks
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cancellation is subject to the provider time window. A cancelled IRN cannot be
            regenerated with the same invoice number.
          </p>
          {error ? (
            <WorkspaceFormBanner title="Compliance error" tone="error">
              {error}
            </WorkspaceFormBanner>
          ) : null}
          <label className="space-y-2 text-sm">
            Reason <span className="text-destructive">*</span>
            <WorkspaceSelect value={reason} onValueChange={setReason} options={options} />
          </label>
          <label className="space-y-2 text-sm">
            Remarks <span className="text-destructive">*</span>
            <Textarea
              maxLength={100}
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
            />
          </label>
          <DialogFooter>
            <Button variant="outline" type="button" disabled={busy} onClick={() => setOpen(false)}>
              Back
            </Button>
            <Button
              variant="destructive"
              type="button"
              disabled={busy}
              onClick={() => void submit()}
            >
              {busy ? "Waiting for provider..." : "Confirm cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
export function SaleComplianceRequests({
  invoiceId,
  onUpdated
}: {
  invoiceId: string | undefined;
  onUpdated: (invoice: Sale) => void;
}) {
  const query = useQuery({
    queryKey: [
      "billing",
      "sales",
      "compliance-jobs",
      getTenantId(),
      getCompanyId(),
      getFinancialYearId(),
      invoiceId
    ],
    queryFn: () => listSaleComplianceJobs(invoiceId!),
    enabled: Boolean(invoiceId),
    refetchInterval: 2000
  });
  const [billNo, setBillNo] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const lastApplied = useRef("");
  const completed = query.data?.find((job) => job.status === "completed");
  useEffect(() => {
    if (!invoiceId || !completed || lastApplied.current === completed.uuid) return;
    lastApplied.current = completed.uuid;
    void getSale(invoiceId)
      .then(onUpdated)
      .catch(() => {
        lastApplied.current = "";
      });
  }, [completed, invoiceId, onUpdated]);
  async function reconcile(uuid: string) {
    setBusy(true);
    setError("");
    try {
      await reconcileSaleCompliance(invoiceId!, uuid, billNo || undefined);
      await query.refetch();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Reconciliation failed.");
    } finally {
      setBusy(false);
    }
  }
  if (!invoiceId) return null;
  return (
    <section className="space-y-3 rounded-md border p-3">
      <h3 className="text-sm font-semibold">Compliance requests</h3>
      {query.isError ? (
        <WorkspaceFormBanner title="Compliance error" tone="error">
          Compliance requests could not be loaded.
        </WorkspaceFormBanner>
      ) : null}
      {error ? (
        <WorkspaceFormBanner title="Compliance error" tone="error">
          {error}
        </WorkspaceFormBanner>
      ) : null}
      {!query.data?.length ? (
        <p className="text-sm text-muted-foreground">No compliance requests yet.</p>
      ) : (
        query.data.map((job) => (
          <div className="space-y-1 border-b pb-2 text-sm last:border-0" key={job.uuid}>
            <div className="flex justify-between">
              <span>{job.action.replace(".", " / ")}</span>
              <strong>{job.status === "review" ? "Needs review" : job.status}</strong>
            </div>
            {job.error ? <p className="text-destructive">{job.error}</p> : null}
            {job.status === "review" ? (
              <div className="flex flex-wrap gap-2">
                <Input
                  placeholder="Provider E-way number, if standalone"
                  value={billNo}
                  onChange={(event) => setBillNo(event.target.value)}
                  maxLength={12}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void reconcile(job.uuid)}
                >
                  Check provider status
                </Button>
              </div>
            ) : null}
          </div>
        ))
      )}
    </section>
  );
}
