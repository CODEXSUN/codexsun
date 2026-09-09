import type { UiComponentDoc } from './ui-components'
import type { UiComponentVariantId } from './component-variants'

export function createComponentCode(component: UiComponentDoc, variant: UiComponentVariantId) {
  if (component.id === 'accordion') return createAccordionCode(component.source, variant)
  if (component.id === 'alert') return createAlertCode(component.source)
  if (component.id === 'button') return createButtonCode(component.source)
  if (component.id === 'button-group') return createButtonGroupCode(component.source)

  const namespace = `${component.name.replaceAll(' ', '')}Ui`
  return `import * as ${namespace} from '${component.source}'

// Documented variant: ${variant}
// Blocks use the default variant unless their public contract says otherwise.
export { ${namespace} }`
}

function createButtonGroupCode(source: string) {
  return `import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Archive,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  MoreHorizontal,
  Share2,
  Trash2,
} from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from '${source}'

export function ButtonGroupSet() {
  return (
    <div className="grid grid-cols-1 place-items-center gap-6 md:grid-cols-2 xl:grid-cols-3">
      <ButtonGroup>
        <Button>Save draft</Button>
        <Button variant="outline">Preview</Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button aria-label="Previous page" size="icon" variant="outline"><ChevronLeft /></Button>
        <Button variant="outline">Page 2</Button>
        <Button aria-label="Next page" size="icon" variant="outline"><ChevronRight /></Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button aria-label="Align left" size="icon" variant="outline"><AlignLeft /></Button>
        <Button aria-label="Align center" size="icon" variant="outline"><AlignCenter /></Button>
        <Button aria-label="Align right" size="icon" variant="outline"><AlignRight /></Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button>Publish <Share2 /></Button>
        <Button aria-label="More publish options" size="icon" variant="outline"><ChevronDown /></Button>
      </ButtonGroup>
      <ButtonGroup>
        <ButtonGroupText>Workspace</ButtonGroupText>
        <Button variant="outline">Open</Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="secondary"><Copy /> Duplicate</Button>
        <Button variant="secondary"><Download /> Export</Button>
      </ButtonGroup>
      <ButtonGroup orientation="vertical">
        <Button variant="outline">Move to archive</Button>
        <Button variant="outline">Restore workspace</Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button aria-label="Archive workspace" size="icon" variant="outline"><Archive /></Button>
        <ButtonGroupSeparator />
        <Button aria-label="Delete workspace" size="icon" variant="destructive"><Trash2 /></Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="success">Approve</Button>
        <Button aria-label="More approval options" size="icon" variant="success"><MoreHorizontal /></Button>
      </ButtonGroup>
    </div>
  )
}`
}

function createButtonCode(source: string) {
  return `import { ChevronDown, LoaderCircle, Plus, Star } from 'lucide-react'
import { Button } from '${source}'
import { ButtonGroup } from '@codexsun/ui/components/button-group'

export function ButtonSet() {
  return (
    <div className="grid grid-cols-2 place-items-center gap-4 sm:grid-cols-3 xl:grid-cols-5">
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
      <Button aria-label="Add workspace" size="icon"><Plus /></Button>
      <Button><Star /> Add to favorites</Button>
      <Button disabled><LoaderCircle className="animate-spin" /> Saving</Button>
      <ButtonGroup>
        <Button>Publish</Button>
        <Button aria-label="More publish options" size="icon" variant="outline">
          <ChevronDown />
        </Button>
      </ButtonGroup>
    </div>
  )
}`
}

function createAlertCode(source: string) {
  return `import {
  CircleFadingArrowUpIcon,
  OctagonAlert,
  ShieldAlert,
} from 'lucide-react'
import { Alert, AlertTitle } from '${source}'

export function AlertCalloutDemo() {
  return (
    <div className="w-full space-y-4">
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
}`
}

function createAccordionCode(source: string, variant: UiComponentVariantId) {
  const boxed = variant === 'boxed'
  const itemClassName = boxed
    ? `\n          className="border px-4 not-last:border-b-0 first:rounded-t-md last:rounded-b-md last:border-b"`
    : ''

  return `import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '${source}'

const items = [
  {
    title: 'Can I change or cancel my order after placing it?',
    content:
      'Yes, you can change or cancel your order within 1 hour of placement by visiting your account page or contacting our support team. After that, orders may already be processed for shipping.',
  },
  {
    title: 'How long does shipping usually take?',
    content:
      'Domestic shipping typically takes 3-5 business days, while international orders may take up to 2-3 weeks depending on your location and customs processing times.',
  },
  {
    title: 'What is your return policy?',
    content:
      'We offer a 30-day return policy for most products. Items must be unused and in their original packaging. To initiate a return, simply contact our support with your order details.',
  },
]

export function ${boxed ? 'AccordionBoxDemo' : 'AccordionDemo'}() {
  return (
    <Accordion className="my-4 w-full max-w-lg" multiple={false}>
      {items.map(({ title, content }, index) => (
        <AccordionItem${itemClassName} key={title} value={\`item-\${index}\`}>
          <AccordionTrigger>{title}</AccordionTrigger>
          <AccordionContent>{content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}`
}
