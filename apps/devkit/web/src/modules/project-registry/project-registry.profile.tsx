import { useState } from 'react'
import type { RegistryNode, RegistryProfileSection } from '@codexsun/devkit-contracts'
import { Button } from '@codexsun/ui/components/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@codexsun/ui/components/tabs'
import { ArrowLeft, Pencil, RotateCcw } from 'lucide-react'
import { ProfileEntryDialog } from './project-registry.dialogs'
import {
  ModuleInformationTable,
  ProfileEntriesTable,
  RegistryMetadataTable,
} from './project-registry.profile-tables'

const sections = ['database', 'routes', 'files', 'actions', 'events', 'planning'] as const
type ProfileTab = 'info' | (typeof sections)[number]

export function ProjectRegistryProfile({
  busy,
  node,
  parent,
  onBack,
  onEdit,
  onRefresh,
  onSaveEntry,
}: {
  busy: boolean
  node: RegistryNode
  parent?: RegistryNode
  onBack: () => void
  onEdit: () => void
  onRefresh: () => void
  onSaveEntry: (
    section: RegistryProfileSection,
    entry: { id?: string; key: string; value: string },
  ) => Promise<void>
}) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('info')
  const [entry, setEntry] = useState<{ id: string; key: string; value: string }>()
  const [dialogOpen, setDialogOpen] = useState(false)
  const openEntry = (next?: { id: string; key: string; value: string }) => {
    setEntry(next)
    setDialogOpen(true)
  }
  return (
    <section className="pb-[calc(12rem+env(safe-area-inset-bottom))]">
      <header className="flex min-h-12 items-center justify-between gap-3 border-b bg-muted/20 px-5 sm:px-8 lg:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <Button onClick={onBack} size="sm" variant="outline">
            <ArrowLeft />
            Back
          </Button>
          <h1 className="truncate text-base font-semibold tracking-tight">{node.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button aria-label="Refresh profile" onClick={onRefresh} size="icon-sm" variant="outline">
            <RotateCcw />
          </Button>
          <Button onClick={onEdit} size="sm" variant="outline">
            <Pencil />
            Edit
          </Button>
        </div>
      </header>
      <div className="px-5 pt-5 sm:px-8 lg:px-10">
        <Tabs
          defaultValue="info"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as ProfileTab)}
        >
          <TabsList
            className="h-auto max-w-full flex-wrap justify-start gap-3 border-b p-0"
            variant="line"
          >
            <TabsTrigger value="info">Info</TabsTrigger>
            {sections.map((item) => (
              <TabsTrigger key={item} value={item} className="capitalize">
                {item}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent
            value="info"
            className="pt-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200"
          >
            <InfoPanel node={node} onAdd={() => openEntry()} onEdit={openEntry} parent={parent} />
          </TabsContent>
          {sections.map((item) => (
            <TabsContent
              className="pt-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200"
              key={item}
              value={item}
            >
              <SpecificationTable
                entries={node.profile[item]}
                onAdd={() => openEntry()}
                onEdit={openEntry}
                section={item}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
      <ProfileEntryDialog
        busy={busy}
        entry={entry}
        onOpenChange={setDialogOpen}
        onSave={(input) => onSaveEntry(activeTab, input).then(() => setDialogOpen(false))}
        open={dialogOpen}
        section={activeTab}
      />
    </section>
  )
}

function InfoPanel({
  node,
  onAdd,
  onEdit,
  parent,
}: {
  node: RegistryNode
  onAdd: () => void
  onEdit: (entry: { id: string; key: string; value: string }) => void
  parent?: RegistryNode
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <ModuleInformationTable node={node} />
        <RegistryMetadataTable node={node} parent={parent} />
      </div>
      <ProfileEntriesTable
        entries={node.profile.info}
        onAdd={onAdd}
        onEdit={onEdit}
        section="additional information"
        title="Additional information"
      />
    </div>
  )
}
function SpecificationTable({
  entries,
  onAdd,
  onEdit,
  section,
}: {
  entries: { id: string; key: string; value: string }[]
  onAdd: () => void
  onEdit: (entry: { id: string; key: string; value: string }) => void
  section: string
}) {
  return (
    <ProfileEntriesTable
      entries={entries}
      onAdd={onAdd}
      onEdit={onEdit}
      section={section}
      title={section}
    />
  )
}
