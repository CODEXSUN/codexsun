export interface ProviderStatusCardProps {
  providerCount: number;
}

export function ProviderStatusCard({ providerCount }: ProviderStatusCardProps) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <p className="text-sm text-muted-foreground">Provider engine</p>
      <h2 className="mt-2 text-2xl font-semibold">{providerCount} providers loaded</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        The Platform host composes declared providers without owning module behavior.
      </p>
    </section>
  );
}
