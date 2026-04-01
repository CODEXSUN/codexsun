import { Badge } from '@ui/components/ui/badge'

interface HealthBadgeProps {
  status: 'idle' | 'ready' | 'error'
}

export function HealthBadge({ status }: HealthBadgeProps) {
  if (status === 'ready') {
    return <Badge className="rounded-full bg-emerald-600 text-white hover:bg-emerald-600">API Ready</Badge>
  }

  if (status === 'error') {
    return <Badge variant="destructive" className="rounded-full">API Offline</Badge>
  }

  return <Badge variant="outline" className="rounded-full">Checking API</Badge>
}
