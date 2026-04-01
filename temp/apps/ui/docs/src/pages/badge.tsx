import { ComponentShowcase } from "../components/showcase";
import { Badge } from "@ui/components/ui/badge";

export default function BadgePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl border-b pb-4 mb-2">Badge</h1>
        <p className="text-xl text-muted-foreground w-full">Displays a badge or a component that looks like a badge.</p>
      </div>

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
    </div>
  );
}
