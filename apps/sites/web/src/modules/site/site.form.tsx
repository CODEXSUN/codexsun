import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import { Input } from "@codexsun/ui/components/input";
import { LoaderCircleIcon, SparklesIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { sitePayloadSchema } from "./site.schema.js";
import type { SitePayload } from "./site.types.js";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";

export const emptySitePayload: SitePayload = {
  description: "",
  name: "",
  port: 7130,
  primaryDomain: "",
  slug: "",
  themeKey: "portfolio-standard"
};

export function SiteForm({
  draft,
  error,
  isEdit = false,
  onCancel,
  onChange,
  onSave,
  saving
}: {
  draft: SitePayload;
  error?: string | undefined;
  isEdit?: boolean;
  onCancel: () => void;
  onChange: (draft: SitePayload) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [attempted, setAttempted] = useState(false);
  const result = sitePayloadSchema.safeParse(draft);
  function errorFor(field: string) {
    return attempted && !result.success
      ? result.error.issues.find((issue) => issue.path[0] === field)?.message
      : undefined;
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <Card
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-card"
        description="Site Studio configures the multi-client portfolio workspace, dev port, and publishing settings."
        title={isEdit ? "Edit client portfolio site" : "Add client portfolio site"}
      >
        {error || (attempted && !result.success) ? (
          <WorkspaceFormBanner title="Check client details">
            {error || "Complete the highlighted fields before saving."}
          </WorkspaceFormBanner>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <SiteField label="Portfolio / Client Name" error={errorFor("name")}>
            <Input
              aria-invalid={Boolean(errorFor("name"))}
              autoFocus
              placeholder="e.g. Acme Corp"
              value={draft.name}
              onChange={(event) => onChange({ ...draft, name: event.target.value })}
            />
          </SiteField>
          <SiteField label="URL Slug" error={errorFor("slug")}>
            <Input
              aria-invalid={Boolean(errorFor("slug"))}
              placeholder="e.g. acme"
              value={draft.slug}
              onChange={(event) => onChange({ ...draft, slug: event.target.value })}
            />
          </SiteField>
          <SiteField label="Primary Domain" error={errorFor("primaryDomain")}>
            <Input
              aria-invalid={Boolean(errorFor("primaryDomain"))}
              placeholder="e.g. acme.com"
              value={draft.primaryDomain}
              onChange={(event) => onChange({ ...draft, primaryDomain: event.target.value })}
            />
          </SiteField>
          <SiteField label="Local Dev Port" error={errorFor("port")}>
            <Input
              aria-invalid={Boolean(errorFor("port"))}
              placeholder="e.g. 7130"
              type="number"
              value={draft.port ?? ""}
              onChange={(event) =>
                onChange({
                  ...draft,
                  port: event.target.value ? Number(event.target.value) : undefined
                })
              }
            />
          </SiteField>
          <SiteField label="Theme Key" error={errorFor("themeKey")}>
            <Input
              aria-invalid={Boolean(errorFor("themeKey"))}
              placeholder="portfolio-standard"
              value={draft.themeKey}
              onChange={(event) => onChange({ ...draft, themeKey: event.target.value })}
            />
          </SiteField>
          <SiteField label="Description" error={errorFor("description")} required={false}>
            <Input
              aria-invalid={Boolean(errorFor("description"))}
              placeholder="Brief summary of client services or company portfolio"
              value={draft.description ?? ""}
              onChange={(event) => onChange({ ...draft, description: event.target.value })}
            />
          </SiteField>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            disabled={saving}
            icon={saving ? <LoaderCircleIcon className="animate-spin" /> : <SparklesIcon />}
            onClick={() => {
              setAttempted(true);
              if (result.success) onSave();
            }}
          >
            {isEdit ? "Save Changes" : "Create Portfolio Site"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function SiteField({
  children,
  label,
  error,
  required = true
}: {
  children: ReactNode;
  label: string;
  error?: string | undefined;
  required?: boolean;
}) {
  return (
    <label
      className={`block space-y-2 text-sm font-medium text-foreground ${error ? "[&_input]:border-destructive" : ""}`}
    >
      <span>
        {label} {required ? <span className="text-destructive">*</span> : null}
      </span>
      {children}
      {error ? <span className="block text-xs text-destructive">{error}</span> : null}
    </label>
  );
}
