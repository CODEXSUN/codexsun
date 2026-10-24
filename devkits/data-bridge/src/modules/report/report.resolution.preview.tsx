import { useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Checkbox } from "@codexsun/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@codexsun/ui/components/dialog";
import { prepareConflictCorrection, commitConflictCorrection } from "./report.services.js";
import type { ConflictResolution } from "./report.types.js";

export function ConflictCorrectionPreview({
  runId,
  table,
  sourceId
}: {
  runId: string;
  table: string;
  sourceId: number;
}) {
  const [plan, setPlan] = useState<ConflictResolution | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function prepare() {
    setBusy(true);
    setError("");
    setConfirmed(false);
    try {
      setPlan(await prepareConflictCorrection(runId, table, sourceId));
      setOpen(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to prepare correction.");
    } finally {
      setBusy(false);
    }
  }
  async function commit() {
    if (!plan || !confirmed) return;
    setBusy(true);
    setError("");
    try {
      setPlan(await commitConflictCorrection(runId, plan.id, plan.fingerprint));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Correction was not saved.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-2 space-y-2">
      <Button size="sm" variant="outline" onClick={() => void prepare()} disabled={busy}>
        Prepare correction
      </Button>
      {error && !open ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>
              Verify correction · {table} · source {sourceId}
            </DialogTitle>
            <DialogDescription>
              Parent values resolve to existing target records. Target identity and creation
              metadata are preserved.
            </DialogDescription>
          </DialogHeader>
          {plan ? (
            <>
              <div className="grid gap-3 lg:grid-cols-3">
                {[
                  { title: "Source collection", data: plan.collection },
                  { title: `Current target · ID ${plan.targetId}`, data: plan.before },
                  { title: "Prepared target data", data: plan.prepared }
                ].map((item) => (
                  <section key={item.title} className="min-w-0 rounded border p-3">
                    <h3 className="mb-2 text-sm font-semibold">{item.title}</h3>
                    <pre className="whitespace-pre-wrap break-all text-xs">
                      {JSON.stringify(item.data, null, 2)}
                    </pre>
                  </section>
                ))}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted">
                    <tr>
                      {[
                        "Field",
                        "Parent table",
                        "Source value",
                        "Source ID",
                        "Target value",
                        "Target ID"
                      ].map((label) => (
                        <th key={label} className="p-2">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {plan.references.map((reference) => (
                      <tr key={reference.field} className="border-b">
                        <td className="p-2">{reference.field}</td>
                        <td className="p-2">{reference.parentTable}</td>
                        <td className="p-2">{JSON.stringify(reference.sourceValue)}</td>
                        <td className="p-2">{reference.sourceId}</td>
                        <td className="p-2">{JSON.stringify(reference.targetValue)}</td>
                        <td className="p-2">{reference.targetId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm">
                Fields to change: <strong>{plan.changes.join(", ")}</strong>
              </p>
              {plan.status === "committed" ? (
                <p role="status" className="text-sm text-emerald-700">
                  Saved and verified. Run a fresh Core Masters audit to refresh the report.
                </p>
              ) : (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={confirmed}
                    onCheckedChange={(value) => setConfirmed(value === true)}
                  />
                  I verified the parent values and approve these target field changes.
                </label>
              )}
            </>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button
              disabled={!confirmed || busy || plan?.status === "committed"}
              onClick={() => void commit()}
            >
              Commit correction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
