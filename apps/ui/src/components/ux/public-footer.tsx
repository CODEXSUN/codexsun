import { AppBrand } from "./app-brand"
import { useRuntimeBrand } from "@/features/branding/runtime-brand-provider"

type PublicFooterProps = {
  appCount?: number
}

export function PublicFooter({ appCount }: PublicFooterProps) {
  const { brand } = useRuntimeBrand()

  return (
    <footer className="border-t border-border/70 bg-background/80">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
        <div className="space-y-4">
          <AppBrand />
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            {brand?.shortAbout ??
              `${brand?.brandName ?? "codexsun"} is the enterprise shell for framework-driven ERP, commerce, billing, operations, and connector apps across internal and external surfaces.`}
          </p>
          {brand?.addressLine1 || brand?.addressLine2 ? (
            <div className="space-y-1 text-sm text-muted-foreground">
              {brand.addressLine1 ? <p>{brand.addressLine1}</p> : null}
              {brand.addressLine2 ? <p>{brand.addressLine2}</p> : null}
            </div>
          ) : null}
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
              <p>Display name: {brand?.brandName ?? "codexsun"}</p>
              <p>Connected apps: {appCount ?? "multiple"}</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
