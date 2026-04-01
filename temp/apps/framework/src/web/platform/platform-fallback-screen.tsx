import { platformBrandingDefaults } from './default-branding'

export function PlatformFallbackScreen({ shellName }: { shellName: string }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.16),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] px-6 py-10 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl flex-col items-center justify-center gap-6 text-center">
        <img
          src={platformBrandingDefaults.logoUrl}
          alt={platformBrandingDefaults.brandName}
          className="h-20 w-20 rounded-3xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-950/10"
          loading="eager"
          decoding="async"
        />
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Platform Shell</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Starting {shellName}
          </h1>
          <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
            Framework bootstrap is loading the selected application shell and wiring its providers.
          </p>
        </div>
      </div>
    </main>
  )
}
