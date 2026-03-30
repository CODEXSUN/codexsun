import { GlobalLoader } from "@/components/ui/global-loader"

export default function GlobalLoader01() {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-border/70 bg-muted/20">
      <GlobalLoader
        fullScreen={false}
        size="md"
        label="Loading workspace context."
      />
    </div>
  )
}
