import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function StorefrontBrandShowcaseSection() {
  return (
    <Card className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
      <CardHeader className="border-b border-border/70">
        <CardTitle>Branding moved to Company Logos</CardTitle>
        <CardDescription>
          The logo designer and public logo publish flow now live inside the company upsert
          `Logos` tab so logo source, preview, editor, and publish stay in one place.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        <p className="text-sm leading-6 text-muted-foreground">
          Open the primary company and use the logo editor there to adjust width, height, left,
          right, top, bottom, size, and publish the final SVG to public branding with backup.
        </p>
        <Button asChild type="button" variant="outline">
          <Link to="/dashboard/settings/companies">Open companies</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
