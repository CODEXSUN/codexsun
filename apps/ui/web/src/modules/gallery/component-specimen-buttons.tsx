import { ArrowRight, ChevronDown, LoaderCircle, Plus, Star } from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import { ButtonGroup } from '@codexsun/ui/components/button-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@codexsun/ui/components/tooltip'
export function ButtonVariantSpecimen() {
  return (
    <div className="grid w-full grid-cols-2 place-items-center gap-x-4 gap-y-5 bg-muted/20 p-6 sm:grid-cols-3 xl:grid-cols-5">
      <Button variant="primary">Primary</Button>
      <Button variant="neutral">Neutral</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="success">Approve</Button>
      <Button variant="warning">Review warning</Button>
      <Button variant="info">View details</Button>
      <Button variant="destructive">Delete workspace</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Read documentation</Button>
      <IconButton />
      <IconTextButton />
      <LoadingButton />
      <SplitButton />
    </div>
  )
}

function IconButton() {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button aria-label="Add workspace" size="icon" />}>
        <Plus />
      </TooltipTrigger>
      <TooltipContent>Add workspace</TooltipContent>
    </Tooltip>
  )
}

function IconTextButton() {
  return (
    <Button>
      <Star data-icon="inline-start" />
      Add to favorites
    </Button>
  )
}

function LoadingButton() {
  return (
    <Button disabled>
      <LoaderCircle className="animate-spin motion-reduce:animate-none" />
      Saving
    </Button>
  )
}

function SplitButton() {
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
