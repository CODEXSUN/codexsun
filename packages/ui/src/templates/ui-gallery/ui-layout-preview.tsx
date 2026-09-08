import {
  BellIcon,
  BookOpenIcon,
  BoxesIcon,
  CircleUserRoundIcon,
  FileTextIcon,
  Grid3X3Icon,
  LayoutDashboardIcon,
  MenuIcon,
  PanelLeftIcon,
  SearchIcon,
} from 'lucide-react'
import { useState } from 'react'

import { Badge } from '../../components/badge'
import { Button } from '../../components/button'
import { cn } from '../../lib/utils'
import type { UiLayoutId } from './ui-layouts'

type MdiPreviewSectionId = 'command' | 'navigation' | 'status' | 'workspace'

const mdiPreviewSections: readonly {
  description: string
  id: MdiPreviewSectionId
  name: string
  number: string
}[] = [
  {
    description: 'Identity and global actions',
    id: 'command',
    name: 'Command bar',
    number: '01',
  },
  {
    description: 'Application destinations',
    id: 'navigation',
    name: 'Navigation',
    number: '02',
  },
  {
    description: 'App-owned working area',
    id: 'workspace',
    name: 'Workspace canvas',
    number: '03',
  },
  {
    description: 'Runtime and page context',
    id: 'status',
    name: 'Status bar',
    number: '04',
  },
]

export function UiLayoutPreview({ layoutId }: { layoutId: UiLayoutId }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-muted/30 p-3 sm:p-5">
      <div className="aspect-[16/9] min-h-72 overflow-hidden rounded-lg border bg-background shadow-xs">
        {layoutId === 'mdi-main' ? <MdiPreview /> : null}
        {layoutId === 'dashboard-01' ? <DashboardPreview /> : null}
        {layoutId === 'sidebar-07' ? <SidebarPreview /> : null}
        {layoutId === 'documentation-sidebar' ? <DocumentationPreview /> : null}
      </div>
    </div>
  )
}

function MdiPreview() {
  const [activeSection, setActiveSection] = useState<MdiPreviewSectionId>('command')
  const section = mdiPreviewSections.find(({ id }) => id === activeSection)!

  return (
    <div className="flex size-full min-h-0 flex-col text-xs">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
        <Badge variant="secondary">Live</Badge>
        <div className="font-semibold">MDI workspace</div>
        <div className="ml-auto text-muted-foreground">Select a section to inspect it</div>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-[11rem_minmax(0,1fr)]">
        <nav className="overflow-y-auto border-r bg-muted/20 p-3" aria-label="Live MDI sections">
          <div className="px-2 pb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Live sections
          </div>
          <div className="grid gap-1">
            {mdiPreviewSections.map((item) => (
              <button
                className={cn(
                  'grid gap-0.5 rounded-lg px-2.5 py-2 text-left transition-colors',
                  item.id === activeSection ? 'bg-foreground text-background' : 'hover:bg-muted',
                )}
                key={item.id}
                type="button"
                aria-pressed={item.id === activeSection}
                onClick={() => setActiveSection(item.id)}
              >
                <span className="flex items-center gap-2 font-medium">
                  <span className="w-5 shrink-0 text-[10px] opacity-70">{item.number}</span>
                  {item.name}
                </span>
                <span className="pl-7 text-[10px] opacity-70">{item.description}</span>
              </button>
            ))}
          </div>
        </nav>
        <section className="min-w-0 overflow-y-auto p-4" aria-live="polite">
          <div className="flex items-start justify-between gap-3 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-muted-foreground">{section.number}</span>
                <h3 className="text-sm font-semibold">{section.name}</h3>
              </div>
              <p className="pt-1 text-muted-foreground">{section.description}</p>
            </div>
            <Badge variant="outline">Interactive</Badge>
          </div>
          <MdiLiveSection sectionId={activeSection} />
        </section>
      </div>
    </div>
  )
}

function MdiLiveSection({ sectionId }: { sectionId: MdiPreviewSectionId }) {
  if (sectionId === 'command') return <LiveCommandBar />
  if (sectionId === 'navigation') return <LiveNavigation />
  if (sectionId === 'workspace') return <LiveWorkspace />
  return <LiveStatusBar />
}

function LiveCommandBar() {
  const [selectedAction, setSelectedAction] = useState('Application identity')

  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="flex h-12 items-center gap-2 border-b px-2">
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Navigation menu"
          onClick={() => setSelectedAction('Navigation toggle')}
        >
          <MenuIcon />
        </Button>
        <div className="flex items-center gap-2 px-2 font-semibold">
          <BoxesIcon className="size-4" /> Platform
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="secondary" onClick={() => setSelectedAction('Global search')}>
            <SearchIcon /> Search <kbd className="rounded bg-background px-1">Ctrl K</kbd>
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Notifications"
            onClick={() => setSelectedAction('Notifications')}
          >
            <BellIcon />
          </Button>
          <Button
            size="icon-sm"
            variant="outline"
            aria-label="Applications"
            onClick={() => setSelectedAction('Application launcher')}
          >
            <Grid3X3Icon />
          </Button>
          <Button
            size="icon-sm"
            variant="outline"
            aria-label="Profile"
            onClick={() => setSelectedAction('Profile menu')}
          >
            <CircleUserRoundIcon />
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-muted/20 px-4 py-3">
        <Badge variant="outline">Selected</Badge>
        <span className="font-medium">{selectedAction}</span>
      </div>
    </div>
  )
}

