export interface ProviderStatusCardProps {
  providerCount: number;
}

export function ProviderStatusCard({ providerCount }: ProviderStatusCardProps) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">Provider engine</p>
      <h2 className="mt-2 text-2xl font-semibold">{providerCount} providers loaded</h2>
      <p className="mt-3 text-sm text-slate-300">
        The Platform host composes declared providers without owning module behavior.
      </p>
    </section>
  );
}
