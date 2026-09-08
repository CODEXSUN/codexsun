import { SlidersHorizontalIcon } from 'lucide-react'

import { Button } from '@codexsun/ui/components/button'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@codexsun/ui/components/popover'
import { cn } from '@codexsun/ui/lib/utils'
import { TopologyMarker } from '../../features/interface-topology'
import { useMdiTopology } from './mdi-topology'

export type MdiCanvas = 'grid' | 'plain'
export type MdiDensity = 'comfortable' | 'compact'

type MdiTweakPanelProps = {
  canvas: MdiCanvas
  density: MdiDensity
  onCanvasChange: (canvas: MdiCanvas) => void
  onDensityChange: (density: MdiDensity) => void
  onOpenFeatures: () => void
}

export function MdiTweakPanel({
  canvas,
  density,
  onCanvasChange,
  onDensityChange,
  onOpenFeatures,
}: MdiTweakPanelProps) {
  const topology = useMdiTopology()
  return (
    <div
      className="fixed right-3 bottom-8 z-40 data-[ito-highlighted=true]:shadow-[inset_0_0_0_2px_rgb(126_34_206/0.92)]"
      {...topology.regionProps('05')}
    >
      <TopologyMarker id="05" topology={topology} />
      <Popover>
        <PopoverTrigger
          render={<Button variant="outline" size="icon" aria-label="Open workspace appearance" />}
        >
          <SlidersHorizontalIcon />
        </PopoverTrigger>
        <PopoverContent align="end" side="top" className="w-64 gap-4">
          <PopoverHeader>
            <PopoverTitle>Workspace appearance</PopoverTitle>
            <PopoverDescription>
              Adjust the MDI shell while its structure is reviewed.
            </PopoverDescription>
          </PopoverHeader>
          <OptionGroup
            label="Density"
            options={['compact', 'comfortable']}
            value={density}
            onChange={onDensityChange}
          />
          <OptionGroup
            label="Canvas"
            options={['plain', 'grid']}
            value={canvas}
            onChange={onCanvasChange}
          />
          <Button variant="outline" className="w-full" onClick={onOpenFeatures}>
            Feature settings
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function OptionGroup<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string
  onChange: (value: T) => void
  options: T[]
  value: T
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            className={cn(
              'h-7 rounded-md px-2 text-sm capitalize transition-colors',
              value === option
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}
