import { Badge } from "@/components/ui/badge"
import {
  AnimatedTabs,
  type AnimatedContentTab,
} from "@/registry/concerns/navigation/animated-tabs"

const tabs: AnimatedContentTab[] = [
  {
    label: "Overview",
    value: "overview",
    content: (
      <div className="space-y-3">
        <Badge variant="outline">Contained tabs</Badge>
        <div className="space-y-1">
          <p className="font-medium text-foreground">Merchandising pulse</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Use animated tabs when the page holds dense, peer-level workspace
            sections and the transition itself helps preserve context.
          </p>
        </div>
      </div>
    ),
  },
  {
    label: "Catalog",
    value: "catalog",
    content: (
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border/70 bg-background/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Active SKUs
          </p>
          <p className="mt-2 text-2xl font-semibold">184</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-background/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Draft products
          </p>
          <p className="mt-2 text-2xl font-semibold">12</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-background/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Sync health
          </p>
          <p className="mt-2 text-2xl font-semibold">98%</p>
        </div>
      </div>
    ),
  },
  {
    label: "Operations",
    value: "operations",
    content: (
      <div className="space-y-3">
        {[
          "Review payment exceptions before 4 PM dispatch cut-off.",
          "Verify storefront hero inventory against current featured products.",
          "Reconcile customer escalations with shipment and invoice state.",
        ].map((item) => (
          <div
            key={item}
            className="rounded-xl border border-border/70 bg-background/80 p-4 text-sm text-muted-foreground"
          >
            {item}
          </div>
        ))}
      </div>
    ),
  },
]

export default function Tabs20() {
  return <AnimatedTabs tabs={tabs} defaultTabValue="overview" />
}
