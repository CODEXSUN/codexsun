import type { ReactNode } from 'react'
import type { RegistryNode } from '@codexsun/devkit-contracts'
import { Badge } from '@codexsun/ui/components/badge'
import { Button } from '@codexsun/ui/components/button'
import { createDataTableColumnHelper, DataTableBlock } from '@codexsun/ui/blocks/table'
import { Pencil, Plus } from 'lucide-react'

type ProfileEntry = { id: string; key: string; value: string }
type ProfileTableRow = { id: string; key: string; value: ReactNode }

const profileColumnHelper = createDataTableColumnHelper<ProfileTableRow>()
const profileEntryColumnHelper = createDataTableColumnHelper<ProfileEntry>()
const detailColumns = profileColumnHelper.columns([
  profileColumnHelper.accessor('key', {
    cell: ({ row }) => <span className="font-medium">{row.original.key}</span>,
    enableHiding: false,
    header: 'Key',
  }),
  profileColumnHelper.accessor('value', {
    cell: ({ row }) => row.original.value,
    enableHiding: false,
    header: 'Value',
  }),
])

export function ModuleInformationTable({ node }: { node: RegistryNode }) {
  const rows: ProfileTableRow[] = [
    { id: 'name', key: 'Name', value: node.title },
    { id: 'key', key: 'Key', value: node.key },
    { id: 'type', key: 'Type', value: node.kind.replace('-', ' ') },
    { id: 'status', key: 'Status', value: <Badge variant="outline">{node.status}</Badge> },
    { id: 'state', key: 'State', value: node.enabled ? 'On' : 'Off' },
    { id: 'description', key: 'Description', value: node.summary },
  ]

  return <ProfileDetailTable rows={rows} title="Module information" />
}

export function RegistryMetadataTable({
  node,
  parent,
}: {
  node: RegistryNode
  parent?: RegistryNode
}) {
  const rows: ProfileTableRow[] = [
    { id: 'id', key: 'ID', value: node.id },
    { id: 'parent-id', key: 'Parent ID', value: parent?.id ?? 'project root' },
    { id: 'type', key: 'Type', value: node.kind.replace('-', ' ') },
    { id: 'profile', key: 'Profile', value: 'Demo specification' },
    { id: 'storage', key: 'Storage', value: 'JSON registry' },
    { id: 'state', key: 'State', value: node.enabled ? 'enabled' : 'disabled' },
  ]

  return <ProfileDetailTable rows={rows} title="Registry" />
}

export function ProfileEntriesTable({
  entries,
  onAdd,
  onEdit,
  section,
  title,
}: {
  entries: ProfileEntry[]
  onAdd: () => void
  onEdit: (entry: ProfileEntry) => void
  section: string
  title: string
}) {
  const columns = profileEntryColumnHelper.columns([
    profileEntryColumnHelper.accessor('key', {
      cell: ({ row }) => <span className="font-medium">{row.original.key}</span>,
      enableHiding: false,
      header: 'Key',
    }),
    profileEntryColumnHelper.accessor('value', {
      cell: ({ row }) => (
        <code className="whitespace-normal break-words text-xs">{row.original.value}</code>
      ),
      enableHiding: false,
      header: 'Value',
    }),
    profileEntryColumnHelper.display({
      cell: ({ row }) => (
        <Button
          aria-label={`Edit ${row.original.key}`}
          onClick={() => onEdit(row.original)}
          size="icon-sm"
          variant="ghost"
        >
          <Pencil />
        </Button>
      ),
      enableHiding: false,
      header: 'Action',
      id: 'actions',
    }),
  ])

  return (
    <DataTableBlock
      columns={columns}
      data={entries}
      defaultPageSize={Math.max(entries.length, 1)}
      emptyMessage={`No ${section} specifications recorded.`}
      getRowId={(row) => row.id}
      getSearchText={(row) => `${row.key} ${row.value}`}
      layout="section"
      showSerialNumber={false}
      tableFooter={
        <Button onClick={onAdd} size="sm" variant="outline">
          <Plus />
          Add key and value
        </Button>
      }
      title={title}
      withPagination={false}
      withToolbar={false}
    />
  )
}

function ProfileDetailTable({ rows, title }: { rows: ProfileTableRow[]; title: string }) {
  return (
    <DataTableBlock
      columns={detailColumns}
      data={rows}
      defaultPageSize={rows.length}
      emptyMessage="No details recorded."
      getRowId={(row) => row.id}
      getSearchText={(row) => row.key}
      layout="section"
      showSerialNumber={false}
      title={title}
      withPagination={false}
      withToolbar={false}
    />
  )
}
