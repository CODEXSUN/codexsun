import { Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCustomerOrders } from '../lib/customer-orders'

export function CustomerNotificationsPage() {
  const { notifications, isLoading, errorMessage } = useCustomerOrders()

  return (
    <div className="space-y-4">
      <Card className="mesh-panel overflow-hidden">
        <CardHeader className="gap-4 border-b border-border/60 p-8">
          <Badge className="w-fit">Notifications</Badge>
          <div className="space-y-3">
            <CardTitle className="text-4xl tracking-tight sm:text-5xl">Current order and payment updates.</CardTitle>
            <CardDescription className="max-w-3xl text-base leading-7">
              This stream reflects live customer-facing commerce activity currently available in the system.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      {errorMessage ? (
        <Card className="border-destructive/40">
          <CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Loading notifications...</CardContent>
        </Card>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <Bell className="size-4" />
            No customer notifications are available yet.
          </CardContent>
        </Card>
      ) : (
        notifications.map((notification) => (
          <Card key={notification.id}>
            <CardContent className="space-y-2 p-5">
              <p className="font-semibold text-foreground">{notification.title}</p>
              <p className="text-sm leading-6 text-muted-foreground">{notification.description}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
