import { useState } from "react";
import { Save, X } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import {
  WorkspaceFormActions,
  WorkspaceFormBody,
  WorkspaceFormField,
  WorkspaceFormSurface,
  WorkspaceUpsertPage
} from "@codexsun/ui/workspace/upsert";
import type { Sop } from "./sop.services";

export function SopForm({
  record,
  saving,
  error,
  onSave,
  onCancel
}: {
  record: Sop | null;
  saving: boolean;
  error: string;
  onSave: (input: { code: string; title: string; purpose: string }) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState({
    code: record?.code ?? "",
    title: record?.title ?? "",
    purpose: record?.purpose ?? ""
  });
  return (
    <WorkspaceUpsertPage title={record ? "Edit SOP" : "New SOP"}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave(value);
        }}
      >
        <WorkspaceFormSurface>
          <WorkspaceFormBody className="space-y-5">
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <div className="grid gap-5 md:grid-cols-[2fr_1fr]">
              <WorkspaceFormField label="SOP name" required>
                <Input
                  id="sop-title"
                  aria-label="SOP name"
                  autoFocus
                  required
                  maxLength={191}
                  value={value.title}
                  onChange={(event) => setValue({ ...value, title: event.target.value })}
                />
              </WorkspaceFormField>
              <WorkspaceFormField label="Code" required>
                <Input
                  id="sop-code"
                  aria-label="Code"
                  required
                  maxLength={64}
                  value={value.code}
                  onChange={(event) => setValue({ ...value, code: event.target.value })}
                />
              </WorkspaceFormField>
            </div>
            <WorkspaceFormField label="Purpose" required>
              <Textarea
                id="sop-purpose"
                aria-label="Purpose"
                required
                className="min-h-28"
                value={value.purpose}
                onChange={(event) => setValue({ ...value, purpose: event.target.value })}
              />
            </WorkspaceFormField>
          </WorkspaceFormBody>
          <WorkspaceFormActions>
            <Button disabled={saving}>
              <Save className="size-4" />
              {saving ? "Saving..." : "Save SOP"}
            </Button>
            <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>
              <X className="size-4" />
              Cancel
            </Button>
          </WorkspaceFormActions>
        </WorkspaceFormSurface>
      </form>
    </WorkspaceUpsertPage>
  );
}
