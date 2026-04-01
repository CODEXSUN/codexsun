import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/components/ui/tabs'

interface ShowcaseProps {
  title: string;
  description: string;
  preview: React.ReactNode;
  code: string;
}

export function ComponentShowcase({ title, description, preview, code }: ShowcaseProps) {
  return (
    <Card className="overflow-hidden border-border/70">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="text-2xl tracking-tight">{title}</CardTitle>
        <CardDescription className="text-sm leading-7">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="preview" className="w-full">
          <div className="border-b border-border/60 px-4 pt-3">
            <TabsList className="h-auto rounded-full bg-muted/50 p-1">
              <TabsTrigger value="preview" className="rounded-full px-4 py-1.5">Preview</TabsTrigger>
              <TabsTrigger value="code" className="rounded-full px-4 py-1.5">Code</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="preview" className="m-0">
            <div className="flex min-h-[240px] w-full items-center justify-center bg-background/70 p-10">
              {preview}
            </div>
          </TabsContent>
          <TabsContent value="code" className="m-0">
            <div className="w-full overflow-x-auto bg-zinc-950 p-5 font-mono text-sm text-zinc-50">
              <pre>
                <code>{code}</code>
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
