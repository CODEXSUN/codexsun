import { ActivityIcon, CheckCircle2Icon, DatabaseIcon } from "lucide-react";
import {
  WorkspaceEntityCard,
  WorkspaceHealthSummary,
  WorkspacePublishStatus,
  WorkspaceRouteChecklist,
  WorkspaceRuntimeStatus,
} from "@codexsun/ui/blocks/workspace";
import { MermaidPreview } from "@codexsun/ui/blocks/mermaid-preview";
import type { DesignSystemAssetManifest } from "@codexsun/ui/design-system";
import { useMdiTopology } from "@codexsun/ui/layouts/mdi-main";
import { UiTemplatePage } from "@codexsun/ui/templates/ui-page";
import type { UiBlockDoc } from "./ui-blocks";

export function UiRegistryBlockDocumentation({
  block,
}: {
  block: UiBlockDoc & { manifest?: DesignSystemAssetManifest };
}) {
  const topology = useMdiTopology();
  const manifest = block.manifest;
  const preview =
    block.id === "workspace-status" ? (
      <WorkspaceStatusPreview />
    ) : block.id === "workspace-entity-card" ? (
      <WorkspaceEntityPreview />
    ) : block.id === "mermaid-preview" ? (
      <MermaidPreview source="flowchart LR\n  App --> SharedUI\n  SharedUI --> Module" />
    ) : (
      <ContractPreview block={block} />
    );

  return (
    <UiTemplatePage
      code={codeForBlock(block)}
      importPath={block.source}
      kind="Block"
      name={block.name}
      preview={preview}
      topology={topology}
      topologyIds={{ page: `${block.id}-page`, preview: `${block.id}-preview`, usage: `${block.id}-usage` }}
      usageDescription={
        <div className="grid gap-2">
          <p>{manifest?.description ?? "Package-owned UI block preview."}</p>
          <p>
            UIUX is a visual gallery only. Applications provide business data, routes, permissions, persistence, and
            workflows.
          </p>
          {manifest ? (
            <div className="flex flex-wrap gap-2 text-xs">
              <span>Default: {manifest.defaultVariantId}</span>
              <span>Variants: {manifest.variants.map((variant) => variant.id).join(", ")}</span>
            </div>
          ) : null}
        </div>
      }
    />
  );
}

function codeForBlock(block: UiBlockDoc) {
  if (block.id === "workspace-status") {
    return `import { WorkspaceRuntimeStatus, WorkspaceHealthSummary, WorkspacePublishStatus, WorkspaceRouteChecklist } from '${block.source}'`;
  }
  if (block.id === "workspace-entity-card") return `import { WorkspaceEntityCard } from '${block.source}'`;
  if (block.id === "mermaid-preview") return `import { MermaidPreview } from '@codexsun/ui/blocks/mermaid-preview'`;
  return `// Compose the package-owned ${block.name} block from '${block.source}'.`;
}

function WorkspaceStatusPreview() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <WorkspaceRuntimeStatus state="live" port={6102} responseTimeMs={42} />
      <WorkspaceHealthSummary icon={ActivityIcon} label="Health" value="98%" tone="success" />
      <WorkspacePublishStatus state="published" />
      <WorkspaceRouteChecklist
        items={[
          { label: "Preview route", status: "ready" },
          { label: "API route", status: "pending" },
        ]}
      />
    </div>
  );
}

function WorkspaceEntityPreview() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <WorkspaceEntityCard
        action={<CheckCircle2Icon className="size-4 text-emerald-500" />}
        description="A package-owned card with application-provided content."
        eyebrow="Workspace"
        title="CRM workspace"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <DatabaseIcon className="size-4" /> 12 records
        </div>
      </WorkspaceEntityCard>
      <WorkspaceEntityCard
        variant="interactive"
        description="Interactive treatment for inventory and resource surfaces."
        eyebrow="Interactive"
        title="Billing workspace"
      />
    </div>
  );
}

function ContractPreview({ block }: { block: UiBlockDoc }) {
  return (
    <div className="rounded-xl border border-dashed bg-muted/20 p-8 text-center">
      <p className="font-medium">{block.name}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        This registry asset is available to applications through the typed package contract.
      </p>
    </div>
  );
}
