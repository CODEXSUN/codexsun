import { Card, CardContent } from "@/components/ui/card"

export function CrmWorkspacePage() {
  return (
    <Card className="border border-border/70 bg-background/90 shadow-sm">
      <CardContent className="space-y-3 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          CRM
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          CRM app is not registered yet
        </h1>
        <p className="text-sm leading-7 text-muted-foreground">
          The CRM workspace file exists, but CRM has not been added to the live suite
          manifest yet. Register the app first, then point this page to the shared
          framework workspace renderer.
        </p>
      </CardContent>
    </Card>
  )
}
