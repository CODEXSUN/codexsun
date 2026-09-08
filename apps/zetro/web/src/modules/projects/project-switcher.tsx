import { useState, type FormEvent } from 'react'
import {
  Archive,
  Check,
  ChevronsUpDown,
  EllipsisVertical,
  FolderGit2,
  Pencil,
  Plus,
  Settings,
} from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@codexsun/ui/components/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@codexsun/ui/components/dropdown-menu'
import { Input } from '@codexsun/ui/components/input'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@codexsun/ui/components/sidebar'
import { useProjects } from './projects.controller'
import { ProjectPropertiesSheet, type ProjectPropertiesSection } from './project-properties.sheet'
import type { ZetroProject } from './projects.types'

export function ProjectSwitcher({ disabled = false }: { disabled?: boolean }) {
  const { isMobile } = useSidebar()
  const projects = useProjects()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [repositoryPath, setRepositoryPath] = useState('')
  const [propertiesProject, setPropertiesProject] = useState<ZetroProject | null>(null)
  const [propertiesSection, setPropertiesSection] = useState<ProjectPropertiesSection>('settings')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const active = projects.activeProject

  if (!active) return null

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    try {
      await projects.addProject({ name: name.trim(), repositoryPath: repositoryPath.trim() })
      setDialogOpen(false)
      setName('')
      setRepositoryPath('')
      setSubmitError(null)
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : 'Zetro could not add this project.')
    } finally {
      setSubmitting(false)
    }
  }

  function openProperties(project: ZetroProject, section: ProjectPropertiesSection) {
    setPropertiesProject(project)
    setPropertiesSection(section)
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  className="cursor-pointer data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                  disabled={disabled}
                  size="lg"
                />
              }
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <FolderGit2 className="size-4" />
              </div>
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{active.name}</span>
                <span className="truncate text-xs text-muted-foreground">Project workspace</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="min-w-64 rounded-lg"
              side={isMobile ? 'bottom' : 'right'}
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel>Projects</DropdownMenuLabel>
                {projects.projects.map((project, index) => (
                  <div className="flex items-center gap-0.5" key={project.id}>
                    <DropdownMenuItem
                      className="min-w-0 flex-1 cursor-pointer gap-2 p-2"
                      onClick={() => projects.selectProject(project.id)}
                    >
                      <div className="flex size-6 items-center justify-center rounded-md border">
                        <FolderGit2 className="size-3.5" />
                      </div>
                      <span className="min-w-0 flex-1 truncate">{project.name}</span>
                      {project.id === active.id ? <Check className="size-4" /> : null}
                      <DropdownMenuShortcut>Ctrl {index + 1}</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger
                        aria-label={`Project actions for ${project.name}`}
                        className="size-8 justify-center px-0 [&>svg:last-child]:hidden"
                        title={`Project actions for ${project.name}`}
                      >
                        <EllipsisVertical className="size-4" />
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="min-w-40">
                        <DropdownMenuItem onClick={() => openProperties(project, 'rename')}>
                          <Pencil /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openProperties(project, 'settings')}>
                          <Settings /> Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openProperties(project, 'archive')}
                          variant="destructive"
                        >
                          <Archive /> Archive
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </div>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer gap-2 p-2"
                onClick={() => setDialogOpen(true)}
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <Plus className="size-4" />
                </div>
                <span className="font-medium text-muted-foreground">Add project</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
            <DialogHeader>
              <DialogTitle>Add project</DialogTitle>
              <DialogDescription>Connect an existing local repository to Zetro.</DialogDescription>
            </DialogHeader>
            <label className="grid gap-1.5 text-sm font-medium">
              Project name
              <Input
                autoFocus
                maxLength={80}
                onChange={(event) => setName(event.target.value)}
                value={name}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Repository path
              <Input
                maxLength={1024}
                onChange={(event) => setRepositoryPath(event.target.value)}
                placeholder="E:\\workspace\\project"
                value={repositoryPath}
              />
            </label>
            {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
            <DialogFooter>
              <Button
                className="cursor-pointer"
                disabled={submitting || !name.trim() || !repositoryPath.trim()}
                type="submit"
              >
                Add project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ProjectPropertiesSheet
        onClose={() => setPropertiesProject(null)}
        project={propertiesProject}
        section={propertiesSection}
      />
    </>
  )
}
