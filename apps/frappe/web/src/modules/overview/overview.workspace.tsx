import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@codexsun/ui/components/dialog";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { useFrappeConnection, useFrappeOverview } from "./overview.hooks";
import { completeFrappeImport, verifyFrappeConnection } from "./overview.services";

export function FrappeOverviewWorkspace() {
  const [verifiedUser, setVerifiedUser] = useState<string | null>(null);
  const [confirmCutover, setConfirmCutover] = useState(false);
  const client = useQueryClient();
  const connection = useFrappeConnection();
  const overview = useFrappeOverview(1, 1, "");
  const verify = useMutation({
    mutationFn: verifyFrappeConnection,
    onSuccess: (result) => {
      setVerifiedUser(result.user);
      toast.success("Frappe connection verified");
    },
    onError: (error) => toast.error("Connection check failed", { description: error.message })
  });
  const cutover = useMutation({
    mutationFn: completeFrappeImport,
    onSuccess: async () => {
      setConfirmCutover(false);
      await client.invalidateQueries({ queryKey: ["frappe"] });
      toast.success("Frappe import finished. CRM now uses local records only.");
    },
    onError: (error) => toast.error("Could not finish import", { description: error.message })
  });
  const configured = connection.data?.configured && connection.data.enabled;
  const counts = overview.data?.counts;

  return (
    <WorkspacePage
      title="Frappe"
      description="Import Frappe records into local CRM, then finish the connection."
      technicalName="page.frappe.overview"
      actions={
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void connection.refetch();
            void overview.refetch();
          }}
          disabled={connection.isFetching || overview.isFetching}
        >
          <RefreshCw className="size-4" /> Refresh
        </Button>
      }
    >
      <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Connection</h2>
          <p className="text-sm text-muted-foreground">
            {connection.isLoading
              ? "Checking configuration…"
              : !connection.data?.configured
                ? "Set up Application connection from the Frappe sidebar."
                : connection.data.importCompletedAt
                  ? "Import complete. CRM now uses local records only."
                  : !connection.data.enabled
                    ? "Frappe connection is disabled."
                    : verifiedUser
                      ? `Verified as ${verifiedUser}`
                      : "Configured. Verify before syncing records."}
          </p>
          {connection.data?.baseUrl ? (
            <p className="truncate text-xs text-muted-foreground">{connection.data.baseUrl}</p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={!configured || verify.isPending || !!connection.data?.importCompletedAt}
          onClick={() => verify.mutate()}
        >
          {verify.isPending ? "Verifying…" : "Verify connection"}
        </Button>
      </Card>
      {connection.error || overview.error ? (
        <p role="alert" className="text-sm text-destructive">
          {connection.error?.message ?? overview.error?.message}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <CountCard label="Local enquiries" value={counts?.total} />
        <CountCard label="Linked to Frappe" value={counts?.synced} />
        <CountCard label="Local only" value={counts?.pending} />
      </div>
      <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div>
          <h2 className="text-sm font-semibold">Finish initial import</h2>
          <p className="text-xs text-muted-foreground">
            After reviewing contacts, enquiries, activities and call logs, stop all Frappe imports
            for this tenant.
          </p>
        </div>
        <Button
          disabled={!!connection.data?.importCompletedAt || cutover.isPending}
          onClick={() => setConfirmCutover(true)}
        >
          {connection.data?.importCompletedAt ? "Import complete" : "Use local CRM only"}
        </Button>
      </Card>
      <Dialog open={confirmCutover} onOpenChange={setConfirmCutover}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finish Frappe import?</DialogTitle>
            <DialogDescription>
              This stops Frappe imports and disables this tenant's Frappe connection. Continue
              working with local CRM records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCutover(false)}>
              Cancel
            </Button>
            <Button disabled={cutover.isPending} onClick={() => cutover.mutate()}>
              {cutover.isPending ? "Finishing…" : "Finish import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WorkspacePage>
  );
}

function CountCard({ label, value }: { label: string; value: number | undefined }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value ?? "—"}</p>
    </Card>
  );
}
