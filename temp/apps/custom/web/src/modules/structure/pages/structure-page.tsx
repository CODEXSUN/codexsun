import { customAppArchitecture } from '@custom-domain/manifest'
import { PageSection } from '@/shared/ui/page-section'
import { FolderTree } from '../components/folder-tree'
import type { StructureSection } from '../model/structure-section'

const sections: StructureSection[] = [
  {
    title: 'Server folders',
    description: 'The backend gets its own bootstrap, config, and module tree.',
    items: customAppArchitecture.serverFolders,
  },
  {
    title: 'Frontend folders',
    description: 'The frontend shell stays thin while modules own page-level work.',
    items: customAppArchitecture.frontendFolders,
  },
]

export function StructurePage() {
  return (
    <div className="space-y-10">
      <PageSection
        eyebrow="Folder map"
        title="Server and frontend roots are separate from the start"
        description="This is the target shape for the custom app before adding business-specific modules."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          {sections.map((section) => (
            <FolderTree key={section.title} section={section} />
          ))}
        </div>
      </PageSection>
    </div>
  )
}
