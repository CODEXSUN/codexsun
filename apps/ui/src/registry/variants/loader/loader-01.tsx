import { GlobalLoader } from "@/registry/concerns/feedback/global-loader"

export default function Loader01() {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-border/70 bg-muted/20">
      <GlobalLoader fullScreen={false} size="md" />
    </div>
  )
}
