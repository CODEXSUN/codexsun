import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ui/components/ui/card'
import type { PackageGroup } from '../model/package-group'

interface PackageGridProps {
  groups: PackageGroup[]
}

export function PackageGrid({ groups }: PackageGridProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {groups.map((group) => (
        <Card key={group.title} className="border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle>{group.title}</CardTitle>
            <CardDescription>Only the packages needed for this scaffold.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.items.map((item) => (
              <div key={item.name} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="font-medium text-foreground">{item.name}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.reason}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
