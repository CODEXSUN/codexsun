import { ComponentShowcase } from "../components/showcase";
import { Button } from "@ui/components/ui/button";

export default function ButtonPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl border-b pb-4 mb-2">Button</h1>
        <p className="text-xl text-muted-foreground w-full">Displays a button or a component that looks like a button.</p>
      </div>

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
    </div>
  );
}
