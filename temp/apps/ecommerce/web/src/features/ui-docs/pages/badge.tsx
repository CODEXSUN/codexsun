import { Badge } from '@ui/components/ui/badge'
import { ComponentShowcase } from '../components/showcase'
import { UiDocsPageShell } from '../components/docs-page-shell'

export default function BadgePage() {
  return (
    <UiDocsPageShell
      title="Badge"
      description="Compact status labels for readiness, metadata, and small semantic markers."
      activeHref="/admin/dashboard/ui/badge"
    >
      <ComponentShowcase
        title="Default"
        description="The default badge."
        preview={<Badge>Badge</Badge>}
        code={`import { Badge } from "@ui/components/ui/badge"\n\nexport function BadgeDemo() {\n  return <Badge>Badge</Badge>\n}`}
      />

      <ComponentShowcase
        title="Variants"
        description="Other available variants."
        preview={
          <div className="flex gap-4">
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        }
        code={`<Badge variant="secondary">Secondary</Badge>\n<Badge variant="destructive">Destructive</Badge>\n<Badge variant="outline">Outline</Badge>`}
      />
    </UiDocsPageShell>
  )
}
