import { Funnel } from 'lucide-react'
import { DropdownMenu, DropdownMenuCheckboxItem } from '@codexsun/ui/components/dropdown-menu'
import { DataTableIconMenuTrigger } from './data-table-icon-menu-trigger'
import { DataTableMenuContent, dataTableMenuOptionClass } from './data-table-menu-content'

export type DataTableFilterOption<TValue extends string> = {
  checked: boolean
  label: string
  value: TValue
}

export function DataTableFilterMenu<TValue extends string>({
  activeCount = 0,
  clearLabel = 'Clear',
  label = 'Filters',
  onClear,
  onSelect,
  options,
  title = 'Filter options',
}: {
  activeCount?: number
  clearLabel?: string
  label?: string
  onClear: () => void
  onSelect: (value: TValue) => void
  options: DataTableFilterOption<TValue>[]
  title?: string
}) {
  return (
    <DropdownMenu>
      <DataTableIconMenuTrigger active={activeCount > 0} label={label}>
        <Funnel />
      </DataTableIconMenuTrigger>
      <DataTableMenuContent actionLabel={clearLabel} onAction={onClear} title={title}>
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            checked={option.checked}
            className={dataTableMenuOptionClass}
            key={option.value}
            onCheckedChange={() => onSelect(option.value)}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DataTableMenuContent>
    </DropdownMenu>
  )
}
