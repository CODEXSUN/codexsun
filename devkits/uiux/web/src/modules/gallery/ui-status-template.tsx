import { StatusBadge, type StatusBadgeValue } from '@codexsun/ui/components/status-badge';
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main';
import { UiTemplatePage } from '@codexsun/ui/templates/ui-page';

const statuses: StatusBadgeValue[] = [
  'active',
  'in-review',
  'complete',
  'planned',
  'draft',
  'open',
  'won',
  'lost',
  'pending',
  'processing',
  'failed',
  'cancelled',
  'archived',
  'suspended',
  'queued',
  'attention',
  'idle',
];

export function UiStatusTemplate() {
  const topology = useMdiTopology();
  return (
    <UiTemplatePage
      code={`import { StatusBadge } from '@codexsun/ui/components/status-badge'

<StatusBadge status="active" />
<StatusBadge status="in-review" />
<StatusBadge status="complete" />
<StatusBadge status="planned" />`}
      importPath="@codexsun/ui/components/status-badge"
      kind="Template"
      name="Status Template"
      preview={
        <div aria-label="Status badge variants" className="flex min-h-24 flex-wrap content-start gap-3 p-6">
          {statuses.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
      }
      topology={topology}
      topologyIds={{ page: '28', preview: '28.1', usage: '28.2' }}
      usageDescription={
        <p>
          Use StatusBadge for compact, readable record state. The status value is application-owned, while the shared
          component provides the label, color, check mark, and accessible name.
        </p>
      }
    />
  );
}
