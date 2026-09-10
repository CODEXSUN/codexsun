import type { ReactNode } from 'react'
import { Badge } from '@codexsun/ui/components/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@codexsun/ui/components/card'

export function GalleryCard({
  children,
  description,
  name,
}: {
  children: ReactNode
  description: string
  name: string
}) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="border-b bg-muted/25">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">{name}</CardTitle>
          <Badge variant="outline">Live</Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-36 items-center justify-center p-6">
        {children}
      </CardContent>
    </Card>
  )
}
