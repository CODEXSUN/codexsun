export type FilterFieldType = 'text' | 'number' | 'date' | 'select' | 'boolean'

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'between'
  | 'is_true'
  | 'is_false'
  | 'is_empty'
  | 'is_not_empty'
  | 'in'

export interface FilterFieldOption {
  label: string
  value: string
}

export interface FilterFieldDefinition {
  id: string
  label: string
  options?: readonly FilterFieldOption[] | undefined
  placeholder?: string | undefined
  type: FilterFieldType
}

export interface FilterRule {
  fieldId: string
  id: string
  operator: FilterOperator
  value?: unknown | undefined
  valueTo?: unknown | undefined
}

export type FilterCombinator = 'AND' | 'OR'

export interface FilterGroup {
  combinator: FilterCombinator
  rules: readonly FilterRule[]
}

export interface FilterBuilderProps {
  allowClear?: boolean | undefined
  ariaLabel?: string | undefined
  className?: string | undefined
  emptyMessage?: string | undefined
  fields: readonly FilterFieldDefinition[]
  filter: FilterGroup
  maxRules?: number | undefined
  onApply?: ((filter: FilterGroup) => void) | undefined
  onChange: (filter: FilterGroup) => void
  onClear?: (() => void) | undefined
  title?: string | undefined
}
