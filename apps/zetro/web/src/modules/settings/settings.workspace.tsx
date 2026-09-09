import { useMemo, useState, type ComponentType, type ReactNode } from 'react'
import {
  ArrowLeft,
  Bot,
  Eye,
  GitBranch,
  MonitorCog,
  Palette,
  Search,
  SlidersHorizontal,
  Rocket,
  Activity,
} from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import { Input } from '@codexsun/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@codexsun/ui/components/select'
import { Separator } from '@codexsun/ui/components/separator'
import { Switch } from '@codexsun/ui/components/switch'
import { TopologyRegion } from '@codexsun/ui/features/interface-topology'
import {
  useMdiTopology,
  type MdiFeatureKey,
  type MdiFeatures,
  type MdiSettingsContentProps,
} from '@codexsun/ui/layouts/mdi-main'
import { ThemeSelector } from '@codexsun/ui/theme'
import { SettingsConnection } from './settings.connection'
import { GlobalDeveloperToolSettings } from '../developer-tools'
import { GlobalGitDeliverySettings } from '../git-delivery'
import { OperationsSettingsView } from '../operations'
import { useZetroPreferences, type ZetroDefaultWorkflow } from './settings.preferences'

type SettingsSection =
  'appearance' | 'connection' | 'developer-tools' | 'general' | 'git-delivery' | 'operations'

const navigation: Array<{
  icon: ComponentType<{ className?: string }>
  id: SettingsSection
  label: string
}> = [
  { icon: SlidersHorizontal, id: 'general', label: 'General' },
  { icon: Palette, id: 'appearance', label: 'Appearance' },
  { icon: GitBranch, id: 'developer-tools', label: 'Developer tools' },
  { icon: Rocket, id: 'git-delivery', label: 'Git delivery' },
  { icon: Activity, id: 'operations', label: 'Operations' },
  { icon: Bot, id: 'connection', label: 'Codex connection' },
]

const workflows: Array<{ label: string; value: ZetroDefaultWorkflow }> = [
  { label: 'Develop', value: 'develop' },
  { label: 'Deliver', value: 'deliver' },
  { label: 'Review', value: 'review' },
  { label: 'Test', value: 'test' },
  { label: 'Document', value: 'document' },
]

const featureOptions: Array<{
  description: string
  key: MdiFeatureKey
  label: string
}> = [
  {
    description: 'Application identity, search, and account actions.',
    key: 'topMenu',
    label: 'Command bar',
  },
  {
    description: 'Application navigation from the command bar.',
    key: 'appSwitcher',
    label: 'App switcher',
  },
  {
    description: 'Workspace activity notifications.',
    key: 'notifications',
    label: 'Notifications',
  },
  {
    description: 'Current user and account menu.',
    key: 'profileMenu',
    label: 'Profile menu',
  },
  {
    description: 'Current desk state along the bottom edge.',
    key: 'statusBar',
    label: 'Status bar',
  },
]

