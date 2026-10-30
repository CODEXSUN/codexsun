import { useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { WorkspaceDatePicker } from "@codexsun/ui/workspace/date-picker";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import { WorkspaceSwitchCard } from "@codexsun/ui/workspace/status";
import {
  WorkspaceFormActions,
  WorkspaceFormBanner,
  WorkspaceFormBody,
  WorkspaceFormField,
  WorkspaceFormGrid,
  WorkspaceFormSurface
} from "@codexsun/ui/workspace/upsert";
import { useEmployeeUsers } from "./employee.hooks";
import { employeeInputSchema } from "./employee.schema";
import type { EmployeeGateway } from "./employee.services";
import type { EmployeeInput, EmployeeRecord } from "./employee.types";

export const employeeFormId = "hrms-employee-form";

export function EmployeeForm({
  employee,
  gateway,
  busy,
  error,
  onSave,
  onCancel
}: {
  employee: EmployeeRecord | null;
  gateway: EmployeeGateway;
  busy: boolean;
  error: string;
  onSave: (input: EmployeeInput) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<EmployeeInput>(() => ({
    employeeCode: employee?.employeeCode ?? "",
    name: employee?.name ?? "",
    email: employee?.email ?? "",
    phone: employee?.phone ?? "",
    department: employee?.department ?? "",
    designation: employee?.designation ?? "",
    joiningDate: employee?.joiningDate ?? null,
    userId: employee?.userId ?? null,
    notes: employee?.notes ?? "",
    status: employee?.status ?? "active"
  }));
  const [issues, setIssues] = useState<Record<string, string>>({});
  const users = useEmployeeUsers(gateway);
  const set = <Key extends keyof EmployeeInput>(key: Key, value: EmployeeInput[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setIssues((current) => ({ ...current, [key]: "" }));
  };
  const options = (users.data ?? [])
    .filter((user) => user.status === "active" || user.id === draft.userId)
    .map((user) => ({ value: String(user.id), label: user.name, description: user.email }));
  const shownError = Object.values(issues).find(Boolean) || error || users.error?.message;
  const textField = (
    key: "employeeCode" | "name" | "email" | "phone" | "department" | "designation",
    label: string,
    required = false,
    maxLength = 180
  ) => (
    <WorkspaceFormField label={label} required={required}>
      <Input
        aria-label={label}
        autoFocus={key === "employeeCode"}
        aria-invalid={Boolean(issues[key])}
        className={issues[key] ? "border-destructive" : ""}
        disabled={busy}
        maxLength={maxLength}
        value={draft[key]}
        onChange={(event) => set(key, event.target.value)}
      />
      {issues[key] && <p className="text-xs text-destructive">{issues[key]}</p>}
    </WorkspaceFormField>
  );
  return (
    <form
      id={employeeFormId}
      className="min-w-0"
      noValidate
      onKeyDown={(event) => {
        if (event.ctrlKey && event.key.toLowerCase() === "s") {
          event.preventDefault();
          if (!busy) event.currentTarget.requestSubmit();
        }
      }}
      onSubmit={(event) => {
        event.preventDefault();
        if (busy) return;
        const parsed = employeeInputSchema.safeParse(draft);
        if (!parsed.success) {
          setIssues(
            Object.fromEntries(
              parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])
            )
          );
          return;
        }
        setIssues({});
        onSave(parsed.data);
      }}
    >
      <WorkspaceFormSurface>
        <WorkspaceFormBody className="space-y-5">
          {shownError && (
            <WorkspaceFormBanner title="Unable to save employee">{shownError}</WorkspaceFormBanner>
          )}
          <WorkspaceFormGrid>
            {textField("employeeCode", "Employee code", true, 40)}
            {textField("name", "Employee name", true)}
            {textField("email", "Email")}
            {textField("phone", "Phone", false, 30)}
            {textField("department", "Department", false, 120)}
            {textField("designation", "Designation", false, 120)}
            <WorkspaceFormField label="Joining date">
              <div className={issues.joiningDate ? "rounded-md border border-destructive" : ""}>
                <WorkspaceDatePicker
                  ariaLabel="Joining date"
                  value={draft.joiningDate ?? ""}
                  onValueChange={(value) => set("joiningDate", value || null)}
                />
              </div>
              {issues.joiningDate && (
                <p className="text-xs text-destructive">{issues.joiningDate}</p>
              )}
            </WorkspaceFormField>
            <WorkspaceFormField label="User account">
              <WorkspaceLookup
                allowTextValue={false}
                options={options}
                loading={users.isFetching}
                invalid={Boolean(issues.userId)}
                value={draft.userId === null ? "" : String(draft.userId)}
                onValueChange={(value) => set("userId", value ? Number(value) : null)}
                placeholder="Select user account (optional)"
                showAllOptionsOnFocus
              />
              {issues.userId && <p className="text-xs text-destructive">{issues.userId}</p>}
            </WorkspaceFormField>
          </WorkspaceFormGrid>
          <WorkspaceFormField label="Notes">
            <Textarea
              aria-label="Notes"
              value={draft.notes}
              maxLength={5000}
              disabled={busy}
              onChange={(event) => set("notes", event.target.value)}
            />
          </WorkspaceFormField>
          <WorkspaceSwitchCard
            fieldLabel="Status"
            checked={draft.status === "active"}
            onCheckedChange={(checked) => set("status", checked ? "active" : "inactive")}
          />
        </WorkspaceFormBody>
        <WorkspaceFormActions>
          <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : employee ? "Update" : "Save"}
          </Button>
        </WorkspaceFormActions>
      </WorkspaceFormSurface>
    </form>
  );
}
