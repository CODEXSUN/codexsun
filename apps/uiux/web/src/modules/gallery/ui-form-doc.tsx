import { useState } from 'react'
import { Field, FieldLabel } from '@codexsun/ui/components/field'
import { Input } from '@codexsun/ui/components/input'
import { Textarea } from '@codexsun/ui/components/textarea'
import { FormBlock, FormLookupField, type FormBlockTab } from '@codexsun/ui/blocks/form'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { UiTemplatePage } from '@codexsun/ui/templates/ui-page'

const contactTypes = [
  { label: 'Customer', value: 'customer' },
  { label: 'Supplier', value: 'supplier' },
  { label: 'Vendor customer', value: 'vendor-customer' },
  { label: 'Staff', value: 'staff' },
  { label: 'Employee', value: 'employee' },
] as const

const contactGroups = [
  { label: 'Retail', value: 'retail' },
  { label: 'Enterprise', value: 'enterprise' },
  { label: 'Partners', value: 'partners' },
] as const

const formPageDescription = 'Update contact identity, communication, address, and finance details.'

const formCode = `import { FormBlock, FormLookupField } from '@codexsun/ui/blocks/form'

export function ContactForm() {
  const [active, setActive] = useState(true)
  const [contactType, setContactType] = useState('customer')

  return (
    <FormBlock
      active={active}
      description="Create or update contact details."
      onActiveChange={setActive}
      onBack={() => history.back()}
      onCancel={() => resetForm()}
      onSubmit={() => saveContact()}
      tabs={[{
        id: 'details',
        label: 'Details',
        content: (
          <FormLookupField
            label="Contact type"
            onValueChange={setContactType}
            options={contactTypes}
            placeholder="Search contact type"
            required
            value={contactType}
          />
        ),
      }]}
      title="New contact"
    />
  )
}`

export function UiFormDocumentation() {
  const topology = useMdiTopology()
  const [active, setActive] = useState(true)
  const [contactType, setContactType] = useState('customer')
  const [contactGroup, setContactGroup] = useState('retail')
  const [feedback, setFeedback] = useState('Form is ready.')
  const tabs = createFormTabs({ contactGroup, contactType, setContactGroup, setContactType })

  return (
    <UiTemplatePage
      code={formCode}
      importPath="@codexsun/ui/blocks/form"
      kind="Block"
      name="Form"
      navigation={{
        next: { href: '/?component=accordion', name: 'Accordion' },
        previous: { href: '/?block=table', name: 'Table' },
      }}
      preview={
        <>
          <FormBlock
            active={active}
            description={formPageDescription}
            onActiveChange={setActive}
            onBack={() => setFeedback('Back requested.')}
            onCancel={() => setFeedback('Form reset requested.')}
            onSubmit={() => setFeedback('Contact save requested.')}
            tabs={tabs}
            title="New contact"
          />
          <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
            {feedback}
          </p>
        </>
      }
      topology={topology}
      topologyIds={{ page: '23', preview: '23.1', usage: '23.2' }}
      usageDescription={
        <p>
          Supply application fields, lookup data, validation, and actions. The Form block owns the
          header, animated tabs, active state, and action layout.
        </p>
      }
    />
  )
}

function createFormTabs({
  contactGroup,
  contactType,
  setContactGroup,
  setContactType,
}: {
  contactGroup: string
  contactType: string
  setContactGroup: (value: string) => void
  setContactType: (value: string) => void
}): FormBlockTab[] {
  return [
    {
      id: 'details',
      label: 'Details',
      content: (
        <div className="grid gap-5 lg:grid-cols-2">
          <TextField label="Name" placeholder="Contact name" required />
          <TextField defaultValue="C-0059" label="Code" required />
          <TextField label="Legal name" placeholder="Registered legal name" />
          <FormLookupField
            label="Contact type"
            onValueChange={setContactType}
            options={contactTypes}
            placeholder="Search contact type"
            required
            value={contactType}
          />
          <FormLookupField
            label="Contact group"
            onValueChange={setContactGroup}
            options={contactGroups}
            placeholder="Search contact group"
            value={contactGroup}
          />
        </div>
      ),
    },
    { id: 'tax', label: 'Tax details', content: <FormTabNote text="Add tax registration data." /> },
    {
      id: 'communication',
      label: 'Communication',
      content: <FormTabNote text="Add email and telephone details." />,
    },
    {
      id: 'addresses',
      label: 'Addresses',
      content: <FormTabNote text="Add billing and delivery addresses." />,
    },
    {
      id: 'finance',
      label: 'Finance',
      content: <FormTabNote text="Add payment and account settings." />,
    },
    {
      id: 'more',
      label: 'More',
      content: (
        <Field>
          <FieldLabel htmlFor="form-notes">Notes</FieldLabel>
          <Textarea id="form-notes" placeholder="Add internal notes" />
        </Field>
      ),
    },
  ]
}

function TextField({
  defaultValue,
  label,
  placeholder,
  required = false,
}: {
  defaultValue?: string
  label: string
  placeholder?: string
  required?: boolean
}) {
  const id = `form-${label.toLowerCase().replaceAll(' ', '-')}`
  return (
    <Field>
      <FieldLabel htmlFor={id}>
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </FieldLabel>
      <Input className="h-10" defaultValue={defaultValue} id={id} placeholder={placeholder} />
    </Field>
  )
}

function FormTabNote({ text }: { text: string }) {
  return <div className="rounded-md bg-muted/50 p-5 text-sm text-muted-foreground">{text}</div>
}
