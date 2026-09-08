import { ArrowRight, Check, CircleDashed, LockKeyhole } from 'lucide-react'
import type { ChatDeliveryRun } from './chat.types'

const stages = ['Plan', 'Observe', 'Review', 'Assign', 'Implement', 'Verify', 'Document', 'Version']

export function DeliveryPipeline({ delivery }: { delivery?: ChatDeliveryRun }) {
  if (delivery) return <DeliveryRecord delivery={delivery} />

  return (
    <div className="delivery-pipeline" aria-label="Delivery pipeline">
      <div className="delivery-stages">
        {stages.map((stage, index) => (
          <span key={stage}>
            {stage}
            {index < stages.length - 1 && <ArrowRight aria-hidden="true" />}
          </span>
        ))}
      </div>
      <span className="publish-gate">
        <LockKeyhole aria-hidden="true" /> Commit and push after approval
      </span>
    </div>
  )
}

function DeliveryRecord({ delivery }: { delivery: ChatDeliveryRun }) {
  return (
    <section className="delivery-record" aria-label="Delivery progress">
      <header>
        <strong>Delivery record</strong>
        <span>{delivery.publicationReady ? 'Ready to publish' : 'Publication gated'}</span>
      </header>
      <ol>
        {delivery.stages.map((stage) => (
          <li className={`stage-${stage.status}`} key={stage.id}>
            <span className="stage-icon" aria-hidden="true">
              {stage.status === 'complete' ? <Check /> : <CircleDashed />}
            </span>
            <span className="stage-copy">
              <strong>{capitalize(stage.id)}</strong>
              <small>{stage.evidence}</small>
            </span>
            <span className="stage-status">{stage.status}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}
