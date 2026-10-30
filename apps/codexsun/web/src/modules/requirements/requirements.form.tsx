import { useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import {
  WorkspaceSelect,
  WorkspaceFormSurface,
  WorkspaceFormBody,
  WorkspaceFormActions,
  WorkspaceFormField
} from "@codexsun/ui/workspace";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { requirementDraftSchema } from "./requirements.schema";
import { createRequirementClientKey } from "./requirements.services";
import type {
  RequirementDraftInput,
  RequirementOrigin,
  RequirementRecord
} from "./requirements.types";

export function RequirementsForm({
  record,
  origin,
  busy,
  onSubmit,
  onCancel
}: {
  record?: RequirementRecord;
  origin: RequirementOrigin;
  busy: boolean;
  onSubmit: (input: RequirementDraftInput) => void;
  onCancel?: () => void;
}) {
  const [input, setInput] = useState<RequirementDraftInput>(() => ({
    clientKey: createRequirementClientKey(),
    title: record?.title ?? "",
    description: record?.description ?? "",
    priority: record?.priority ?? "normal",
    origin
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  return (
    <WorkspaceFormSurface>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const result = requirementDraftSchema.safeParse(input);
          if (!result.success) {
            setErrors(
              Object.fromEntries(
                result.error.issues.map((issue) => [String(issue.path[0]), issue.message])
              )
            );
            return;
          }
          setErrors({});
          onSubmit(result.data);
        }}
      >
        <WorkspaceFormBody>
          {Object.keys(errors).length > 0 && (
            <WorkspaceFormBanner title="Check your request">
              Complete the highlighted fields.
            </WorkspaceFormBanner>
          )}
          <div className="space-y-4">
            <WorkspaceFormField label="What would you like to get done?" required>
              <Input
                value={input.title}
                maxLength={200}
                disabled={busy}
                aria-invalid={Boolean(errors.title)}
                className={errors.title ? "border-destructive" : ""}
                onChange={(e) => setInput({ ...input, title: e.target.value })}
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            </WorkspaceFormField>
            <WorkspaceFormField label="Idea or requirement" required>
              <Textarea
                rows={6}
                value={input.description}
                maxLength={20000}
                disabled={busy}
                aria-invalid={Boolean(errors.description)}
                className={errors.description ? "border-destructive" : ""}
                onChange={(e) => setInput({ ...input, description: e.target.value })}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description}</p>
              )}
            </WorkspaceFormField>
            <WorkspaceFormField label="Priority" required>
              <WorkspaceSelect
                value={input.priority}
                disabled={busy}
                ariaLabel="Priority"
                options={[
                  { value: "low", label: "Low" },
                  { value: "normal", label: "Normal" },
                  { value: "high", label: "High" },
                  { value: "urgent", label: "Urgent" }
                ]}
                onValueChange={(value) =>
                  setInput({
                    ...input,
                    priority: requirementDraftSchema.shape.priority.parse(value)
                  })
                }
              />
            </WorkspaceFormField>
          </div>
        </WorkspaceFormBody>
        <WorkspaceFormActions>
          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : record ? "Update" : "Save"}
            </Button>
          </div>
        </WorkspaceFormActions>
      </form>
    </WorkspaceFormSurface>
  );
}
