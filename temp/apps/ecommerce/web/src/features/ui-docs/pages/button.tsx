import { Button } from '@ui/components/ui/button'
import { ComponentShowcase } from '../components/showcase'
import { UiDocsPageShell } from '../components/docs-page-shell'

export default function ButtonPage() {
  return (
    <UiDocsPageShell
      title="Button"
      description="Action controls for primary, secondary, destructive, and low-emphasis interaction patterns."
      activeHref="/admin/dashboard/ui/button"
    >
      <ComponentShowcase
        title="Primary"
        description="The default button styling."
        preview={<Button>Default Button</Button>}
        code={`import { Button } from "@ui/components/ui/button"\n\nexport function ButtonDemo() {\n  return <Button>Default Button</Button>\n}`}
      />

      <ComponentShowcase
        title="Variants"
        description="Available button variants."
        preview={
          <div className="flex flex-wrap gap-4">
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
        }
        code={`<Button variant="secondary">Secondary</Button>\n<Button variant="destructive">Destructive</Button>\n<Button variant="outline">Outline</Button>\n<Button variant="ghost">Ghost</Button>\n<Button variant="link">Link</Button>`}
      />
    </UiDocsPageShell>
  )
}