export function SettingsWorkspace({ features, onBack, onFeatureChange }: MdiSettingsContentProps) {
  const topology = useMdiTopology()
  const [activeSection, setActiveSection] = useState<SettingsSection>('general')
  const [query, setQuery] = useState('')
  const visibleNavigation = useMemo(
    () =>
      navigation.filter(({ label }) => label.toLowerCase().includes(query.trim().toLowerCase())),
    [query],
  )

  return (
    <TopologyRegion
      aria-label="Zetro settings"
      as="section"
      className="flex size-full min-h-0 bg-background"
      id="15.1.5"
      topology={topology}
    >
      <aside className="flex w-60 shrink-0 flex-col border-r bg-muted/20 p-3">
        <Button className="mb-3 justify-start" onClick={onBack} variant="ghost">
          <ArrowLeft /> Back to Zetro
        </Button>
        <label className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            aria-label="Search settings"
            className="h-9 pl-8"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search settings"
            value={query}
          />
        </label>
        <nav aria-label="Settings sections" className="flex flex-col gap-1 pt-4">
          {visibleNavigation.map((item) => {
            const Icon = item.icon
            return (
              <button
                aria-current={activeSection === item.id ? 'page' : undefined}
                className="flex h-9 cursor-pointer items-center gap-2 rounded-md px-3 text-left text-sm hover:bg-muted aria-[current=page]:bg-muted aria-[current=page]:font-medium"
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                type="button"
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            )
          })}
          {visibleNavigation.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">No matching settings.</p>
          ) : null}
        </nav>
      </aside>
      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-8 py-10 lg:px-12">
          {activeSection === 'general' ? <GeneralSettings /> : null}
          {activeSection === 'appearance' ? (
            <AppearanceSettings features={features} onFeatureChange={onFeatureChange} />
          ) : null}
          {activeSection === 'connection' ? <SettingsConnection /> : null}
          {activeSection === 'developer-tools' ? <GlobalDeveloperToolSettings /> : null}
          {activeSection === 'git-delivery' ? <GlobalGitDeliverySettings /> : null}
          {activeSection === 'operations' ? <OperationsSettingsView /> : null}
        </div>
      </div>
    </TopologyRegion>
  )
}

function GeneralSettings() {
  const topology = useMdiTopology()
  const { preferences, setPreference } = useZetroPreferences()

  return (
    <TopologyRegion as="div" className="flex flex-col gap-7" id="15.1.5.1" topology={topology}>
      <SettingsHeading
        description="Defaults that apply across every Zetro project."
        icon={MonitorCog}
        title="General"
      />
      <SettingsRows>
        <SettingsRow
          description="Workflow selected when a new chat composer opens."
          label="Default workflow"
        >
          <Select
            items={workflows}
            onValueChange={(value) =>
              value && setPreference('defaultWorkflow', value as ZetroDefaultWorkflow)
            }
            value={preferences.defaultWorkflow}
          >
            <SelectTrigger className="w-40" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {workflows.map((workflow) => (
                <SelectItem key={workflow.value} value={workflow.value}>
                  {workflow.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow
          description="Show the ITO inspection button, labels, and inspector for interface work."
          label="Interface topology tools"
        >
          <Switch
            aria-label="Show interface topology tools"
            checked={preferences.interfaceTopology}
            onCheckedChange={(enabled) => setPreference('interfaceTopology', enabled)}
          />
        </SettingsRow>
      </SettingsRows>
    </TopologyRegion>
  )
}

function AppearanceSettings({
  features,
  onFeatureChange,
}: {
  features: MdiFeatures
  onFeatureChange: (feature: MdiFeatureKey, enabled: boolean) => void
}) {
  const topology = useMdiTopology()
  return (
    <TopologyRegion as="div" className="flex flex-col gap-7" id="15.1.5.2" topology={topology}>
      <SettingsHeading
        description="Control Zetro theme and shared workspace chrome."
        icon={Eye}
        title="Appearance"
      />
      <ThemeSelector />
      <SettingsRows>
        {featureOptions.map((option) => (
          <SettingsRow description={option.description} key={option.key} label={option.label}>
            <Switch
              aria-label={`Show ${option.label}`}
              checked={features[option.key]}
              onCheckedChange={(enabled) => onFeatureChange(option.key, enabled)}
            />
          </SettingsRow>
        ))}
      </SettingsRows>
    </TopologyRegion>
  )
}

function SettingsHeading({
  description,
  icon: Icon,
  title,
}: {
  description: string
  icon: ComponentType<{ className?: string }>
  title: string
}) {
  return (
    <header className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted">
        <Icon className="size-4" />
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </header>
  )
}

function SettingsRows({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border [&>hr:last-child]:hidden">{children}</div>
  )
}

function SettingsRow({
  children,
  description,
  label,
}: {
  children: ReactNode
  description: string
  label: string
}) {
  return (
    <>
      <div className="flex min-h-16 items-center gap-6 px-4 py-3">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-sm text-muted-foreground">{description}</span>
        </span>
        <span className="shrink-0">{children}</span>
      </div>
      <Separator />
    </>
  )
}
