import { useEffect, useState } from 'react'
import type { RegistryNode, RegistryProfileSection } from '@codexsun/devkit-contracts'
import { Button } from '@codexsun/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@codexsun/ui/components/dialog'
import { Input } from '@codexsun/ui/components/input'
import { NativeSelect } from '@codexsun/ui/components/native-select'

export function NodeUpsertDialog({
  busy,
  node,
  onOpenChange,
  onSave,
  open,
  parent,
}: {
  busy: boolean
  node?: RegistryNode
  onOpenChange: (open: boolean) => void
  onSave: (input: NodeFormInput) => Promise<void>
  open: boolean
  parent?: RegistryNode
}) {
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [key, setKey] = useState('')
  const [status, setStatus] = useState<RegistryNode['status']>('planned')
  const [enabled, setEnabled] = useState(true)
  useEffect(() => {
    setTitle(node?.title ?? '')
    setSummary(node?.summary ?? '')
    setKey(node?.key ?? '')
    setStatus(node?.status ?? 'planned')
    setEnabled(node?.enabled ?? true)
  }, [node, open])
  const canSubmit = title.trim() && summary.trim()
  const kind = node?.kind ?? (parent ? childKind(parent.kind) : 'app')
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {node ? `Edit ${node.kind.replace('-', ' ')}` : `New ${kind.replace('-', ' ')}`}
          </DialogTitle>
          <DialogDescription>
            {node
              ? 'Update this registry node.'
              : `Add a ${kind.replace('-', ' ')} under ${parent?.title}.`}
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (canSubmit)
              void onSave({
                enabled,
                key: key.trim() || toKey(title),
                kind,
                status,
                summary: summary.trim(),
                title: title.trim(),
              })
          }}
        >
          <Field label="Name" value={title} onChange={setTitle} autoFocus />
          <Field label="Description" value={summary} onChange={setSummary} />
          {node ? (
            <>
              <Field label="Key" value={key} onChange={setKey} />
              <label className="grid gap-1.5 text-sm font-medium">
                Status
                <NativeSelect
                  onChange={(event) => setStatus(event.target.value as RegistryNode['status'])}
                  value={status}
                >
                  <option value="planned">Planned</option>
                  <option value="active">Active</option>
                  <option value="ready">Ready</option>
                  <option value="blocked">Blocked</option>
                </NativeSelect>
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  checked={enabled}
                  onChange={(event) => setEnabled(event.target.checked)}
                  type="checkbox"
                />
                Enabled
              </label>
            </>
          ) : null}
          <DialogFooter>
            <Button disabled={busy || !canSubmit} type="submit">
              {busy ? 'Saving…' : node ? 'Save changes' : `Create ${kind.replace('-', ' ')}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export type NodeFormInput = Pick<
  RegistryNode,
  'enabled' | 'key' | 'kind' | 'status' | 'summary' | 'title'
>

export function ProfileEntryDialog({
  busy,
  entry,
  onOpenChange,
  onSave,
  open,
  section,
}: {
  busy: boolean
  entry?: { id: string; key: string; value: string }
  onOpenChange: (open: boolean) => void
  onSave: (input: { id?: string; key: string; value: string }) => Promise<void>
  open: boolean
  section: RegistryProfileSection
}) {
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')
  useEffect(() => {
    setKey(entry?.key ?? '')
    setValue(entry?.value ?? '')
  }, [entry, open])
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {entry ? 'Edit' : 'Add'} {section} entry
          </DialogTitle>
          <DialogDescription>Record a concrete module specification.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (key.trim() && value.trim())
              void onSave({ id: entry?.id, key: key.trim(), value: value.trim() })
          }}
        >
          <Field label="Key" value={key} onChange={setKey} autoFocus />
          <Field label="Value" value={value} onChange={setValue} />
          <DialogFooter>
            <Button disabled={busy || !key.trim() || !value.trim()} type="submit">
              {busy ? 'Saving…' : 'Save entry'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  autoFocus,
  label,
  onChange,
  value,
}: {
  autoFocus?: boolean
  label: string
  onChange: (value: string) => void
  value: string
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <Input
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  )
}
function childKind(kind: RegistryNode['kind']): RegistryNode['kind'] {
  return (
    {
      app: 'module-group',
      module: 'module',
      'module-group': 'submodule-group',
      project: 'app',
      'submodule-group': 'module',
    } as const
  )[kind]
}
function toKey(value: string): string {
  return (
    value
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'item'
  )
}
