import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { WorkspaceTableEmptyState } from "@codexsun/ui/workspace/table";
import { formatDateTime } from "@codexsun/ui/workspace/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useWorkReports, workReportKey } from "./work-report.hooks";
import { createWorkReport } from "./work-report.services";
import type { WorkReportTarget } from "./work-report.types";

type ChargeAction = "charge" | "collection";

export function WorkChargesWorkspace({ target }: { target: WorkReportTarget }) {
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const history = useWorkReports(target, page, "charges");
  const [action, setAction] = useState<ChargeAction>("charge");
  const [amount, setAmount] = useState("");
  const [body, setBody] = useState("");
  const save = useMutation({
    mutationFn: () =>
      createWorkReport({
        ...target,
        action,
        body: body.trim(),
        amount: Number(amount),
        requestId: crypto.randomUUID(),
        latitude: null,
        longitude: null,
        accuracyMeters: null,
        capturedAt: null
      }),
    onSuccess: async () => {
      setAmount("");
      setBody("");
      setPage(1);
      await client.invalidateQueries({ queryKey: workReportKey(target) });
      toast.success(action === "charge" ? "Charge initiated" : "Collection recorded");
    },
    onError: (error) => toast.error("Could not save charge", { description: error.message })
  });
  const totals = history.data?.amounts;
  const charged = totals?.charges ?? 0;
  const collected = totals?.collections ?? 0;
  const outstanding = Math.max(0, charged - collected);

  return (
    <section className="space-y-4 bg-card p-4">
      {history.error ? (
        <p role="alert" className="text-sm text-destructive">
          {history.error.message}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3" aria-label="Charge totals">
        <AmountSummary label="Initiated charges" value={charged} />
        <AmountSummary label="Collected" value={collected} />
        <AmountSummary label="Outstanding" value={outstanding} />
      </div>
      <div className="space-y-3 rounded-md border border-border/70 p-3">
        <div className="flex flex-wrap gap-2" aria-label="Charge action">
          <Button
            type="button"
            variant={action === "charge" ? "default" : "outline"}
            aria-pressed={action === "charge"}
            onClick={() => setAction("charge")}
          >
            Initiate charge
          </Button>
          <Button
            type="button"
            variant={action === "collection" ? "default" : "outline"}
            aria-pressed={action === "collection"}
            disabled={outstanding <= 0}
            onClick={() => setAction("collection")}
          >
            Record collected charge
          </Button>
        </div>
        <form
          className="grid gap-3 sm:grid-cols-[minmax(10rem,0.45fr)_minmax(16rem,1fr)_auto] sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            if (Number(amount) <= 0 || !Number.isFinite(Number(amount))) {
              toast.error("Enter an amount greater than zero.");
              return;
            }
            if (action === "collection" && Number(amount) > outstanding) {
              toast.error(`Collection cannot exceed ${formatCurrency(outstanding)} outstanding.`);
              return;
            }
            save.mutate();
          }}
        >
          <label className="space-y-1 text-sm font-medium">
            <span>{action === "charge" ? "Charge amount" : "Collected amount"} (₹)</span>
            <Input
              type="number"
              min="0.01"
              max={action === "collection" ? outstanding : undefined}
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              disabled={save.isPending || (action === "collection" && outstanding <= 0)}
              required
            />
          </label>
          <label className="space-y-1 text-sm font-medium">
            <span>Details (optional)</span>
            <Textarea
              className="h-11 min-h-11 resize-none"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={10000}
              rows={1}
              disabled={save.isPending}
            />
          </label>
          <Button
            type="submit"
            disabled={save.isPending || (action === "collection" && outstanding <= 0)}
          >
            {save.isPending
              ? "Saving…"
              : action === "charge"
                ? "Initiate charge"
                : "Record collection"}
          </Button>
        </form>
      </div>
      <div>
        <p className="mb-3 text-xs text-muted-foreground">
          {history.data?.total ?? 0} {(history.data?.total ?? 0) === 1 ? "record" : "records"}
        </p>
        <div className="workspace-scroll overflow-x-auto rounded-md border border-border/70">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="w-12 px-3 py-2">#</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Details</th>
                <th className="px-3 py-2">By</th>
                <th className="px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {(history.data?.items ?? []).map((row, index) => (
                <tr key={row.uuid} className="border-t border-border/70 align-top">
                  <td className="px-3 py-2 text-muted-foreground">
                    {(page - 1) * 100 + index + 1}
                  </td>
                  <td className="px-3 py-2 font-medium">
                    {row.action === "charge" ? "Charge initiated" : "Collected"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-medium">
                    {formatCurrency(Number(row.amount ?? 0))}
                  </td>
                  <td className="min-w-48 px-3 py-2 whitespace-pre-wrap">{row.body || "—"}</td>
                  <td className="px-3 py-2">{row.created_by_name || row.created_by}</td>
                  <td className="whitespace-nowrap px-3 py-2">{formatDateTime(row.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!history.isLoading && (history.data?.items.length ?? 0) === 0 ? (
            <WorkspaceTableEmptyState>No charges have been recorded.</WorkspaceTableEmptyState>
          ) : null}
        </div>
        {(history.data?.total ?? 0) > 100 ? (
          <div className="mt-3 flex items-center justify-end gap-3 text-sm">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span>
              Page {page} of {Math.ceil((history.data?.total ?? 0) / 100)}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page * 100 >= (history.data?.total ?? 0)}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function AmountSummary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border/70 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{formatCurrency(value)}</p>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
}
