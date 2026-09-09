import {
  ArrowRight,
  ChevronDown,
  CircleFadingArrowUpIcon,
  FileText,
  LoaderCircle,
  OctagonAlert,
  Plus,
  ShieldAlert,
  Sparkles,
  Star,
} from 'lucide-react'
import { Alert, AlertTitle } from '../../components/alert'
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '../../components/attachment'
import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from '../../components/bubble'
import { Button } from '../../components/button'
import { ButtonGroup } from '../../components/button-group'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/empty'
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from '../../components/message'
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '../../components/message-scroller'
import { Progress, ProgressLabel, ProgressValue } from '../../components/progress'
import { Skeleton } from '../../components/skeleton'
import { Spinner } from '../../components/spinner'
import { Toaster as Sonner } from '../../components/sonner'
import { toast, Toaster as ToastHost } from '../../components/toast'
import { Toggle } from '../../components/toggle'
import { ToggleGroup, ToggleGroupItem } from '../../components/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/tooltip'
import type { UiComponentVariantId } from './component-variants'
import { SpecimenStage } from './component-specimen-stage'

export function ActionsSpecimen({ componentId, compact, variant }: SpecimenProps) {
  if (componentId === 'alert') return <AlertCalloutSpecimen />

  return (
    <SpecimenStage compact={compact}>{renderSpecimen(componentId, compact, variant)}</SpecimenStage>
  )
}

type SpecimenProps = {
  compact: boolean
  componentId: string
  variant: UiComponentVariantId
}

