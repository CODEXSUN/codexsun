import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ui/components/ui/card'
import type { StructureSection } from '../model/structure-section'

interface FolderTreeProps {
  section: StructureSection
}

export function FolderTree({ section }: FolderTreeProps) {
  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader>
        <CardTitle>{section.title}</CardTitle>
        <CardDescription>{section.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {section.items.map((item) => (
          <div key={item.path} className="rounded-2xl border border-border/70 bg-background/70 p-4">
            <p className="font-mono text-sm font-medium text-foreground">{item.path}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.purpose}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
