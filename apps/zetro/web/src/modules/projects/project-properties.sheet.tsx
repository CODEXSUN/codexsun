import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Archive, Check, Pencil, Settings, Wrench, X } from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import { Input } from '@codexsun/ui/components/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@codexsun/ui/components/sheet'
import { ProjectLogo } from './project-logo'
import { ProjectSettingsForm, type ProjectSettingsValue } from './project-settings.form'
import { useProjects } from './projects.controller'
import type { ProjectUpdate, ZetroProject } from './projects.types'
import { ProjectDeveloperToolSettings } from '../developer-tools'
import { ProjectGitDeliverySettings } from '../git-delivery'

export type ProjectPropertiesSection = 'archive' | 'settings' | 'tools'

export function ProjectPropertiesSheet({
  onClose,
  projectId,
  section,
}: {
  onClose(): void
  projectId: string | null
  section: ProjectPropertiesSection
}) {
  const projects = useProjects()
  const project = useMemo(
    () => projects.projects.find(({ id }) => id === projectId) ?? null,
    [projectId, projects.projects],
  )
  const [activeSection, setActiveSection] = useState(section)
  const [editingName, setEditingName] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(() => createForm(project))
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setActiveSection(section)
    setEditingName(false)
    setError(null)
    setForm(createForm(project))
  }, [project, section])

  async function saveLabel() {
    if (!project || !form.name.trim() || form.name.trim() === project.name) {
      setEditingName(false)
      return
    }
    if (await changeProject({ name: form.name.trim() })) setEditingName(false)
  }

  async function saveSettings(event: FormEvent) {
    event.preventDefault()
    if (!project) return
    await changeProject({
      githubUrl: form.githubUrl.trim(),
      logoColor: form.logoColor,
      logoText: form.logoText.trim(),
      repositoryPath: form.repositoryPath.trim(),
      tagline: form.tagline.trim(),
    })
  }

  async function archiveProject() {
    if (!project) return
    if (await changeProject({ archived: true })) onClose()
  }

  async function changeProject(input: ProjectUpdate) {
    if (!project) return false
    setSubmitting(true)
    try {
      await projects.updateProject(project.id, input)
      setError(null)
      return true
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Zetro could not update this project.')
      return false
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Sheet open={project !== null} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-full gap-2 sm:max-w-lg">
          <SheetHeader className="gap-0 border-b p-3 pr-12">
            <div className="flex h-8 min-w-0 items-center gap-1">
              <ProjectLogo className="size-7" project={project ?? fallbackProject} />
              {editingName ? (
                <>
                  <SheetTitle className="sr-only">{project?.name}</SheetTitle>
                  <Input
                    aria-label="Project label"
                    autoFocus
                    className="h-8 min-w-0 flex-1 font-semibold"
                    maxLength={80}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    value={form.name}
                  />
                  <Button
                    aria-label="Save project label"
                    className="cursor-pointer"
                    disabled={submitting || !form.name.trim()}
                    onClick={() => void saveLabel()}
                    size="icon-xs"
                    variant="ghost"
                  >
                    <Check />
                  </Button>
                  <Button
                    aria-label="Cancel project label edit"
                    className="cursor-pointer"
                    onClick={() => {
                      setForm({ ...form, name: project?.name ?? '' })
                      setEditingName(false)
                    }}
                    size="icon-xs"
                    variant="ghost"
                  >
                    <X />
                  </Button>
                </>
              ) : (
                <>
                  <SheetTitle className="min-w-0 flex-1 truncate font-semibold">
                    {project?.name}
                  </SheetTitle>
                  <Button
                    aria-label="Edit project label"
                    className="cursor-pointer"
                    onClick={() => setEditingName(true)}
                    size="icon-xs"
                    title="Edit project label"
                    variant="ghost"
                  >
                    <Pencil />
                  </Button>
                </>
              )}
            </div>
            <SheetDescription className="sr-only">
              Project settings and archive controls.
            </SheetDescription>
          </SheetHeader>
          <nav aria-label="Project property sections" className="grid grid-cols-3 gap-1 px-3">
            <SectionButton
              active={activeSection === 'settings'}
              icon={Settings}
              label="Settings"
              onClick={() => setActiveSection('settings')}
            />
            <SectionButton
              active={activeSection === 'tools'}
              icon={Wrench}
              label="Tools"
              onClick={() => setActiveSection('tools')}
            />
            <SectionButton
              active={activeSection === 'archive'}
              icon={Archive}
              label="Archive"
              onClick={() => setActiveSection('archive')}
            />
          </nav>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
            {activeSection === 'settings' && project ? (
              <ProjectSettingsForm
                form={form}
                onChange={setForm}
                onSubmit={(event) => void saveSettings(event)}
                project={project}
                submitting={submitting}
              />
            ) : null}
            {activeSection === 'archive' ? (
              <div className="grid gap-4 pt-2">
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
            {activeSection === 'tools' ? (
              <div className="grid gap-6">
                <ProjectDeveloperToolSettings />
                <ProjectGitDeliverySettings />
              </div>
            ) : null}
            {error ? <p className="pt-3 text-sm text-destructive">{error}</p> : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function SectionButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: typeof Settings
  label: string
  onClick(): void
}) {
  return (
    <Button
      aria-current={active ? 'page' : undefined}
      className="h-9 cursor-pointer"
      onClick={onClick}
      variant={active ? 'secondary' : 'ghost'}
    >
      <Icon /> {label}
    </Button>
  )
}

function createForm(project: ZetroProject | null): ProjectSettingsValue {
  return {
    githubUrl: project?.githubUrl ?? '',
    logoColor: project?.logoColor ?? '#18181b',
    logoText: project?.logoText ?? '',
    name: project?.name ?? '',
    repositoryPath: project?.repositoryPath ?? '',
    tagline: project?.tagline ?? '',
  }
}

const fallbackProject = { logoColor: '#18181b', logoText: '', name: '' }
