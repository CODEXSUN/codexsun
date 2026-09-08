import { useMemo, useState } from 'react'
import type { RegistryNode } from '@codexsun/devkit-contracts'
import { Badge } from '@codexsun/ui/components/badge'
import { Button } from '@codexsun/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@codexsun/ui/components/dropdown-menu'
import {
  createDataTableColumnHelper,
  DataTableBlock,
  type DataTableColumn,
} from '@codexsun/ui/blocks/table'
import { ChevronLeft, Ellipsis, FolderOpen, Plus, RotateCcw, Settings2 } from 'lucide-react'

const columnHelper = createDataTableColumnHelper<RegistryNode>()

export function ProjectRegistryBrowser({
  node,
  onBack,
  onCreate,
  onEdit,
  onOpen,
  onProfile,
  onRefresh,
}: {
  node: RegistryNode
  onBack: () => void
  onCreate: () => void
  onEdit: (node: RegistryNode) => void
  onOpen: (node: RegistryNode) => void
  onProfile: (node: RegistryNode) => void
  onRefresh: () => void
}) {
  const [filter, setFilter] = useState<'all' | RegistryNode['status']>('all')
  const rows = useMemo(
    () => node.children.filter((child) => filter === 'all' || child.status === filter),
    [filter, node.children],
  )
  const columns = useMemo<DataTableColumn<RegistryNode>[]>(
    () => createColumns(onEdit, onOpen, onProfile),
    [onEdit, onOpen, onProfile],
  )
  const childLabel = nextLabel(node.kind)

  return (
    <DataTableBlock
      columns={columns}
      data={rows}
      description={node.summary}
      emptyMessage={`No ${childLabel.toLocaleLowerCase()} entries yet. Add one to continue the hierarchy.`}
      getRowId={(row) => row.id}
      getSearchText={(row) => `${row.title} ${row.key} ${row.summary} ${row.kind} ${row.status}`}
      primaryAction={
        <>
          {node.kind !== 'project' ? (
            <Button onClick={onBack} size="sm" variant="outline">
              <ChevronLeft />
              Back
            </Button>
          ) : null}
          <Button aria-label="Refresh registry" onClick={onRefresh} size="sm" variant="outline">
            <RotateCcw />
            Refresh
          </Button>
          {childLabel ? (
            <Button onClick={onCreate} size="sm">
              <Plus />
              New {childLabel}
            </Button>
          ) : null}
        </>
      }
      searchPlaceholder={`Search ${childLabel.toLocaleLowerCase()} entries`}
      summary={<RegistrySummary node={node} total={rows.length} />}
      title={node.title}
      toolbarFilters={<StatusFilter filter={filter} onChange={setFilter} />}
    />
  )
}

function createColumns(
  onEdit: (node: RegistryNode) => void,
  onOpen: (node: RegistryNode) => void,
  onProfile: (node: RegistryNode) => void,
): DataTableColumn<RegistryNode>[] {
  return columnHelper.columns([
    columnHelper.accessor('title', {
      cell: ({ row }) => (
        <div>
          <button
            aria-label={`${isProfileNode(row.original) ? 'Open profile for' : 'Open'} ${row.original.title}`}
            className="block cursor-pointer text-left font-medium text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() =>
              isProfileNode(row.original) ? onProfile(row.original) : onOpen(row.original)
            }
          >
            {row.original.title}
          </button>
          <span className="block max-w-80 truncate text-xs text-muted-foreground">
            {row.original.summary}
          </span>
        </div>
      ),
      enableHiding: false,
      header: 'Name',
    }),
    columnHelper.accessor('key', {
      cell: ({ row }) => <code className="text-xs">{row.original.key}</code>,
      header: 'Key',
    }),
    columnHelper.accessor('kind', {
      cell: ({ row }) => <span className="capitalize">{row.original.kind.replace('-', ' ')}</span>,
      header: 'Type',
    }),
    columnHelper.accessor('status', {
      cell: ({ row }) => <StatusBadge value={row.original.status} />,
      header: 'Status',
    }),
    columnHelper.accessor('enabled', {
      cell: ({ row }) => <Badge variant="outline">{row.original.enabled ? 'On' : 'Off'}</Badge>,
      header: 'State',
    }),
    columnHelper.accessor('children', {
      cell: ({ row }) => row.original.children.length,
      header: 'Children',
    }),
    columnHelper.display({
      id: 'actions',
      enableHiding: false,
      header: 'Action',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                aria-label={`Actions for ${row.original.title}`}
                size="icon-sm"
                variant="outline"
              />
            }
          >
            <Ellipsis />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {!isProfileNode(row.original) ? (
              <DropdownMenuItem onClick={() => onOpen(row.original)}>
                <FolderOpen />
                Open children
              </DropdownMenuItem>
            ) : null}
            {isProfileNode(row.original) ? (
              <DropdownMenuItem onClick={() => onProfile(row.original)}>
                <Settings2 />
                Profile
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={() => onEdit(row.original)}>Edit</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    }),
  ])
}

function StatusFilter({
  filter,
  onChange,
}: {
  filter: 'all' | RegistryNode['status']
  onChange: (value: 'all' | RegistryNode['status']) => void
}) {
  return (
    <select
      aria-label="Filter by status"
      className="h-8 rounded-lg border bg-transparent px-2 text-sm"
      onChange={(event) => onChange(event.target.value as 'all' | RegistryNode['status'])}
      value={filter}
    >
      <option value="all">All statuses</option>
      <option value="planned">Planned</option>
      <option value="active">Active</option>
      <option value="ready">Ready</option>
      <option value="blocked">Blocked</option>
    </select>
  )
}

function RegistrySummary({ node, total }: { node: RegistryNode; total: number }) {
  return (
    <div className="grid gap-3 text-sm sm:grid-cols-4">
      <Summary label="Current level" value={node.kind.replace('-', ' ')} />
      <Summary label="Entries" value={String(total)} />
      <Summary
        label="Enabled"
        value={String(node.children.filter((child) => child.enabled).length)}
      />
      <Summary
        label="Approved"
        value={String(node.children.filter((child) => child.confirmation === 'approved').length)}
      />
    </div>
  )
}
function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <strong className="capitalize">{value}</strong>
    </div>
  )
}
function StatusBadge({ value }: { value: RegistryNode['status'] }) {
  return (
    <Badge
      className={
        value === 'blocked'
          ? 'border-red-300 text-red-700'
          : value === 'ready'
            ? 'border-emerald-400 text-emerald-700'
            : value === 'active'
              ? 'border-blue-400 text-blue-700'
              : ''
      }
      variant="outline"
    >
      {value}
    </Badge>
  )
}
function nextLabel(kind: RegistryNode['kind']): string {
  return {
    app: 'Module group',
    module: '',
    'module-group': 'Submodule group',
    project: 'App',
    'submodule-group': 'Module',
  }[kind]
}
function isProfileNode(node: RegistryNode): boolean {
  return node.kind === 'module'
}
