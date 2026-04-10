import { Card, CardContent } from "@/components/ui/card"

import { StorefrontTechnicalNameBadge } from "../../../components/storefront-technical-name-badge"

export function StorefrontHomeErrorSection({ error }: { error: string }) {
  return (
    <Card className="relative overflow-visible border-destructive/20 bg-destructive/5" data-technical-name="section.storefront.home.error">
      <StorefrontTechnicalNameBadge
        name="section.storefront.home.error"
        className="right-4 top-4"
      />
      <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
    </Card>
  )
}
