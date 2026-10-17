import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkReportForm } from "./work-report.form";
import { WorkReportList } from "./work-report.list";
import { useWorkReports, workReportKey } from "./work-report.hooks";
import { createWorkReport } from "./work-report.services";
import { reportBodySchema } from "./work-report.schema";
import type { WorkReportPayload, WorkReportTarget } from "./work-report.types";
export function WorkReportWorkspace({
  enquiryId = null,
  taskId = null
}: {
  enquiryId?: number | null;
  taskId?: number | null;
}) {
  const target: WorkReportTarget = { enquiryId, taskId };
  const [body, setBody] = useState("");
  const retry = useRef<WorkReportPayload | null>(null);
  const client = useQueryClient();
  const reports = useWorkReports(target);
  const save = useMutation({
    mutationFn: async (action: WorkReportPayload["action"]) => {
      if (action === "report") reportBodySchema.parse(body);
      if (retry.current?.action !== action || retry.current.body !== body) retry.current = null;
      if (!retry.current) {
        const position =
          action === "report"
            ? null
            : await new Promise<GeolocationPosition>((resolve, reject) => {
                if (!navigator.geolocation) {
                  reject(new Error("Location is unavailable on this device."));
                  return;
                }
                navigator.geolocation.getCurrentPosition(
                  resolve,
                  (error) => reject(new Error(error.message)),
                  { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
                );
              });
        retry.current = {
          ...target,
          action,
          body,
          requestId: crypto.randomUUID(),
          latitude: position?.coords.latitude ?? null,
          longitude: position?.coords.longitude ?? null,
          accuracyMeters: position?.coords.accuracy ?? null,
          capturedAt: position ? new Date(position.timestamp).toISOString() : null
        };
      }
      return createWorkReport(retry.current);
    },
    onSuccess: async () => {
      retry.current = null;
      setBody("");
      await client.invalidateQueries({ queryKey: workReportKey(target) });
      toast.success("Action sent");
    },
    onError: (error) => toast.error("Could not send action", { description: error.message })
  });
  return (
    <section className="space-y-4 rounded-md border bg-background p-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => void reports.refetch()}>
          Refresh
        </Button>
      </div>
      {reports.error ? (
        <p role="alert" className="text-sm text-destructive">
          {reports.error.message}
        </p>
      ) : null}
      {reports.isLoading ? (
        <p>Loading actions…</p>
      ) : (
        <>
          <WorkReportForm
            body={body}
            onChange={setBody}
            onSubmit={(action) => save.mutate(action)}
            pending={save.isPending}
          />
          <WorkReportList items={reports.data ?? []} />
        </>
      )}
    </section>
  );
}
