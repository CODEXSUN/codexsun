import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, BellRing, MessageSquare, Settings2, Timer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Textarea } from "@codexsun/ui/components/textarea";
import { WorkspaceAnimatedTabs } from "@codexsun/ui/workspace/animated-tabs";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { formatDateTime } from "@codexsun/ui/workspace/utils";
import { useTaskOptions, taskQueryKey } from "./task.hooks";
import {
  addTaskComment,
  getTask,
  getTaskActivity,
  getTaskClosures,
  getTaskComments,
  getTaskJobs,
  requestTaskClosure,
  reviewTaskClosure,
  startTaskJob,
  stopTaskJob,
  updateTaskProperties
} from "./task.services";
import type { TaskRecord } from "./task.types";

type Tab = "comments" | "jobs" | "activity" | "details" | "closure";

export function TaskShow({
  id,
  onEdit,
  onEditActionChange
}: {
  id: string;
  onEdit: (row: TaskRecord) => void;
  onEditActionChange?: (action: { run: () => void } | null) => void;
}) {
  const client = useQueryClient();
  const [tab, setTab] = useState<Tab>("comments");
  const [comment, setComment] = useState("");
  const [reason, setReason] = useState("");
  const task = useQuery({
    queryKey: [...taskQueryKey, "detail", id],
    queryFn: () => getTask(Number(id)),
    enabled: Boolean(id)
  });
  const options = useTaskOptions();
  const key = Number(id);
  const comments = useQuery({
    queryKey: ["crm", "tasks", key, "comments"],
    queryFn: () => getTaskComments(key),
    enabled: Boolean(task.data)
  });
  const jobs = useQuery({
    queryKey: ["crm", "tasks", key, "jobs"],
    queryFn: () => getTaskJobs(key),
    enabled: Boolean(task.data)
  });
  const closures = useQuery({
    queryKey: ["crm", "tasks", key, "closures"],
    queryFn: () => getTaskClosures(key),
    enabled: Boolean(task.data)
  });
  const activity = useQuery({
    queryKey: ["crm", "tasks", key, "activity"],
    queryFn: () => getTaskActivity(key),
    enabled: Boolean(task.data)
  });
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: taskQueryKey }),
      client.invalidateQueries({ queryKey: [...taskQueryKey, "detail", id] }),
      client.invalidateQueries({ queryKey: ["crm", "tasks", key, "comments"] }),
      client.invalidateQueries({ queryKey: ["crm", "tasks", key, "jobs"] }),
      client.invalidateQueries({ queryKey: ["crm", "tasks", key, "closures"] }),
      client.invalidateQueries({ queryKey: ["crm", "tasks", key, "activity"] })
    ]);
  };
  const commentMutation = useMutation({
    mutationFn: () => addTaskComment(key, comment),
    onSuccess: async () => {
      setComment("");
      await refresh();
      toast.success("Comment added");
    },
    onError: (error) => toast.error("Unable to add comment", { description: error.message })
  });
  const jobMutation = useMutation({
    mutationFn: async (running: boolean) => {
      if (running) {
        await stopTaskJob(key);
        return null;
      }
      return startTaskJob(key);
    },
    onSuccess: refresh,
    onError: (error) => toast.error("Unable to update job", { description: error.message })
  });
  const closureMutation = useMutation({
    mutationFn: () => requestTaskClosure(key, reason),
    onSuccess: async () => {
      setReason("");
      await refresh();
      toast.success("Closure request sent");
    },
    onError: (error) => toast.error("Unable to request closure", { description: error.message })
  });
  const reviewMutation = useMutation({
    mutationFn: ({
      requestId,
      decision
    }: {
      requestId: number;
      decision: "approved" | "rejected";
    }) => reviewTaskClosure(requestId, decision),
    onSuccess: async () => {
      await refresh();
      toast.success("Closure request reviewed");
    },
    onError: (error) =>
      toast.error("Unable to review closure request", { description: error.message })
  });
  const propertyMutation = useMutation({
    mutationFn: (patch: Parameters<typeof updateTaskProperties>[1]) =>
      updateTaskProperties(key, patch),
    onSuccess: refresh,
    onError: (error) => toast.error("Unable to update task", { description: error.message })
  });
  const activeJob = useMemo(() => jobs.data?.find((item) => !item.stoppedAt), [jobs.data]);
  const row = task.data;
  const canEdit = Boolean(options.data?.capabilities.update);
  useEffect(() => {
    if (canEdit && row) onEditActionChange?.({ run: () => onEdit(row) });
    else onEditActionChange?.(null);
    return () => onEditActionChange?.(null);
  }, [canEdit, onEdit, onEditActionChange, row]);

  if (!row && !task.error)
    return (
      <WorkspacePage title="Task" className="!pt-0 lg:!pt-0">
        <p className="text-sm text-muted-foreground">Loading task…</p>
      </WorkspacePage>
    );
  if (!row)
    return (
      <WorkspacePage title="Task" className="!pt-0 lg:!pt-0">
        <p role="alert" className="text-sm text-destructive">
          {task.error?.message ?? "Task not found."}
        </p>
      </WorkspacePage>
    );
  const canRespond = Boolean(options.data?.capabilities.respond);
  const tabs = [
    {
      value: "comments",
      label: (
        <Label
          icon={<MessageSquare className="size-4" />}
          text="Comments"
          count={comments.data?.length ?? 0}
        />
      ),
      content: (
        <section className="space-y-3 rounded-md border bg-background p-4 shadow-sm">
          {comments.data?.map((item) => (
            <div key={item.uuid} className="border-b py-2 text-sm">
              <span className="font-medium">{item.createdBy}</span>
              <span className="text-muted-foreground"> · {formatDateTime(item.createdAt)}</span>
              <p className="mt-1 whitespace-pre-wrap">{item.body}</p>
            </div>
          ))}
          {comments.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading comments…</p>
          ) : null}
          {comments.error ? (
            <p role="alert" className="text-sm text-destructive">
              {comments.error.message}
            </p>
          ) : null}
          {canRespond ? (
            <>
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Write a response"
                rows={3}
              />
              <Button
                disabled={!comment.trim() || commentMutation.isPending}
                onClick={() => commentMutation.mutate()}
              >
                Add comment
              </Button>
            </>
          ) : null}
        </section>
      )
    },
    {
      value: "jobs",
      label: (
        <Label icon={<Timer className="size-4" />} text="Jobs" count={jobs.data?.length ?? 0} />
      ),
      content: (
        <section className="space-y-3 rounded-md border bg-background p-4 shadow-sm">
          {jobs.data?.map((item) => (
            <div key={item.uuid} className="border-b py-2 text-sm">
              {item.startedBy} · {formatDateTime(item.startedAt)}{" "}
              {item.stoppedAt ? `– ${formatDateTime(item.stoppedAt)}` : "· Running"}
            </div>
          ))}
          {options.data?.capabilities.work ? (
            <Button
              variant="outline"
              disabled={jobMutation.isPending || Boolean(activeJob && !activeJob.canStop)}
              onClick={() => jobMutation.mutate(Boolean(activeJob))}
            >
              {activeJob
                ? activeJob.canStop
                  ? "Stop job"
                  : `Running by ${activeJob.startedBy}`
                : "Start job"}
            </Button>
          ) : null}
        </section>
      )
    },
    {
      value: "activity",
      label: (
        <Label
          icon={<Activity className="size-4" />}
          text="Activity"
          count={activity.data?.length ?? 0}
        />
      ),
      content: (
        <section className="divide-y rounded-md border bg-background p-4 shadow-sm">
          {activity.data?.map((item) => (
            <div key={item.uuid} className="py-3 text-sm">
              <span className="font-medium">{item.actor}</span>
              <span className="text-muted-foreground">
                {" "}
                · {item.description} · {formatDateTime(item.createdAt)}
              </span>
            </div>
          ))}
          {activity.isLoading ? (
            <p className="py-3 text-sm text-muted-foreground">Loading activity…</p>
          ) : null}
        </section>
      )
    },
    {
      value: "details",
      label: <Label icon={<Settings2 className="size-4" />} text="Details" />,
      content: (
        <section className="grid gap-4 rounded-md border bg-background p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
          <Property
            label="List in"
            value={row.listInId}
            options={options.data?.lists ?? []}
            onChange={(listInId) => propertyMutation.mutate({ listInId })}
          />
          <Property
            label="Priority"
            value={row.priorityId}
            options={options.data?.priorities ?? []}
            onChange={(priorityId) => {
              if (priorityId) propertyMutation.mutate({ priorityId });
            }}
          />
          <Property
            label="Status"
            value={row.statusId}
            options={options.data?.statuses.filter((item) => item.code !== "closed") ?? []}
            onChange={(statusId) => {
              if (statusId) propertyMutation.mutate({ statusId });
            }}
          />
          <Info
            label="Created by"
            value={`${row.creatorName} · ${formatDateTime(row.createdAt)}`}
          />
          <Info label="Assigned to" value={row.assignedTo ?? "Unassigned"} />
          <Info label="Due date" value={formatDate(row.dueDate)} />
        </section>
      )
    },
    {
      value: "closure",
      label: (
        <Label
          icon={<BellRing className="size-4" />}
          text="Closure requests"
          count={closures.data?.length ?? 0}
        />
      ),
      content: (
        <section className="space-y-3 rounded-md border bg-background p-4 shadow-sm">
          {closures.data?.map((item) => (
            <div key={item.uuid} className="border-b py-3 text-sm">
              <p>{item.reason}</p>
              <p className="text-muted-foreground">
                {item.status} · {item.requestedBy} · {formatDateTime(item.createdAt)}
              </p>
              {item.status === "pending" && options.data?.capabilities.reviewClosure ? (
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      reviewMutation.mutate({ requestId: item.id, decision: "approved" })
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      reviewMutation.mutate({ requestId: item.id, decision: "rejected" })
                    }
                  >
                    Reject
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
          {closures.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading closure requests…</p>
          ) : null}
          {canRespond ? (
            <>
              <Textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Reason for requesting closure"
                rows={2}
              />
              <Button
                variant="outline"
                disabled={!reason.trim() || closureMutation.isPending || row.closurePending}
                onClick={() => closureMutation.mutate()}
              >
                Request closure
              </Button>
            </>
          ) : null}
        </section>
      )
    }
  ];
  return (
    <WorkspacePage title="" className="!pt-0 lg:!pt-0" technicalName="page.crm.tasks.show">
      <div className="rounded-md border bg-background p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">
              Task #{row.id} · {row.listIn ?? "No list"}
            </p>
            <h1 className="mt-1 text-xl font-semibold">{row.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Created by {row.creatorName} · Assigned to {row.assignedTo ?? "Unassigned"} ·{" "}
              {row.statusName} · {row.priorityName}
            </p>
          </div>
          <WorkspaceStatusBadge status={row.status} label={row.statusName} />
        </div>
        {row.description ? (
          <p className="mt-4 whitespace-pre-wrap text-sm">{row.description}</p>
        ) : null}
      </div>
      <WorkspaceAnimatedTabs
        value={tab}
        onValueChange={(value) => setTab(value as Tab)}
        tabs={tabs}
      />
    </WorkspacePage>
  );
}

function Label({ icon, text, count }: { icon: ReactNode; text: string; count?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      {icon}
      {text}
      {count !== undefined ? (
        <span className="rounded-full bg-muted px-1.5 text-xs">{count}</span>
      ) : null}
    </span>
  );
}
function formatDate(value: string | null) {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}-${month}-${year}`;
}
function Property({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: number | null;
  options: Array<{ id: number; name: string }>;
  onChange: (value: number | null) => void;
}) {
  return (
    <label className="grid gap-1 text-xs text-muted-foreground">
      {label}
      <WorkspaceLookup
        allowTextValue={false}
        clearable={label === "List in"}
        options={options.map((item) => ({ label: item.name, value: String(item.id) }))}
        value={value === null ? "" : String(value)}
        onValueChange={(next) => onChange(next ? Number(next) : null)}
      />
    </label>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}