function renderSpecimen(componentId: string, compact: boolean, variant: UiComponentVariantId) {
  if (componentId === 'button') return <ButtonVariantSpecimen variant={variant} />
  if (componentId === 'button-group') {
    return (
      <ButtonGroup>
        <Button size={compact ? 'sm' : 'default'}>Save</Button>
        <Button size={compact ? 'sm' : 'default'} variant="outline">
          Publish
        </Button>
      </ButtonGroup>
    )
  }
  if (componentId === 'toggle')
    return (
      <Toggle defaultPressed size={compact ? 'sm' : 'default'}>
        Live preview
      </Toggle>
    )
  if (componentId === 'toggle-group') {
    return (
      <ToggleGroup defaultValue={['grid']} multiple size={compact ? 'sm' : 'default'}>
        <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
        <ToggleGroupItem value="list">List</ToggleGroupItem>
      </ToggleGroup>
    )
  }
  if (componentId === 'attachment') {
    return (
      <Attachment size={compact ? 'sm' : 'default'}>
        <AttachmentMedia>
          <FileText />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>design-system.pdf</AttachmentTitle>
          <AttachmentDescription>2.4 MB · Ready</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
    )
  }
  if (componentId === 'bubble') {
    return (
      <BubbleGroup className="w-full max-w-md">
        <Bubble variant={compact ? 'muted' : 'tinted'}>
          <BubbleContent>Shared components keep every workspace consistent.</BubbleContent>
          <BubbleReactions>✨ 3</BubbleReactions>
        </Bubble>
      </BubbleGroup>
    )
  }
  if (componentId === 'message') {
    return (
      <MessageGroup className="w-full max-w-lg">
        <Message align="start">
          <MessageAvatar>CS</MessageAvatar>
          <MessageContent>
            <MessageHeader>CODEXSUN UI</MessageHeader>
            <Bubble variant="muted">
              <BubbleContent>The component is ready to use.</BubbleContent>
            </Bubble>
            <MessageFooter>Just now</MessageFooter>
          </MessageContent>
        </Message>
      </MessageGroup>
    )
  }
  if (componentId === 'message-scroller') {
    return (
      <MessageScrollerProvider>
        <MessageScroller className={compact ? 'h-36 max-w-lg' : 'h-52 max-w-xl'}>
          <MessageScrollerViewport>
            <MessageScrollerContent className="p-3">
              {['Start of thread', 'Shared component selected', 'Preview is live'].map((text) => (
                <MessageScrollerItem key={text} className="rounded-lg border bg-card p-3 text-sm">
                  {text}
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
        </MessageScroller>
      </MessageScrollerProvider>
    )
  }
  if (componentId === 'empty') {
    return (
      <Empty className={compact ? 'min-h-36 border' : 'min-h-52 border'}>
        <EmptyHeader>
          <EmptyTitle>No components found</EmptyTitle>
          <EmptyDescription>Change the filter or create a new component.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }
  if (componentId === 'progress') {
    return (
      <Progress className="w-full max-w-lg" value={compact ? 48 : 72}>
        <ProgressLabel>Documentation coverage</ProgressLabel>
        <ProgressValue />
      </Progress>
    )
  }
  if (componentId === 'skeleton') {
    return (
      <div className="w-full max-w-lg space-y-3">
        <Skeleton className="h-8 w-2/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    )
  }
  if (componentId === 'spinner')
    return (
      <div className="flex items-center gap-3 text-sm">
        <Spinner /> Loading component preview
      </div>
    )
  if (componentId === 'toast') {
    return (
      <ToastHost>
        <Button
          onClick={() =>
            toast.add({ title: 'Component saved', description: 'Your default variant is active.' })
          }
          variant="outline"
        >
          <Sparkles />
          Show toast
        </Button>
      </ToastHost>
    )
  }
  if (componentId === 'sonner') {
    return (
      <div className="flex items-center gap-3">
        <Sonner />
        <Button variant="outline">Sonner notification host</Button>
      </div>
    )
  }
  return <p className="text-sm text-muted-foreground">Dedicated preview is being prepared.</p>
}

function ButtonVariantSpecimen({ variant }: { variant: UiComponentVariantId }) {
  if (variant === 'icon') {
    return (
      <Tooltip>
        <TooltipTrigger render={<Button aria-label="Add workspace" size="icon" />}>
          <Plus />
        </TooltipTrigger>
        <TooltipContent>Add workspace</TooltipContent>
      </Tooltip>
    )
  }
  if (variant === 'icon-text') {
    return (
      <Button>
        <Star data-icon="inline-start" />
        Add to favorites
      </Button>
    )
  }
  if (variant === 'loading') {
    return (
      <Button disabled>
        <LoaderCircle className="animate-spin motion-reduce:animate-none" />
        Saving
      </Button>
    )
  }
  if (variant === 'split') {
    return (
      <ButtonGroup>
        <Button>
          Publish
          <ArrowRight data-icon="inline-end" />
        </Button>
        <Button aria-label="More publish options" size="icon" variant="outline">
          <ChevronDown />
        </Button>
      </ButtonGroup>
    )
  }

  const labels: Partial<Record<UiComponentVariantId, string>> = {
    default: 'Primary',
    destructive: 'Delete workspace',
    ghost: 'Ghost',
    info: 'View details',
    link: 'Read documentation',
    neutral: 'Neutral',
    outline: 'Outline',
    secondary: 'Secondary',
    success: 'Approve',
    warning: 'Review warning',
  }
  const buttonStyles: Partial<
    Record<
      UiComponentVariantId,
      | 'default'
      | 'destructive'
      | 'ghost'
      | 'info'
      | 'link'
      | 'neutral'
      | 'outline'
      | 'secondary'
      | 'success'
      | 'warning'
    >
  > = {
    default: 'default',
    destructive: 'destructive',
    ghost: 'ghost',
    info: 'info',
    link: 'link',
    neutral: 'neutral',
    outline: 'outline',
    secondary: 'secondary',
    success: 'success',
    warning: 'warning',
  }

  return <Button variant={buttonStyles[variant] ?? 'default'}>{labels[variant] ?? 'Button'}</Button>
}

function AlertCalloutSpecimen() {
  return (
    <div className="mx-auto w-full max-w-lg space-y-4 py-8">
      <Alert className="border-emerald-500/50 bg-emerald-600/10 text-emerald-500 dark:border-emerald-600/50 dark:bg-emerald-600/15">
        <CircleFadingArrowUpIcon className="size-4" />
        <AlertTitle>Your action has been completed successfully.</AlertTitle>
      </Alert>
      <Alert className="border-blue-400/50 bg-blue-500/10 text-blue-500 dark:border-blue-600/60 dark:bg-blue-600/20 dark:text-blue-400">
        <CircleFadingArrowUpIcon className="size-4" />
        <AlertTitle>A new version of the app is now available.</AlertTitle>
      </Alert>
      <Alert className="border-amber-500/50 bg-amber-600/10 text-amber-500 dark:border-amber-600/50 dark:bg-amber-600/15">
        <ShieldAlert className="size-4" />
        <AlertTitle>Changes will overwrite existing data.</AlertTitle>
      </Alert>
      <Alert className="border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/50 dark:bg-destructive/15">
        <OctagonAlert className="size-4" />
        <AlertTitle>Unable to process your request. Please try again later.</AlertTitle>
      </Alert>
    </div>
  )
}
