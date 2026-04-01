import { Link } from 'react-router-dom'
import { ArrowRight, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CustomerSectionPageProps {
  title: string
  description: string
  storeHref?: string
  storeLabel?: string
}

export function CustomerSectionPage({
  title,
  description,
  storeHref = '/search',
  storeLabel = 'Open storefront',
}: CustomerSectionPageProps) {
  return (
    <div className="space-y-4">
      <Card className="mesh-panel overflow-hidden">
        <CardHeader className="gap-4 border-b border-border/60 p-8">
          <CardTitle className="text-4xl tracking-tight sm:text-5xl">{title}</CardTitle>
          <CardDescription className="max-w-3xl text-base leading-7">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="rounded-[1.5rem] border border-dashed border-border/80 p-6">
            <p className="text-sm leading-7 text-muted-foreground">
              This customer surface is isolated from the admin dashboard. It is ready for feature-specific expansion without mixing internal operator menus into the storefront account area.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild>
                <Link to={storeHref}>
                  <ShoppingBag className="size-4" />
                  {storeLabel}
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/contact">
                  Need help
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
