import type { UiComponentDoc } from './ui-components'
import type { UiComponentVariantId } from './component-variants'

export function createComponentCode(component: UiComponentDoc, variant: UiComponentVariantId) {
  if (component.id === 'accordion') return createAccordionCode(component.source, variant)
  if (component.id === 'alert') return createAlertCode(component.source)
  if (component.id === 'button') return createButtonCode(component.source, variant)

  const namespace = `${component.name.replaceAll(' ', '')}Ui`
  return `import * as ${namespace} from '${component.source}'

// Documented variant: ${variant}
// Blocks use the default variant unless their public contract says otherwise.
export { ${namespace} }`
}

function createButtonCode(source: string, variant: UiComponentVariantId) {
  if (variant === 'icon') {
    return `import { Plus } from 'lucide-react'
import { Button } from '${source}'

export function AddWorkspaceButton() {
  return (
    <Button aria-label="Add workspace" size="icon">
      <Plus />
    </Button>
  )
}`
  }
  if (variant === 'icon-text') {
    return `import { Star } from 'lucide-react'
import { Button } from '${source}'

export function FavoriteButton() {
  return (
    <Button>
      <Star data-icon="inline-start" />
      Add to favorites
    </Button>
  )
}`
  }
  if (variant === 'loading') {
    return `import { LoaderCircle } from 'lucide-react'
import { Button } from '${source}'

export function SavingButton() {
  return (
    <Button disabled>
      <LoaderCircle className="animate-spin motion-reduce:animate-none" />
      Saving
    </Button>
  )
}`
  }
  if (variant === 'split') {
    return `import { ChevronDown } from 'lucide-react'
import { Button } from '${source}'
import { ButtonGroup } from '@codexsun/ui/components/button-group'

export function PublishButton() {
  return (
    <ButtonGroup>
      <Button>Publish</Button>
      <Button aria-label="More publish options" size="icon" variant="outline">
        <ChevronDown />
      </Button>
    </ButtonGroup>
  )
}`
  }

  const variants: Partial<Record<UiComponentVariantId, string>> = {
    default: 'primary',
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
  const variantProperty = variants[variant] ? ` variant="${variants[variant]}"` : ''

  return `import { Button } from '${source}'

export function ButtonDemo() {
  return <Button${variantProperty}>${labels[variant] ?? 'Button'}</Button>
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
