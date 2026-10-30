import { useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { WorkspaceSwitchCard } from "@codexsun/ui/workspace/status";
import {
  WorkspaceFormActions,
  WorkspaceFormBanner,
  WorkspaceFormBody,
  WorkspaceFormField,
  WorkspaceFormGrid,
  WorkspaceFormSurface
} from "@codexsun/ui/workspace/upsert";
import { designationSchema } from "./designation.schema";
import type { DesignationInput, DesignationRecord } from "./designation.types";

export const designationFormId = "hrms-designation-form";

export function DesignationForm({
  designation,
  busy,
  error,
  onSave,
  onCancel
}: {
  designation: DesignationRecord | null;
  busy: boolean;
  error: string;
  onSave: (input: DesignationInput) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<DesignationInput>(() => ({
    name: designation?.name ?? "",
    description: designation?.description ?? "",
    status: designation?.status ?? "active"
  }));
  const [issues, setIssues] = useState<Record<string, string>>({});
  const set = <Key extends keyof DesignationInput>(key: Key, value: DesignationInput[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setIssues((current) => ({ ...current, [key]: "" }));
  };
  const shownError = Object.values(issues).find(Boolean) || error;
  return (
    <form
      id={designationFormId}
      className="min-w-0"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (busy) return;
        const parsed = designationSchema.safeParse(draft);
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
            <WorkspaceFormBanner title="Unable to save designation">
              {shownError}
            </WorkspaceFormBanner>
          )}
          <WorkspaceFormGrid>
            <WorkspaceFormField label="Designation name" required>
              <Input
                aria-label="Designation name"
                autoFocus
                aria-invalid={Boolean(issues.name)}
                className={issues.name ? "border-destructive" : ""}
                disabled={busy}
                maxLength={120}
                value={draft.name}
                onChange={(event) => set("name", event.target.value)}
              />
              {issues.name && <p className="text-xs text-destructive">{issues.name}</p>}
            </WorkspaceFormField>
            <WorkspaceFormField label="Description">
              <Textarea
                aria-label="Description"
                disabled={busy}
                maxLength={500}
                value={draft.description}
                onChange={(event) => set("description", event.target.value)}
              />
            </WorkspaceFormField>
          </WorkspaceFormGrid>
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
            {busy ? "Saving…" : designation ? "Update" : "Save"}
          </Button>
        </WorkspaceFormActions>
      </WorkspaceFormSurface>
    </form>
  );
}
