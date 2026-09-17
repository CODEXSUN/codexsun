import { ProviderStatusCard } from "../blocks/provider-status-card";

export interface ProviderOverviewPageProps {
  providerCount: number;
}

export function ProviderOverviewPage({ providerCount }: ProviderOverviewPageProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ProviderStatusCard providerCount={providerCount} />
      <section className="rounded-lg border border-border bg-surface p-5">
        <p className="text-sm text-muted-foreground">Startup</p>
        <p className="mt-2 text-sm text-foreground">
          Start the API with npm.cmd run dev:api. Start the web host with npm.cmd run dev:web.
        </p>
      </section>
    </div>
  );
}
