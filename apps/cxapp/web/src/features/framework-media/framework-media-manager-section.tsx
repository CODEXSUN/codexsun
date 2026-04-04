import { FrameworkMediaBrowser } from "./media-browser"

export function FrameworkMediaManagerSection() {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Media Manager
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Shared media storage for company branding, product galleries, sliders, and any
          future module that needs managed image attachments.
        </p>
      </div>
      <FrameworkMediaBrowser />
    </div>
  )
}
