import { Info } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/accordion'
import { Alert, AlertDescription, AlertTitle } from '../../components/alert'
import { AspectRatio } from '../../components/aspect-ratio'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '../../components/avatar'
import { Badge } from '../../components/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../../components/breadcrumb'
import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from '../../components/bubble'
import { Button } from '../../components/button'
import { ButtonGroup } from '../../components/button-group'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../components/collapsible'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/empty'
import { Kbd, KbdGroup } from '../../components/kbd'
import { Marker, MarkerContent, MarkerIcon } from '../../components/marker'
import { Separator } from '../../components/separator'
import { GalleryCard } from './gallery-card'

export function GalleryFoundations() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <GalleryCard description="Primary, outline, and grouped actions." name="Actions">
        <ButtonGroup>
          <Button>Save</Button>
          <Button variant="outline">Preview</Button>
        </ButtonGroup>
      </GalleryCard>
      <GalleryCard description="Status, identity, and compact metadata." name="Identity & status">
        <div className="flex items-center gap-4">
          <AvatarGroup>
            <Avatar>
              <AvatarFallback>CS</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>UI</AvatarFallback>
            </Avatar>
            <AvatarGroupCount>+3</AvatarGroupCount>
          </AvatarGroup>
          <Badge>Ready</Badge>
          <Marker>
            <MarkerIcon>
              <Info />
            </MarkerIcon>
            <MarkerContent>Shared</MarkerContent>
          </Marker>
        </div>
      </GalleryCard>
      <GalleryCard
        description="Expandable content and progressive disclosure."
        name="Accordion & collapsible"
      >
        <div className="w-full space-y-3">
          <Accordion>
            <AccordionItem value="one">
              <AccordionTrigger>Shared UI package</AccordionTrigger>
              <AccordionContent>One source for every application.</AccordionContent>
            </AccordionItem>
          </Accordion>
          <Collapsible>
            <CollapsibleTrigger render={<Button variant="outline" />}>
              More details
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 text-sm text-muted-foreground">
              Reusable and typed.
            </CollapsibleContent>
          </Collapsible>
        </div>
      </GalleryCard>
      <GalleryCard
        description="Messages, notices, and conversation surfaces."
        name="Feedback & bubbles"
      >
        <div className="w-full space-y-4">
          <Alert>
            <Info />
            <AlertTitle>Component gallery</AlertTitle>
            <AlertDescription>Every module is indexed below.</AlertDescription>
          </Alert>
          <BubbleGroup>
            <Bubble variant="tinted">
              <BubbleContent>Glass stickers identify this region.</BubbleContent>
              <BubbleReactions>✨ 3</BubbleReactions>
            </Bubble>
          </BubbleGroup>
        </div>
      </GalleryCard>
      <GalleryCard description="Path navigation and keyboard hints." name="Breadcrumb & keyboard">
        <div className="space-y-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">UI</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Gallery</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <span>+</span>
            <Kbd>K</Kbd>
          </KbdGroup>
        </div>
      </GalleryCard>
      <GalleryCard description="Responsive media and empty states." name="Media & empty">
        <div className="grid w-full grid-cols-2 gap-4">
          <AspectRatio
            ratio={16 / 9}
            className="grid place-items-center rounded-lg bg-muted text-xs text-muted-foreground"
          >
            16:9
          </AspectRatio>
          <Empty className="min-h-0 border">
            <EmptyHeader>
              <EmptyTitle>No records</EmptyTitle>
              <EmptyDescription>Start with a new item.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </GalleryCard>
      <Separator className="xl:col-span-2" />
    </div>
  )
}
