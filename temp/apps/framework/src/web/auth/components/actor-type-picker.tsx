import type { ActorType } from '@shared/index'
import { cn } from '@/lib/utils'

const actorTypeLabels: Record<ActorType, string> = {
  customer: 'Customer',
  staff: 'Staff',
  admin: 'Admin',
  vendor: 'Vendor',
}

interface ActorTypePickerProps {
  value: ActorType
  onChange: (value: ActorType) => void
}

export function ActorTypePicker({ value, onChange }: ActorTypePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {(Object.keys(actorTypeLabels) as ActorType[]).map((actorType) => (
        <button
          key={actorType}
          type="button"
          onClick={() => onChange(actorType)}
          className={cn(
            'rounded-2xl border px-4 py-3 text-sm transition',
            value === actorType
              ? 'border-accent bg-accent/15 text-foreground'
              : 'border-border bg-background text-muted-foreground hover:text-foreground',
          )}
        >
          {actorTypeLabels[actorType]}
        </button>
      ))}
    </div>
  )
}
