import { AppBrand } from "./app-brand"

type PublicFooterProps = {
  appCount?: number
}

export function PublicFooter({ appCount }: PublicFooterProps) {
  return (
    <footer className="border-t border-border/70 bg-background/80">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
        <div className="space-y-4">
          <AppBrand />
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            codexsun is the enterprise shell for framework-driven ERP, commerce,
            billing, operations, and connector apps across internal and external
            surfaces.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Portfolio
            </p>
            <div className="space-y-1 text-sm text-foreground">
              <p>Framework-first application runtime</p>
              <p>Reusable UI and dashboard shell</p>
              <p>Internal and external integration endpoints</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Suite
            </p>
            <div className="space-y-1 text-sm text-foreground">
              <p>Main app: cxapp</p>
              <p>Display name: codexsun</p>
              <p>Connected apps: {appCount ?? "multiple"}</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
