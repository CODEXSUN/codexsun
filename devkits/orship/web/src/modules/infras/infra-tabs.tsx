import { Card, CardDescription, CardHeader, CardTitle } from "@codexsun/ui/components/card";
import { MariaDBController } from "./mariadb-controller";

export type InfraShowTab = "details" | "maintenance" | "notes";

type InfraTabsProps = {
  readonly activeTab: InfraShowTab;
  readonly onTabChange: (tab: InfraShowTab) => void;
};

type InfraTabScaffoldProps = {
  readonly request: typeof fetch;
  readonly tab: Exclude<InfraShowTab, "details">;
};

const tabs: Array<{ label: string; value: InfraShowTab }> = [
  { label: "Details", value: "details" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Notes", value: "notes" },
];

export function InfraTabs({ activeTab, onTabChange }: InfraTabsProps) {
  const activeIndex = Math.max(0, tabs.findIndex((tab) => tab.value === activeTab));

  return (
    <div className="relative grid w-fit grid-cols-3 rounded-lg border bg-background p-1">
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 rounded-md bg-muted transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateX(${activeIndex * 100}%)`, width: "calc((100% - 0.5rem) / 3)" }}
      />
      {tabs.map((tab) => (
        <button
          className="relative z-10 h-8 min-w-28 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors data-[active=true]:text-foreground"
          data-active={activeTab === tab.value}
          key={tab.value}
          type="button"
          onClick={() => onTabChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function InfraTabScaffold({ request, tab }: InfraTabScaffoldProps) {
  if (tab === "maintenance") return <MariaDBController request={request} />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
        <CardDescription>Capture operator notes, runbook context, and follow-up decisions for this infra record.</CardDescription>
      </CardHeader>
    </Card>
  );
}
