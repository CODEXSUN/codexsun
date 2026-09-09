import { Box, Info } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { AspectRatio } from '../../components/aspect-ratio'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '../../components/avatar'
import { Badge } from '../../components/badge'
import { Calendar } from '../../components/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../../components/carousel'
import { ChartContainer, type ChartConfig } from '../../components/chart'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../components/collapsible'
import { DirectionProvider } from '../../components/direction'
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '../../components/item'
import { Kbd, KbdGroup } from '../../components/kbd'
import { Marker, MarkerContent, MarkerIcon } from '../../components/marker'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../../components/resizable'
import { ScrollArea } from '../../components/scroll-area'
import { Separator } from '../../components/separator'
import { SpecimenStage } from './component-specimen-stage'

type SpecimenProps = { compact: boolean; componentId: string }

export function DataSpecimen({ componentId, compact }: SpecimenProps) {
  return <SpecimenStage compact={compact}>{renderSpecimen(componentId, compact)}</SpecimenStage>
}

const chartData = [
  { month: 'Jan', total: 42 },
  { month: 'Feb', total: 67 },
  { month: 'Mar', total: 54 },
  { month: 'Apr', total: 82 },
]
const chartConfig = { total: { color: 'var(--primary)', label: 'Total' } } satisfies ChartConfig

function renderSpecimen(componentId: string, compact: boolean) {
  if (componentId === 'avatar') {
    return (
      <AvatarGroup>
        <Avatar size={compact ? 'sm' : 'default'}>
          <AvatarFallback>CS</AvatarFallback>
        </Avatar>
        <Avatar size={compact ? 'sm' : 'default'}>
          <AvatarFallback>UI</AvatarFallback>
        </Avatar>
        <AvatarGroupCount>+4</AvatarGroupCount>
      </AvatarGroup>
    )
  }
  if (componentId === 'badge') {
    return (
      <div className="flex flex-wrap gap-2">
        <Badge>Default</Badge>
        <Badge variant="secondary">Preview</Badge>
        <Badge variant="outline">Stable</Badge>
      </div>
    )
  }
  if (componentId === 'calendar') return <Calendar className="rounded-lg border" mode="single" />
  if (componentId === 'card') {
    return (
      <Card className="w-full max-w-sm" size={compact ? 'sm' : 'default'}>
        <CardHeader>
          <CardTitle>Workspace delivery</CardTitle>
          <CardDescription>Reusable content with a clear hierarchy.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">62 components</p>
        </CardContent>
        <CardFooter>Ready for applications</CardFooter>
      </Card>
    )
  }
  if (componentId === 'carousel') {
    return (
      <Carousel className="w-[min(20rem,calc(100%-5rem))]">
        <CarouselContent>
          {['Components', 'Blocks', 'Layouts'].map((item) => (
            <CarouselItem key={item}>
              <div className="grid h-32 place-items-center rounded-lg border bg-muted/30 font-medium">
                {item}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    )
  }
  if (componentId === 'chart') {
    return (
      <ChartContainer
        className={compact ? 'h-40 w-full max-w-md' : 'h-56 w-full max-w-xl'}
        config={chartConfig}
      >
        <BarChart data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <Bar dataKey="total" fill="var(--color-total)" radius={5} />
        </BarChart>
      </ChartContainer>
    )
  }
  if (componentId === 'item') {
    return (
      <Item
        className="max-w-lg"
        variant={compact ? 'muted' : 'outline'}
        size={compact ? 'xs' : 'default'}
      >
        <ItemMedia variant="icon">
          <Box />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>UI package</ItemTitle>
          <ItemDescription>Shared primitives, blocks, and layout templates.</ItemDescription>
        </ItemContent>
        <Badge>Ready</Badge>
      </Item>
    )
  }
  if (componentId === 'kbd')
    return (
      <KbdGroup>
        <Kbd>Ctrl</Kbd>
        <span>+</span>
        <Kbd>K</Kbd>
      </KbdGroup>
    )
  if (componentId === 'marker')
    return (
      <Marker>
        <MarkerIcon>
          <Info />
        </MarkerIcon>
        <MarkerContent>Shared source</MarkerContent>
      </Marker>
    )
  if (componentId === 'aspect-ratio') {
    return (
      <AspectRatio
        className="grid w-full max-w-lg place-items-center rounded-lg bg-muted text-sm text-muted-foreground"
        ratio={compact ? 4 / 3 : 16 / 9}
      >
        Responsive preview · {compact ? '4:3' : '16:9'}
      </AspectRatio>
    )
  }
  if (componentId === 'collapsible') {
    return (
      <Collapsible className="w-full max-w-lg rounded-lg border p-4">
        <CollapsibleTrigger className="w-full cursor-pointer text-left font-medium">
          Component details
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 text-sm text-muted-foreground">
          Public imports and shared tokens remain centralized.
        </CollapsibleContent>
      </Collapsible>
    )
  }
  if (componentId === 'direction') {
    return (
      <DirectionProvider direction={compact ? 'rtl' : 'ltr'}>
        <div
          dir={compact ? 'rtl' : 'ltr'}
          className="w-full max-w-lg rounded-lg border p-4 text-sm"
        >
          <strong>{compact ? 'Right to left' : 'Left to right'}</strong>
          <p className="mt-2 text-muted-foreground">
            Logical spacing follows the selected reading direction.
          </p>
        </div>
      </DirectionProvider>
    )
  }
  if (componentId === 'resizable') {
    return (
      <ResizablePanelGroup
        className="h-40 w-full max-w-xl overflow-hidden rounded-lg border"
        orientation="horizontal"
      >
        <ResizablePanel defaultSize={compact ? 35 : 45}>
          <div className="grid h-full place-items-center bg-muted/30 text-sm">Catalog</div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={compact ? 65 : 55}>
          <div className="grid h-full place-items-center text-sm">Preview</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }
  if (componentId === 'scroll-area') {
    return (
      <ScrollArea
        className={
          compact
            ? 'h-32 w-full max-w-md rounded-lg border p-3'
            : 'h-48 w-full max-w-lg rounded-lg border p-4'
        }
      >
        <div className="space-y-3">
          {Array.from({ length: 9 }, (_, index) => (
            <p className="text-sm" key={index}>
              Component record {index + 1}
            </p>
          ))}
        </div>
      </ScrollArea>
    )
  }
  if (componentId === 'separator') {
    return (
      <div className="w-full max-w-lg">
        <p className="font-medium">Component registry</p>
        <Separator className="my-4" />
        <p className="text-sm text-muted-foreground">
          Defaults and variants stay independently addressable.
        </p>
      </div>
    )
  }
  return <p className="text-sm text-muted-foreground">Dedicated preview is being prepared.</p>
}
