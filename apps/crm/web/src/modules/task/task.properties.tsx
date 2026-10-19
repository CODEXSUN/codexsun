import { useEffect, useState, type ReactNode } from "react";
import { Check, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceDatePicker } from "@codexsun/ui/workspace/date-picker";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import { WorkspaceDetailTable, WorkspaceShowCard } from "@codexsun/ui/workspace/show";
import { CrmColorLabel, prioritySwatch, statusIcon } from "../../crm-colors";
import { formatDate as formatWorkspaceDate, formatDateTime } from "@codexsun/ui/workspace/utils";
import type { TaskOptions, TaskRecord } from "./task.types";

type TaskPropertyPatch = {
  listInId?: number | null;
  priorityId?: number;
  statusId?: number;
  assignedUserId?: number | null;
  dueDate?: string | null;
};
type EditableKey = keyof TaskPropertyPatch;

export function TaskPropertiesPanel({
  record,
  options,
  canEdit,
  loading,
  onChange
}: {
  record: TaskRecord;
  options: TaskOptions | undefined;
  canEdit: boolean;
  loading: boolean;
  onChange: (patch: TaskPropertyPatch) => Promise<void>;
}) {
  const [editing, setEditing] = useState<EditableKey | null>(null);
  const [draft, setDraft] = useState<TaskPropertyPatch>({});
  const statusOptions = (options?.statuses ?? []).filter((item) => item.code !== "closed");
  if (!statusOptions.some((item) => item.id === record.statusId)) {
    statusOptions.unshift({ id: record.statusId, name: record.statusName, code: record.status });
  }

  useEffect(() => {
    setEditing(null);
    setDraft({});
  }, [record.id]);

  function edit(key: EditableKey) {
    setEditing(key);
    setDraft({ [key]: record[key] } as TaskPropertyPatch);
  }

  async function save(key: EditableKey) {
    if (key === "statusId" && draft.statusId === record.statusId) {
      cancel();
      return;
    }
    if ((key === "priorityId" || key === "statusId") && !draft[key]) {
      toast.error(`Choose a ${key === "priorityId" ? "priority" : "status"}.`);
      return;
    }
    await onChange({ [key]: draft[key] } as TaskPropertyPatch);
    setEditing(null);
    setDraft({});
  }

  function cancel() {
    setEditing(null);
    setDraft({});
  }

  return (
    <div className="p-4">
      <WorkspaceShowCard className="border-t border-border/70">
        <EditableRow
          label="List in"
          value={record.listIn || "—"}
          canEdit={canEdit}
          editing={editing === "listInId"}
          loading={loading}
          onEdit={() => edit("listInId")}
          onCancel={cancel}
          onSave={() => save("listInId")}
        >
          <WorkspaceLookup
            allowTextValue={false}
            clearable
            showAllOptionsOnFocus
            options={(options?.lists ?? [])
              .filter((item) => item.status === undefined || item.status === "active")
              .map((item) => ({ label: item.name, value: String(item.id) }))}
            value={draft.listInId ? String(draft.listInId) : ""}
            onValueChange={(value) => setDraft({ listInId: value ? Number(value) : null })}
          />
        </EditableRow>
        <EditableRow
          label="Priority"
          value={
            <CrmColorLabel kind="priority" code={record.priority} label={record.priorityName} />
          }
          canEdit={canEdit}
          editing={editing === "priorityId"}
          loading={loading}
          onEdit={() => edit("priorityId")}
          onCancel={cancel}
          onSave={() => save("priorityId")}
        >
          <WorkspaceLookup
            allowTextValue={false}
            clearable={false}
            showAllOptionsOnFocus
            options={(options?.priorities ?? [])
              .filter((item) => item.status === undefined || item.status === "active")
              .map((item) => ({
                label: item.name,
                value: String(item.id),
                swatchClassName: prioritySwatch(item.code ?? "")
              }))}
            value={draft.priorityId ? String(draft.priorityId) : ""}
            onValueChange={(value) => {
              if (value) setDraft({ priorityId: Number(value) });
            }}
          />
        </EditableRow>
        <EditableRow
          label="Assigned to"
          value={record.assignedTo ?? "Unassigned"}
          canEdit={canEdit}
          editing={editing === "assignedUserId"}
          loading={loading}
          onEdit={() => edit("assignedUserId")}
          onCancel={cancel}
          onSave={() => save("assignedUserId")}
        >
          <WorkspaceLookup
            allowTextValue={false}
            clearable
            showAllOptionsOnFocus
            options={(options?.users ?? []).map((item) => ({
              label: item.name,
              value: String(item.id)
            }))}
            placeholder="Unassigned"
            value={draft.assignedUserId ? String(draft.assignedUserId) : ""}
            onValueChange={(value) => setDraft({ assignedUserId: value ? Number(value) : null })}
          />
        </EditableRow>
        <EditableRow
          label="Due date"
          value={record.dueDate ? formatWorkspaceDate(record.dueDate) : "—"}
          canEdit={canEdit}
          editing={editing === "dueDate"}
          loading={loading}
          onEdit={() => edit("dueDate")}
          onCancel={cancel}
          onSave={() => save("dueDate")}
        >
          <WorkspaceDatePicker
            ariaLabel="Task due date"
            placeholder="Select date"
            value={draft.dueDate ?? ""}
            onValueChange={(value) => setDraft({ dueDate: value || null })}
          />
        </EditableRow>
        <EditableRow
          label="Status"
          value={<CrmColorLabel kind="status" code={record.status} label={record.statusName} />}
          canEdit={
            canEdit && (record.status !== "closed" || Boolean(options?.capabilities.reopenClosed))
          }
          editing={editing === "statusId"}
          loading={loading}
          onEdit={() => edit("statusId")}
          onCancel={cancel}
          onSave={() => save("statusId")}
        >
          <WorkspaceLookup
            allowTextValue={false}
            clearable={false}
            showAllOptionsOnFocus
            options={statusOptions.map((item) => ({
              label: item.name,
              value: String(item.id),
              leadingIcon: statusIcon(item.code ?? "")
            }))}
            value={draft.statusId ? String(draft.statusId) : ""}
            onValueChange={(value) => {
              if (value) setDraft({ statusId: Number(value) });
            }}
          />
        </EditableRow>
        <WorkspaceDetailTable
          rows={[
            ["Created by", record.creatorName || record.createdBy],
            ["Updated", formatDateTime(record.updatedAt)]
          ]}
        />
      </WorkspaceShowCard>
    </div>
  );
}

