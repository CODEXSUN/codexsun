import { useEffect, useMemo, useState } from 'react'
import type {
  RegistryNode,
  RegistryProfileSection,
  RegistryResponse,
} from '@codexsun/devkit-contracts'
import { Badge } from '@codexsun/ui/components/badge'
import { Button } from '@codexsun/ui/components/button'
import { NodeUpsertDialog, type NodeFormInput } from './project-registry.dialogs'
import { ProjectRegistryBrowser } from './project-registry.browser'
import { ProjectRegistryProfile } from './project-registry.profile'
import {
  createNode,
  fetchRegistry,
  updateNode,
  upsertProfileEntry,
} from './project-registry.services'

export function ProjectRegistryWorkspace() {
  const [registry, setRegistry] = useState<RegistryResponse>()
  const [currentId, setCurrentId] = useState('')
  const [profileId, setProfileId] = useState<string>()
  const [editing, setEditing] = useState<RegistryNode>()
  const [createOpen, setCreateOpen] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const reload = () =>
    fetchRegistry()
      .then(setRegistry)
      .catch((reason: unknown) => setError(toMessage(reason)))

  useEffect(() => {
    void reload()
  }, [])

  const current = useMemo(
    () => registry && (findNode(registry.root, currentId) ?? registry.root),
    [currentId, registry],
  )
  const profile = useMemo(
    () => registry && profileId && findNode(registry.root, profileId),
    [profileId, registry],
  )
  const profileParent = useMemo(
    () => (registry && profileId ? findParent(registry.root, profileId) : undefined),
    [profileId, registry],
  )

  async function saveNode(input: NodeFormInput) {
    if (!current) return
    setSaving(true)
    setError('')
    try {
      if (editing) await updateNode(editing.id, input)
      else
        await createNode({
          kind: input.kind,
          parentId: current.id,
          summary: input.summary,
          title: input.title,
        })
      setCreateOpen(false)
      setEditing(undefined)
      await reload()
    } catch (reason: unknown) {
      setError(toMessage(reason))
    } finally {
      setSaving(false)
    }
  }

  async function saveProfileEntry(
    section: RegistryProfileSection,
    entry: { id?: string; key: string; value: string },
  ) {
    if (!profile) return
    setSaving(true)
    setError('')
    try {
      await upsertProfileEntry(profile.id, section, entry)
      await reload()
    } catch (reason: unknown) {
      setError(toMessage(reason))
    } finally {
      setSaving(false)
    }
  }

  if (!registry && !error)
    return (
      <main className="min-h-full px-5 py-10 sm:px-8 lg:px-10">
        <p className="text-sm text-muted-foreground">Loading project registry…</p>
      </main>
    )
  if (!registry || !current)
    return (
      <main className="min-h-full px-5 py-10 sm:px-8 lg:px-10">
        <Badge variant="destructive">Registry unavailable</Badge>
        <p className="mt-4 text-sm text-muted-foreground">
          {error || 'The selected registry node no longer exists.'}
        </p>
        <Button className="mt-5" onClick={() => void reload()}>
          Retry
        </Button>
      </main>
    )

  return (
    <main className={profile ? 'min-h-full' : 'min-h-full px-5 py-8 sm:px-8 lg:px-10'}>
      {error ? (
        <p
          className={
            profile
              ? 'px-5 pt-5 text-sm text-destructive sm:px-8 lg:px-10'
              : 'mb-4 text-sm text-destructive'
          }
        >
          {error}
        </p>
      ) : null}
      {profile ? (
        <ProjectRegistryProfile
          busy={saving}
          node={profile}
          parent={profileParent}
          onBack={() => setProfileId(undefined)}
          onEdit={() => {
            setEditing(profile)
            setCreateOpen(true)
          }}
          onRefresh={() => void reload()}
          onSaveEntry={saveProfileEntry}
        />
      ) : (
        <ProjectRegistryBrowser
          node={current}
          onBack={() => setCurrentId(parentId(registry.root, current.id) ?? registry.root.id)}
          onCreate={() => {
            setEditing(undefined)
            setCreateOpen(true)
          }}
          onEdit={(node) => {
            setEditing(node)
            setCreateOpen(true)
          }}
          onOpen={(node) => setCurrentId(node.id)}
          onProfile={(node) => setProfileId(node.id)}
          onRefresh={() => void reload()}
        />
      )}
      <NodeUpsertDialog
        busy={saving}
        node={editing}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) setEditing(undefined)
        }}
        onSave={saveNode}
        open={createOpen}
        parent={editing ? undefined : current}
      />
    </main>
  )
}

function findNode(node: RegistryNode, id: string): RegistryNode | undefined {
  return node.id === id ? node : node.children.map((child) => findNode(child, id)).find(Boolean)
}
function parentId(node: RegistryNode, childId: string): string | undefined {
  if (node.children.some((child) => child.id === childId)) return node.id
  return node.children.map((child) => parentId(child, childId)).find(Boolean)
}
function findParent(node: RegistryNode, childId: string): RegistryNode | undefined {
  if (node.children.some((child) => child.id === childId)) return node
  return node.children.map((child) => findParent(child, childId)).find(Boolean)
}
function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Project registry is unavailable.'
}
