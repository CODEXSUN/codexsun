import { useEffect, useState, type FormEvent } from 'react'
import { FolderKanban, FolderOpen } from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import { Input } from '@codexsun/ui/components/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@codexsun/ui/components/sheet'
import { ProjectDirectoryBrowser, useProjects } from '../projects'
import { useAgentChat } from './agent-chat.controller'
import type { ChatWorkspaceScope } from './agent-chat.types'

export function AgentChatScopeSheet() {
  const chat = useAgentChat()
  const { activeProject } = useProjects()
  const [browserOpen, setBrowserOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<ChatWorkspaceScope>(emptyScope)

  useEffect(() => {
    if (chat.scopeOpen) {
      setForm(chat.scope ?? emptyScope)
      setError(null)
    }
  }, [chat.scope, chat.scopeOpen])

  if (!activeProject) return null

  function selectFolder(path: string) {
    const folderPath = toRelativePath(activeProject!.repositoryPath, path)
    if (!folderPath) {
      setError('Choose an application or module folder below the project root.')
      return
    }
    const inferred = inferScope(folderPath)
    setForm((current) => ({
      application: inferred.application || current.application,
      folderPath,
      module: inferred.module || current.module,
    }))
    setError(null)
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!form.application.trim() || !form.folderPath.trim()) return
    void chat.saveScope({
      application: form.application.trim(),
      folderPath: normalizeRelativePath(form.folderPath),
      module: form.module.trim(),
    })
  }

  return (
    <>
      <Sheet open={chat.scopeOpen} onOpenChange={chat.setScopeOpen}>
        <SheetContent className="w-full gap-0 sm:max-w-md">
          <SheetHeader className="border-b p-4 pr-12">
            <div className="flex items-center gap-2">
              <FolderKanban className="size-4" />
              <SheetTitle>Chat workspace</SheetTitle>
            </div>
            <SheetDescription>
              Connect this chat to one application or module folder.
            </SheetDescription>
          </SheetHeader>
          <form className="grid gap-4 p-4" onSubmit={submit}>
            <label className="grid gap-1.5 text-sm font-medium">
              Application
              <Input
                maxLength={80}
                onChange={(event) => setForm({ ...form, application: event.target.value })}
                placeholder="zetro"
                value={form.application}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Module
              <Input
                maxLength={120}
                onChange={(event) => setForm({ ...form, module: event.target.value })}
                placeholder="agent-chat"
                value={form.module}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Connected folder
              <div className="flex gap-2">
                <Input
                  className="min-w-0 flex-1 font-mono text-xs"
                  onChange={(event) => setForm({ ...form, folderPath: event.target.value })}
                  placeholder="apps/zetro/web/src/modules/agent-chat"
                  value={form.folderPath}
                />
                <Button
                  aria-label="Browse project folders"
                  className="cursor-pointer"
                  onClick={() => setBrowserOpen(true)}
                  size="icon"
                  title="Browse project folders"
                  type="button"
                  variant="outline"
                >
                  <FolderOpen />
                </Button>
              </div>
            </label>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button
              className="w-fit cursor-pointer"
              disabled={chat.isBusy || !form.application.trim() || !form.folderPath.trim()}
              type="submit"
            >
              Connect folder
            </Button>
          </form>
        </SheetContent>
      </Sheet>
      <ProjectDirectoryBrowser
        onOpenChange={setBrowserOpen}
        onSelect={selectFolder}
        open={browserOpen}
        rootPath={activeProject.repositoryPath}
        startPath={toAbsolutePath(activeProject.repositoryPath, form.folderPath)}
      />
    </>
  )
}

const emptyScope: ChatWorkspaceScope = { application: '', folderPath: '', module: '' }

function inferScope(folderPath: string): Pick<ChatWorkspaceScope, 'application' | 'module'> {
  const segments = normalizeRelativePath(folderPath).split('/')
  const modulesIndex = segments.lastIndexOf('modules')
  return {
    application: segments[0] === 'apps' ? (segments[1] ?? '') : '',
    module: modulesIndex >= 0 ? (segments[modulesIndex + 1] ?? '') : '',
  }
}

function normalizeRelativePath(path: string) {
  return path.trim().replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/$/, '')
}

function toAbsolutePath(root: string, folderPath: string) {
  if (!folderPath.trim()) return root
  const normalizedFolder = normalizeRelativePath(folderPath)
  if (normalizedFolder.split('/').some((segment) => segment === '..')) return root
  const separator = root.includes('\\') ? '\\' : '/'
  return `${root.replace(/[\\/]$/, '')}${separator}${normalizedFolder.replaceAll('/', separator)}`
}

function toRelativePath(root: string, selected: string) {
  const displayRoot = normalizeAbsolutePath(root)
  const displaySelected = normalizeAbsolutePath(selected)
  const prefix = `${displayRoot}/`
  if (!displaySelected.toLowerCase().startsWith(prefix.toLowerCase())) return ''
  return displaySelected.slice(prefix.length)
}

function normalizeAbsolutePath(path: string) {
  return path.replaceAll('\\', '/').replace(/\/$/, '')
}
