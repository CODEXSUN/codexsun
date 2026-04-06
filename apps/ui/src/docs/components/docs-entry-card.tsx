import { CardTitle } from "@/components/ui/card";
import type { DocsEntry } from "@/registry/data/catalog";
import { CopyCodeButton } from "@/docs/components/copy-code-button";
import { ViewCodeDialog } from "@/docs/components/view-code-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProjectDefaults } from "@/design-system/context/project-defaults-provider";
import { getDesignSystemComponentDefault } from "@/design-system/data/component-governance";

export function DocsEntryCard({
  entry,
  showHeader = true,
}: {
  entry: DocsEntry;
  showHeader?: boolean;
}) {
  const EntryIcon = entry.icon;
  const baselineDefault = getDesignSystemComponentDefault(entry.id);
  const { clearPreviewDefault, getResolvedDefault, setPreviewDefault } =
    useProjectDefaults();
  const componentDefault = getResolvedDefault(entry.id);
  const fullWidthExampleIds =
    entry.id === "table" ? new Set(["table-11", "table-12"]) : null;

  return (
    <div id={entry.id} className="space-y-5">
      {showHeader ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="border-border/70 bg-background flex size-10 items-center justify-center rounded-xl border">
                <EntryIcon className="size-5" />
              </div>
              <div>
                <CardTitle>{entry.name}</CardTitle>
                <p className="text-muted-foreground text-sm">
                  {entry.description}
                </p>
              </div>
            </div>
            {componentDefault ? (
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  Code name: {componentDefault.applicationName}
                </Badge>
                <Badge variant="outline">
                  Default: {componentDefault.activeDefaultExampleTitle}
                </Badge>
                {componentDefault.isOverridden ? (
                  <Badge>Preview override</Badge>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="border-border/70 bg-background text-muted-foreground rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase">
            {entry.examples.length} variants
          </div>
        </div>
      ) : null}
      <div className="grid gap-4 xl:grid-cols-2">
        {entry.examples.map((example, index) => {
          const isProjectDefault =
            componentDefault?.activeDefaultExampleId === example.id;
          const isSourceDefault =
            baselineDefault?.defaultExampleId === example.id;
          const isFullWidth = fullWidthExampleIds?.has(example.id) ?? false;

          return (
            <div
              key={example.id}
              className={
                isFullWidth
                  ? "border-border/70 bg-background overflow-hidden rounded-[1.25rem] border xl:col-span-2"
                  : "border-border/70 bg-background overflow-hidden rounded-[1.25rem] border"
              }
            >
              <div className="border-border/60 flex items-center justify-between gap-3 border-b px-4 py-3">
                <div className="text-foreground flex flex-wrap items-center gap-2 text-sm font-semibold">
                  <span className="text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}.
                  </span>
                  <span>{example.title}</span>
                  {isProjectDefault ? (
                    <Badge variant="outline">
                      {componentDefault?.isOverridden
                        ? "Active preview default"
                        : "Project default"}
                    </Badge>
                  ) : null}
                  {!isProjectDefault && isSourceDefault ? (
                    <Badge variant="outline">Source default</Badge>
                  ) : null}
                </div>
                <div className="flex items-center gap-1">
                  <CopyCodeButton code={example.code} iconOnly />
                  <ViewCodeDialog
                    code={example.code}
                    title={`${entry.name} - ${example.title}`}
                    description={entry.description}
                  />
                </div>
              </div>
              <div className="p-4">
                <div className="border-border/70 bg-background rounded-[1rem] border p-5">
                  {example.preview}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button
                    variant={isProjectDefault ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setPreviewDefault(entry.id, example.id)}
                  >
                    {isProjectDefault
                      ? "Selected as active default"
                      : "Use as project default"}
                  </Button>
                  {componentDefault?.isOverridden && isProjectDefault ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearPreviewDefault(entry.id)}
                    >
                      Restore source default
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
