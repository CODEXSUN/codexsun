import { Braces, FileText, FlaskConical, Rocket, SearchCheck } from 'lucide-react'
import type { ChatWorkflow } from './chat.types'
import { TopologyMarker } from '@codexsun/ui/features/interface-topology'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'

const options = [
  { icon: Rocket, label: 'Deliver', value: 'deliver' },
  { icon: Braces, label: 'Develop', value: 'develop' },
  { icon: FileText, label: 'Document', value: 'document' },
  { icon: SearchCheck, label: 'Review', value: 'review' },
  { icon: FlaskConical, label: 'Test', value: 'test' },
] as const

interface WorkflowSelectorProps {
  disabled: boolean
  onChange(value: ChatWorkflow): void
  value: ChatWorkflow
}

export function WorkflowSelector({ disabled, onChange, value }: WorkflowSelectorProps) {
  const topology = useMdiTopology()
  return (
    <div
      className="workflow-selector relative data-[ito-highlighted=true]:shadow-[inset_0_0_0_2px_rgb(126_34_206/0.92)]"
      aria-label="Task workflow"
      role="group"
      {...topology.regionProps('11.3.1')}
    >
      <TopologyMarker id="11.3.1" topology={topology} />
      {options.map((option) => {
        const Icon = option.icon
        return (
          <button
            aria-pressed={value === option.value}
            disabled={disabled}
            key={option.value}
            onClick={() => onChange(option.value)}
            title={`${option.label} workflow`}
            type="button"
          >
            <Icon aria-hidden="true" />
            <span>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
