import { useState } from 'react'
import { ExecutionStatus, type ExecutionStatusProps } from '@codexsun/ui/blocks/execution-status'
import { Button } from '@codexsun/ui/components/button'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { UiTemplatePage } from '@codexsun/ui/templates/ui-page'

export function UiExecutionStatusDocumentation() {
  const topology = useMdiTopology()
  const [state, setState] = useState<ExecutionStatusProps['state']>('active')
  const [animated, setAnimated] = useState(true)
  return (
    <UiTemplatePage
      name="Execution Status"
      kind="Block"
      importPath="@codexsun/ui/blocks/execution-status"
      topology={topology}
      topologyIds={{ page: '26', preview: '26.1', usage: '26.2' }}
      navigation={{ previous: { href: '/?block=form', name: 'Form' } }}
      code={`import { ExecutionStatus } from '@codexsun/ui/blocks/execution-status'

<ExecutionStatus state="active" title="Execution in progress"
  description="Observed state, not estimated completion" elapsed="24s"
  metrics={[{ label: 'Received updates', value: 3 }]} />`}
      preview={
        <div className="grid gap-6">
          <p className="text-sm text-muted-foreground">
            Interactive specimen · sample values, no live job is running.
          </p>
          <div className="flex flex-wrap gap-2">
            {(['active', 'idle', 'complete', 'attention'] as const).map((value) => (
              <Button
                key={value}
                variant={value === state ? 'secondary' : 'outline'}
                aria-pressed={value === state}
                onClick={() => setState(value)}
              >
                {value}
              </Button>
            ))}
            <Button
              variant="outline"
              aria-pressed={animated}
              onClick={() => setAnimated(!animated)}
            >
              {animated ? 'Pause motion' : 'Enable motion'}
            </Button>
          </div>
          <ExecutionStatus
            state={state}
            animated={animated}
            title={
              {
                active: 'Execution in progress',
                idle: 'Queued for execution',
                complete: 'Run complete',
                attention: 'Updates interrupted',
              }[state]
            }
            description="The application supplies observed state and counts."
            elapsed="24s"
            metrics={[
              { label: 'Received updates', value: 3 },
              { label: 'Recorded actions', value: 2 },
            ]}
          />
        </div>
      }
      usageDescription={
        <p>
          Supply observed state, elapsed text, and labeled metrics. Pause active state when data
          becomes stale. Motion respects reduced-motion settings. The indeterminate bar never
          estimates a completion percentage.
        </p>
      }
    />
  )
}