function LiveNavigation() {
  const [activeItem, setActiveItem] = useState('Overview')

  return (
    <div className="grid gap-2 rounded-xl border p-3 sm:grid-cols-3">
      {['Overview', 'Activity', 'Settings'].map((item) => (
        <Button
          className="justify-start"
          key={item}
          variant={activeItem === item ? 'default' : 'ghost'}
          onClick={() => setActiveItem(item)}
        >
          <LayoutDashboardIcon /> {item}
        </Button>
      ))}
    </div>
  )
}

function LiveWorkspace() {
  const [view, setView] = useState<'activity' | 'summary'>('summary')

  return (
    <div className="grid gap-3 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold">Workspace health</div>
          <div className="text-muted-foreground">Application-owned content inside the shell.</div>
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={view === 'summary' ? 'default' : 'ghost'}
            onClick={() => setView('summary')}
          >
            Summary
          </Button>
          <Button
            size="sm"
            variant={view === 'activity' ? 'default' : 'ghost'}
            onClick={() => setView('activity')}
          >
            Activity
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(view === 'summary'
          ? ['18 modules', '5 applications', 'All systems ready']
          : ['12 updates', '3 reviews', '1 notification']
        ).map((value) => (
          <div className="rounded-lg bg-muted/40 p-3 font-medium" key={value}>
            {value}
          </div>
        ))}
      </div>
    </div>
  )
}

function LiveStatusBar() {
  const [connected, setConnected] = useState(true)

  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="flex h-8 items-center gap-2 bg-muted/30 px-3 text-muted-foreground">
        <span className={cn('size-2 rounded-full', connected ? 'bg-success' : 'bg-destructive')} />
        <span>{connected ? 'Ready' : 'Offline'}</span>
        <span className="text-border">|</span>
        <span>Overview</span>
        <Button
          className="ml-auto"
          size="xs"
          variant="ghost"
          onClick={() => setConnected(!connected)}
        >
          Toggle state
        </Button>
      </div>
    </div>
  )
}

function DashboardPreview() {
  return (
    <div className="grid size-full content-start gap-4 p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Operations overview</div>
          <div className="text-muted-foreground">Live workspace health</div>
        </div>
        <div className="rounded-md bg-foreground px-3 py-1.5 text-background">New report</div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {['128 modules', '2,486 members', '99.98% ready'].map((value) => (
          <div className="rounded-lg border p-3 font-medium" key={value}>
            {value}
          </div>
        ))}
      </div>
      <div className="flex h-36 items-end gap-3 rounded-lg border p-4">
        {['h-[42%]', 'h-[68%]', 'h-[54%]', 'h-[82%]', 'h-[63%]', 'h-[76%]', 'h-[88%]'].map(
          (heightClass) => (
            <div className={`${heightClass} flex-1 rounded-t bg-foreground/75`} key={heightClass} />
          ),
        )}
      </div>
    </div>
  )
}

function SidebarPreview() {
  return (
    <div className="grid size-full grid-cols-[8.5rem_1fr] text-xs">
      <div className="border-r bg-muted/25 p-3">
        <div className="flex items-center gap-2 pb-5 font-semibold">
          <PanelLeftIcon className="size-4" /> Project desk
        </div>
        <PreviewNavigation active="Projects" items={['Home', 'Projects', 'Messages', 'Settings']} />
      </div>
      <div className="grid content-start gap-5 p-6">
        <div className="text-base font-semibold">Projects</div>
        <div className="grid grid-cols-2 gap-3">
          {['Design system', 'Client portal', 'Mobile workspace', 'Release tools'].map((label) => (
            <div className="flex items-center gap-2 rounded-lg border p-3" key={label}>
              <FileTextIcon className="size-4 text-muted-foreground" /> {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DocumentationPreview() {
  return (
    <div className="grid size-full grid-cols-[8.5rem_1fr_7.5rem] text-xs">
      <div className="border-r p-3">
        <div className="flex items-center gap-2 pb-5 font-semibold">
          <BookOpenIcon className="size-4" /> UI Docs
        </div>
        <PreviewNavigation active="MDI Main" items={['MDI Main', 'Dashboard 01', 'Sidebar 07']} />
      </div>
      <article className="grid content-start gap-3 p-6">
        <div className="text-lg font-semibold">MDI Main</div>
        <div className="h-2 w-4/5 rounded bg-muted-foreground/30" />
        <div className="h-2 w-3/5 rounded bg-muted-foreground/20" />
        <div className="mt-3 h-28 rounded-lg border bg-muted/20" />
      </article>
      <div className="border-l p-3 text-muted-foreground">
        <div className="pb-3 font-medium text-foreground">On this page</div>
        <div className="grid gap-2">
          <span>Preview</span>
          <span>Usage</span>
          <span>Code</span>
        </div>
      </div>
    </div>
  )
}

function PreviewNavigation({ active, items }: { active: string; items: string[] }) {
  return (
    <div className="grid gap-1">
      {items.map((item) => (
        <div
          className={cn(
            'flex items-center gap-2 rounded px-2 py-1.5',
            item === active ? 'bg-foreground text-background' : 'text-muted-foreground',
          )}
          key={item}
        >
          <LayoutDashboardIcon className="size-3.5" /> {item}
        </div>
      ))}
    </div>
  )
}
