import { ArrowLeftIcon } from 'lucide-react'

import { Button } from '@codexsun/ui/components/button'
import { Separator } from '@codexsun/ui/components/separator'
import { Switch } from '@codexsun/ui/components/switch'
import { TopologyMarker, TopologyRegion } from '../../features/interface-topology'

import type { MdiFeatureKey, MdiFeatures } from './mdi-types'
import { useMdiTopology } from './mdi-topology'

const featureOptions: Array<{ description: string; key: MdiFeatureKey; label: string }> = [
  {
    key: 'topMenu',
    label: 'Top menu',
    description: 'Show the application context, search, and account actions.',
  },
  {
    key: 'notifications',
    label: 'Notifications',
    description: 'Show the notification action in the top menu.',
  },
  {
    key: 'appSwitcher',
    label: 'Application switcher',
    description: 'Show the grid used to move between available applications.',
  },
  {
    key: 'profileMenu',
    label: 'Profile menu',
    description: 'Show the current user and account actions.',
  },
  {
    key: 'statusBar',
    label: 'Workspace status bar',
    description: 'Show workspace state along the bottom edge.',
  },
]

type MdiFeatureSettingsProps = {
  features: MdiFeatures
  onBack: () => void
  onFeatureChange: (feature: MdiFeatureKey, enabled: boolean) => void
}

export function MdiFeatureSettings({ features, onBack, onFeatureChange }: MdiFeatureSettingsProps) {
  const topology = useMdiTopology()
  return (
    <section
      className="relative h-full overflow-auto bg-background data-[ito-highlighted=true]:ring-2 data-[ito-highlighted=true]:ring-inset data-[ito-highlighted=true]:ring-violet-700"
      aria-labelledby="mdi-features-title"
      {...topology.regionProps('06')}
    >
      <TopologyMarker id="06" topology={topology} />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10 lg:px-10">
        <div className="flex items-start gap-4">
          <TopologyRegion as="div" id="06.1" topology={topology}>
            <Button variant="outline" size="icon" onClick={onBack} aria-label="Back to workspace">
              <ArrowLeftIcon />
            </Button>
          </TopologyRegion>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-muted-foreground">Settings</p>
            <h1 id="mdi-features-title" className="text-2xl font-semibold tracking-tight">
              Workspace features
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Choose which shared MDI controls appear in this application.
            </p>
          </div>
        </div>
        <TopologyRegion as="div" className="flex flex-col" id="06.2" topology={topology}>
          {featureOptions.map((option, index) => (
            <TopologyRegion as="div" id={`06.2.${index + 1}`} key={option.key} topology={topology}>
              {index > 0 ? <Separator /> : null}
              <div className="flex items-center gap-6 py-5">
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span id={`${option.key}-label`} className="text-sm font-semibold">
                    {option.label}
                  </span>
                  <span
                    id={`${option.key}-description`}
                    className="text-sm leading-5 text-muted-foreground"
                  >
                    {option.description}
                  </span>
                </span>
                <Switch
                  checked={features[option.key]}
                  onCheckedChange={(enabled) => onFeatureChange(option.key, enabled)}
                  aria-labelledby={`${option.key}-label`}
                  aria-describedby={`${option.key}-description`}
                />
              </div>
            </TopologyRegion>
          ))}
        </TopologyRegion>
      </div>
    </section>
  )
}
