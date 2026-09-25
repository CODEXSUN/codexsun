import { CheckCircle2Icon, CircleAlertIcon, CircleDashedIcon } from 'lucide-react'

import { Badge } from '../../components/badge'

export type WorkspacePublishState = 'draft' | 'published' | 'review'

export function WorkspacePublishStatus({ state }: { state: WorkspacePublishState }) {
  const config = {
    draft: { icon: CircleDashedIcon, label: 'Draft', variant: 'secondary' as const },
    published: { icon: CheckCircle2Icon, label: 'Published', variant: 'studio-success' as const },
    review: { icon: CircleAlertIcon, label: 'Needs review', variant: 'studio-warning' as const },
  }[state]
  const Icon = config.icon
  return <Badge aria-label={`Publish status: ${config.label}`} variant={config.variant}><Icon aria-hidden="true" />{config.label}</Badge>
}
