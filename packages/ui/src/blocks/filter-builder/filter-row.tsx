import { Trash2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import type {
  FilterFieldDefinition,
  FilterOperator,
  FilterRule,
} from './filter-types'

const operatorsByType: Record<string, { label: string; value: FilterOperator }[]> = {
  text: [
    { label: 'contains', value: 'contains' },
    { label: 'does not contain', value: 'not_contains' },
    { label: 'equals', value: 'equals' },
    { label: 'starts with', value: 'starts_with' },
    { label: 'ends with', value: 'ends_with' },
    { label: 'is empty', value: 'is_empty' },
    { label: 'is not empty', value: 'is_not_empty' },
  ],
  number: [
    { label: '=', value: 'equals' },
    { label: '≠', value: 'not_equals' },
    { label: '>', value: 'greater_than' },
    { label: '<', value: 'less_than' },
    { label: '≥', value: 'greater_or_equal' },
    { label: '≤', value: 'less_or_equal' },
    { label: 'between', value: 'between' },
  ],
  date: [
    { label: 'is on', value: 'equals' },
    { label: 'is after', value: 'greater_than' },
    { label: 'is before', value: 'less_than' },
    { label: 'between', value: 'between' },
  ],
  select: [
    { label: 'is', value: 'equals' },
    { label: 'is not', value: 'not_equals' },
  ],
  boolean: [
    { label: 'is true', value: 'is_true' },
    { label: 'is false', value: 'is_false' },
  ],
}

export function FilterRow({
  fields,
  onDelete,
  onUpdate,
  rule,
}: {
  fields: readonly FilterFieldDefinition[]
  onDelete: (id: string) => void
  onUpdate: (updated: FilterRule) => void
  rule: FilterRule
}) {
  const currentField = fields.find((f) => f.id === rule.fieldId) || fields[0]
  const fieldType = currentField?.type || 'text'
  const operators = operatorsByType[fieldType] || operatorsByType.text

  const isUnaryOperator =
    rule.operator === 'is_empty' ||
    rule.operator === 'is_not_empty' ||
    rule.operator === 'is_true' ||
    rule.operator === 'is_false'

  const isBetween = rule.operator === 'between'

  function handleFieldChange(newFieldId: string) {
    const newField = fields.find((f) => f.id === newFieldId)
    const newType = newField?.type || 'text'
    const defaultOp = operatorsByType[newType]?.[0]?.value || 'contains'
    onUpdate({
      ...rule,
      fieldId: newFieldId,
      operator: defaultOp,
      value: '',
      valueTo: '',
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-background/50 p-2.5 transition-colors hover:border-border">
      {/* Field selector */}
      <select
        aria-label="Filter field"
        className="h-8.5 rounded-lg border border-border/80 bg-background px-2.5 text-xs font-medium text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
        value={rule.fieldId}
        onChange={(e) => handleFieldChange(e.target.value)}
      >
        {fields.map((f) => (
          <option key={f.id} value={f.id}>
            {f.label}
          </option>
        ))}
      </select>

      {/* Operator selector */}
      <select
        aria-label="Filter operator"
        className="h-8.5 rounded-lg border border-border/80 bg-background px-2.5 text-xs font-medium text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
        value={rule.operator}
        onChange={(e) =>
          onUpdate({ ...rule, operator: e.target.value as FilterOperator })
        }
      >
        {operators.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>

      {/* Dynamic value input */}
      {!isUnaryOperator && (
        <div className="flex flex-1 items-center gap-2 min-w-36">
          {fieldType === 'select' && currentField.options ? (
            <select
              aria-label="Filter value"
              className="h-8.5 w-full rounded-lg border border-border/80 bg-background px-2.5 text-xs text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
              value={String(rule.value ?? '')}
              onChange={(e) => onUpdate({ ...rule, value: e.target.value })}
            >
              <option value="">Select an option...</option>
              {currentField.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              aria-label="Filter value"
              className={cn(
                'h-8.5 w-full rounded-lg border border-border/80 bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30',
                isBetween && 'w-1/2',
              )}
              placeholder={currentField?.placeholder || 'Enter value...'}
              type={fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : 'text'}
              value={String(rule.value ?? '')}
              onChange={(e) => onUpdate({ ...rule, value: e.target.value })}
            />
          )}

          {isBetween && (
            <>
              <span className="text-xs text-muted-foreground">and</span>
              <input
                aria-label="Filter value to"
                className="h-8.5 w-1/2 rounded-lg border border-border/80 bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                placeholder="To..."
                type={fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : 'text'}
                value={String(rule.valueTo ?? '')}
                onChange={(e) => onUpdate({ ...rule, valueTo: e.target.value })}
              />
            </>
          )}
        </div>
      )}

      {/* Delete button */}
      <button
        aria-label="Remove filter rule"
        className="size-8.5 shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        type="button"
        onClick={() => onDelete(rule.id)}
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  )
}
