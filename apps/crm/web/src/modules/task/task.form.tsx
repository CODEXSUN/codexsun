import { useQueryClient } from "@tanstack/react-query";
import {
  EnquiryCustomerFields,
  enquiryContactsQueryKey,
  useEnquiryContacts,
  useEnquiryMasterCreate
} from "../enquiry";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import { WorkspaceDateInputPicker } from "@codexsun/ui/workspace/date-input-picker";
import { prioritySwatch, statusIcon } from "../../crm-colors";
import { taskOptionsQueryKey } from "./task.hooks";
import {
  WorkspaceFormActions,
  WorkspaceFormBanner,
  WorkspaceFormBody,
  WorkspaceFormField,
  WorkspaceFormSurface,
  WorkspaceUpsertPage
} from "@codexsun/ui/workspace/upsert";
import { taskSchema } from "./task.schema";
import { TaskCreationContext } from "./task.creation-context";
import type { TaskLookup, TaskPayload, TaskRecord } from "./task.types";

export const newTaskFormId = "crm-new-task-form";

export function TaskForm({
  record,
  options,
  saving,
  error,
  onCancel,
  onSeeAll,
  onOpenTask,
  onSave
}: {
  record: TaskRecord | null;
  options: {
    lists: TaskLookup[];
    statuses: TaskLookup[];
    priorities: TaskLookup[];
    users: TaskLookup[];
  };
  saving: boolean;
  error: string;
  onCancel: () => void;
  onSeeAll: () => void;
  onOpenTask: (id: string) => void;
  onSave: (value: TaskPayload) => void;
}) {
  const [value, setValue] = useState<TaskPayload>(
    record
      ? {
          contactId: record.contactId,
          capturedName: null,
          capturedPhone: record.contactPhone,
          title: record.title,
          description: record.description,
          listInId: record.listInId,
          priorityId: record.priorityId,
          statusId: record.statusId,
          assignedUserId: record.assignedUserId,
          dueDate: record.dueDate
        }
      : {
          contactId: null,
          capturedName: null,
          capturedPhone: null,
          title: "",
          description: "",
          listInId: null,
          priorityId: options.priorities.find((x) => x.code === "normal")?.id ?? 0,
          statusId: options.statuses.find((x) => x.code === "new")?.id ?? 0,
          assignedUserId: null,
          dueDate: null
        }
  );
  const contacts = useEnquiryContacts();
  const client = useQueryClient();
  const createMaster = useEnquiryMasterCreate();
  const setCustomer = useCallback(
    (next: Partial<Pick<TaskPayload, "contactId" | "capturedName" | "capturedPhone">>) =>
      setValue((current) => ({ ...current, ...next })),
    []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isNew = record === null;
  useEffect(() => {
    if (!isNew) return;
    const handleSaveShortcut = (event: KeyboardEvent) => {
      if (
        !event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey ||
        event.repeat ||
        event.key.toLowerCase() !== "s" ||
        (event.target instanceof Element && event.target.closest('[role="dialog"]'))
      )
        return;
      event.preventDefault();
      (document.getElementById(newTaskFormId) as HTMLFormElement | null)?.requestSubmit();
    };
    document.addEventListener("keydown", handleSaveShortcut);
    return () => document.removeEventListener("keydown", handleSaveShortcut);
  }, [isNew]);
  const set = (key: keyof TaskPayload, next: TaskPayload[keyof TaskPayload]) => {
    setValue((current) => ({ ...current, [key]: next }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };
  return (
    <WorkspaceUpsertPage
      className={
        isNew
          ? "grid max-w-[92rem] items-start gap-4 space-y-0 pt-0 lg:grid-cols-[minmax(0,1fr)_18rem] lg:pt-0 2xl:grid-cols-[minmax(0,1fr)_20rem]"
          : "max-w-5xl"
      }
      title={isNew ? "" : "Update task"}
      {...(isNew ? {} : { description: "Update the task assignment, progress, and due date." })}
    >
      <form
        noValidate
        className="min-w-0"
        {...(isNew ? { id: newTaskFormId } : {})}
        onSubmit={(event) => {
          event.preventDefault();
          const parsed = taskSchema.safeParse(value);
          if (!parsed.success) {
            setErrors(
              Object.fromEntries(
                parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])
              )
            );
            return;
          }
          onSave(parsed.data);
        }}
      >
        <WorkspaceFormSurface>
          <WorkspaceFormBody>
            {Object.values(errors).some(Boolean) ? (
              <WorkspaceFormBanner title="Unable to save task">
                {Object.values(errors).find(Boolean)}
              </WorkspaceFormBanner>
            ) : null}
            {error ? (
              <WorkspaceFormBanner title="Unable to save task">{error}</WorkspaceFormBanner>
            ) : null}
            <div className="grid items-stretch gap-4 lg:grid-cols-2 lg:gap-8">
              <section
                className="min-w-0 rounded-md border border-border/80 p-4 sm:p-5"
                aria-label="Task content"
              >
                <div className="space-y-5">
                  <WorkspaceFormField label="Task title" required>
                    <Input
                      autoFocus={isNew}
                      value={value.title}
                      aria-invalid={Boolean(errors.title)}
                      onChange={(e) => set("title", e.target.value)}
                    />
                    {errors.title ? (
                      <small className="text-destructive">{errors.title}</small>
                    ) : null}
                  </WorkspaceFormField>
                  <WorkspaceFormField label="Task details">
                    <Textarea
                      className="min-h-52 resize-y"
                      rows={8}
                      value={value.description}
                      onChange={(e) => set("description", e.target.value)}
                    />
                  </WorkspaceFormField>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Contact (optional)</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setCustomer({ contactId: null, capturedName: null, capturedPhone: null })
                        }
                      >
                        Clear contact
                      </Button>
                    </div>
                    <EnquiryCustomerFields
                      customerRequired={false}
                      strictMobile
                      contacts={contacts.data ?? []}
                      loading={contacts.isLoading}
                      value={value}
                      error={errors.contactId ?? errors.capturedName ?? ""}
                      mobileError={errors.capturedPhone ?? ""}
                      onChange={setCustomer}
                      onContactSaved={async () => {
                        await client.invalidateQueries({ queryKey: enquiryContactsQueryKey });
                      }}
                    />
                  </div>
                </div>
              </section>
              <section
                className="min-w-0 rounded-md border border-border/80 p-4 sm:p-5"
                aria-label="Task assignment"
              >
                <div className="space-y-5">
                  <Lookup
                    label="List in"
                    value={value.listInId}
                    options={options.lists}
                    onChange={(v) => set("listInId", v)}
                  />
                  <Lookup
                    label="Assigned to"
                    value={value.assignedUserId}
                    options={options.users}
                    onChange={(v) => set("assignedUserId", v)}
                  />
                  <WorkspaceFormField label="Priority" required>
                    <WorkspaceLookup
                      allowTextValue={false}
                      clearable={false}
                      createMode="inline"
                      createLabel="Create Priority"
                      showCreateWhenEmpty
                      showAllOptionsOnFocus
                      options={options.priorities.map((item) => ({
                        label: item.name,
                        value: String(item.id),
                        swatchClassName: prioritySwatch(item.code ?? "")
                      }))}
                      value={value.priorityId ? String(value.priorityId) : ""}
                      invalid={Boolean(errors.priorityId)}
                      onCreate={async (name) => {
                        const option = await createMaster.priority(name);
                        await client.invalidateQueries({ queryKey: taskOptionsQueryKey });
                        return option;
                      }}
                      onTextChange={() => set("priorityId", 0)}
                      onValueChange={(selected) => set("priorityId", Number(selected) || 0)}
                    />
                    {errors.priorityId ? (
                      <small className="text-destructive">{errors.priorityId}</small>
                    ) : null}
                  </WorkspaceFormField>
                  <WorkspaceFormField label="Status" required>
                    <WorkspaceLookup
                      allowTextValue={false}
                      clearable={false}
                      createMode="inline"
                      createLabel="Create Status"
                      showCreateWhenEmpty
                      showAllOptionsOnFocus
                      options={options.statuses
                        .filter(
                          (item) => item.code !== "closed" || record?.status === "closed"
                        )
                        .map((item) => ({
                          label: item.name,
                          value: String(item.id),
                          leadingIcon: statusIcon(item.code ?? "")
                        }))}
                      value={value.statusId ? String(value.statusId) : ""}
                      invalid={Boolean(errors.statusId)}
                      onCreate={async (name) => {
                        const option = await createMaster.status(name);
                        await client.invalidateQueries({ queryKey: taskOptionsQueryKey });
                        return option;
                      }}
                      onTextChange={() => set("statusId", 0)}
                      onValueChange={(selected) => set("statusId", Number(selected) || 0)}
                    />
                    {errors.statusId ? (
                      <small className="text-destructive">{errors.statusId}</small>
                    ) : null}
                  </WorkspaceFormField>
                  <WorkspaceFormField label="Due date">
                    <WorkspaceDateInputPicker
                      value={value.dueDate ?? ""}
                      onValueChange={(date) => set("dueDate", date || null)}
                    />
                  </WorkspaceFormField>
                </div>
              </section>
            </div>
          </WorkspaceFormBody>
          {!isNew ? (
            <WorkspaceFormActions>
              <Button
                type="submit"
                disabled={saving || !options.statuses.length || !options.priorities.length}
              >
                {saving ? "Saving…" : "Update task"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
                Cancel
              </Button>
            </WorkspaceFormActions>
          ) : null}
        </WorkspaceFormSurface>
      </form>
      {isNew ? (
        <TaskCreationContext
          users={options.users}
          selectedUserId={value.assignedUserId}
          onSelectAssignee={(id) => set("assignedUserId", id)}
          onOpenTask={onOpenTask}
          onSeeAll={onSeeAll}
          onCancel={onCancel}
        />
      ) : null}
    </WorkspaceUpsertPage>
  );
}

function Lookup({
  label,
  value,
  options,
  onChange,
  error,
  required = false
}: {
  label: string;
  value: number | null;
  options: TaskLookup[];
  onChange: (value: number | null) => void;
  error?: string;
  required?: boolean;
}) {
  return (
    <WorkspaceFormField label={label} required={required}>
      <WorkspaceLookup
        allowTextValue={false}
        clearable={label === "List in" || label === "Assigned to"}
        options={options.map((item) => ({ label: item.name, value: String(item.id) }))}
        value={value === null ? "" : String(value)}
        placeholder={`Choose ${label.toLowerCase()}`}
        invalid={Boolean(error)}
        onValueChange={(next) => onChange(next ? Number(next) : null)}
      />
      {error ? <small className="text-destructive">{error}</small> : null}
    </WorkspaceFormField>
  );
}
