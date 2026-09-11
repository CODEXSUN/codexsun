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
  options?: readonly FilterFieldOption[]
  placeholder?: string
  type: FilterFieldType
}

export interface FilterRule {
  fieldId: string
  id: string
  operator: FilterOperator
  value?: unknown
  valueTo?: unknown
}

export type FilterCombinator = 'AND' | 'OR'

export interface FilterGroup {
  combinator: FilterCombinator
  rules: readonly FilterRule[]
}

export interface FilterBuilderProps {
  allowClear?: boolean
  ariaLabel?: string
  className?: string
  emptyMessage?: string
  fields: readonly FilterFieldDefinition[]
  filter: FilterGroup
  maxRules?: number
  onApply?: (filter: FilterGroup) => void
  onChange: (filter: FilterGroup) => void
  onClear?: () => void
  title?: string
}
