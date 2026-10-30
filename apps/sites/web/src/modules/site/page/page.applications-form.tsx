import { useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { PageField } from "./page.fields.js";
import type { PageContent } from "./page.types.js";
export function PageApplicationsForm({
  value,
  onChange
}: {
  value: PageContent;
  onChange: (value: PageContent) => void;
}) {
  const [selected, setSelected] = useState(0);
  const apps = value.applications ?? [];
  const item = apps[selected];
  function update(patch: Partial<NonNullable<PageContent["applications"]>[number]>) {
    onChange({
      ...value,
      applications: apps.map((app, i) => (i === selected ? { ...app, ...patch } : app))
    });
  }
  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        LogicX public application catalogue. These entries describe products and link to an enquiry.
        They do not grant app access.
      </p>
      <div className="flex gap-3">
        <WorkspaceSelect
          ariaLabel="Application to edit"
          value={String(selected)}
          options={apps.map((app, i) => ({ value: String(i), label: app.name }))}
          onValueChange={(v) => setSelected(Number(v))}
        />
        <Button
          variant="outline"
          disabled={apps.length >= 50}
          onClick={() => {
            const index = apps.length;
            onChange({
              ...value,
              applications: [
                ...apps,
                {
                  slug: `new-app-${index + 1}`,
                  name: "New application",
                  category: "Business",
                  summary: "Describe the application and its current scope.",
                  features: ["Describe a supported capability"]
                }
              ]
            });
            setSelected(index);
          }}
        >
          Add application
        </Button>
      </div>
      {item ? (
        <>
          <PageField
            label="Application name"
            value={item.name}
            onChange={(name) => update({ name })}
          />
          <PageField
            label="Application slug"
            value={item.slug}
            onChange={(slug) => update({ slug })}
          />
          <PageField
            label="Category"
            value={item.category}
            onChange={(category) => update({ category })}
          />
          <PageField
            label="Summary"
            multiline
            value={item.summary}
            onChange={(summary) => update({ summary })}
          />
          <PageField
            label="Capabilities, one per line"
            multiline
            value={item.features.join("\n")}
            onChange={(features) => update({ features: features.split("\n") })}
          />
          <Button
            variant="outline"
            className="justify-self-start"
            onClick={() => {
              onChange({ ...value, applications: apps.filter((_, i) => i !== selected) });
              setSelected(0);
            }}
          >
            Remove application from draft
          </Button>
        </>
      ) : (
        <p>No applications added yet.</p>
      )}
    </div>
  );
}
