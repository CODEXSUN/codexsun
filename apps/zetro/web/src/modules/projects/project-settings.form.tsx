import { useState, type FormEvent } from 'react'
import { FolderOpen } from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import { Input } from '@codexsun/ui/components/input'
import { ProjectDirectoryBrowser } from './project-directory-browser'
import { pickDesktopRepositoryFolder } from './desktop-folder-picker'
import { ProjectLogo } from './project-logo'
import type { ZetroProject } from './projects.types'

export type ProjectSettingsValue = {
  githubUrl: string
  logoColor: string
  logoText: string
  name: string
  repositoryPath: string
  tagline: string
}

export function ProjectSettingsForm({
  form,
  onChange,
  onSubmit,
  project,
  submitting,
}: {
  form: ProjectSettingsValue
  onChange(value: ProjectSettingsValue): void
  onSubmit(event: FormEvent): void
  project: ZetroProject
  submitting: boolean
}) {
  const [browserOpen, setBrowserOpen] = useState(false)

  async function browseRepository() {
    const selected = await pickDesktopRepositoryFolder(
      form.repositoryPath || project.repositoryPath,
    )
    if (selected === undefined) setBrowserOpen(true)
    else if (selected) onChange({ ...form, repositoryPath: selected })
  }

  return (
    <>
      <form className="grid gap-4 pt-2" onSubmit={onSubmit}>
        <label className="grid gap-1.5 text-sm font-medium">
          Repository path
          <div className="flex gap-2">
            <Input
              className="min-w-0 flex-1"
              maxLength={1024}
              onChange={(event) => onChange({ ...form, repositoryPath: event.target.value })}
              value={form.repositoryPath}
            />
            <Button
              aria-label="Browse repository folders"
              className="cursor-pointer"
              onClick={() => void browseRepository()}
              type="button"
              variant="outline"
            >
              <FolderOpen /> Browse
            </Button>
          </div>
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          GitHub URL
          <Input
            inputMode="url"
            maxLength={2048}
            onChange={(event) => onChange({ ...form, githubUrl: event.target.value })}
            placeholder="https://github.com/owner/repository"
            value={form.githubUrl}
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Tagline
          <Input
            maxLength={160}
            onChange={(event) => onChange({ ...form, tagline: event.target.value })}
            placeholder="Describe this project"
            value={form.tagline}
          />
        </label>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <label className="grid gap-1.5 text-sm font-medium">
            Logo text
            <Input
              className="uppercase"
              maxLength={3}
              onChange={(event) => onChange({ ...form, logoText: event.target.value })}
              value={form.logoText}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Color
            <input
              aria-label="Project color"
              className="h-10 w-14 cursor-pointer rounded-md border bg-background p-1"
              onChange={(event) => onChange({ ...form, logoColor: event.target.value })}
              type="color"
              value={form.logoColor}
            />
          </label>
        </div>
        <div className="flex items-center gap-2 border-y py-3">
          <ProjectLogo project={{ ...project, ...form }} />
          <div className="min-w-0">
            <div className="truncate font-semibold">{form.name || project.name}</div>
            <div className="truncate text-xs text-muted-foreground">{form.tagline}</div>
          </div>
        </div>
        <Button
          className="w-fit cursor-pointer"
          disabled={submitting || !form.repositoryPath.trim() || !form.logoText.trim()}
          type="submit"
        >
          Save settings
        </Button>
        <ProjectDates project={project} />
      </form>
      <ProjectDirectoryBrowser
        onOpenChange={setBrowserOpen}
        onSelect={(repositoryPath) => onChange({ ...form, repositoryPath })}
        open={browserOpen}
        startPath={form.repositoryPath || project.repositoryPath}
      />
    </>
  )
}

function ProjectDates({ project }: { project: ZetroProject }) {
  return (
    <dl className="grid grid-cols-2 gap-4 border-t pt-3 text-sm">
      <div>
        <dt className="text-xs text-muted-foreground">Created</dt>
        <dd className="pt-1">{formatDate(project.createdAt)}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Updated</dt>
        <dd className="pt-1">{formatDate(project.updatedAt)}</dd>
      </div>
    </dl>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  )
}
