import { useMemo, useState } from 'react'
import { Eye, Pencil, Plus } from 'lucide-react'
import { Button } from '../../components/button'
import {
  createDataTableColumnHelper,
  DataTableBlock,
  DataTableFilterMenu,
  DataTableRowActions,
  DataTableStatus,
  DataTableTotals,
  type DataTableColumn,
} from '../../blocks/table'
import { useMdiTopology } from '../../layouts/mdi-main'
import { UiTemplatePage } from '../ui-page'

type WorkspaceRow = {
  amount: number
  id: string
  name: string
  owner: string
  status: 'Active' | 'Complete' | 'In review' | 'Planned'
  units: number
  updated: string
}

const columnHelper = createDataTableColumnHelper<WorkspaceRow>()

const rows: WorkspaceRow[] = [
  {
    id: 'WS-1042',
    name: 'Retail rollout',
    owner: 'Asha Menon',
    status: 'Active',
    updated: 'Today',
    amount: 48600,
    units: 18,
  },
  {
    id: 'WS-1041',
    name: 'Partner portal',
    owner: 'Daniel Roy',
    status: 'In review',
    updated: 'Today',
    amount: 32400,
    units: 12,
  },
  {
    id: 'WS-1039',
    name: 'Billing migration',
    owner: 'Meera Shah',
    status: 'Complete',
    updated: 'Yesterday',
    amount: 78250,
    units: 31,
  },
  {
    id: 'WS-1037',
    name: 'Mobile onboarding',
    owner: 'Ravi Kumar',
    status: 'Planned',
    updated: 'Sep 6',
    amount: 21900,
    units: 9,
  },
  {
    id: 'WS-1036',
    name: 'Support dashboard',
    owner: 'Nila Thomas',
    status: 'Active',
    updated: 'Sep 5',
    amount: 41500,
    units: 16,
  },
  {
    id: 'WS-1033',
    name: 'Inventory sync',
    owner: 'Arjun Rao',
    status: 'In review',
    updated: 'Sep 4',
    amount: 56700,
    units: 22,
  },
  {
    id: 'WS-1031',
    name: 'Access controls',
    owner: 'Sara Khan',
    status: 'Complete',
    updated: 'Sep 3',
    amount: 29400,
    units: 11,
  },
  {
    id: 'WS-1028',
    name: 'Analytics refresh',
    owner: 'Vikram Das',
    status: 'Active',
    updated: 'Sep 2',
    amount: 63800,
    units: 24,
  },
  {
    id: 'WS-1025',
    name: 'Document workflow',
    owner: 'Isha Patel',
    status: 'Planned',
    updated: 'Aug 30',
    amount: 18750,
    units: 7,
  },
  {
    id: 'WS-1022',
    name: 'Customer import',
    owner: 'Noah George',
    status: 'Complete',
    updated: 'Aug 28',
    amount: 35200,
    units: 14,
  },
]

const tableCode = `import type { ReactNode } from 'react'
import {
  createDataTableColumnHelper,
  DataTableBlock,
  DataTableRowActions,
  DataTableStatus,
  DataTableTotals,
} from '@codexsun/ui/blocks/table'

const columnHelper = createDataTableColumnHelper<WorkspaceRow>()
function buildColumns(onOpen: (row: WorkspaceRow) => void) {
  return columnHelper.columns([
  columnHelper.accessor('id', { header: 'Reference' }),
  columnHelper.accessor('name', { header: 'Workspace' }),
  columnHelper.accessor('owner', { header: 'Owner' }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: ({ getValue }) => (
      <DataTableStatus label={getValue()} tone="success" />
    ),
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Action',
    enableHiding: false,
    cell: ({ row }) => (
      <DataTableRowActions
        label={\`Actions for \${row.original.name}\`}
        actions={[{ id: 'view', label: 'View', onSelect: () => onOpen(row.original) }]}
      />
    ),
  }),
  ])
}

export function WorkspaceTable({
  filters,
  onOpen,
  rows,
}: {
  filters?: ReactNode
  onOpen: (row: WorkspaceRow) => void
  rows: WorkspaceRow[]
}) {
  return (
    <DataTableBlock
      columns={buildColumns(onOpen)}
      data={rows}
      description="Review active workspace delivery."
      emptyMessage="No workspaces found."
      getRowId={(row) => row.id}
      getSearchText={(row) => Object.values(row).join(' ')}
      itemLabel="workspaces"
      summary={
        <DataTableTotals
          items={[{ label: 'Visible rows', value: rows.length }]}
        />
      }
      title="Workspace delivery"
      toolbarFilters={filters}
    />
  )
}`

