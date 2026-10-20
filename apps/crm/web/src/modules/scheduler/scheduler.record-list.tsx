import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceTableEmptyState } from "@codexsun/ui/workspace/table";
import { formatDateTime } from "@codexsun/ui/workspace/utils";
import { toast } from "sonner";
import { listSchedules, updateScheduleStatus, type ScheduleSourceType } from "./scheduler.services";

export function useRecordSchedules(sourceType: ScheduleSourceType, sourceId: number) {
  return useQuery({
    queryKey: ["crm-schedules", "record", sourceType, sourceId],
    queryFn: () => listSchedules("schedules", { sourceType, sourceId }),
    enabled: Number.isInteger(sourceId) && sourceId > 0
  });
}

export function ScheduleRecordList({
  sourceType,
  sourceId
}: {
  sourceType: ScheduleSourceType;
  sourceId: number;
}) {
  const client = useQueryClient();
  const schedules = useRecordSchedules(sourceType, sourceId);
  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "completed" | "cancelled" }) =>
      updateScheduleStatus(id, status),
    onSuccess: async () => {
      toast.success("Schedule updated");
      await client.invalidateQueries({ queryKey: ["crm-schedules"] });
    },
    onError: (error: Error) =>
      toast.error("Could not update schedule", { description: error.message })
  });
  const refresh = () =>
    void client.invalidateQueries({ queryKey: ["crm-schedules", "record", sourceType, sourceId] });
  const rows = schedules.data ?? [];

  return (
    <section className="space-y-3 p-4">
      {schedules.isError ? (
        <div
          className="flex items-center justify-between gap-3 text-sm text-destructive"
          role="alert"
        >
          <span>{schedules.error.message}</span>
          <Button size="sm" variant="outline" onClick={() => void schedules.refetch()}>
            Retry
          </Button>
        </div>
      ) : null}
      <div className="workspace-scroll overflow-x-auto rounded-md border border-border/70">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              {["#", "Schedule", "Details", "Scheduled", "Reminder", "Status", "By", "Action"].map(
                (label) => (
                  <th key={label} className="px-3 py-2">
                    {label}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((item, index) => (
              <tr key={item.id} className="border-t border-border/70 align-top">
                <td className="px-3 py-2">{index + 1}</td>
                <td className="min-w-44 px-3 py-2 font-medium">{item.title}</td>
                <td className="max-w-sm whitespace-pre-wrap break-words px-3 py-2">
                  {item.details || "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-2">{formatDateTime(item.scheduledAt)}</td>
                <td className="whitespace-nowrap px-3 py-2">{formatDateTime(item.reminderAt)}</td>
                <td className="px-3 py-2 capitalize">{item.status}</td>
                <td className="px-3 py-2">{item.createdBy}</td>
                <td className="px-3 py-2">
                  {item.status === "scheduled" ? (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={changeStatus.isPending}
                        onClick={() => changeStatus.mutate({ id: item.id, status: "completed" })}
                      >
                        Done
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={changeStatus.isPending}
                        onClick={() => changeStatus.mutate({ id: item.id, status: "cancelled" })}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {schedules.isLoading ? (
          <WorkspaceTableEmptyState>Loading schedules…</WorkspaceTableEmptyState>
        ) : rows.length === 0 && !schedules.isError ? (
          <WorkspaceTableEmptyState>No schedules linked to this record.</WorkspaceTableEmptyState>
        ) : null}
      </div>
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={refresh} disabled={schedules.isFetching}>
          Refresh schedules
        </Button>
      </div>
    </section>
  );
}
