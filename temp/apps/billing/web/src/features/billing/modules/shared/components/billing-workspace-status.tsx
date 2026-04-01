import { AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@admin-web/components/ui/card'

export function BillingWorkspaceStatus({
  loading,
  error,
}: {
  loading: boolean
  error: string | null
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Loading billing workspace...</CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="flex items-start gap-3 p-6 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </CardContent>
      </Card>
    )
  }

  return null
}
