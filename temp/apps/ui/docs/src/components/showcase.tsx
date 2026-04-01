import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/ui/tabs";

interface ShowcaseProps {
  title: string;
  description: string;
  preview: React.ReactNode;
  code: string;
}

export function ComponentShowcase({ title, description, preview, code }: ShowcaseProps) {
  return (
    <div className="space-y-4 mb-10">
      <div className="space-y-1.5 align-top">
        <h3 className="font-heading text-2xl font-semibold tracking-tight">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <Tabs defaultValue="preview" className="relative mt-2 w-full">
        <TabsList className="w-full justify-start rounded-b-none p-0 bg-transparent border-b">
          <TabsTrigger
            value="preview"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            Preview
          </TabsTrigger>
          <TabsTrigger
            value="code"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            Code
          </TabsTrigger>
        </TabsList>
        <TabsContent value="preview" className="mt-0">
          <div className="flex min-h-[350px] w-full items-center justify-center rounded-b-lg border border-t-0 bg-background/50 p-10">
            {preview}
          </div>
        </TabsContent>
        <TabsContent value="code" className="mt-0">
          <div className="w-full rounded-b-lg rounded-t-none border border-t-0 bg-zinc-950 font-mono text-sm text-zinc-50 p-4 overflow-x-auto">
            <pre>
              <code>{code}</code>
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
