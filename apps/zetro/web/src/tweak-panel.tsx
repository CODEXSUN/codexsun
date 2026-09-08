import { Check, SlidersHorizontal, Volume2, VolumeX, X } from 'lucide-react'
import { TopologyMarker } from '@codexsun/ui/features/interface-topology'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import type { Accent, Density } from './use-preferences'

interface TweakPanelProps {
  accent: Accent
  autoSpeak: boolean
  density: Density
  isOpen: boolean
  showTasks: boolean
  onAccentChange(value: Accent): void
  onAutoSpeakChange(value: boolean): void
  onDensityChange(value: Density): void
  onOpenChange(value: boolean): void
  onShowTasksChange(value: boolean): void
}

export function TweakPanel(props: TweakPanelProps) {
  const topology = useMdiTopology()

  if (!props.isOpen) {
    return (
      <button
        aria-label="Customize Zetro"
        className={`tweak-launcher ${topology.highlightClassName('14')}`}
        onClick={() => props.onOpenChange(true)}
        type="button"
        {...topology.regionProps('14')}
      >
        <SlidersHorizontal />
        <span>Customize</span>
      </button>
    )
  }

  return (
    <section
      aria-label="Customize Zetro"
      className={`tweak-panel ${topology.highlightClassName('14')}`}
      {...topology.regionProps('14')}
    >
      <TopologyMarker id="14" topology={topology} />
      <header>
        <div>
          <p className="eyebrow">Live preferences</p>
          <h2>Make it yours</h2>
        </div>
        <button
          aria-label="Close customization"
          onClick={() => props.onOpenChange(false)}
          type="button"
        >
          <X />
        </button>
      </header>

      <fieldset>
        <legend>Spacing</legend>
        <div className="segmented-control">
          {(['focused', 'relaxed'] as const).map((density) => (
            <button
              className={props.density === density ? 'selected' : ''}
              key={density}
              onClick={() => props.onDensityChange(density)}
              type="button"
            >
              {props.density === density && <Check />}
              {density === 'focused' ? 'Focused' : 'Relaxed'}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Accent</legend>
        <div className="accent-options">
          {(['cobalt', 'forest', 'ember'] as const).map((accent) => (
            <button
              aria-label={`${accent} accent`}
              aria-pressed={props.accent === accent}
              className={`accent-swatch accent-${accent}`}
              key={accent}
              onClick={() => props.onAccentChange(accent)}
              type="button"
            >
              {props.accent === accent && <Check />}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="toggle-row">
        <span>
          <strong>Task rail</strong>
          <small>Keep execution beside the conversation</small>
        </span>
        <input
          checked={props.showTasks}
          onChange={(event) => props.onShowTasksChange(event.target.checked)}
          type="checkbox"
        />
      </label>

      <label className="toggle-row">
        <span>
          <strong>Spoken replies</strong>
          <small>Read new Zetro answers aloud</small>
        </span>
        {props.autoSpeak ? <Volume2 /> : <VolumeX />}
        <input
          checked={props.autoSpeak}
          onChange={(event) => props.onAutoSpeakChange(event.target.checked)}
          type="checkbox"
        />
      </label>
    </section>
  )
}
