import { FileTextIcon, FilterIcon, PlusIcon, UserCircleIcon } from "lucide-react";
import type { ReactNode } from "react";
import { AppHeader } from "@codexsun/ui/blocks/app-header";
import { Button } from "@codexsun/ui/components/button";
import { useMdiTopology } from "@codexsun/ui/layouts/mdi-main";
import { UiTemplatePage } from "@codexsun/ui/templates/ui-page";

const appHeaderCode = `import { AppHeader } from "@codexsun/ui/blocks/app-header"

<AppHeader
  variant="title-actions"
  title="Enquiry"
  titleIcon={FileTextIcon}
  filter={<Button variant="outline" size="sm"><FilterIcon /> Filter</Button>}
  primaryAction={{ label: "New enquiry", icon: PlusIcon, onClick: onCreate }}
/>`;

export function UiAppHeaderDocumentation() {
  const topology = useMdiTopology();

  return (
    <UiTemplatePage
      code={appHeaderCode}
      importPath="@codexsun/ui/blocks/app-header"
      kind="Block"
      name="App Header"
      navigation={{ previous: { href: "/?block=mascot", name: "Mascot" } }}
      preview={
        <div className="space-y-5">
          <AppHeaderExample
            description="Workspace breadcrumbs with profile content and a primary create action."
            header={
              <AppHeader
                breadcrumbs={[
                  { href: "#workspace", label: "Workspace" },
                  { href: "#sales", label: "Sales" },
                  { label: "Enquiry" },
                ]}
                end={<span className="hidden text-xs text-muted-foreground sm:inline">Ready</span>}
                primaryAction={{ icon: PlusIcon, label: "New enquiry", onClick: () => undefined }}
                profile={
                  <Button aria-label="Open profile" size="icon-sm" variant="ghost">
                    <UserCircleIcon />
                  </Button>
                }
                variant="breadcrumb-actions"
              />
            }
            name="Breadcrumb + action"
          />
          <AppHeaderExample
            description="A page icon and title aligned with filter controls and a primary action."
            header={
              <AppHeader
                end={<span className="hidden text-xs text-muted-foreground sm:inline">Ready</span>}
                filter={
                  <Button size="sm" variant="outline">
                    <FilterIcon /> Filter
                  </Button>
                }
                primaryAction={{ icon: PlusIcon, label: "New enquiry", onClick: () => undefined }}
                title="Enquiry"
                titleIcon={FileTextIcon}
                variant="title-actions"
              />
            }
            name="Title + filter + action"
          />
          <AppHeaderExample
            description="A source link with a copy affordance for docs, code, and resource pages."
            header={
              <AppHeader
                copyValue="@codexsun/ui/blocks/app-header"
                resourceHref="#source"
                resourceLabel="apps/crm/web/src/enquiry.tsx"
                title="Enquiry"
                variant="resource-actions"
              />
            }
            name="Resource + copy"
          />
        </div>
      }
      topology={topology}
      topologyIds={{ page: "30", preview: "30.1", usage: "30.2" }}
      usageDescription={
        <p>
          Use one shared header contract across documentation pages, master lists, forms, and identity screens. Supply
          application-owned breadcrumbs, filter controls, profile content, links, and actions through typed props or
          slots while choosing the appropriate variant.
        </p>
      }
    />
  );
}

function AppHeaderExample({ description, header, name }: { description: string; header: ReactNode; name: string }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border/80 bg-background shadow-xs">
      <div className="border-b border-border/70 bg-muted/20 px-4 py-3">
        <h2 className="text-sm font-semibold">{name}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {header}
      <div className="flex min-h-24 items-center justify-center bg-muted/10 p-6 text-sm text-muted-foreground">
        Page content sits below this header.
      </div>
    </section>
  );
}
