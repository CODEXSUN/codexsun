import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../../components/carousel'
import { Progress, ProgressLabel, ProgressValue } from '../../components/progress'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../../components/resizable'
import { ScrollArea } from '../../components/scroll-area'
import { Skeleton } from '../../components/skeleton'
import { Spinner } from '../../components/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/tabs'
import { GalleryCard } from './gallery-card'

export function GalleryData() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <GalleryCard description="Tables, tabs, and compact data navigation." name="Structured data">
        <Tabs className="w-full" defaultValue="table">
          <TabsList>
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="loading">Loading</TabsTrigger>
          </TabsList>
          <TabsContent value="table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>ui</TableCell>
                  <TableCell>Ready</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>platform</TableCell>
                  <TableCell>Wired</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TabsContent>
          <TabsContent className="space-y-2" value="loading">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </TabsContent>
        </Tabs>
      </GalleryCard>
      <GalleryCard
        description="Progress, spinner, and scrollable content."
        name="Progress & scroll"
      >
        <div className="w-full space-y-5">
          <Progress value={72}>
            <ProgressLabel>Coverage</ProgressLabel>
            <ProgressValue />
          </Progress>
          <div className="flex items-center gap-2 text-sm">
            <Spinner /> Loading preview
          </div>
          <ScrollArea className="h-24 rounded-lg border p-3">
            <div className="space-y-2 text-sm">
              {Array.from({ length: 8 }, (_, index) => (
                <p key={index}>Component record {index + 1}</p>
              ))}
            </div>
          </ScrollArea>
        </div>
      </GalleryCard>
      <GalleryCard description="Keyboard-operable horizontal content." name="Carousel">
        <Carousel className="w-[min(18rem,calc(100%-4rem))]">
          <CarouselContent>
            {['Primitives', 'Blocks', 'Layouts'].map((item) => (
              <CarouselItem key={item}>
                <div className="grid h-28 place-items-center rounded-xl border bg-muted/40 font-medium">
                  {item}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </GalleryCard>
      <GalleryCard description="Resizable adjacent workspace panels." name="Resizable panels">
        <ResizablePanelGroup
          className="h-32 w-full overflow-hidden rounded-xl border"
          orientation="horizontal"
        >
          <ResizablePanel defaultSize={45}>
            <div className="grid h-full place-items-center bg-muted/40 text-sm">Catalog</div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={55}>
            <div className="grid h-full place-items-center text-sm">Preview</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </GalleryCard>
    </div>
  )
}
