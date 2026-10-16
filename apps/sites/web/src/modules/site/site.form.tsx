import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import { Input } from "@codexsun/ui/components/input";
import { LoaderCircleIcon, SparklesIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { SitePayload } from "./site.types.js";

export const emptySitePayload: SitePayload = {
  description: "",
  name: "",
  port: 7130,
  primaryDomain: "",
  slug: "",
  themeKey: "cms-default"
};

export function SiteForm({
  draft,
  isEdit = false,
  onCancel,
  onChange,
  onSave,
  saving
}: {
  draft: SitePayload;
  isEdit?: boolean;
  onCancel: () => void;
  onChange: (draft: SitePayload) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <Card
        className="w-full max-w-2xl bg-card"
        description="Site Studio configures the multi-client portfolio workspace, dev port, and publishing settings."
        title={isEdit ? "Edit client portfolio site" : "Add client portfolio site"}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <SiteField label="Portfolio / Client Name">
            <Input
              autoFocus
              placeholder="e.g. Acme Corp"
              value={draft.name}
              onChange={(event) => onChange({ ...draft, name: event.target.value })}
            />
          </SiteField>
          <SiteField label="URL Slug">
            <Input
              placeholder="e.g. acme"
              value={draft.slug}
              onChange={(event) => onChange({ ...draft, slug: event.target.value })}
            />
          </SiteField>
          <SiteField label="Primary Domain">
            <Input
              placeholder="e.g. acme.com or localhost:7130"
              value={draft.primaryDomain}
              onChange={(event) => onChange({ ...draft, primaryDomain: event.target.value })}
            />
          </SiteField>
          <SiteField label="Local Dev Port">
            <Input
              placeholder="e.g. 7130"
              type="number"
              value={draft.port ?? ""}
              onChange={(event) =>
                onChange({ ...draft, port: event.target.value ? Number(event.target.value) : undefined })
              }
            />
          </SiteField>
          <SiteField label="Theme Key">
            <Input
              placeholder="portfolio-codexsun | portfolio-logicx | portfolio-techmedia"
              value={draft.themeKey}
              onChange={(event) => onChange({ ...draft, themeKey: event.target.value })}
            />
          </SiteField>
          <SiteField label="Description">
            <Input
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
            disabled={saving || !draft.name.trim() || !draft.slug.trim()}
            icon={saving ? <LoaderCircleIcon className="animate-spin" /> : <SparklesIcon />}
            onClick={onSave}
          >
            {isEdit ? "Save Changes" : "Create Portfolio Site"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function SiteField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block space-y-2 text-sm font-medium text-foreground">
      <span>
        {label} <span className="text-destructive">*</span>
      </span>
      {children}
    </label>
  );
}
