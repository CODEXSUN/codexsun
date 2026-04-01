import { ComponentShowcase } from "../components/showcase";
import { Input } from "@ui/components/ui/input";
import { Label } from "@ui/components/ui/label";

export default function InputPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl border-b pb-4 mb-2">Input</h1>
        <p className="text-xl text-muted-foreground w-full">Displays a form input field or a component that looks like an input field.</p>
      </div>

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
    </div>
  );
}
