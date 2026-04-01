import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function NotFoundPage() {
  return (
    <div className="page-frame flex min-h-screen items-center justify-center px-4 py-6">
      <Card className="max-w-xl">
        <CardHeader>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">404</p>
          <CardTitle>That route is not mapped yet.</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <p className="text-sm leading-7 text-muted-foreground">
            The frontend foundation covers the requested public, auth, and dashboard surfaces. Anything else still needs explicit implementation.
          </p>
          <Button asChild variant="outline">
            <Link to="/">
              <ArrowLeft className="size-4" />
              Home
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
