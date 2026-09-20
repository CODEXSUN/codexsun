import { CircleCheck } from 'lucide-react';
import { cn } from '../lib/utils';

export type StatusBadgeValue =
  | 'active'
  | 'in-review'
  | 'complete'
  | 'planned'
  | 'draft'
  | 'open'
  | 'won'
  | 'lost'
  | 'pending'
  | 'processing'
  | 'failed'
  | 'cancelled'
  | 'archived'
  | 'suspended'
  | 'queued'
  | 'attention'
  | 'idle';

const statusStyles: Record<StatusBadgeValue, string> = {
  active: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300',
  'in-review':
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
  complete:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
  planned:
    'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300',
  draft: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300',
  open: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300',
  won: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
  lost: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300',
  pending:
    'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-300',
  processing:
    'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300',
  failed: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300',
  cancelled: 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300',
  archived: 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-300',
  suspended:
    'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300',
  queued:
    'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300',
  attention: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300',
  idle: 'border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-300',
};

const statusLabels: Record<StatusBadgeValue, string> = {
  active: 'Active',
  'in-review': 'In review',
  complete: 'Complete',
  planned: 'Planned',
  draft: 'Draft',
  open: 'Open',
  won: 'Won',
  lost: 'Lost',
  pending: 'Pending',
  processing: 'Processing',
  failed: 'Failed',
  cancelled: 'Cancelled',
  archived: 'Archived',
  suspended: 'Suspended',
  queued: 'Queued',
  attention: 'Attention',
  idle: 'Idle',
};

export function getStatusBadgeValue(value: string): StatusBadgeValue {
  const normalized = value.trim().toLowerCase();
  if (['complete', 'completed', 'done'].includes(normalized)) return 'complete';
  if (['in review', 'in-review', 'long hold', 'hold for approval'].includes(normalized)) return 'in-review';
  if (['active'].includes(normalized)) return 'active';
  if (['draft'].includes(normalized)) return 'draft';
  if (['open'].includes(normalized)) return 'open';
  if (['won'].includes(normalized)) return 'won';
  if (['lost'].includes(normalized)) return 'lost';
  if (['pending'].includes(normalized)) return 'pending';
  if (['processing', 'in progress'].includes(normalized)) return 'processing';
  if (['failed', 'error'].includes(normalized)) return 'failed';
  if (['cancelled', 'canceled'].includes(normalized)) return 'cancelled';
  if (['archived'].includes(normalized)) return 'archived';
  if (['suspended', 'disabled'].includes(normalized)) return 'suspended';
  if (['queued'].includes(normalized)) return 'queued';
  if (['attention'].includes(normalized)) return 'attention';
  if (['idle'].includes(normalized)) return 'idle';
  return 'active';
}

export function StatusBadge({
  className,
  label,
  status,
}: {
  status: StatusBadgeValue;
  label?: string;
  className?: string;
}) {
  const displayLabel = label ?? statusLabels[status];
  return (
    <span
      aria-label={`Status: ${displayLabel}`}
      className={cn(
        'inline-flex h-6 w-fit items-center gap-1 rounded-md border px-2 text-xs font-medium whitespace-nowrap',
        statusStyles[status],
        className,
      )}
    >
      <CircleCheck aria-hidden="true" className="size-3.5" />
      {displayLabel}
    </span>
  );
}
