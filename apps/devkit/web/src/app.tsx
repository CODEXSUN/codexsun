import { MdiMain } from '@codexsun/ui/layouts/mdi-main'
import { Boxes, FolderKanban } from 'lucide-react'
import { ProjectRegistryWorkspace } from './modules/project-registry/project-registry.workspace'

export function App() {
  return (
    <MdiMain
      applicationIcon={Boxes}
      applicationId="devkit"
      applicationName="DevKit"
      navigation={[
        {
          defaultOpen: true,
          label: 'Planning',
          items: [{ active: true, icon: FolderKanban, label: 'Project registry' }],
        },
      ]}
      primaryAction={null}
      searchPlaceholder="Search planning"
      showAppearancePanel={false}
      workspaceTitle="DevKit"
    >
      <ProjectRegistryWorkspace />
    </MdiMain>
  )
}