function EditableRow({
  label,
  value,
  canEdit,
  editing,
  loading,
  children,
  onEdit,
  onCancel,
  onSave
}: {
  label: string;
  value: ReactNode;
  canEdit: boolean;
  editing: boolean;
  loading: boolean;
  children: ReactNode;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div
      className="border-b border-border/70 text-sm"
      style={{ display: "grid", gridTemplateColumns: "9rem minmax(0, 1fr)" }}
    >
      <div className="bg-muted/30 px-3 py-3 text-xs uppercase text-muted-foreground">{label}</div>
      <div className="flex min-w-0 items-center gap-1 px-2 py-1.5">
        {editing ? (
          <>
            <div className="min-w-0 flex-1">{children}</div>
            <Button
              aria-label={`Save ${label}`}
              className="size-8 shrink-0"
              disabled={loading}
              size="icon"
              type="button"
              onClick={onSave}
            >
              <Check className="size-4" />
            </Button>
            <Button
              aria-label={`Cancel editing ${label}`}
              className="size-8 shrink-0"
              disabled={loading}
              size="icon"
              type="button"
              variant="ghost"
              onClick={onCancel}
            >
              <X className="size-4" />
            </Button>
          </>
        ) : (
          <>
            <span className="min-w-0 flex-1 truncate font-medium">{value}</span>
            {canEdit ? (
              <Button
                aria-label={`Edit ${label}`}
                className="size-8 shrink-0"
                size="icon"
                type="button"
                variant="ghost"
                onClick={onEdit}
              >
                <Pencil className="size-3.5" />
              </Button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
