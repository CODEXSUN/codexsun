import { ArrowRightIcon, DatabaseIcon, ClipboardCheckIcon } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { WorkspacePage } from "@codexsun/ui/workspace/page";

const setupSteps = [
  {
    title: "Database Connections",
    description: "Verify the saved source and active destination tenant.",
    icon: DatabaseIcon
  },
  {
    title: "Table Mapping",
    description: "Choose source and destination tables independently.",
    icon: DatabaseIcon
  },
  {
    title: "Field Mapping",
    description: "Map fields, defaults, generated values, and target parents.",
    icon: ClipboardCheckIcon
  },
  {
    title: "Import Preparation",
    description: "Select source rows and audit the exact destination data.",
    icon: ClipboardCheckIcon
  },
  {
    title: "Confirm Import",
    description: "Verify the prepared records and queue the import.",
    icon: ClipboardCheckIcon
  },
  {
    title: "Import Results",
    description: "Review inserted, existing, and warning records.",
    icon: ClipboardCheckIcon
  }
];

export function DataBridgeWorkspace({
  onOpenCommonTables,
  onStartImport
}: {
  onOpenCommonTables: () => void;
  onStartImport: () => void;
}) {
  return (
    <WorkspacePage
      title="Data Bridge"
      description="A dedicated workspace for planning data exchange between connected systems."
    >
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <section className="rounded-md border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Guided data import
          </p>
          <h2 className="mt-2 text-lg font-semibold">Source to destination</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Bring mapped records from a saved database source into an active tenant. Existing target
            rows are preserved.
          </p>
          <Button className="mt-4 mr-2" onClick={onStartImport}>
            New import
          </Button>
          <button
            type="button"
            className="mt-4 h-9 rounded-md bg-primary px-3 text-sm text-primary-foreground"
            onClick={onOpenCommonTables}
          >
            Open Common Tables
          </button>
        </section>

        <section className="rounded-md border bg-card p-5">
          <h2 className="text-sm font-semibold">Import workflow</h2>
          <ol className="mt-4 divide-y">
            {setupSteps.map(({ title, description, icon: Icon }, index) => (
              <li key={title} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    <span className="mr-2 text-muted-foreground">{index + 1}.</span>
                    {title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                </div>
                {index < setupSteps.length - 1 ? (
                  <ArrowRightIcon
                    aria-hidden="true"
                    className="mt-2 size-4 text-muted-foreground"
                  />
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </WorkspacePage>
  );
}