export function UiTableDocumentation() {
  const topology = useMdiTopology()
  const [statusFilter, setStatusFilter] = useState<WorkspaceRow['status'] | 'All'>('All')
  const [lastAction, setLastAction] = useState('No row action selected.')
  const visibleRows = useMemo(
    () => rows.filter((row) => statusFilter === 'All' || row.status === statusFilter),
    [statusFilter],
  )
  const columns = useMemo(() => createColumns((message) => setLastAction(message)), [])

  return (
    <UiTemplatePage
      code={tableCode}
      importPath="@codexsun/ui/blocks/table"
      kind="Block"
      name="Table"
      navigation={{
        next: { href: '/ui?block=form', name: 'Form' },
        previous: {
          href: '/ui?layout=mdi-main',
          name: 'MDI Main',
        },
      }}
      preview={
        <>
          <DataTableBlock
            columns={columns}
            data={visibleRows}
            description="Ten sample records rendered by the centralized table block."
            emptyMessage="No workspace records match the current search."
            getRowId={(row) => row.id}
            getSearchText={(row) =>
              `${row.id} ${row.name} ${row.owner} ${row.status} ${row.updated}`
            }
            searchPlaceholder="Search reference, workspace, owner, or status"
            itemLabel="workspaces"
            primaryAction={
              <Button onClick={() => setLastAction('New workspace form requested.')}>
                <Plus />
                New workspace
              </Button>
            }
            summary={<TableSummary rows={visibleRows} />}
            title="Workspace delivery"
            toolbarFilters={<StatusFilter filter={statusFilter} onChange={setStatusFilter} />}
          />
          <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
            {lastAction}
          </p>
        </>
      }
      previewClassName="[&_[data-slot=table]]:min-w-[56rem]"
      topology={topology}
      topologyIds={{ page: '22', preview: '22.1', usage: '22.2' }}
      usageDescription={
        <p>
          Pass typed rows and column definitions from your application. The Table block handles
          search, sorting, column visibility, pagination, totals, row actions, and responsive
          scrolling.
        </p>
      }
    />
  )
}

function TableSummary({ rows: data }: { rows: WorkspaceRow[] }) {
  const active = data.filter(({ status }) => status === 'Active').length
  const units = data.reduce((sum, row) => sum + row.units, 0)
  const total = data.reduce((sum, row) => sum + row.amount, 0)

  return (
    <DataTableTotals
      items={[
        { label: 'Total quantity', value: units },
        { label: 'Active', value: active },
        { label: 'Visible rows', value: data.length },
        { label: 'Grand total', value: formatCurrency(total) },
      ]}
    />
  )
}

function createColumns(onAction: (message: string) => void): DataTableColumn<WorkspaceRow>[] {
  return columnHelper.columns([
    columnHelper.accessor('id', { header: 'Reference' }),
    columnHelper.accessor('name', { header: 'Workspace' }),
    columnHelper.accessor('owner', { header: 'Owner' }),
    columnHelper.accessor('units', {
      header: 'Qty',
      cell: ({ getValue }) => <span className="tabular-nums">{getValue()}</span>,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue()
        const tone = status === 'Complete' ? 'success' : status === 'Active' ? 'info' : 'warning'
        return <DataTableStatus label={status} tone={tone} />
      },
    }),
    columnHelper.accessor('updated', { header: 'Updated' }),
    columnHelper.accessor('amount', {
      header: 'Total',
      cell: ({ getValue }) => (
        <span className="block text-right font-semibold tabular-nums">
          {formatCurrency(getValue())}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      enableHiding: false,
      header: 'Action',
      cell: ({ row }) => (
        <DataTableRowActions
          actions={[
            {
              id: 'view',
              icon: <Eye />,
              label: 'View',
              onSelect: () => onAction(`Opened ${row.original.name}.`),
            },
            {
              id: 'edit',
              icon: <Pencil />,
              label: 'Edit',
              onSelect: () => onAction(`Editing ${row.original.name}.`),
              separatorBefore: true,
            },
          ]}
          label={`Actions for ${row.original.name}`}
        />
      ),
    }),
  ])
}

function StatusFilter({
  filter,
  onChange,
}: {
  filter: WorkspaceRow['status'] | 'All'
  onChange: (status: WorkspaceRow['status'] | 'All') => void
}) {
  const statuses: Array<WorkspaceRow['status'] | 'All'> = [
    'All',
    'Active',
    'Complete',
    'In review',
    'Planned',
  ]
  return (
    <DataTableFilterMenu
      activeCount={filter === 'All' ? 0 : 1}
      onClear={() => onChange('All')}
      onSelect={onChange}
      options={statuses.map((status) => ({
        checked: filter === status,
        label: status === 'All' ? 'All statuses' : status,
        value: status,
      }))}
    />
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    currency: 'INR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}
