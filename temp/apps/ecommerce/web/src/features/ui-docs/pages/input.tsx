import { Input } from '@ui/components/ui/input'
import { Label } from '@ui/components/ui/label'
import { ComponentShowcase } from '../components/showcase'
import { UiDocsPageShell } from '../components/docs-page-shell'

export default function InputPage() {
  return (
    <UiDocsPageShell
      title="Input"
      description="Form field primitives for admin data entry, authentication, search, and setup flows."
      activeHref="/admin/dashboard/ui/input"
    >
      <ComponentShowcase
        title="Default"
        description="The default input field."
        preview={<Input type="email" placeholder="Email" className="max-w-xs" />}
        code={`import { Input } from "@ui/components/ui/input"\n\nexport function InputDemo() {\n  return <Input type="email" placeholder="Email" />\n}`}
      />

      <ComponentShowcase
        title="With Label"
        description="An input field with a label."
        preview={
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input type="email" id="email" placeholder="Email" />
          </div>
        }
        code={`import { Input } from "@ui/components/ui/input"\nimport { Label } from "@ui/components/ui/label"\n\nexport function InputWithLabel() {\n  return (\n    <div className="grid w-full max-w-sm items-center gap-1.5">\n      <Label htmlFor="email">Email</Label>\n      <Input type="email" id="email" placeholder="Email" />\n    </div>\n  )\n}`}
      />
    </UiDocsPageShell>
  )
}
