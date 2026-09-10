import {
  BoxesIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  CloudIcon,
  FolderKanbanIcon,
  UsersIcon,
} from 'lucide-react'

import {
  WorkspaceActionCard,
  WorkspaceMetricCard,
  WorkspaceMetricGrid,
  WorkspacePageHeader,
  WorkspaceSectionCard,
} from '@codexsun/ui/blocks/workspace'
import { Badge } from '@codexsun/ui/components/badge'
import { Button } from '@codexsun/ui/components/button'

export function GalleryWorkspaceBlocks() {
  return (
    <div className="grid gap-6 rounded-xl border bg-background p-5">
      <WorkspacePageHeader
        actions={<Button>Create workspace</Button>}
        badge={<Badge variant="secondary">Live</Badge>}
        description="Reusable application blocks use shared semantic tokens and responsive Tailwind composition."
        eyebrow="Workspace overview"
        title="Platform operations"
      />

      <WorkspaceMetricGrid className="xl:grid-cols-3">
        <WorkspaceMetricCard
          description="across four applications"
          icon={BoxesIcon}
          label="Active modules"
          tone="accent"
          trend={{ direction: 'up', label: '+8%' }}
          value="128"
        />
        <WorkspaceMetricCard
          description="within the last hour"
          icon={UsersIcon}
          label="Workspace members"
          tone="success"
          trend={{ direction: 'up', label: '+12' }}
          value="2,486"
        />
        <WorkspaceMetricCard
          description="requires one review"
          icon={CloudIcon}
          label="Runtime health"
          tone="warning"
          trend={{ direction: 'flat', label: 'Stable' }}
          value="99.98%"
        />
      </WorkspaceMetricGrid>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">
        <WorkspaceSectionCard
          action={<Button variant="outline">View activity</Button>}
          description="A standard section surface for application-owned content."
          footer={<span className="text-xs text-muted-foreground">Updated two minutes ago</span>}
          title="Workspace health"
        >
          <div className="grid gap-3">
            {['Platform web', 'Docs workspace', 'DevKit registry'].map((label) => (
              <div className="flex items-center gap-3" key={label}>
                <CircleCheckIcon className="size-4 shrink-0 text-success" />
                <span className="min-w-0 flex-1 text-sm">{label}</span>
                <Badge variant="outline">Ready</Badge>
              </div>
            ))}
          </div>
        </WorkspaceSectionCard>

        <div className="grid gap-3">
          <WorkspaceActionCard
            action={
              <Button aria-label="Open project portfolio" size="icon-sm" variant="ghost">
                <ChevronRightIcon />
              </Button>
            }
            description="Review milestones and delivery state."
            icon={FolderKanbanIcon}
            title="Project portfolio"
          />
          <WorkspaceActionCard
            action={
              <Button aria-label="Open module catalog" size="icon-sm" variant="ghost">
                <ChevronRightIcon />
              </Button>
            }
            description="Inspect shared and application-owned modules."
            icon={BoxesIcon}
            title="Module catalog"
          />
        </div>
      </div>
    </div>
  )
}
