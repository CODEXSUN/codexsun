import { useState } from 'react'
import {
  FilterBuilder,
  type FilterFieldDefinition,
  type FilterGroup,
} from '@codexsun/ui/blocks/filter-builder'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { UiTemplatePage } from '@codexsun/ui/templates/ui-page'

const sampleFilterFields: readonly FilterFieldDefinition[] = [
  { id: 'customer_name', label: 'Customer Name', placeholder: 'e.g. Acme Corp', type: 'text' },
  { id: 'revenue', label: 'Revenue ($)', placeholder: 'e.g. 5000', type: 'number' },
  {
    id: 'status',
    label: 'Account Status',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Trialing', value: 'trialing' },
      { label: 'Suspended', value: 'suspended' },
      { label: 'Churned', value: 'churned' },
    ],
    type: 'select',
  },
  { id: 'created_at', label: 'Creation Date', type: 'date' },
  { id: 'is_verified', label: 'Email Verified', type: 'boolean' },
]

const initialFilterGroup: FilterGroup = {
  combinator: 'AND',
  rules: [
    { fieldId: 'status', id: 'rule-1', operator: 'equals', value: 'active' },
    { fieldId: 'revenue', id: 'rule-2', operator: 'greater_than', value: 2500 },
    { fieldId: 'customer_name', id: 'rule-3', operator: 'contains', value: 'Tech' },
  ],
}

const filterCode = `import { useState } from 'react'
import { FilterBuilder, type FilterGroup } from '@codexsun/ui/blocks/filter-builder'

export function CustomerFilters() {
  const [filter, setFilter] = useState<FilterGroup>(initialFilter)

  return (
    <FilterBuilder
      fields={customerFields}
      filter={filter}
      onChange={setFilter}
      onApply={(applied) => fetchFilteredData(applied)}
    />
  )
}`

export function UiFilterBuilderDocumentation() {
  const topology = useMdiTopology()
  const [filter, setFilter] = useState<FilterGroup>(initialFilterGroup)
  const [appliedQuery, setAppliedQuery] = useState<string>(
    JSON.stringify(initialFilterGroup, null, 2),
  )

  function handleApply(applied: FilterGroup) {
    setAppliedQuery(JSON.stringify(applied, null, 2))
  }

  return (
    <UiTemplatePage
      code={filterCode}
      importPath="@codexsun/ui/blocks/filter-builder"
      kind="Block"
      name="Filter Builder"
      navigation={{
        next: { href: '/?component=button', name: 'Button' },
        previous: { href: '/?block=dropzone', name: 'File Dropzone' },
      }}
      preview={
        <div className="flex flex-col gap-4">
          <div className="w-full max-w-2xl">
            <FilterBuilder
              fields={sampleFilterFields}
              filter={filter}
              onApply={handleApply}
              onChange={setFilter}
            />
          </div>

          <div className="w-full max-w-2xl rounded-xl border border-border/70 bg-muted/40 p-3">
            <span className="text-[11px] font-semibold tracking-tight text-muted-foreground">
              Applied filter query output:
            </span>
            <pre className="mt-1.5 overflow-x-auto text-[11px] font-mono text-foreground/90">
              {appliedQuery}
            </pre>
          </div>
        </div>
      }
      topology={topology}
      topologyIds={{ page: '27', preview: '27.1', usage: '27.2' }}
      usageDescription={
        <p>
          Supply field definitions and data types. The Filter Builder block manages dynamic operator
          matching per data type, unary operators (empty/boolean), ranged between operators, AND/OR combinator
          toggles, and serializes clean rule groups.
        </p>
      }
    />
  )
}
