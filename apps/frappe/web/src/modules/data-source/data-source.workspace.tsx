import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import {
  frappeDataSourceKey,
  useFrappeConnectionSettings,
  useFrappeDataSource
} from "../connection/connection.hooks";
import { saveFrappeDataSource } from "../connection/connection.services";

export function FrappeDataSourceWorkspace() {
  const client = useQueryClient();
  const connection = useFrappeConnectionSettings();
  const source = useFrappeDataSource();
  const save = useMutation({
    mutationFn: saveFrappeDataSource,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: frappeDataSourceKey });
      await client.invalidateQueries({ queryKey: ["crm"] });
      toast.success("CRM enquiry source updated");
    },
    onError: (error) => toast.error("Unable to change source", { description: error.message })
  });
  const ready =
    connection.data?.configured &&
    connection.data.enabled &&
    connection.data.source === "tenant" &&
    connection.data.verificationStatus === "verified";
  return (
    <WorkspacePage
      title="App data sources"
      description="Choose where each app reads its data. CRM Enquiries is the first supported module."
      technicalName="page.frappe.data-sources"
    >
      <Card className="space-y-3 p-4">
        <h2 className="text-sm font-semibold">Frappe connection</h2>
        <p className="text-sm text-muted-foreground">
          {connection.isLoading
            ? "Checking connection…"
            : ready
              ? `Verified: ${connection.data?.baseUrl}`
              : "Save, enable and verify a Frappe connection to use live data."}
        </p>
        {connection.error ? (
          <p role="alert" className="text-sm text-destructive">
            {connection.error.message}
          </p>
        ) : null}
        <Button asChild variant="outline">
          <a href="/app/frappe/connection">Open connection settings</a>
        </Button>
      </Card>
      <Card className="space-y-4 p-4">
        <div>
          <h2 className="text-sm font-semibold">CRM Enquiries</h2>
          <p className="text-sm text-muted-foreground">
            Select the source used by CRM enquiries, overview and reports. Local records and Frappe
            documents remain separate.
          </p>
        </div>
        {source.error ? (
          <p role="alert" className="text-sm text-destructive">
            {source.error.message}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2" role="group" aria-label="CRM enquiry source">
          <Button
            type="button"
            variant={source.data?.provider === "local" ? "default" : "outline"}
            disabled={source.isLoading || save.isPending}
            onClick={() => save.mutate("local")}
          >
            Local
          </Button>
          <Button
            type="button"
            variant={source.data?.provider === "frappe" ? "default" : "outline"}
            disabled={source.isLoading || save.isPending || !ready}
            onClick={() => save.mutate("frappe")}
          >
            Frappe Live
          </Button>
        </div>
        {save.isPending ? <p className="text-sm text-muted-foreground">Saving source…</p> : null}
      </Card>
    </WorkspacePage>
  );
}
