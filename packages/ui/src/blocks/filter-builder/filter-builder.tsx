import { Filter, Plus, RotateCcw } from 'lucide-react'
import { Button } from '../../components/button'
import { cn } from '../../lib/utils'
import { FilterRow } from './filter-row'
import type { FilterBuilderProps, FilterCombinator, FilterRule } from './filter-types'

export function FilterBuilder({
  allowClear = true,
  ariaLabel = 'Filter builder',
  className,
  emptyMessage = 'No filter conditions applied. Add a rule to filter records.',
  fields,
  filter,
  maxRules = 10,
  onApply,
  onChange,
  onClear,
  title = 'Filter rules',
}: FilterBuilderProps) {
  function handleAddRule() {
    if (filter.rules.length >= maxRules || fields.length === 0) return
    const defaultField = fields[0]
    const defaultOp =
      defaultField.type === 'number'
        ? 'equals'
        : defaultField.type === 'select'
          ? 'equals'
          : defaultField.type === 'date'
            ? 'equals'
            : 'contains'

    const newRule: FilterRule = {
      fieldId: defaultField.id,
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      operator: defaultOp,
      value: '',
    }

    onChange({
      ...filter,
      rules: [...filter.rules, newRule],
    })
  }

  function handleUpdateRule(updatedRule: FilterRule) {
    onChange({
      ...filter,
      rules: filter.rules.map((r) => (r.id === updatedRule.id ? updatedRule : r)),
    })
  }

  function handleDeleteRule(ruleId: string) {
    onChange({
      ...filter,
      rules: filter.rules.filter((r) => r.id !== ruleId),
    })
  }

  function handleCombinatorToggle(combinator: FilterCombinator) {
    onChange({
      ...filter,
      combinator,
    })
  }

  function handleClear() {
    onChange({
      ...filter,
      rules: [],
    })
    onClear?.()
  }

  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        'flex flex-col gap-3.5 rounded-2xl border border-border/80 bg-card p-4 text-card-foreground shadow-2xs',
        className,
      )}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold tracking-tight text-foreground">{title}</h4>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {filter.rules.length}
            {maxRules ? ` / ${maxRules}` : ''}
          </span>
        </div>

        {filter.rules.length > 1 && (
          <div className="flex items-center rounded-lg border border-border/80 bg-muted/40 p-0.5">
            <button
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-semibold transition-all',
                filter.combinator === 'AND'
                  ? 'bg-background text-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              type="button"
              onClick={() => handleCombinatorToggle('AND')}
            >
              Match ALL (AND)
            </button>
            <button
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-semibold transition-all',
                filter.combinator === 'OR'
                  ? 'bg-background text-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              type="button"
              onClick={() => handleCombinatorToggle('OR')}
            >
              Match ANY (OR)
            </button>
          </div>
        )}
      </div>

      {/* Rules list */}
      <div className="flex flex-col gap-2 min-h-16">
        {filter.rules.map((rule) => (
          <FilterRow
            fields={fields}
            key={rule.id}
            onDelete={handleDeleteRule}
            onUpdate={handleUpdateRule}
            rule={rule}
          />
        ))}

        {filter.rules.length === 0 && (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-border/60 py-6 text-center text-xs text-muted-foreground">
            {emptyMessage}
          </div>
        )}
      </div>

      {/* Footer controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3">
        <Button
          disabled={filter.rules.length >= maxRules}
          size="sm"
          variant="outline"
          onClick={handleAddRule}
        >
          <Plus className="size-3.5" /> Add condition
        </Button>

        <div className="flex items-center gap-2">
          {allowClear && filter.rules.length > 0 && (
            <Button size="sm" variant="ghost" onClick={handleClear}>
              <RotateCcw className="size-3.5" /> Clear
            </Button>
          )}

          {onApply && (
            <Button size="sm" variant="default" onClick={() => onApply(filter)}>
              Apply filter
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
