import { useEffect, useState, type FormEvent } from 'react'
import { Archive, FolderGit2, Pencil, Settings } from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import { Input } from '@codexsun/ui/components/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@codexsun/ui/components/sheet'
import { useProjects } from './projects.controller'
import type { ZetroProject } from './projects.types'

export type ProjectPropertiesSection = 'archive' | 'rename' | 'settings'

export function ProjectPropertiesSheet({
  onClose,
  project,
  section,
}: {
  onClose(): void
  project: ZetroProject | null
  section: ProjectPropertiesSection
}) {
  const projects = useProjects()
  const [activeSection, setActiveSection] = useState(section)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState(project?.name ?? '')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setActiveSection(section)
    setName(project?.name ?? '')
    setError(null)
  }, [project, section])

  async function saveName(event: FormEvent) {
    event.preventDefault()
    if (!project || !name.trim() || name.trim() === project.name) return
    await runChange(() => projects.updateProject(project.id, { name: name.trim() }))
  }

  async function archiveProject() {
    if (!project) return
    await runChange(() => projects.updateProject(project.id, { archived: true }))
  }

  async function runChange(change: () => Promise<ZetroProject>) {
    setSubmitting(true)
    try {
      await change()
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Zetro could not update this project.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={project !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader className="border-b pr-12">
          <SheetTitle>Project properties</SheetTitle>
          <SheetDescription>{project?.name}</SheetDescription>
        </SheetHeader>
        <nav aria-label="Project property sections" className="grid grid-cols-3 gap-1 px-4">
          <SectionButton
            active={activeSection === 'rename'}
            icon={Pencil}
            label="Rename"
            onClick={() => setActiveSection('rename')}
          />
          <SectionButton
            active={activeSection === 'settings'}
            icon={Settings}
            label="Settings"
            onClick={() => setActiveSection('settings')}
          />
          <SectionButton
            active={activeSection === 'archive'}
            icon={Archive}
            label="Archive"
            onClick={() => setActiveSection('archive')}
          />
        </nav>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {activeSection === 'rename' ? (
            <form className="grid gap-4 pt-4" onSubmit={(event) => void saveName(event)}>
              <label className="grid gap-1.5 text-sm font-medium">
                Project name
                <Input
                  autoFocus
                  maxLength={80}
                  onChange={(event) => setName(event.target.value)}
                  value={name}
                />
              </label>
              <Button
                className="w-fit cursor-pointer"
                disabled={submitting || !name.trim() || name.trim() === project?.name}
                type="submit"
              >
                Save name
              </Button>
            </form>
          ) : null}
          {activeSection === 'settings' && project ? <ProjectSettings project={project} /> : null}
          {activeSection === 'archive' ? (
            <div className="grid gap-4 pt-4">
              <div>
                <h2 className="font-medium">Archive project</h2>
                <p className="pt-1 text-sm text-muted-foreground">
                  Remove this project from the active project switcher.
                </p>
              </div>
              <Button
                className="w-fit cursor-pointer"
                disabled={submitting || projects.projects.length === 1}
                onClick={() => void archiveProject()}
                variant="destructive"
              >
                <Archive /> Archive project
              </Button>
              {projects.projects.length === 1 ? (
                <p className="text-sm text-muted-foreground">
                  Add another project before archiving this project.
                </p>
              ) : null}
            </div>
          ) : null}
          {error ? <p className="pt-4 text-sm text-destructive">{error}</p> : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function SectionButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: typeof Pencil
  label: string
  onClick(): void
}) {
  return (
    <Button
      aria-current={active ? 'page' : undefined}
      className="cursor-pointer justify-start"
      onClick={onClick}
      variant={active ? 'secondary' : 'ghost'}
    >
      <Icon /> {label}
    </Button>
  )
}

function ProjectSettings({ project }: { project: ZetroProject }) {
  return (
    <dl className="grid gap-4 pt-4">
      <div className="flex items-center gap-2">
        <FolderGit2 className="size-4 text-muted-foreground" />
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground">Repository</dt>
          <dd className="truncate font-medium" title={project.repositoryPath}>
            {project.repositoryPath}
          </dd>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 border-t pt-4">
        <div>
          <dt className="text-xs text-muted-foreground">Created</dt>
          <dd className="pt-1">{formatDate(project.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Updated</dt>
          <dd className="pt-1">{formatDate(project.updatedAt)}</dd>
        </div>
      </div>
    </dl>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  )
}
