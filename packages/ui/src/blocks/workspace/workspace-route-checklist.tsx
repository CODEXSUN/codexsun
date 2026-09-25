import { CheckCircle2Icon, CircleAlertIcon } from 'lucide-react'

import { Badge } from '../../components/badge'
import { Card, CardContent } from '../../components/card'

export type WorkspaceRouteCheck = { label: string; status: 'blocked' | 'ready' | 'pending' }

export function WorkspaceRouteChecklist({ items }: { items: WorkspaceRouteCheck[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => {
        const ready = item.status === 'ready'
        const Icon = ready ? CheckCircle2Icon : CircleAlertIcon
        return (
          <Card key={item.label} size="sm" className="shadow-none">
            <CardContent className="flex items-center gap-3 p-3 text-sm">
              <Icon aria-hidden="true" className={`size-4 ${ready ? 'text-emerald-500' : 'text-amber-500'}`} />
              <span className="flex-1">{item.label}</span>
              <Badge variant={ready ? 'studio-success' : item.status === 'pending' ? 'studio-warning' : 'secondary'}>
                {ready ? 'Ready' : item.status === 'pending' ? 'Pending' : 'Blocked'}
              </Badge>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
